import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIExtraction } from '@/types';

function getGeminiClient(): GoogleGenerativeAI {
  let apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    '';
  apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
  return new GoogleGenerativeAI(apiKey);
}

const SUPPORTED_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash',
];

function cleanString(val?: any): string | undefined {
  if (val === null || val === undefined) return undefined;
  const s = String(val).trim();
  return s.length > 0 && s.toLowerCase() !== 'null' ? s : undefined;
}

function parseGrade(g?: any): 'UNC' | 'AU' | 'XF' | 'VF' | 'F' | 'VG' | 'G' | 'Unknown' | undefined {
  if (!g) return undefined;
  const upper = String(g).toUpperCase().trim();
  if (upper.includes('UNC') || upper.includes('UNCIRCULATED')) return 'UNC';
  if (upper.includes('AU') || upper.includes('ABOUT UNCIRCULATED')) return 'AU';
  if (upper.includes('XF') || upper.includes('EF') || upper.includes('EXTRA FINE')) return 'XF';
  if (upper.includes('VF') || upper.includes('VERY FINE')) return 'VF';
  if (upper.includes('VG') || upper.includes('VERY GOOD')) return 'VG';
  if (upper.includes('F') || upper.includes('FINE')) return 'F';
  if (upper.includes('G') || upper.includes('GOOD')) return 'G';
  return 'Unknown';
}

function parseFancySerial(f?: any): 'Solid' | 'Radar' | 'Ladder' | 'Binary' | 'Repeater' | 'LowNumber' | 'HighNumber' | 'Sequential' | 'None' | 'Unknown' | undefined {
  if (!f) return undefined;
  const upper = String(f).toUpperCase().trim();
  if (upper.includes('SOLID')) return 'Solid';
  if (upper.includes('RADAR')) return 'Radar';
  if (upper.includes('LADDER')) return 'Ladder';
  if (upper.includes('BINARY')) return 'Binary';
  if (upper.includes('REPEATER')) return 'Repeater';
  if (upper.includes('LOW')) return 'LowNumber';
  if (upper.includes('HIGH')) return 'HighNumber';
  if (upper.includes('SEQ')) return 'Sequential';
  if (upper.includes('NONE')) return 'None';
  return 'Unknown';
}

/**
 * Extract banknote details from front and back images using Gemini Vision
 */
export async function extractBanknoteDetails(
  frontImageBase64: string,
  backImageBase64: string
): Promise<AIExtraction> {
  try {
    const client = getGeminiClient();

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

    let responseText = '';
    let lastError: any = null;

    for (const modelName of SUPPORTED_MODELS) {
      try {
        const model = client.getGenerativeModel({ model: modelName });
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
        responseText = response.response.text();
        if (responseText) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini] Model ${modelName} call failed, trying fallback:`, err?.message || err);
      }
    }

    if (!responseText) {
      throw lastError || new Error('All Gemini model fallbacks failed to generate content');
    }

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

    // Merge with defaults and sanitize all fields
    const result: AIExtraction = {
      countryOfOrigin: cleanString(extractedData.countryOfOrigin) || 'Unknown',
      denomination: cleanString(extractedData.denomination) || 'Unknown',
      currency: cleanString(extractedData.currency) || 'Unknown',
      pickNumber: cleanString(extractedData.pickNumber),
      issueYear: cleanString(extractedData.issueYear),
      seriesDate: cleanString(extractedData.seriesDate),
      fullSerialNumber: cleanString(extractedData.fullSerialNumber),
      serialPrefix: cleanString(extractedData.serialPrefix),
      serialNumeric: cleanString(extractedData.serialNumeric),
      serialSuffix: cleanString(extractedData.serialSuffix),
      signature1Name: cleanString(extractedData.signature1Name),
      signature1Title: cleanString(extractedData.signature1Title),
      signature2Name: cleanString(extractedData.signature2Name),
      signature2Title: cleanString(extractedData.signature2Title),
      watermarks: cleanString(extractedData.watermarks),
      securityFeatures: cleanString(extractedData.securityFeatures),
      conditionGrade: parseGrade(extractedData.conditionGrade),
      machineEstimatedGrade: parseGrade(extractedData.machineEstimatedGrade),
      fancySerialType: parseFancySerial(extractedData.fancySerialType),
      isReplacementNote: Boolean(extractedData.isReplacementNote),
      errorType: cleanString(extractedData.errorType),
      defectsAndAnomalies: cleanString(extractedData.defectsAndAnomalies),
      notes: cleanString(extractedData.notes),
    };

    return result;
  } catch (error) {
    console.error('AI extraction error:', error);
    throw error;
  }
}
