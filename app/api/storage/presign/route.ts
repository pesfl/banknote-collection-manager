import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPresignedUploadUrl, isR2Configured } from '@/lib/storage/r2';

/**
 * POST /api/storage/presign
 * Generates pre-signed URL for direct browser/mobile upload to Cloudflare R2
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'anonymous-collector';

    if (!isR2Configured()) {
      return NextResponse.json(
        {
          error:
            'Cloudflare R2 storage credentials are not configured. Please add R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY to .env.local',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { filename, contentType = 'image/jpeg', folder = 'banknotes' } = body;

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Sanitize and generate unique storage key
    const extension = filename.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const key = `${folder}/${userId}/${timestamp}-${randomSuffix}.${extension}`;

    const { uploadUrl, publicUrl } = await getPresignedUploadUrl({
      key,
      contentType,
      expiresIn: 3600,
    });

    return NextResponse.json({
      success: true,
      uploadUrl,
      key,
      publicUrl,
    });
  } catch (error: any) {
    console.error('Presign error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate pre-signed URL' },
      { status: 500 }
    );
  }
}
