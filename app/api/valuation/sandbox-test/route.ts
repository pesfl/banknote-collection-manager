import { NextRequest, NextResponse } from 'next/server';
import { resolveBanknoteValuation } from '@/lib/valuation/valuation-service';

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json({
      success: true,
      ...valuation,
      data: valuation,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Sandbox valuation query failed' },
      { status: 500 }
    );
  }
}
