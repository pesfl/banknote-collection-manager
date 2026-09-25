import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/sync/status
 * Get sync status and pending specimens count
 *
 * Response:
 *   - pendingCount: number
 *   - syncedCount: number
 *   - failedCount: number
 *   - pendingItems: Array<{
 *       serverId: string
 *       capturedAt: string (ISO)
 *       country?: string
 *       denomination?: string
 *       syncStatus: 'PENDING' | 'SYNCED' | 'FAILED'
 *     }>
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Query specimen sync status
    const banknotes = await prisma.banknote.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        syncStatus: true,
        extractionStatus: true,
        countryOfOrigin: true,
        denomination: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent 100
    });

    const stats = {
      pendingCount: 0,
      syncedCount: 0,
      failedCount: 0,
      pendingItems: [] as any[],
    };

    for (const banknote of banknotes) {
      if (banknote.syncStatus === 'PENDING') {
        stats.pendingCount++;
        stats.pendingItems.push({
          serverId: banknote.id,
          capturedAt: banknote.createdAt.toISOString(),
          country: banknote.countryOfOrigin,
          denomination: banknote.denomination,
          extractionStatus: banknote.extractionStatus,
          syncStatus: banknote.syncStatus,
        });
      } else if (banknote.syncStatus === 'SYNCED') {
        stats.syncedCount++;
      } else if (banknote.syncStatus === 'FAILED') {
        stats.failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
