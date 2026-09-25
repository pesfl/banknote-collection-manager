# 🏦 Banknote Collection Manager- Micheal

**Specimen-Level Banknote Collection Management & AI Multi-Source Valuation System**

A modern, mobile-first web application for cataloging, analyzing, and valuing banknotes with **offline-first** architecture, **AI-powered extraction**, and **multi-source valuation**.

## 🎯 Features

### 📱 Mobile Experience (Minimal but Powerful)
- **Dual-Photo Capture**: Front + Back of each specimen, instantly saved locally
- **Zero Internet Required**: Captures stored in IndexedDB, synced automatically when online
- **Recent Inventory**: View recent captures with sync status badges
- **Network Aware**: Detects Wi-Fi vs cellular, auto-syncs on Wi-Fi only
- **Settings**: Local storage management, app info

### 💻 Desktop Features (Full-Featured)
- **Advanced Inventory Grid**: Filter, sort, search specimens
- **AI-Powered Extraction**: Gemini Vision API extracts 40+ fields from images
- **Multi-Source Valuation**: PMG, Heritage Auctions, Stack's Bowers, eBay, Numista
- **Valuation Matrix**: Evidence from 6 sources with conflict detection
- **Analytics Dashboard**: Portfolio value, rarity distribution, ROI tracking

### 🔌 Technical Highlights
- **Offline-First**: Service Workers + IndexedDB for seamless offline usage
- **Responsive Design**: Mobile-first, works on all devices
- **Type-Safe**: TypeScript strict mode, Zod validation schemas
- **Progressive Web App**: Installable on iOS/Android home screens
- **No Data Loss**: Local queue ensures no captures are lost

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+ (or SQLite for local dev)

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your settings

# Initialize database
npx prisma migrate dev

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📱 How to Use

### Mobile Capture
1. Tap **📷 Capture** tab
2. Take or upload **Front** photo
3. Take or upload **Back** photo
4. Add optional notes
5. Tap **Save Specimen** → ✓ Saved locally (no internet needed)

### Sync to Cloud
- **Automatic**: When on Wi-Fi, syncs automatically
- **Manual**: Expand **SyncPanel**, tap **↑ Sync Now**
- **Status**: Badges show 📍 Local, ☁️ Synced, ⏳ Syncing, ⚠️ Error

### View Collection
1. Tap **📋 Inventory** tab
2. See recent captures in grid
3. Tap any card to view details
4. Check sync status & network info

## 📂 Project Structure

```
app/
├── app/                    # Next.js pages
│   ├── (mobile)/          # Mobile routes (capture, inventory, settings)
│   ├── (dashboard)/       # Desktop routes (full features)
│   ├── api/              # API endpoints
│   └── layout.tsx        # Root layout
├── components/           # React components
│   └── mobile/          # Mobile-specific
├── lib/                 # Utilities
│   ├── offline/         # IndexedDB, sync, network
│   ├── auth.ts         # NextAuth setup
│   └── db/            # Prisma
├── hooks/              # Custom React hooks
├── types/             # TypeScript & Zod schemas
├── prisma/            # Database schema
└── public/            # Assets, manifest.json
```

## 🛠️ Tech Stack

- **Next.js 15** (App Router, SSR)
- **TypeScript** (strict mode)
- **Tailwind CSS** (responsive, dark mode)
- **Prisma ORM** + PostgreSQL
- **NextAuth.js** (authentication)
- **Zustand** (state management)
- **TanStack Query** (server state)
- **IndexedDB + Service Workers** (offline)
- **Google Gemini Vision API** (AI extraction)
- **Zod** (validation)

## 📊 Database Schema

- **User** — Auth + roles
- **Banknote** — Specimen data
- **ExtractionLog** — AI history
- **ValuationLog** — Price evidence
- **SyncQueue** — Offline-first queue

## 🌐 Deploy to Vercel

### 1. Push to GitHub
```bash
git add .
git commit -m "Initial commit: mobile capture + offline-first"
git push origin main
```

### 2. Connect to Vercel
- Go to [vercel.com](https://vercel.com)
- Click **New Project**
- Select GitHub repo
- Import settings
- Add environment variables
- Deploy!

### Environment Variables (in Vercel)
```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<random-string>
GOOGLE_GENERATIVE_AI_API_KEY=<your-key>
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
S3_BUCKET_NAME=banknotes-collection
```

## 📝 Documentation

- **[Mobile Implementation Guide](./MOBILE_IMPLEMENTATION_GUIDE.md)** — Components, test scenarios
- **[Implementation Status](./IMPLEMENTATION_STATUS.md)** — Feature checklist, roadmap
- **[NextJS Specification](../NEXTJS_WEBAPP_SPECIFICATION_PROMPT.md)** — Full requirements

## 🔐 Security

✅ NextAuth.js JWT auth
✅ Role-based access (ADMIN, COLLECTOR, VIEWER)
✅ Zod input validation
✅ Environment variables for secrets
✅ CORS headers on APIs

## 📈 Roadmap

- ✅ Mobile capture + offline-first
- ⏳ API integration (S3, sync endpoints)
- ⏳ AI extraction (Gemini Vision)
- ⏳ Desktop dashboard + valuation
- ⏳ Analytics + charts

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repo
2. Create feature branch
3. Commit changes
4. Push & open PR

---

**Made with ❤️ for banknote collectors**
