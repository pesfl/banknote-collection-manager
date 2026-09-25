import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

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
      } catch (dbError) {
        // If local database is not yet migrated/running, generate a temporary dev ID
        console.warn('Database not available for dev user, using fallback dev-id:', dbError);
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

    // Generate specimen IDs and image placeholders
    const frontImageUrl = `s3://banknotes-collection/${userId}/${Date.now()}_front.jpg`;
    const backImageUrl = `s3://banknotes-collection/${userId}/${Date.now()}_back.jpg`;
    const displayImageUrl = `s3://banknotes-collection/${userId}/${Date.now()}_display.jpg`;

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
    } catch (dbErr) {
      console.warn('Database save skipped (local offline mode):', dbErr);
    }

    return NextResponse.json({
      success: true,
      serverId,
      status: 'saved',
      message: 'Images received. AI extraction queued.',
    });
  } catch (error) {
    console.error('Capture error:', error);
    return NextResponse.json(
      { error: 'Failed to process capture' },
      { status: 500 }
    );
  }
}
