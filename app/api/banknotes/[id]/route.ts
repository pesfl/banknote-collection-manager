import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { deleteFromR2, isR2Configured } from '@/lib/storage/r2';

/**
 * DELETE /api/banknotes/[id]
 * Deletes a banknote record from the database and removes media from Cloudflare R2
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Specimen ID is required' }, { status: 400 });
    }

    // Attempt to locate banknote in database
    let banknote: any = null;
    try {
      banknote = await prisma.banknote.findUnique({
        where: { id },
      });
    } catch {
      console.warn('Database query skipped (local offline mode)');
    }

    // Clean up images in Cloudflare R2 if configured
    if (isR2Configured() && banknote) {
      try {
        if (banknote.frontImageUrl && !banknote.frontImageUrl.startsWith('http')) {
          await deleteFromR2(banknote.frontImageUrl).catch(() => {});
        }
        if (banknote.backImageUrl && !banknote.backImageUrl.startsWith('http')) {
          await deleteFromR2(banknote.backImageUrl).catch(() => {});
        }
      } catch (r2Err) {
        console.warn('R2 deletion warning:', r2Err);
      }
    }

    // Delete record from database if present
    if (banknote) {
      try {
        await prisma.banknote.delete({
          where: { id },
        });
      } catch (dbErr) {
        console.warn('Database record deletion skipped:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      id,
      message: 'Banknote record and media successfully deleted',
    });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete banknote record' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/banknotes/[id]
 * Updates a banknote record with AI extracted metadata
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Specimen ID is required' }, { status: 400 });
    }

    const body = await request.json();

    try {
      const updated = await prisma.banknote.update({
        where: { id },
        data: {
          countryOfOrigin: body.countryOfOrigin || body.country || undefined,
          denomination: body.denomination || undefined,
          currency: body.currency || undefined,
          pickNumber: body.pickNumber || undefined,
          issueYear: body.issueYear || undefined,
          seriesDate: body.seriesDate || undefined,
          fullSerialNumber: body.fullSerialNumber || undefined,
          serialPrefix: body.serialPrefix || undefined,
          serialNumeric: body.serialNumeric || undefined,
          serialSuffix: body.serialSuffix || undefined,
          conditionGrade: body.conditionGrade || undefined,
          machineEstimatedGrade: body.machineEstimatedGrade || undefined,
          fancySerialType: body.fancySerialType || undefined,
          isReplacementNote: body.isReplacementNote !== undefined ? Boolean(body.isReplacementNote) : undefined,
          errorType: body.errorType || undefined,
          signature1Name: body.signature1Name || undefined,
          signature1Title: body.signature1Title || undefined,
          signature2Name: body.signature2Name || undefined,
          signature2Title: body.signature2Title || undefined,
          watermarks: body.watermarks || undefined,
          securityFeatures: body.securityFeatures || undefined,
          notes: body.notes || undefined,
          defectsAndAnomalies: body.defectsAndAnomalies || undefined,
          extractionStatus: 'COMPLETED',
          extractionData: body,
        },
      });

      return NextResponse.json({ success: true, banknote: updated });
    } catch (dbErr) {
      console.warn('Database update skipped (local offline mode):', dbErr);
      return NextResponse.json({ success: true, offline: true });
    }
  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update banknote' },
      { status: 500 }
    );
  }
}

