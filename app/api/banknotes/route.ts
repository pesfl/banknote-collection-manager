import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

async function getOrCreateUserId(): Promise<string> {
  const session = await getServerSession(authOptions).catch(() => null);
  if (session?.user?.email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (user) return user.id;
    } catch {}
  }

  // Fallback to default/demo collector user
  try {
    let devUser = await prisma.user.findFirst({
      where: { email: 'collector@banknotes.app' },
    });
    if (!devUser) {
      devUser = await prisma.user.create({
        data: {
          email: 'collector@banknotes.app',
          name: 'Primary Collector',
          role: 'COLLECTOR',
        },
      });
    }
    return devUser.id;
  } catch {
    return 'default-collector';
  }
}

/**
 * GET /api/banknotes
 * Fetches all banknotes from PostgreSQL (Neon)
 */
export async function GET(request: NextRequest) {
  try {
    const banknotes = await prisma.banknote.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      banknotes,
      items: banknotes,
      count: banknotes.length,
      source: 'database',
    });
  } catch (dbErr: any) {
    console.warn('[Banknotes API] Database query skipped or failed (offline fallback):', dbErr?.message);
    return NextResponse.json({
      success: true,
      banknotes: [],
      items: [],
      count: 0,
      offline: true,
      message: 'Database offline or not yet connected',
    });
  }
}

/**
 * POST /api/banknotes
 * Saves or upserts a banknote (or array of banknotes) into PostgreSQL (Neon)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      return NextResponse.json({ error: 'No banknote data provided' }, { status: 400 });
    }

    const userId = await getOrCreateUserId();
    const saved = [];

    for (const item of items) {
      const id = item.id || `bn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const ex = item.extractedData || {};

      try {
        const banknote = await prisma.banknote.upsert({
          where: { id },
          update: {
            countryOfOrigin: item.countryOfOrigin || item.country || ex.countryOfOrigin || undefined,
            denomination: item.denomination || ex.denomination || undefined,
            currency: item.currency || ex.currency || undefined,
            pickNumber: item.pickNumber || ex.pickNumber || undefined,
            issueYear: item.issueYear || item.year || ex.issueYear || undefined,
            seriesDate: item.seriesDate || ex.seriesDate || undefined,
            fullSerialNumber: item.fullSerialNumber || item.serialNumber || ex.fullSerialNumber || undefined,
            serialPrefix: item.serialPrefix || ex.serialPrefix || undefined,
            serialNumeric: item.serialNumeric || ex.serialNumeric || undefined,
            serialSuffix: item.serialSuffix || ex.serialSuffix || undefined,
            conditionGrade: item.conditionGrade || item.condition || ex.conditionGrade || undefined,
            machineEstimatedGrade: item.machineEstimatedGrade || ex.machineEstimatedGrade || undefined,
            fancySerialType: item.fancySerialType || (item.isSpecial ? 'Special' : undefined) || ex.fancySerialType || undefined,
            isReplacementNote: item.isReplacementNote !== undefined ? Boolean(item.isReplacementNote) : false,
            errorType: item.errorType || undefined,
            frontImageUrl: item.frontImageUrl || item.frontImage || item.displayImageUrl || undefined,
            backImageUrl: item.backImageUrl || item.backImage || undefined,
            displayImageUrl: item.displayImageUrl || item.frontImageUrl || item.frontImage || undefined,
            notes: item.notes || ex.notes || undefined,
            numistaPmgValue: item.numistaPmgValue || item.numistaValue || ex.numistaValue || undefined,
            collectorMarketValue: item.collectorMarketValue || item.value || ex.collectorMarketValue || undefined,
            syncStatus: 'SYNCED',
            syncedAt: new Date(),
          },
          create: {
            id,
            userId,
            countryOfOrigin: item.countryOfOrigin || item.country || ex.countryOfOrigin || 'Unknown',
            denomination: item.denomination || ex.denomination || '—',
            currency: item.currency || ex.currency || '',
            pickNumber: item.pickNumber || ex.pickNumber || '',
            issueYear: item.issueYear || item.year || ex.issueYear || '',
            seriesDate: item.seriesDate || ex.seriesDate || '',
            fullSerialNumber: item.fullSerialNumber || item.serialNumber || ex.fullSerialNumber || '',
            serialPrefix: item.serialPrefix || ex.serialPrefix || '',
            serialNumeric: item.serialNumeric || ex.serialNumeric || '',
            serialSuffix: item.serialSuffix || ex.serialSuffix || '',
            conditionGrade: item.conditionGrade || item.condition || ex.conditionGrade || 'UNC',
            machineEstimatedGrade: item.machineEstimatedGrade || ex.machineEstimatedGrade || '',
            fancySerialType: item.fancySerialType || (item.isSpecial ? 'Special' : 'None') || ex.fancySerialType || 'None',
            isReplacementNote: Boolean(item.isReplacementNote),
            errorType: item.errorType || 'None',
            frontImageUrl: item.frontImageUrl || item.frontImage || item.displayImageUrl || '',
            backImageUrl: item.backImageUrl || item.backImage || '',
            displayImageUrl: item.displayImageUrl || item.frontImageUrl || item.frontImage || '',
            notes: item.notes || ex.notes || '',
            numistaPmgValue: item.numistaPmgValue || item.numistaValue || ex.numistaValue || '',
            collectorMarketValue: item.collectorMarketValue || item.value || ex.collectorMarketValue || 'Valuation Pending',
            syncStatus: 'SYNCED',
            syncedAt: new Date(),
          },
        });
        saved.push(banknote);
      } catch (upsertErr) {
        console.warn(`[Banknotes API] Could not upsert banknote ${id}:`, upsertErr);
      }
    }

    return NextResponse.json({
      success: true,
      savedCount: saved.length,
      banknotes: saved,
    });
  } catch (error: any) {
    console.error('[Banknotes API] POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save banknote(s)' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/banknotes
 * Clears all banknotes (or a specific banknote if ?id=... provided)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      await prisma.banknote.delete({ where: { id } });
      return NextResponse.json({ success: true, message: `Banknote ${id} deleted` });
    }

    const { count } = await prisma.banknote.deleteMany({});
    return NextResponse.json({
      success: true,
      deletedCount: count,
      message: 'All banknotes cleared',
    });
  } catch (error: any) {
    console.error('[Banknotes API] DELETE error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete banknote(s)' },
      { status: 500 }
    );
  }
}

