# Mobile UI Implementation Guide

**Status**: ✅ Complete - Ready for Testing
**Last Updated**: 2026-09-25

---

## 📱 What's Been Built

### Components

#### Capture Flow (`components/mobile/CaptureFlow.tsx`)
- **Step 1: Front Photo** → Camera/file upload
- **Step 2: Back Photo** → Camera/file upload  
- **Step 3: Review** → Preview both images + optional notes
- **Step 4: Complete** → Save to IndexedDB (no internet required)

**Key Features**:
✅ Full camera access (with file upload fallback)
✅ Image compression (JPEG 85% quality for IndexedDB)
✅ Instant local save feedback
✅ Retry/retake buttons at review stage
✅ Optional notes field

#### Camera Input (`components/mobile/CameraInput.tsx`)
- Native `getUserMedia()` API for camera access
- Canvas capture for image serialization
- File input fallback for gallery upload
- Real-time camera feed preview
- Capture button (disabled until ready)

#### Inventory List (`components/mobile/InventoryList.tsx`)
- Grid view of 20 most recent captures
- **Empty state** with CTA to start capturing
- **Detail modal** on tap (expands for full specimen info)
- **Sync status badges** (📍 Local, ☁️ Synced, ⏳ Syncing, ⚠️ Error)
- Real-time updates every 2 seconds

#### Inventory Card (`components/mobile/InventoryCard.tsx`)
- Thumbnail preview (Front image)
- Country + Denomination from extracted data
- Relative timestamp ("5m ago", "2h ago", etc.)
- Sync status badge
- Click to expand

#### Sync Panel (`components/mobile/SyncPanel.tsx`)
- **Network status indicator** (📴 Offline / 📱 Cellular / ✓ Wi-Fi)
- **Sync counters** (Pending, Synced, Failed)
- **Manual "Sync Now" button**
- **Retry Failed button** (if failed items exist)
- **Status messages**:
  - "You're offline. Sync will happen automatically when back online."
  - "Switch to Wi-Fi to sync (to save cellular data)"
  - "All synced"

#### Additional Components
- `SyncStatusBadge.tsx` — Reusable sync status indicator
- `NotesInput.tsx` — Optional notes textarea
- `ImagePreview.tsx` — Image preview with remove button

### Pages

#### `/capture` (Mobile Capture)
- Full-screen capture flow
- Sticky header with navigation link
- Success toast notification
- Bottom navigation bar (3 tabs)
- Responsive touch-friendly buttons (44px+ tap targets)

#### `/inventory` (Mobile Inventory)
- Recent captures grid
- Expandable sync panel
- Specimen detail modal
- Empty state with CTA
- Bottom navigation bar

#### `/settings` (Mobile Settings)
- Storage usage statistics
- Local data management (clear button)
- App info section
- Bottom navigation bar

### Layout Features
- **Bottom Navigation** (sticky) - 3 main tabs
- **Responsive Design** - Mobile-first, works on tablets
- **Dark Mode Support** - Full `dark:` prefixes in Tailwind
- **Touch-Optimized** - Buttons, inputs designed for mobile

---

## 🔗 Data Flow

```
Camera/Gallery
    ↓
CaptureFlow Component
    ↓
useBanknoteCapture Hook
    ├─ Compress images (JPEG 85%)
    └─ Save to IndexedDB
    ↓
InventoryList Component
    ├─ Query IndexedDB (getRecentSpecimens)
    ├─ Poll for sync status updates
    └─ Render cards with badges
```

### Sync Flow
```
InventoryList (displays pending count)
    ↓
SyncPanel (manual/auto sync trigger)
    ↓
useOfflineSync Hook
    ├─ Monitor network status
    ├─ Detect Wi-Fi (auto-trigger)
    └─ Call syncPendingSpecimens()
    ↓
SyncQueueManager (lib/offline/sync-queue.ts)
    ├─ Get pending specimens
    ├─ POST to /api/capture (batch upload)
    ├─ Update IndexedDB sync status
    └─ Log results
    ↓
Database Updated
    ↓
InventoryList Re-renders (toast notification)
```

---

## 🎯 How to Test

### Prerequisites
```bash
# Navigate to project
cd /Users/immanual/Desktop/IMMCODE/banknote_system_app/app

# Install dependencies (if not done)
npm install

# Create .env.local file
cp .env.example .env.local
# Edit .env.local with your settings (can use dummy values for local testing)
```

### Run Development Server
```bash
npm run dev
```

Open: `http://localhost:3000`

### Test on Mobile Device
1. Get your machine's IP: `ipconfig getifaddr en0` (macOS) or `ipconfig` (Windows)
2. On mobile: `http://<YOUR_IP>:3000`
3. **iOS**: Add to Home Screen (Settings → Share → Add to Home Screen)
4. **Android**: Install prompt should appear

### Test Scenarios

#### ✅ Test 1: Capture Flow
1. Tap "📷 Capture" tab
2. Tap "📷 Take Photo" or "📁 Choose from Gallery"
3. Capture/select Front photo
4. Tap "Capture" or "Choose from Gallery" again for Back photo
5. Review both images
6. Add optional notes
7. Tap "Save Specimen"
8. **Expect**: ✓ Success screen, specimen appears in Inventory within 2 seconds

#### ✅ Test 2: Offline Functionality
1. Capture a specimen (as above)
2. Turn OFF Wi-Fi / Go airplane mode
3. Tap "📋 Inventory" tab
4. **Expect**: 
   - Specimen visible with "📍 Local" badge
   - SyncPanel shows "📴 Offline"
   - "Sync Now" button is disabled

#### ✅ Test 3: Auto-Sync on Wi-Fi
1. Capture a specimen while OFFLINE
2. Turn ON Wi-Fi
3. **Expect**: 
   - SyncPanel shows "✓ Wi-Fi"
   - Sync happens automatically (badge changes to "☁️ Synced" or "⏳ Syncing")
   - If API fails: "⚠️ Error" badge

#### ✅ Test 4: Manual Sync
1. Capture while offline
2. Expand SyncPanel
3. Tap "↑ Sync Now"
4. **Expect**: Loading spinner, then status update

#### ✅ Test 5: Storage Info
1. Tap "⚙️ Settings"
2. **Expect**: 
   - Shows "Saved Specimens: X"
   - Shows "Space Used: X KB"
   - "Clear Local Data" button available

#### ✅ Test 6: Specimen Details
1. Go to "📋 Inventory"
2. Tap any specimen card
3. **Expect**: 
   - Modal slides up from bottom
   - Shows full Front + Back images
   - Shows Status, Captured time, Notes (if any)
   - "Close" button at bottom

#### ✅ Test 7: Network Status Display
1. Go to "📋 Inventory" → Expand SyncPanel
2. Disconnect Wi-Fi (stay online via cellular if possible)
3. **Expect**: 
   - Shows "📱 Cellular" badge
   - "Sync Now" disabled
   - Warning: "Switch to Wi-Fi to sync..."
4. Connect to Wi-Fi
5. **Expect**: 
   - Badge changes to "✓ Wi-Fi"
   - Auto-sync triggers

#### ✅ Test 8: Responsive Design
1. Open on mobile phone (portrait)
   - Should fit perfectly, buttons easy to tap
2. Open on tablet (landscape)
   - Should expand to fit landscape, still usable
3. Open in browser DevTools (mobile emulation)
   - Inspect responsive breakpoints (sm/md/lg)

---

## 🎨 UI/UX Details

### Colors & Status Indicators
| Status | Badge | Background | Text | Icon |
|--------|-------|-----------|------|------|
| Pending | 📍 Local | Yellow 100 | Yellow 800 | 📍 |
| Syncing | ⏳ Syncing | Blue 100 | Blue 800 | ⏳ |
| Synced | ☁️ Synced | Green 100 | Green 800 | ☁️ |
| Failed | ⚠️ Error | Red 100 | Red 800 | ⚠️ |

### Touch Targets
- All buttons: **44px minimum height** (iPhone guideline)
- Icon buttons: **48x48px**
- Card tap area: **Full card**

### Animations
- Success toast: Fade in/out (3s duration)
- Modal entry: Slide up from bottom
- Sync status: Real-time badge updates
- Loading spinner: CSS animation

### Dark Mode
- All components support dark mode via `dark:` prefixes
- Background: `bg-white dark:bg-gray-800`
- Text: `text-gray-900 dark:text-white`
- Borders: `border-gray-200 dark:border-gray-700`

---

## 📊 Component Tree

```
(mobile)/ [Group Layout]
├── layout.tsx (shared layout for mobile routes)
├── (capture)/
│   └── page.tsx [CapturePage]
│       └── CaptureFlow
│           ├── CameraInput
│           ├── ImagePreview (Front)
│           ├── ImagePreview (Back)
│           ├── NotesInput
│           └── Action Buttons
│
├── (inventory)/
│   └── page.tsx [InventoryPage]
│       └── InventoryList
│           ├── SyncPanel
│           │   └── NetworkIndicator
│           ├── Header (title + counts)
│           ├── Grid
│           │   └── InventoryCard[]
│           │       ├── Thumbnail
│           │       ├── Country/Denomination
│           │       ├── Timestamp
│           │       └── SyncStatusBadge
│           └── SpecimenDetailModal
│               ├── Full Images
│               ├── Metadata (Status, Date, Notes)
│               └── Close Button
│
└── (settings)/
    └── page.tsx [SettingsPage]
        ├── Storage Section
        ├── Data Management Section
        └── About Section
```

---

## 🔄 State Management

### Local State (React Hooks)
- `CaptureFlow`: step, frontImage, backImage, notes, previews
- `InventoryList`: specimens[], counts, selectedId, isLoading
- `SyncPanel`: isExpanded

### Global State (Zustand + Context)
- User authentication (NextAuth)
- Network status (EventEmitter in `wifi-detector.ts`)
- Sync status (SyncQueueManager subscription)

### Local Storage (IndexedDB)
- **Specimens table**: All captured images + metadata
- **SyncQueue table**: Pending syncs + retry tracking
- **SyncLog table**: Sync history

---

## 🚀 Ready for Next Steps

### To Continue Development:
1. **API Integration** 
   - Wire up `/api/capture` to actually upload to S3
   - Implement `/api/sync/push` endpoint
   
2. **AI Extraction**
   - Add Gemini Vision API call in capture flow
   - Display extracted metadata in inventory cards

3. **Desktop Version**
   - Create `/app/(dashboard)/banknotes` for grid view
   - Build valuation matrix component
   - Analytics dashboard

4. **Authentication**
   - Create `/app/(auth)/signin` and `/register` pages
   - Add session guards to routes

---

## 📝 Notes for Development

### Camera Permissions
- iOS: Requires `<NSCameraUsageDescription>` in Info.plist (PWA workaround pending)
- Android: Requires `<uses-permission android:name="android.permission.CAMERA"/>` in AndroidManifest.xml
- Web: Browser permission prompt on first camera access

### IndexedDB Storage
- Blobs stored directly (not Base64) to minimize DB size
- Estimated 500KB per specimen (compressed JPEG)
- Auto-cleanup: No explicit pruning (users can clear via Settings)

### Network Detection
- Fallback: Assumes Wi-Fi if online (iOS limitation)
- Android: Can detect cellular vs Wi-Fi
- Auto-sync only triggers on `navigator.connection.type === 'wifi'` or equivalent

### Performance
- Grid rendering: 2 columns (mobile), 3-4 on tablets
- Lazy loading: Images use native browser loading
- Re-renders: Inventory refreshes every 2 seconds (can be optimized with sync events)

---

## 🐛 Known Issues & TODOs

- ⏳ Camera permission errors not gracefully handled
- ⏳ No success/error messages from API (API endpoints still stubs)
- ⏳ No image compression for network upload (only local storage)
- ⏳ IndexedDB migration strategy not implemented
- ⏳ Sync retry UI doesn't show countdown timer

---

## ✅ Checklist Before Production

- [ ] API endpoints implemented (`/api/capture`, `/api/sync/push`)
- [ ] S3/R2 image upload working
- [ ] Authentication & session management
- [ ] Gemini Vision API integration
- [ ] Error handling & user feedback
- [ ] Mobile app testing on real iOS/Android
- [ ] PWA app icons & manifest finalized
- [ ] Service Worker offline testing
- [ ] Data migration strategy
- [ ] Privacy policy & terms
- [ ] Analytics tracking
- [ ] Performance optimization
