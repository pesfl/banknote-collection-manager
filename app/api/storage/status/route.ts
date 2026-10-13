import { NextResponse } from 'next/server';
import {
  isR2Configured,
  R2_ACCOUNT_ID,
  R2_BUCKET_NAME,
  R2_ENDPOINT,
  R2_PUBLIC_URL,
  r2Client,
} from '@/lib/storage/r2';
import { HeadBucketCommand } from '@aws-sdk/client-s3';

/**
 * GET /api/storage/status
 * Diagnostic endpoint to verify Cloudflare R2 connection and bucket accessibility
 */
export async function GET() {
  const configured = isR2Configured();

  if (!configured) {
    return NextResponse.json({
      configured: false,
      status: 'unconfigured',
      accountId: R2_ACCOUNT_ID,
      bucket: R2_BUCKET_NAME,
      endpoint: R2_ENDPOINT,
      publicUrl: R2_PUBLIC_URL || null,
      message:
        'Cloudflare R2 credentials missing. Add R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY to .env.local',
    });
  }

  try {
    // Ping bucket with HeadBucketCommand
    await r2Client.send(new HeadBucketCommand({ Bucket: R2_BUCKET_NAME }));

    return NextResponse.json({
      configured: true,
      status: 'connected',
      accountId: R2_ACCOUNT_ID,
      bucket: R2_BUCKET_NAME,
      endpoint: R2_ENDPOINT,
      publicUrl: R2_PUBLIC_URL || null,
      message: `Successfully connected to Cloudflare R2 bucket: "${R2_BUCKET_NAME}"`,
    });
  } catch (error: any) {
    const isAuthError =
      error.name === 'InvalidAccessKeyId' ||
      error.name === 'SignatureDoesNotMatch' ||
      error.$metadata?.httpStatusCode === 403;

    const isNotFoundError =
      error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404;

    return NextResponse.json(
      {
        configured: true,
        status: 'error',
        accountId: R2_ACCOUNT_ID,
        bucket: R2_BUCKET_NAME,
        endpoint: R2_ENDPOINT,
        errorName: error.name,
        errorMessage: error.message,
        hint: isNotFoundError
          ? `Bucket "${R2_BUCKET_NAME}" does not exist in Cloudflare R2 account. Please create it in the Cloudflare dashboard.`
          : isAuthError
          ? 'Invalid R2 Access Key or Secret Key. Please verify API Token permissions.'
          : error.message,
      },
      { status: 200 }
    );
  }
}
