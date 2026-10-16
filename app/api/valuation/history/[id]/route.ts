import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const history = await prisma.valuationLog.findMany({
      where: { banknoteId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      history,
      data: history,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch valuation history' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const createdDate = body.createdAt ? new Date(body.createdAt) : new Date();

    const newLog = await prisma.valuationLog.create({
      data: {
        banknoteId: id,
        pmgValue: body.pmgValue || null,
        heritageValue: body.heritageValue || null,
        stacksBowersValue: body.stacksBowersValue || null,
        ebayValue: body.ebayValue || null,
        numistaValue: body.numistaValue || null,
        banknoteArchivesValue: body.banknoteArchivesValue || null,
        estimatedValue: body.estimatedValue || null,
        confidenceScore: typeof body.confidenceScore === 'number' ? body.confidenceScore : 0.90,
        conflictDetected: body.conflictDetected || false,
        source: body.source || 'manual_log',
        notes: body.notes || null,
        createdAt: createdDate,
      },
    });

    // If this is the newest valuation, update current fields on the banknote
    if (body.updateCurrent !== false && body.estimatedValue) {
      try {
        await prisma.banknote.update({
          where: { id },
          data: {
            collectorMarketValue: body.estimatedValue,
            pmgValue: body.pmgValue || undefined,
            heritageValue: body.heritageValue || undefined,
            stacksBowersValue: body.stacksBowersValue || undefined,
            ebayValue: body.ebayValue || undefined,
            numistaValue: body.numistaValue || undefined,
            banknoteArchivesValue: body.banknoteArchivesValue || undefined,
          },
        });
      } catch (_) {}
    }

    const updatedHistory = await prisma.valuationLog.findMany({
      where: { banknoteId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      log: newLog,
      history: updatedHistory,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create valuation log' },
      { status: 500 }
    );
  }
}
