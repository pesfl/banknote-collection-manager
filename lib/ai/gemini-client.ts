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
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.8-flash',
  'gemini-flash-latest',
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

  // Support PMG/PCGS 70-point numerical grading scale
  const num = parseInt(upper.replace(/\D/g, ''), 10);
  if (!isNaN(num)) {
    if (num >= 60) return 'UNC';
    if (num >= 50) return 'AU';
    if (num >= 40) return 'XF';
    if (num >= 20) return 'VF';
    if (num >= 12) return 'F';
    if (num >= 8) return 'VG';
    if (num >= 4) return 'G';
  }

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

function detectImageMimeType(base64: string, explicitType?: string): string {
  if (explicitType && explicitType.startsWith('image/')) {
    // Standardize jpeg
    if (explicitType === 'image/jpg') return 'image/jpeg';
    return explicitType;
  }
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
  if (base64.startsWith('UklGR')) return 'image/webp';
  if (base64.startsWith('R0lGOD')) return 'image/gif';
  return 'image/jpeg';
}

/**
 * Extract banknote details from front and back images using Gemini Vision
 */
export async function extractBanknoteDetails(
  frontImageBase64: string,
  backImageBase64: string,
  frontMimeType?: string,
  backMimeType?: string
): Promise<AIExtraction> {
  const frontMime = detectImageMimeType(frontImageBase64, frontMimeType);
  const backMime = detectImageMimeType(backImageBase64, backMimeType);
  try {
    const client = getGeminiClient();

    const extractionPrompt = `You are an elite numismatic specialist and professional banknote grader. Analyze these banknote images (front and back) and extract structured numismatic data in JSON format.

=== PRIORITY RULE #1: CERTIFIED GRADING SLABS & ENVELOPES (PMG, PCGS, LEGACY, CGC) ===
- FIRST, carefully check if the note is encased in a certified grading holder, plastic slab, or sleeve with a printed grading label banner (such as PMG - Paper Money Guaranty green banner, PCGS Banknote, Legacy Currency, etc.).
- IF A GRADING SLAB/LABEL IS VISIBLE, THE INFORMATION PRINTED ON THE LABEL IS OFFICIAL GROUND TRUTH:
  1. "countryOfOrigin": Take the exact country printed on the grader's label (e.g., if the PMG label says "Philippines", the country is "Philippines", NOT "United States").
  2. "denomination" & "currency": Take the exact face value and currency from the label (e.g., "100 Piso", "500 Pesos").
  3. "pickNumber": Take the catalog reference printed on the label (e.g., "P-192*", "Pick# 182a", "P-88").
  4. "conditionGrade": Convert the certified grade number on the label to standard tier:
     - 65 to 70 (Gem/Superb UNC) -> "UNC"
     - 60 to 64 (Uncirculated) -> "UNC"
     - 50 to 58 (About Uncirculated) -> "AU"
     - 40 to 45 (Extremely Fine) -> "XF"
     - 20 to 35 (Very Fine) -> "VF"
     - 12 to 15 (Fine) -> "F"
     - 8 to 10 (Very Good) -> "VG"
  5. "isReplacementNote": Check if the label contains a star symbol ("★" or "*") or the words "Star Note", "Replacement", or if the serial number begins/ends with a star ("*"). If so, set "isReplacementNote": true.
  6. "notes": Include the certified grading details, e.g., "PMG Certified Gem Unc 66 EPQ - Star Replacement Note".

=== PRIORITY RULE #2: PHILIPPINES & FORMER US-ADMINISTERED ISSUES ===
- Historical Philippine banknotes (Commonwealth Treasury Certificates, 1944 Victory notes, Central Bank of the Philippines issues) were engraved and manufactured by the US Bureau of Engraving and Printing (BEP) in Washington D.C.
- Even if they feature American guilloche scrollwork, George Washington portraits, or text saying "United States of America - Philippine Islands" or "Treasury Certificate by Authority of an Act of Congress", THE COUNTRY IS "Philippines" AND THE CURRENCY IS "Peso" (or "Piso"), NEVER "United States" or "US Dollar".

=== PRIORITY RULE #3: STAR & REPLACEMENT NOTES ===
- Examine the serial number and label closely for a star symbol ("*", "★") at the beginning or end of the serial number (e.g., "*01234567*", "A1234567*"). A star indicates a replacement note issued to replace a damaged print sheet. If detected, set "isReplacementNote": true.

Return ONLY a valid JSON object (no markdown, no code fences, no extra text) with these fields:
{
  "countryOfOrigin": "string - issuing country name (e.g., 'Philippines', 'Canada', 'India', 'United States')",
  "denomination": "string - numerical denomination with currency name/symbol (e.g., '100 Piso', '$10', '₹50')",
  "currency": "string - currency name (e.g., 'Philippine Peso', 'Canadian Dollar', 'Indian Rupee')",
  "pickNumber": "string - Pick catalog number if visible or on label (e.g., 'P-192*', 'P-113', 'P-24')",
  "issueYear": "string - year of issue from note or label (e.g., '1944', '2018')",
  "seriesDate": "string - series date if different from issue year",
  "fullSerialNumber": "string - complete serial number as printed including any star (*)",
  "serialPrefix": "string - prefix letters/symbols",
  "serialNumeric": "string - numeric portion",
  "serialSuffix": "string - suffix letters/symbols (e.g. '*' if star note)",
  "signature1Name": "string - first signature name if visible",
  "signature1Title": "string - first signature title/role",
  "signature2Name": "string - second signature name if visible",
  "signature2Title": "string - second signature title/role",
  "watermarks": "string - visible watermarks description",
  "securityFeatures": "string - security features (thread, hologram, color-shifting ink, etc.)",
  "conditionGrade": "string - condition tier: UNC, AU, XF, VF, F, VG, G, Unknown",
  "machineEstimatedGrade": "string - estimated grade tier",
  "fancySerialType": "string - fancy serial classification (Solid, Radar, Ladder, Binary, Repeater, LowNumber, HighNumber, Sequential, None, Unknown)",
  "isReplacementNote": "boolean - true if star or replacement note, false otherwise",
  "errorType": "string - if printing error present (e.g., misalignment, overprint), else null",
  "defectsAndAnomalies": "string - folds, stains, tears, pinholes, or holder certification details",
  "notes": "string - grader certification details (e.g. 'PMG 66 EPQ Gem Uncirculated') and historical context"
}

If any field cannot be determined, use null. Be accurate and conservative.`;

    let responseText = '';
    let lastError: any = null;

    for (const modelName of SUPPORTED_MODELS) {
      try {
        const model = client.getGenerativeModel({ model: modelName });
        const response = await model.generateContent([
          {
            inlineData: {
              mimeType: frontMime,
              data: frontImageBase64,
            },
          },
          {
            inlineData: {
              mimeType: backMime,
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
