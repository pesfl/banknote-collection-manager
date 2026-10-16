import { NextRequest, NextResponse } from 'next/server';
import { 
  resolveBanknoteValuation, 
  recordValuationLog, 
  getBanknoteValuationHistory 
} from '@/lib/valuation/valuation-service';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Look up on server DB if exists
    let banknote: any = null;
    try {
      banknote = await prisma.banknote.findUnique({
        where: { id },
      });
    } catch (_) {}

    const valuation = await resolveBanknoteValuation({
      countryOfOrigin: banknote?.countryOfOrigin,
      denomination: banknote?.denomination,
      currency: banknote?.currency,
      pickNumber: banknote?.pickNumber,
      issueYear: banknote?.issueYear,
      conditionGrade: banknote?.conditionGrade,
      isReplacementNote: banknote?.isReplacementNote,
      fancySerialType: banknote?.fancySerialType,
    });

    let history: any[] = [];
    if (banknote) {
      await recordValuationLog(id, valuation, 'api_query');
      history = await getBanknoteValuationHistory(id);
    }

    return NextResponse.json({
      success: true,
      ...valuation,
      data: valuation,
      history,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Valuation query failed' },
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
    const body = await request.json().catch(() => ({}));

    const valuation = await resolveBanknoteValuation({
      countryOfOrigin: body.countryOfOrigin || body.country,
      denomination: body.denomination,
      currency: body.currency,
      pickNumber: body.pickNumber,
      issueYear: body.issueYear,
      conditionGrade: body.conditionGrade,
      isReplacementNote: body.isReplacementNote,
      fancySerialType: body.fancySerialType,
    });

    let history: any[] = [];
    try {
      await recordValuationLog(id, valuation, body.source || 'user_revaluation', body.notes);
      history = await getBanknoteValuationHistory(id);
    } catch (_) {}

    return NextResponse.json({
      success: true,
      ...valuation,
      data: valuation,
      history,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Valuation update failed' },
      { status: 500 }
    );
  }
}
