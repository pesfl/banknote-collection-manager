import { NextRequest, NextResponse } from 'next/server';
import { getObjectFromR2, isR2Configured } from '@/lib/storage/r2';

/**
 * GET /api/media/[...key]
 * Stream media assets directly from Cloudflare R2
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key: keyParts } = await context.params;
    if (!keyParts || keyParts.length === 0) {
      return NextResponse.json({ error: 'Missing object key' }, { status: 400 });
    }

    const key = keyParts.join('/');

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: 'Cloudflare R2 is not configured in environment variables' },
        { status: 503 }
      );
    }

    const s3Response = await getObjectFromR2(key);

    if (!s3Response.Body) {
      return NextResponse.json({ error: 'Object body not found' }, { status: 404 });
    }

    // Convert AWS SDK stream to Web ReadableStream
    const stream = s3Response.Body.transformToWebStream();

    const contentType = s3Response.ContentType || 'application/octet-stream';
    const contentLength = s3Response.ContentLength?.toString();
    const etag = s3Response.ETag;

    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }
    if (etag) {
      headers.set('ETag', etag);
    }

    return new Response(stream, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    console.error('Error fetching media from R2:', error);
    return NextResponse.json(
      { error: 'Failed to stream media asset' },
      { status: 500 }
    );
  }
}
