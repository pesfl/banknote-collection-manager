# 🚀 GitHub & Vercel Setup Guide

This guide walks you through publishing your Banknote Collection Manager to GitHub and deploying it to Vercel.

## 📋 Prerequisites

- GitHub account (free at [github.com](https://github.com))
- Vercel account (free at [vercel.com](https://vercel.com))
- Git installed locally
- Code already committed (✓ done)

---

## 1️⃣ Create GitHub Repository

### Step 1: Create New Repo on GitHub
1. Go to [github.com/new](https://github.com/new)
2. **Repository name**: `banknote-collection-manager` (or your preferred name)
3. **Description**: "Specimen-level banknote collection management with offline-first mobile capture"
4. **Visibility**: Public or Private (up to you)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

### Step 2: Push Code to GitHub

Copy the SSH or HTTPS command from GitHub (they'll show it after creating the repo) and run:

```bash
cd /Users/immanual/Desktop/IMMCODE/banknote_system_app/app

# Option A: HTTPS (if you have password auth set up)
git remote add origin https://github.com/YOUR_USERNAME/banknote-collection-manager.git
git branch -M main
git push -u origin main

# Option B: SSH (recommended if SSH keys are set up)
git remote add origin git@github.com:YOUR_USERNAME/banknote-collection-manager.git
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

### Step 3: Verify on GitHub
Go to `https://github.com/YOUR_USERNAME/banknote-collection-manager` and confirm all files are there.

---

## 2️⃣ Deploy to Vercel

### Option A: Deploy via GitHub (Recommended)

#### Step 1: Connect GitHub to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub (or create account)
3. Click **New Project**
4. Click **Import Git Repository**
5. Select `banknote-collection-manager` from your repos
6. Click **Import**

#### Step 2: Configure Environment Variables
The deploy page will show fields for environment variables (from `vercel.json`).

Fill in these required variables:

```
DATABASE_URL = postgresql://user:password@host/dbname
NEXTAUTH_URL = https://your-domain.vercel.app
NEXTAUTH_SECRET = <generate below>
GOOGLE_GENERATIVE_AI_API_KEY = <your Gemini API key>
AWS_REGION = us-east-1
AWS_ACCESS_KEY_ID = <your AWS key>
AWS_SECRET_ACCESS_KEY = <your AWS secret>
S3_BUCKET_NAME = banknotes-collection
```

#### Step 3: Generate Required Secrets

**NEXTAUTH_SECRET** - Generate a random secure string:
```bash
openssl rand -base64 32
```
Copy the output and paste into the `NEXTAUTH_SECRET` field.

**GOOGLE_GENERATIVE_AI_API_KEY** - Get from:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Create API Key**
3. Copy the key

**AWS Credentials** - If using S3:
1. Go to AWS IAM
2. Create access key for a user with S3 permissions
3. Copy Access Key ID and Secret Access Key

#### Step 4: Deploy
1. Click **Deploy**
2. Wait for build to complete (2-3 minutes)
3. You'll get a URL: `https://banknote-collection-manager.vercel.app`

#### Step 5: Update NEXTAUTH_URL (if needed)
If deployment URL differs from what you entered:
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Settings → Environment Variables
4. Update `NEXTAUTH_URL` to match your Vercel URL
5. Redeploy (will be automatic)

---

### Option B: Deploy via CLI

If you prefer command-line:

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project
cd /Users/immanual/Desktop/IMMCODE/banknote_system_app/app

# Deploy
vercel

# You'll be prompted to:
# 1. Link to existing or create new project
# 2. Set up environment variables
# 3. Confirm deployment
```

---

## 3️⃣ Database Setup

### Local Development (SQLite)
```bash
# Uses SQLite by default if DATABASE_URL not set
npx prisma migrate dev
```

### Production (PostgreSQL on Vercel)

**Option A: Use Vercel Postgres**
1. In Vercel dashboard → Storage → Connect Store
2. Click **Create New** → **Postgres**
3. Copy connection string to `DATABASE_URL` env var
4. Run migration:
```bash
npx prisma migrate deploy
```

**Option B: Use External PostgreSQL**
1. Get connection string from your provider
2. Add to Vercel env variables
3. Run migration

---

## 4️⃣ Custom Domain (Optional)

To use a custom domain like `banknotes.yourdomain.com`:

1. In Vercel dashboard → Settings → Domains
2. Add your domain
3. Add DNS records (Vercel will show exact ones needed)
4. Update `NEXTAUTH_URL` to use your domain
5. Redeploy

---

## 5️⃣ Testing Deployed App

### Mobile Testing
1. Visit your Vercel URL on a phone
2. Try capturing a banknote
3. Check sync status
4. Go offline, capture again
5. Check IndexedDB in DevTools

### Desktop Testing
1. Open on a desktop browser
2. Open DevTools → Application → Storage
3. See IndexedDB databases
4. Check Service Workers
5. Verify PWA manifest

---

## 6️⃣ Continuous Deployment

Once GitHub is connected to Vercel:
- Every push to `main` branch auto-deploys
- No need to manually push to Vercel
- Previews created for pull requests automatically

**Git workflow**:
```bash
# Make changes locally
git add .
git commit -m "Add new feature"
git push origin main

# ← Vercel automatically builds & deploys
```

---

## 🔍 Verify Deployment

Check these after deploying:

- [ ] App loads at Vercel URL
- [ ] Mobile capture works
- [ ] Offline mode works (turn off internet, capture)
- [ ] Images compress properly
- [ ] Sync triggers on Wi-Fi
- [ ] PWA manifest accessible (`/manifest.json`)
- [ ] Environment variables set correctly
- [ ] Logs show no errors

**View Vercel logs**:
1. Vercel dashboard → Your project
2. Click "Deployments"
3. Select latest deployment
4. Click "Logs"

---

## 🆘 Troubleshooting

### "Module not found" errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run build
```

### "ENV variable not found"
- Check Vercel dashboard → Settings → Environment Variables
- Verify variable names match `.env.example`
- Redeploy after adding variables

### "Database connection failed"
- Check `DATABASE_URL` is set in Vercel
- Verify database is running/accessible
- Test connection locally first

### "Service Worker not loading"
- Check browser console for errors
- Verify `/manifest.json` exists
- Clear cache: DevTools → Application → Clear Storage

### "Camera not working on mobile"
- HTTPS required (Vercel provides this)
- Check camera permissions in settings
- Test with gallery upload as fallback

---

## 📊 Monitoring

### Vercel Analytics
1. Dashboard → Your project
2. Click "Analytics"
3. See real-time traffic, errors, usage

### Database Monitoring
- Use Prisma Studio: `npx prisma studio`
- Or your database provider's console

---

## 🔐 Security Checklist

- ✅ `NEXTAUTH_SECRET` is strong & random
- ✅ AWS keys are limited to S3 only
- ✅ Database password is strong
- ✅ Repository is private (if sensitive)
- ✅ No `.env` file in git
- ✅ All secrets in Vercel env, not in code

---

## 🚀 Next Steps After Deployment

1. **Add Custom Domain** (if desired)
2. **Set up Monitoring** (Vercel Analytics, Sentry, etc.)
3. **Configure CI/CD** (add GitHub Actions for tests)
4. **Set up Backup** (database backups)
5. **Create API Keys** for Google Gemini & AWS
6. **Test AI Extraction** (after Gemini API key added)
7. **Monitor Sync Queue** (check for failed syncs in logs)

---

## 📚 Useful Links

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **GitHub Docs**: https://docs.github.com
- **Prisma Docs**: https://www.prisma.io/docs
- **NextAuth.js Docs**: https://next-auth.js.org

---

## ✅ Success!

Once deployed, you have:
- ✅ Live web app accessible globally
- ✅ Mobile capture working offline
- ✅ Auto-sync to cloud
- ✅ Scalable PostgreSQL database
- ✅ CI/CD via GitHub + Vercel
- ✅ HTTPS + custom domain ready

**Share your app URL!** Example: `https://banknote-collection-manager.vercel.app`

---

## 🆘 Need Help?

- **Vercel Support**: vercel.com/support
- **GitHub Discussions**: github.com/yourusername/banknote-collection-manager/discussions
- **Community**: Next.js Discord, Vercel Discord
