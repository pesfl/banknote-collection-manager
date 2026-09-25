import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIExtraction } from '@/types';

const client = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

/**
 * Extract banknote details from front and back images using Gemini Vision
 */
export async function extractBanknoteDetails(
  frontImageBase64: string,
  backImageBase64: string
): Promise<AIExtraction> {
  try {
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const extractionPrompt = `You are a numismatic expert. Analyze these banknote images (front and back) and extract the following information in JSON format.

Return ONLY a valid JSON object (no markdown, no explanation) with these fields:
{
  "countryOfOrigin": "string - country name",
  "denomination": "string - numerical denomination with currency symbol",
  "currency": "string - currency name",
  "pickNumber": "string - Pick catalog number if visible (e.g., P-88, P-211c)",
  "issueYear": "string - year of issue from note",
  "seriesDate": "string - series date if different from issue year",
  "fullSerialNumber": "string - complete serial number as printed",
  "serialPrefix": "string - prefix letters/numbers",
  "serialNumeric": "string - numeric portion",
  "serialSuffix": "string - suffix letters",
  "signature1Name": "string - first signature name if visible",
  "signature1Title": "string - first signature title/role",
  "signature2Name": "string - second signature name if visible",
  "signature2Title": "string - second signature title/role",
  "watermarks": "string - visible watermarks description",
  "securityFeatures": "string - security features (security thread, hologram, etc.)",
  "conditionGrade": "string - condition (UNC, AU, XF, VF, F, VG, G, Unknown)",
  "machineEstimatedGrade": "string - machine learning estimated grade",
  "fancySerialType": "string - fancy serial classification (Solid, Radar, Ladder, Binary, Repeater, LowNumber, HighNumber, Sequential, None, Unknown)",
  "isReplacementNote": "boolean - true if replacement/star note",
  "errorType": "string - if printing error present (e.g., misalignment, overprint)",
  "defectsAndAnomalies": "string - folds, stains, tears, ink overspray, miscuts, etc.",
  "notes": "string - any other collector-relevant details"
}

If any field cannot be determined, use null. Be accurate and conservative - only include information you can clearly see.`;

    const response = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: frontImageBase64,
        },
      },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: backImageBase64,
        },
      },
      {
        text: extractionPrompt,
      },
    ]);

    const responseText = response.response.text();

    // Parse JSON from response
    let extractedData: Partial<AIExtraction>;
    try {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      extractedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      throw new Error('Failed to parse AI extraction response');
    }

    // Merge with defaults to ensure all fields present
    const result: AIExtraction = {
      countryOfOrigin: extractedData.countryOfOrigin || 'Unknown',
      denomination: extractedData.denomination || 'Unknown',
      currency: extractedData.currency || 'Unknown',
      pickNumber: extractedData.pickNumber,
      issueYear: extractedData.issueYear,
      seriesDate: extractedData.seriesDate,
      fullSerialNumber: extractedData.fullSerialNumber,
      serialPrefix: extractedData.serialPrefix,
      serialNumeric: extractedData.serialNumeric,
      serialSuffix: extractedData.serialSuffix,
      signature1Name: extractedData.signature1Name,
      signature1Title: extractedData.signature1Title,
      signature2Name: extractedData.signature2Name,
      signature2Title: extractedData.signature2Title,
      watermarks: extractedData.watermarks,
      securityFeatures: extractedData.securityFeatures,
      conditionGrade: extractedData.conditionGrade,
      machineEstimatedGrade: extractedData.machineEstimatedGrade,
      fancySerialType: extractedData.fancySerialType,
      isReplacementNote: extractedData.isReplacementNote || false,
      errorType: extractedData.errorType,
      defectsAndAnomalies: extractedData.defectsAndAnomalies,
      notes: extractedData.notes,
    };

    return result;
  } catch (error) {
    console.error('AI extraction error:', error);
    throw error;
  }
}
