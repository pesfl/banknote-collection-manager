import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Cloudflare R2 Storage Configuration
 * Compatible with AWS S3 API
 */

export const R2_ACCOUNT_ID =
  process.env.R2_ACCOUNT_ID || 'e97df7bfb09acbf14f6a44b36cc979f7';

export const R2_ENDPOINT =
  process.env.R2_ENDPOINT ||
  `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

export const R2_BUCKET_NAME =
  process.env.R2_BUCKET_NAME || 'banknotes-media';

export const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL || ''; // Optional: custom domain or https://pub-<hash>.r2.dev

/**
 * Check if Cloudflare R2 credentials are fully configured
 */
export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  );
}

/**
 * Singleton instance of S3Client configured for Cloudflare R2
 */
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export interface UploadOptions {
  key: string;
  body: Buffer | Uint8Array | Blob | string;
  contentType: string;
  metadata?: Record<string, string>;
}

/**
 * Upload an object directly to Cloudflare R2
 */
export async function uploadToR2({
  key,
  body,
  contentType,
  metadata = {},
}: UploadOptions): Promise<{ key: string; url: string; bucket: string }> {
  if (!isR2Configured()) {
    throw new Error(
      'Cloudflare R2 is not configured. Please set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.'
    );
  }

  // Convert string/Blob if necessary
  let uploadBody: any = body;
  if (body instanceof Blob) {
    const arrayBuffer = await body.arrayBuffer();
    uploadBody = Buffer.from(arrayBuffer);
  } else if (typeof body === 'string') {
    uploadBody = Buffer.from(body);
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: uploadBody,
    ContentType: contentType,
    Metadata: metadata,
  });

  await r2Client.send(command);

  return {
    key,
    url: getR2PublicUrl(key),
    bucket: R2_BUCKET_NAME,
  };
}

/**
 * Generate a pre-signed URL for client-side direct upload to Cloudflare R2.
 * Avoids passing large camera raw image buffers through serverless functions.
 */
export async function getPresignedUploadUrl({
  key,
  contentType,
  expiresIn = 3600, // 1 hour
}: {
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  if (!isR2Configured()) {
    throw new Error(
      'Cloudflare R2 is not configured. Please set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.'
    );
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });

  return {
    uploadUrl,
    key,
    publicUrl: getR2PublicUrl(key),
  };
}

/**
 * Generate a pre-signed URL for viewing/downloading an object from Cloudflare R2.
 */
export async function getPresignedDownloadUrl({
  key,
  expiresIn = 3600,
}: {
  key: string;
  expiresIn?: number;
}): Promise<string> {
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 is not configured.');
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Get readable public URL for an R2 object.
 * If R2_PUBLIC_URL is configured (e.g. pub-xxx.r2.dev or custom domain), use it.
 * Otherwise, fall back to the built-in streaming endpoint `/api/media/[key]`.
 */
export function getR2PublicUrl(key: string): string {
  // Strip leading slash if present
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;

  if (R2_PUBLIC_URL) {
    const baseUrl = R2_PUBLIC_URL.endsWith('/')
      ? R2_PUBLIC_URL.slice(0, -1)
      : R2_PUBLIC_URL;
    return `${baseUrl}/${cleanKey}`;
  }

  // Fallback to internal streaming proxy
  return `/api/media/${cleanKey}`;
}

/**
 * Check if an object exists in Cloudflare R2
 */
export async function checkObjectExists(key: string): Promise<boolean> {
  if (!isR2Configured()) return false;

  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    await r2Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Delete an object from Cloudflare R2
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 is not configured.');
  }

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
  return true;
}

/**
 * Get raw object stream from R2 (used by the media streaming proxy)
 */
export async function getObjectFromR2(key: string) {
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 is not configured.');
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return r2Client.send(command);
}
