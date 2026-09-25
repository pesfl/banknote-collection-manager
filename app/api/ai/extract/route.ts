import { NextRequest, NextResponse } from 'next/server';
import { extractBanknoteDetails } from '@/lib/ai/gemini-client';
import { AIExtractionSchema } from '@/types';

/**
 * POST /api/ai/extract
 * Extract banknote details from front and back images using Gemini Vision API
 *
 * Request: multipart/form-data
 *   - frontImage: File (JPEG/PNG)
 *   - backImage: File (JPEG/PNG)
 *
 * Response:
 *   - success: boolean
 *   - data: AIExtraction object with 40+ fields
 *   - error?: string (if failed)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if API key is set
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google Generative AI API key not configured',
        },
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const frontImage = formData.get('frontImage') as File;
    const backImage = formData.get('backImage') as File;

    if (!frontImage || !backImage) {
      return NextResponse.json(
        {
          success: false,
          error: 'Both front and back images are required',
        },
        { status: 400 }
      );
    }

    // Convert images to base64
    const frontBuffer = await frontImage.arrayBuffer();
    const backBuffer = await backImage.arrayBuffer();

    const frontBase64 = Buffer.from(frontBuffer).toString('base64');
    const backBase64 = Buffer.from(backBuffer).toString('base64');

    // Call Gemini Vision API
    const extractedData = await extractBanknoteDetails(frontBase64, backBase64);

    // Validate with Zod schema
    const validatedData = AIExtractionSchema.parse(extractedData);

    return NextResponse.json({
      success: true,
      data: validatedData,
    });
  } catch (error) {
    console.error('AI extraction API error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to extract banknote details';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
