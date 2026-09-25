# 🤖 AI "Identify" Feature - Gemini Vision Integration Guide

**Status**: ✅ Complete and Ready to Deploy  
**Last Updated**: 2026-09-26

---

## 📋 What's Been Built

### 1. **Gemini Vision API Client** (`lib/ai/gemini-client.ts`)
- Calls Google Gemini 1.5 Flash model with front + back images
- Extracts 40+ banknote fields in structured JSON
- Type-safe Zod validation on all responses
- Comprehensive error handling

### 2. **AI Extraction API Endpoint** (`/api/ai/extract`)
- POST endpoint that accepts multipart form data (front + back photos)
- Converts images to base64 for Gemini API
- Returns validated AIExtraction schema
- Graceful error messages

### 3. **React Hook** (`hooks/useAIExtraction.ts`)
- `useAIExtraction()` hook for components
- Manages extraction state (loading, results, errors)
- Handles file-to-FormData conversion
- Provides `extractBanknote()` and `clearResults()` methods

### 4. **Results Component** (`components/mobile/ExtractionResults.tsx`)
- Beautiful expandable card displaying 40+ extracted fields
- 6 organized sections (Identity, Serial, Condition, Signatures, Security, Details)
- Summary row showing key info (Country, Denomination, Condition, Pick #)
- Dark mode support

### 5. **Capture Integration** (Updated `CaptureFlow.tsx`)
- Auto-extract after saving specimen
- Shows "🤖 Analyzing..." loading state with spinner
- Displays results in completion screen
- Graceful fallback if extraction fails
- Doesn't block capture workflow (continues even on error)

---

## 🚀 Setup Instructions

### Step 1: Get Google Gemini API Key

1. Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)**
2. Click **Create API Key** in your Google Cloud project
3. Copy the key (starts with `AIza...`)

### Step 2: Add to Vercel Environment

1. Go to your **Vercel Dashboard**
2. Select your project
3. **Settings** → **Environment Variables**
4. Add:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY = your_key_here
   ```
5. Redeploy

Or set locally:
```bash
echo 'GOOGLE_GENERATIVE_AI_API_KEY=your_key_here' >> .env.local
```

### Step 3: Test the Feature

1. Go to mobile capture: `/capture`
2. Capture Front and Back photos
3. Tap "Save Specimen"
4. Watch for "🤖 Analyzing..." loading state
5. Results appear automatically when done!

---

## 🎯 Extracted Fields (40+)

### Identity (Required)
- ✅ Country of Origin
- ✅ Denomination & Face Value
- ✅ Currency Name
- ✅ Pick Catalog Number
- ✅ Issue Year & Series Date

### Serial Number
- ✅ Full Serial Number
- ✅ Prefix (letters/numbers)
- ✅ Numeric Portion
- ✅ Suffix (letters)
- ✅ Fancy Serial Type (Radar, Ladder, Solid, etc.)
- ✅ Replacement Note (star/special)

### Condition & Grading
- ✅ Condition Grade (UNC, AU, XF, VF, F, VG, G)
- ✅ Machine-Estimated Grade (AI assessment)
- ✅ Physical Defects (folds, stains, tears)
- ✅ Error Types (miscut, overprint, etc.)

### Authentication
- ✅ Signature 1 (Name & Title)
- ✅ Signature 2 (Name & Title)
- ✅ Watermarks Present
- ✅ Security Features (thread, hologram, etc.)

### Additional
- ✅ Collector Notes & Special Features
- ✅ Historical Details
- ✅ Full 40+ field schema per `types/index.ts`

---

## 📊 API Specification

### POST `/api/ai/extract`

**Request**: multipart/form-data
```
Content-Type: multipart/form-data

frontImage: File (JPEG/PNG)
backImage: File (JPEG/PNG)
```

**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "countryOfOrigin": "India",
    "denomination": "₹10",
    "currency": "Indian Rupee",
    "pickNumber": "P-88",
    "issueYear": "2017",
    "fullSerialNumber": "25N 185629",
    "conditionGrade": "UNC",
    "signature1Name": "Raghuram Rajan",
    "signature1Title": "Governor",
    "watermarks": "Ashoka Lion Capital",
    "securityFeatures": "Security thread, Hologram",
    "fancySerialType": "Radar",
    "isReplacementNote": false,
    "machineEstimatedGrade": "UNC",
    ... (30+ more fields)
  }
}
```

**Error**: 500
```json
{
  "success": false,
  "error": "Google Generative AI API key not configured"
}
```

---

## 🎨 UX Flow

```
User captures Front photo
        ↓
User captures Back photo
        ↓
[Review Screen: can edit notes, retake photos]
        ↓
Click "Save Specimen"
        ↓
[Show "Saving..." spinner] → Save to IndexedDB (instant)
        ↓
[Show "🤖 Analyzing..."] → Call /api/ai/extract (Gemini API)
        ↓
[Results display] → Show extracted 40+ fields
        ↓
Can expand/collapse sections
        ↓
"Capture Another" button to reset form
```

---

## 🔍 Example Output

When user captures a banknote, they see:

```
✓ Saved!

🤖 AI Extraction Results
┌─────────────────────────┐
│ India | ₹10 | UNC | P-88│
└─────────────────────────┘

[Tap to expand all sections]

Sections available:
- 🪪 Identity (Country, Denomination, Pick #)
- #️⃣ Serial Number (Full, Prefix, Type)
- 📊 Condition & Grade (Grade, Defects)
- ✍️ Signatures (Sig1, Sig2)
- 🔒 Security Features (Watermarks, Thread)
- 📝 Details (Year, Notes)
```

---

## 🛠️ Development Tips

### Testing Locally
```bash
# Ensure API key is in .env.local
GOOGLE_GENERATIVE_AI_API_KEY=your_key

# Run dev server
npm run dev

# Open http://localhost:3000/capture
# Upload test banknote images
```

### Debugging
- Check browser console for extraction errors
- Network tab shows POST to `/api/ai/extract`
- Vercel logs show Gemini API calls
- IndexedDB contains extraction results

### Cost
- Gemini 1.5 Flash: ~$0.001-0.01 per extraction
- Free tier: 15 requests/minute, 32K tokens/day
- Production: Pay as you go (~$0.0001 per 1K tokens)

---

## 📈 Future Enhancements

### Phase 2
- [ ] Manual correction UI (edit extracted fields)
- [ ] Confidence scoring per field
- [ ] Batch extraction (multiple notes at once)
- [ ] OCR improvement with lighting/angle detection

### Phase 3
- [ ] Valuation integration (prices from extracted data)
- [ ] Duplicate detection (same note detected twice)
- [ ] Rarity scoring (based on serial + variety)
- [ ] Export extraction as CSV/PDF

### Phase 4
- [ ] Model fine-tuning on collector feedback
- [ ] Real-time preview as user captures
- [ ] Edge case handling (old/rare notes)
- [ ] Multi-language support

---

## 🔐 Security & Privacy

✅ **API Key Security**:
- Never exposed in client code
- Only used server-side in `/api/ai/extract`
- Set in Vercel environment variables
- Rotatable in Google Cloud Console

✅ **Image Privacy**:
- Images only sent to Google Gemini API
- Not stored in our database
- Only metadata (extraction results) saved
- User can delete anytime from inventory

✅ **Rate Limiting** (recommended for production):
- Add rate limiting middleware on `/api/ai/extract`
- Prevent abuse/cost explosion
- Per-user or per-IP limits

---

## 🚀 Deploy Checklist

- [x] Gemini client created
- [x] API endpoint implemented
- [x] React hook built
- [x] Components created
- [x] Capture flow integrated
- [x] Error handling added
- [ ] API key added to Vercel
- [ ] Tested with real images
- [ ] Monitored costs
- [ ] Rate limiting added (optional)

---

## 📞 Troubleshooting

### "API key not configured"
→ Check Vercel Settings → Environment Variables  
→ Verify `GOOGLE_GENERATIVE_AI_API_KEY` is set  
→ Redeploy after adding

### "Failed to extract banknote details"
→ Images might be too blurry/low resolution  
→ Try clearer photos with good lighting  
→ Check Gemini API quota/usage in Google Cloud

### "timeout"
→ Gemini API taking too long (normal for complex images)  
→ Increase timeout from default 30s to 60s  
→ Check Vercel function timeout setting

### Extraction results not showing
→ Check browser console for errors  
→ Verify images are in JPEG/PNG format  
→ Test with sample banknote images first

---

## 📚 References

- **Gemini API Docs**: https://ai.google.dev/docs
- **Vision Capabilities**: https://ai.google.dev/docs/vision
- **Pricing**: https://ai.google.dev/pricing
- **Quotas**: https://ai.google.dev/docs/quotas_limits

---

## ✨ What's Next?

After deploying this feature:

1. **Test with real banknotes** — capture various denominations/countries
2. **Monitor API costs** — watch Google Cloud billing
3. **Collect user feedback** — accuracy, speed, features
4. **Fine-tune prompt** — adjust extraction schema based on results
5. **Build valuation integration** — use extracted data for pricing
6. **Add manual corrections** — let users edit AI results

---

**Feature Ready!** 🎉 Deploy to Vercel and test with real banknotes.
