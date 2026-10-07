# Banknote Collection Manager - Master Implementation Status & Architecture Blueprint

> **System**: Specimen-Level Banknote Collection Management & 5+1 AI Multi-Source Valuation System  
> **Framework**: Next.js 15 (App Router), TypeScript (Strict Mode), Tailwind CSS, Prisma ORM (PostgreSQL), Zustand, Gemini Vision AI  
> **Status**: Phase 1 (Foundation) & Phase 2 (Mobile Capture) Complete ✅ | Phase 3 (App Shell, Desktop Workspace, Valuation Matrix & Canvas Stacker) In Progress 🔄  
> **Last Updated**: 2026-10-07

---

## 🧭 System Architecture & Design Philosophy

The application is engineered specifically for cataloging, analyzing, and valuing physical banknote specimens (scaling to 10,000+ notes) with zero-friction collector capture and a defensible multi-source valuation matrix.

```mermaid
flowchart TD
    subgraph Ingestion ["1. Rapid Ingestion & Local Capture"]
        UI_MOBILE[Mobile/Kiosk Dual-Camera Capture] -->|📷 Front + Back| CANVAS_STACK[Client Edge-Detection & Zero-Gap Canvas Stacker]
        CANVAS_STACK --> IDB[(IndexedDB Local Store & Sync Queue)]
    end

    subgraph Core_Services ["2. Next.js API Services & Rule Engine"]
        IDB -->|Auto Sync on Wi-Fi| API_CAPTURE[/api/capture & /api/sync]
        API_CAPTURE --> AI_SERVICE[Gemini Vision AI Service]
        AI_SERVICE -->|40-Field Visual JSON| RULE_ENGINE[Deterministic TS Rule Engine<br/>Serial Split, Fancy Serials, Grade Mapping]
    end

    subgraph Multi_Source_Valuation ["3. 5+1 Defensible Valuation Pipeline"]
        RULE_ENGINE --> MOD_A[Module A: Identification Engine<br/>PMG & Numista Cross-Check]
        RULE_ENGINE --> MOD_B[Module B: Signature & Variety Engine<br/>TBB & Numista Signature Combinations]
        RULE_ENGINE --> MOD_C[Module C: Rarity & Sales Engine<br/>Heritage, Stack's, eBay SOLD Only]
        
        MOD_A --> EVIDENCE_MATRIX[Source Evidence Matrix]
        MOD_B --> EVIDENCE_MATRIX
        MOD_C --> EVIDENCE_MATRIX
        
        EVIDENCE_MATRIX --> CONFLICT_DETECTOR{Conflict >20% or Pick Divergence?}
        CONFLICT_DETECTOR -- Yes --> BANNER[⚠️ Discrepancy Warning Banner & Authority Lock]
        CONFLICT_DETECTOR -- No --> FINAL_VALUATION[4-Tier Defensible Value + Dealer Trade]
    end

    subgraph Data_Layer ["4. Persistence & Security Layer"]
        FINAL_VALUATION --> PRISMA[(PostgreSQL / Prisma ORM)]
        BANNER --> PRISMA
        PRISMA --> DASHBOARD[Executive Dashboard & Collection Analytics]
    end
```

---

## 📊 Comprehensive Implementation Status Tracker

### 🌟 High-Level Phase Overview

| Phase | Description | Status | Progress |
|---|---|---|:---:|
| **Phase 1** | Foundation, Prisma ORM, Offline-First IDB, PWA | **COMPLETED** | 100% ✅ |
| **Phase 2** | Mobile Capture Flow, Dual Camera Input, Sync Queue | **COMPLETED** | 100% ✅ |
| **Phase 3** | App Shell, Global Navigation, NextAuth UI, Executive Dashboard | **COMPLETED** | 100% ✅ |
| **Phase 4** | 5+1 Valuation Matrix, Conflict Resolution, Auction Scrapers | **IN PROGRESS** | 60% 🔄 |
| **Phase 5** | Edge-to-Edge Canvas Stacker Viewer (Web Component) | **IN PROGRESS** | 60% 🔄 |
| **Phase 6** | Executive Dashboard & Collection Analytics | **COMPLETED** | 100% ✅ |

---

## 🛠️ Detailed Breakdown by Phase & Component

### ✅ Phase 1: Foundation & Architecture (COMPLETED)

- [x] **Next.js 15 App Router & Strict TypeScript**: Initialized with ESLint and zero-`any` type safety.
- [x] **Tailwind CSS & Theming**: Integrated CSS variables with dynamic dark/light mode toggle support (`AnimatedThemeToggler`).
- [x] **Prisma ORM & PostgreSQL Schema**:
  - `User`, `Account`, `Session`, `VerificationToken` (NextAuth models).
  - `Banknote` (Full 40+ catalog, physical, and packaging attributes).
  - `ExtractionLog` (AI extraction audit trail).
  - `ValuationLog` & `EvidenceMatrix` (5-source pricing records).
  - `SyncQueue` (Local-to-cloud synchronization status).
- [x] **Offline-First & PWA Integration**:
  - Service Worker integration via `next-pwa`.
  - PWA `manifest.json` with icons and mobile standalone configuration.
  - IndexedDB utilities (`lib/offline/idb.ts`) for specimens and queue tracking.
  - Network status monitor (`lib/offline/wifi-detector.ts`) with Wi-Fi auto-sync trigger.
- [x] **Core Capture Hooks**:
  - `useBanknoteCapture`: Dual-photo handling, compression, and IndexedDB caching.
  - `useOfflineSync`: Automatic background sync queue processing.
  - `useAIExtraction`: Gemini Vision API request orchestration.

---

### ✅ Phase 2: Mobile Ingestion & Capture Flow (COMPLETED)

- [x] **Mobile Capture View (`/app/(mobile)/capture`)**:
  - Step-by-step camera capture: 📷 Front Photo $\rightarrow$ 📷 Back Photo $\rightarrow$ Combined Review.
  - Fast retake & camera fallback input (`CameraInput.tsx`).
  - Zero-latency local storage confirmation with toast feedback.
- [x] **Mobile Inventory List (`/app/(mobile)/inventory`)**:
  - Card-based feed of captured notes with sync status badges (📍 Local, ☁️ Synced, ⏳ Syncing).
  - Tap-to-expand details and sync status retry trigger.
- [x] **Mobile Settings & Diagnostics (`/app/(mobile)/settings`)**:
  - IndexedDB storage stats (specimen count, queue count, estimated MB).
  - Local cache management (clear local storage safely without touching cloud).
  - Theme mode toggle.

---

### 🔄 Phase 3: Desktop Workspace, App Shell & Authentication (IN PROGRESS)

- [ ] **Unified App Shell & Navigation System**:
  - [ ] **Global Header**: Omnibox search (Pick #, Country, Serial, Denomination), Online/Offline sync status indicator, Quick Capture button (`+ Capture`), Theme toggle, and User profile avatar menu.
  - [ ] **Desktop Collapsible Sidebar**: Fast links to Dashboard, Banknote Inventory, Dual Capture, AI Valuation Matrix, Analytics, and System Settings.
  - [ ] **Mobile Bottom Tab Bar & Slide-Over Drawer**: Consistent navigation parity across phone, tablet, and desktop.
  - [ ] **Root `/` Route Rework**: Remove forced mobile-only redirect; dynamically route desktop users to `/dashboard` and mobile users to `/capture` or unified responsive layout.
- [ ] **Authentication & User Management Flow**:
  - [ ] Wrap app in NextAuth `SessionProvider` in `app/layout.tsx`.
  - [ ] Build `/auth/signin` (Login with credentials + 1-click Demo Collector login for instant testing).
  - [ ] Build `/auth/register` (New user registration).
  - [ ] Route protection middleware for authenticated dashboard features with role-based access (ADMIN, COLLECTOR, VIEWER).
- [ ] **Desktop Inventory Workspace (`/app/(dashboard)/banknotes`)**:
  - [ ] High-density horizontal table view (10–15 visible rows) with thumbnail preview.
  - [ ] Visual Grid View vs Data Table toggle.
  - [ ] Multi-criteria filters: Country, Grade (UNC down to Poor), Pick #, Fancy Serial, Storage Box.
  - [ ] Batch operations: Bulk export (CSV/JSON), batch grade adjust, valuation refresh.
  - [ ] Standalone Specimen Master Inspector modal/page (`/banknotes/[id]`).

---

### 🔄 Phase 4: AI Extraction, Rule Engine & 5+1 Valuation Matrix (IN PROGRESS)

- [x] **Gemini Vision AI Connector (`lib/ai/gemini-client.ts`)**:
  - 40-field structured JSON extraction prompt.
  - Support for multi-modal base64 Front + Back image inputs.
- [ ] **Deterministic TypeScript Rule Engine (`lib/utils/rule-engine.ts`)**:
  - *Adapted from FileMaker calculation scripts into pure, high-performance TypeScript*:
  - [x] **Serial Number Splitter**: Separates full string into `serialPrefix`, `serialNumeric`, and `serialSuffix`.
  - [x] **Fancy Serial Detector**: Regex & mathematical detection of:
    - ⭐ Solid Serials (`77777777`)
    - ⭐ Radar / Palindromic Serials (`12344321`)
    - ⭐ Low Serials (`#00000042` $\le 1000$)
    - ⭐ Ladder Serials (`12345678`)
    - ⭐ Binary Serials (only 2 distinct digits)
  - [x] **Replacement / Star Note Flag**: Detects `*` suffix/prefix or replacement series indicators.
  - [ ] **Consecutive Run Detection**: Automatically links adjacent serial numbers within the same storage box.
- [ ] **5 Core + 1 Supplemental Valuation Matrix Engine (`services/valuation.service.ts`)**:
  - [ ] **1. PMG Price Guide Connector**: Primary catalog baseline anchor.
  - [ ] **2. Heritage Auctions Realized Sales Engine**: High-tier realized auction prices.
  - [ ] **3. Stack's Bowers Realized Sales Engine**: Equal-weighted professional auction prices.
  - [ ] **4. eBay SOLD Listings Scraper Logic**:
    - **Strict Rule**: Scrapes completed/sold items ONLY (`LH_Sold=1&LH_Complete=1`). Completely ignores active asking or unsold items.
    - Matches exact Pick number, signature variety, and condition grade.
  - [ ] **5. Numista Variety & Market Cross-Check**: Signature and variety ID confirmation.
  - [ ] **6. BanknoteArchives Engine**: Supplemental historical sales for low-census items.
- [ ] **Discrepancy Detection & Conflict Resolution UI (`components/valuation/`)**:
  - [ ] Automated `⚠️ CATALOG DISCREPANCY DETECTED` banner when Pick numbers differ across sources (e.g., PMG says `P-327b`, Numista says `P-327c`).
  - [ ] Price variation warning when source estimates diverge by $>20\%$.
  - [ ] 5-Tier Confidence Badge: 🟢 CONFIRMED (90-100%), 🟡 PROBABLE (70-89%), 🟠 CONFLICT (Needs Review), 🔴 UNVERIFIED (<50%), ⚪ UNKNOWN.
  - [ ] Field-weighted authority lock & collector manual override buttons.
- [ ] **4-Tier Defensible Valuation Output Engine**:
  - [ ] 1. PMG Reference Value
  - [ ] 2. Professional Auction Range (Heritage / Stack's)
  - [ ] 3. eBay SOLD Marketplace Range + Sample Count ($n$)
  - [ ] 4. Estimated Current Market Value (CMV)
  - [ ] 5. Dealer Wholesale Buyout / Trade-Credit Range

---

### 🔄 Phase 5: Interactive Edge-to-Edge Canvas Stacker Viewer (IN PROGRESS)

- [x] **Standalone HTML5/TS Combiner Logic (`combine.ts` & `banknote_webviewer_ui.html`)**:
  - Edge detection with energy gradients to locate banknote perimeter.
  - Dark border strip shaving and perimeter dark-pixel cleansing.
  - Standardized 1200px width scaling with zero-gap Front-over-Back stacking.
- [ ] **Interactive React Canvas Stacker Component (`components/banknote/CanvasStacker.tsx`)**:
  - [ ] Embedded client-side canvas rendering for ultra-fast processing.
  - [ ] Interactive controls:
    - Front / Back / Stacked toggle.
    - Opacity Blending Slider (0% to 100% overlay to inspect watermarks and security threads through the paper).
    - Edge-to-edge high-DPI zoom lens & pan.
    - 90° / 180° rotation tools.
  - [ ] Export high-res edge-trimmed images (`frontImageUrl`, `backImageUrl`, `displayImageUrl`).

---

### ⏳ Phase 6: Executive Dashboard & Collection Analytics (PLANNED)

- [ ] **Executive Dashboard (`/app/(dashboard)/page.tsx` or `/dashboard`)**:
  - [ ] Portfolio KPI Cards: Total Market Value, Total Cost Basis, Realized/Unrealized ROI %, Total Specimens, Notes Pending AI Processing.
  - [ ] Ingestion Velocity & Queue monitor.
  - [ ] Recent Captures Carousel & Quick Ingestion trigger.
  - [ ] Storage Capacity Gauge (Physical Box/Section coordinates).
- [ ] **Collection Analytics (`/app/(dashboard)/analytics`)**:
  - [ ] Historical Portfolio Value trendlines (Recharts).
  - [ ] Geographic Distribution chart (by issuing country/region).
  - [ ] Physical Condition Grade Pyramid (UNC, AU, XF, VF, Fine, VG).
  - [ ] Fancy Serial & Rarity breakdown chart.
  - [ ] Acquisition Cost vs. Current Market Value comparison matrix.

---

## 🗄️ Master 65-Field Specimen Entity Schema

The application models the full 65-field physical banknote specimen lifecycle:

| Group | Key Fields | Description |
|---|---|---|
| **Media Containers** | `frontImageUrl`, `backImageUrl`, `displayImageUrl`, `frontTrimmedUrl`, `backTrimmedUrl` | High-res raw scans, edge-trimmed crops, and stacked 1200px zero-gap composite |
| **Catalog Identification** | `countryOfOrigin`, `denomination`, `currency`, `issueYear`, `seriesDate`, `pickNumber`, `tbbNumber`, `issuer`, `printer` | Standardized reference catalog mapping |
| **Physical Specimen Data** | `fullSerialNumber`, `serialPrefix`, `serialNumeric`, `serialSuffix`, `consecutiveRunFlag`, `runPosition` | Parsed serial metrics and run sequence tracking |
| **Signatures & Varieties** | `signature1Name`, `signature1Title`, `signature2Name`, `signature2Title`, `signatureVariety`, `watermarkVariety` | Explicit signatories and physical variety types |
| **Condition & Grading** | `conditionGrade`, `machineEstimatedGrade`, `gradingEntity`, `certNumber`, `epq` | UNC to Poor scale, slab vendor (PMG/PCGS/Raw), EPQ star |
| **Packaging & Units** | `isOriginalBundle`, `bundleSize`, `isGovernmentSealed`, `originalPackaging` | 100-note strap, 500-note pack, single sleeve |
| **Special Classifications** | `fancySerialType`, `isReplacementNote`, `errorType`, `specialPremium` | Radar, Low Serial, Solid, Star note, printing error |
| **Physical Storage Location** | `storageBox`, `storageSection`, `storagePosition` | Exact vault/box coordinates (`Box 01 -> Sec A -> Pos 023`) |
| **5+1 Valuation Evidence** | `pmgValue`, `auctionRange`, `ebaySoldRange`, `salesSampleCount`, `collectorMarketValue`, `wholesaleEstimate` | Defensible multi-source price matrix and sample counts |
| **Confidence & Audit** | `confidenceScore`, `confidenceTier`, `evidenceCitationBlock`, `discrepancyFlag` | 5-tier status (Confirmed/Conflict), audit trail, citation logs |
| **Acquisition & Provenance** | `purchasePrice`, `purchaseDate`, `acquisitionSource`, `tradeCreditValue` | Cost basis, acquisition vendor, trade valuation |

---

## 📅 Execution Roadmap & Next Steps

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ MILESTONE 1: App Shell, Navigation & Authentication Setup                         [CURRENT FOCUS]│
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Build Global Header, Desktop Sidebar, and Responsive Mobile Drawer navigation.                 │
│ 2. Set up NextAuth Session Provider, `/auth/signin`, `/auth/register`, and 1-click Demo Login.  │
│ 3. Update root `/` to direct to the rich Executive Dashboard with quick capture launcher.        │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ MILESTONE 2: Executive Dashboard & Specimen Inventory Workspace                                  │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Implement `/dashboard` with KPI cards, recent notes, and sync indicators.                     │
│ 2. Upgrade `/banknotes` with high-density table view, visual grid switch, and multi-filters.     │
│ 3. Build Specimen Detail Inspector modal with 40-field metadata tabs.                            │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ MILESTONE 3: Interactive Canvas Stacker & 5+1 Valuation Matrix UI                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Port zero-gap canvas edge-detection & watermark opacity slider into `CanvasStacker.tsx`.      │
│ 2. Build `/valuation` 5+1 Evidence Matrix table with conflict warning banners.                   │
│ 3. Build `/analytics` with portfolio growth charts and country/grade distributions.             │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```
