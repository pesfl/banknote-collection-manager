import { z } from 'zod';

// ============================================================================
// BANKNOTE TYPES & VALIDATION
// ============================================================================

export const BanknoteGradeEnum = z.enum(['UNC', 'AU', 'XF', 'VF', 'F', 'VG', 'G', 'Unknown']);
export type BanknoteGrade = z.infer<typeof BanknoteGradeEnum>;

export const FancySerialTypeEnum = z.enum([
  'Solid',
  'Radar',
  'Ladder',
  'Binary',
  'Repeater',
  'LowNumber',
  'HighNumber',
  'Sequential',
  'None',
  'Unknown',
]);
export type FancySerialType = z.infer<typeof FancySerialTypeEnum>;

// Core Banknote Schema
export const BanknoteSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),

  // Catalog Identity
  countryOfOrigin: z.string().optional(),
  denomination: z.string().optional(),
  currency: z.string().optional(),
  pickNumber: z.string().optional(),
  issueYear: z.string().optional(),
  seriesDate: z.string().optional(),

  // Physical Specimen Data
  fullSerialNumber: z.string().optional(),
  serialPrefix: z.string().optional(),
  serialNumeric: z.string().optional(),
  serialSuffix: z.string().optional(),

  // Grading & Condition
  conditionGrade: BanknoteGradeEnum.optional(),
  machineEstimatedGrade: BanknoteGradeEnum.optional(),

  // Special Classifications
  fancySerialType: FancySerialTypeEnum.optional(),
  isReplacementNote: z.boolean().default(false),
  errorType: z.string().optional(),

  // Storage Location
  storageBox: z.string().optional(),
  storageSection: z.string().optional(),
  storagePosition: z.string().optional(),

  // Images (S3 URLs)
  frontImageUrl: z.string().url().optional(),
  backImageUrl: z.string().url().optional(),
  displayImageUrl: z.string().url().optional(),

  // Signatures
  signature1Name: z.string().optional(),
  signature1Title: z.string().optional(),
  signature2Name: z.string().optional(),
  signature2Title: z.string().optional(),

  // Watermarks & Security
  watermarks: z.string().optional(),
  securityFeatures: z.string().optional(),

  // Notes & Anomalies
  notes: z.string().optional(),
  defectsAndAnomalies: z.string().optional(),

  // Valuation Data
  numistaPmgValue: z.string().optional(),
  collectorMarketValue: z.string().optional(),

  // Acquisition
  acquisitionDate: z.date().optional(),
  acquisitionSource: z.string().optional(),
  purchasePrice: z.number().positive().optional(),

  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Banknote = z.infer<typeof BanknoteSchema>;

// ============================================================================
// CAPTURE & MOBILE TYPES
// ============================================================================

export const CaptureMobileSchema = z.object({
  frontImage: z.instanceof(File),
  backImage: z.instanceof(File),
  notes: z.string().optional(),
  capturedAt: z.date(),
});

export type CaptureMobileInput = z.infer<typeof CaptureMobileSchema>;

export const CaptureResponseSchema = z.object({
  serverId: z.string(),
  status: z.enum(['saved', 'error']),
  message: z.string(),
});

export type CaptureResponse = z.infer<typeof CaptureResponseSchema>;

// ============================================================================
// LOCAL SPECIMEN (OFFLINE STORAGE)
// ============================================================================

export const LocalSpecimenSchema = z.object({
  id: z.string(), // e.g., "sp_local_1726934400000"
  frontImageBlob: z.instanceof(Blob),
  backImageBlob: z.instanceof(Blob),
  capturedAt: z.date(),
  syncStatus: z.enum(['pending', 'syncing', 'synced', 'failed']),
  extractedData: z.object({
    country: z.string().optional(),
    denomination: z.string().optional(),
    pickNumber: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
  serverId: z.string().optional(),
  lastSyncAttempt: z.date().optional(),
  syncRetryCount: z.number().default(0),
});

export type LocalSpecimen = z.infer<typeof LocalSpecimenSchema>;

// ============================================================================
// SYNC TYPES
// ============================================================================

export const SyncQueueItemSchema = z.object({
  localId: z.string(),
  serverId: z.string().optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  status: z.enum(['PENDING', 'SYNCING', 'COMPLETED', 'FAILED']),
  payload: z.record(z.string(), z.any()),
  retryCount: z.number(),
  errorMessage: z.string().optional(),
});

export type SyncQueueItem = z.infer<typeof SyncQueueItemSchema>;

export const SyncPushRequestSchema = z.object({
  specimens: z.array(z.object({
    localId: z.string(),
    frontImage: z.string().or(z.instanceof(File)),
    backImage: z.string().or(z.instanceof(File)),
    notes: z.string().optional(),
  })),
});

export type SyncPushRequest = z.infer<typeof SyncPushRequestSchema>;

export const SyncPushResponseSchema = z.object({
  synced: z.array(z.object({
    localId: z.string(),
    serverId: z.string(),
    status: z.enum(['success', 'failed']),
  })),
  failed: z.array(z.object({
    localId: z.string(),
    error: z.string(),
  })).optional(),
});

export type SyncPushResponse = z.infer<typeof SyncPushResponseSchema>;

export const SyncStatusResponseSchema = z.object({
  localCount: z.number(),
  syncedCount: z.number(),
  failedCount: z.number(),
  pendingItems: z.array(z.object({
    localId: z.string(),
    capturedAt: z.date(),
    country: z.string().optional(),
    denomination: z.string().optional(),
    syncStatus: z.enum(['pending', 'syncing', 'synced', 'failed']),
  })),
});

export type SyncStatusResponse = z.infer<typeof SyncStatusResponseSchema>;

// ============================================================================
// AI EXTRACTION TYPES
// ============================================================================

export const AIExtractionSchema = z.object({
  countryOfOrigin: z.string().default('Unknown'),
  denomination: z.string().default('Unknown'),
  currency: z.string().default('Unknown'),
  pickNumber: z.string().optional(),
  issueYear: z.string().optional(),
  seriesDate: z.string().optional(),
  fullSerialNumber: z.string().optional(),
  serialPrefix: z.string().optional(),
  serialNumeric: z.string().optional(),
  serialSuffix: z.string().optional(),
  signature1Name: z.string().optional(),
  signature1Title: z.string().optional(),
  signature2Name: z.string().optional(),
  signature2Title: z.string().optional(),
  watermarks: z.string().optional(),
  securityFeatures: z.string().optional(),
  conditionGrade: BanknoteGradeEnum.optional(),
  machineEstimatedGrade: BanknoteGradeEnum.optional(),
  fancySerialType: FancySerialTypeEnum.optional(),
  isReplacementNote: z.boolean().default(false),
  errorType: z.string().optional(),
  defectsAndAnomalies: z.string().optional(),
  notes: z.string().optional(),
});

export type AIExtraction = z.infer<typeof AIExtractionSchema>;

// ============================================================================
// VALUATION TYPES
// ============================================================================

export const ValuationSourceEnum = z.enum([
  'PMG_PRICE_GUIDE',
  'HERITAGE_AUCTIONS',
  'STACKS_BOWERS',
  'EBAY_SOLD',
  'NUMISTA_CATALOG',
  'BANKNOTE_ARCHIVES',
]);

export type ValuationSource = z.infer<typeof ValuationSourceEnum>;

export const EvidenceMatrixSchema = z.object({
  pmgValue: z.string().optional(),
  heritageValue: z.string().optional(),
  stacksBowersValue: z.string().optional(),
  ebayValue: z.string().optional(),
  numistaValue: z.string().optional(),
  banknoteArchivesValue: z.string().optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  conflictDetected: z.boolean().default(false),
});

export type EvidenceMatrix = z.infer<typeof EvidenceMatrixSchema>;

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

export enum UserRole {
  ADMIN = 'ADMIN',
  COLLECTOR = 'COLLECTOR',
  VIEWER = 'VIEWER',
}

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  image: z.string().url().optional(),
  role: z.nativeEnum(UserRole),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.record(z.string(), z.any()).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export type APIResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
