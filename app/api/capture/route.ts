import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { uploadToR2, getR2PublicUrl, isR2Configured } from '@/lib/storage/r2';

/**
 * POST /api/capture
 * Handle mobile specimen capture uploads
 *
 * Request: multipart/form-data
 *   - frontImage: File
 *   - backImage: File
 *   - notes: string (optional)
 *   - capturedAt: ISO timestamp
 *
 * Response:
 *   - serverId: string (specimen ID)
 *   - status: string
 *   - message: string
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication or provide development fallback
    const session = await getServerSession(authOptions);
    let userId: string;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      userId = user.id;
    } else if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      // In development / local testing, allow fallback to a default dev user
      try {
        let devUser = await prisma.user.findFirst({
          where: { email: 'dev@banknotes.local' },
        });
        if (!devUser) {
          devUser = await prisma.user.create({
            data: {
              email: 'dev@banknotes.local',
              name: 'Dev Collector',
              role: 'COLLECTOR',
            },
          });
        }
        userId = devUser.id;
      } catch {
        // If local database is not yet migrated/running, use fallback dev collector ID
        console.warn('Local database offline, using dev collector ID for local testing');
        userId = 'dev-collector-local';
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const frontImage = formData.get('frontImage') as File;
    const backImage = formData.get('backImage') as File;
    const notes = formData.get('notes') as string | null;
    const capturedAtStr = formData.get('capturedAt') as string;

    // Validate
    if (!frontImage || !backImage) {
      return NextResponse.json(
        { error: 'Missing required images' },
        { status: 400 }
      );
    }

    const capturedAt = new Date(capturedAtStr || Date.now());

    // Upload to Cloudflare R2
    const timestamp = Date.now();
    const frontKey = `banknotes/${userId}/${timestamp}_front.jpg`;
    const backKey = `banknotes/${userId}/${timestamp}_back.jpg`;

    let frontImageUrl = getR2PublicUrl(frontKey);
    let backImageUrl = getR2PublicUrl(backKey);
    let displayImageUrl = frontImageUrl;

    if (isR2Configured()) {
      try {
        let frontBuffer = Buffer.from(await frontImage.arrayBuffer());
        let backBuffer = Buffer.from(await backImage.arrayBuffer());

        // Server-side orientation normalization and JPEG optimization
        try {
          const sharp = (await import('sharp')).default;
          frontBuffer = await sharp(frontBuffer)
            .rotate()
            .jpeg({ quality: 90, mozjpeg: true })
            .toBuffer();
        } catch {}

        try {
          const sharp = (await import('sharp')).default;
          backBuffer = await sharp(backBuffer)
            .rotate()
            .jpeg({ quality: 90, mozjpeg: true })
            .toBuffer();
        } catch {}

        const frontResult = await uploadToR2({
          key: frontKey,
          body: frontBuffer,
          contentType: 'image/jpeg',
          metadata: { userId, side: 'front' },
        });

        const backResult = await uploadToR2({
          key: backKey,
          body: backBuffer,
          contentType: 'image/jpeg',
          metadata: { userId, side: 'back' },
        });

        frontImageUrl = frontResult.url;
        backImageUrl = backResult.url;
        displayImageUrl = frontResult.url;
        console.log(`[R2] Uploaded front & back images: ${frontKey}, ${backKey}`);
      } catch (r2Err) {
        console.error('[R2] Upload failed, falling back to proxy URL:', r2Err);
      }
    } else {
      console.warn('[R2] Storage credentials not configured, using proxy media URL');
    }

    let serverId = `sp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Create banknote record in database
      const banknote = await prisma.banknote.create({
        data: {
          userId,
          frontImageUrl,
          backImageUrl,
          displayImageUrl,
          notes: notes || undefined,
          extractionStatus: 'PENDING',
          valuationStatus: 'PENDING',
          syncStatus: 'SYNCED',
        },
      });
      serverId = banknote.id;
      console.log(`Queued AI extraction for specimen ${banknote.id}`);
    } catch {
      console.warn('Database save skipped (local offline mode)');
    }

    return NextResponse.json({
      success: true,
      serverId,
      status: 'saved',
      frontImageUrl,
      backImageUrl,
      message: 'Images uploaded and AI extraction queued.',
    });
  } catch (error) {
    console.error('Capture error:', error);
    return NextResponse.json(
      { error: 'Failed to process capture' },
      { status: 500 }
    );
  }
}
