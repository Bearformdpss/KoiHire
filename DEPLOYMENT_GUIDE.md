# 🚀 KoiHire Deployment Guide

Complete step-by-step guide to get your code on GitHub and deploy to production.

---

## 📋 Table of Contents

1. [GitHub Setup (Do First)](#github-setup)
2. [Stripe Integration (Do Second)](#stripe-integration)
3. [Production Deployment (Do Third)](#production-deployment)
4. [Email Notifications (Do Last)](#email-notifications)

---

## 1️⃣ GitHub Setup (Do This NOW)

### Step 1: Initialize Git Repository

Open a terminal in the project root and run:

```bash
# Navigate to project
cd c:\Users\taylo\Desktop\ROWFLOW_MVP_STRUCTURE

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: KoiHire MVP with dual marketplace"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. **Repository name:** `koihire` (or `koihire-mvp`)
3. **Description:** "Dual marketplace platform for freelancers and clients"
4. **Visibility:** Private (recommended for now)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

### Step 3: Connect Local Repo to GitHub

GitHub will show you commands. Run these:

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/koihire.git

# Push code to GitHub
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

### Step 4: Invite Your Stripe Friend for Code Review

1. Go to your repo: `https://github.com/YOUR_USERNAME/koihire`
2. Click **Settings** → **Collaborators**
3. Click **Add people**
4. Enter your friend's GitHub username
5. They'll receive an invite to review the code!

### ✅ Verification

- Visit your repo URL
- You should see all your code
- Your friend can now clone and review!

---

## 2️⃣ Stripe Integration (Do This SECOND)

### Why Stripe Before Deployment?

- Test payments locally first
- Debug issues on your machine
- Ensure payment flow works before going live
- Your Stripe friend can help debug locally

### Step 1: Get Stripe API Keys

1. Go to https://dashboard.stripe.com
2. Create account (or sign in)
3. Navigate to **Developers** → **API keys**
4. Copy these keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### Step 2: Add Stripe to Backend .env

```bash
# Open backend/.env and add:
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET (we'll add this later)
```

### Step 3: Add Stripe to Frontend .env.local

```bash
# Open frontend/.env.local and add:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

### Step 4: Install Stripe Libraries

```bash
# Backend
cd backend
npm install stripe

# Frontend
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Step 5: Test Stripe Locally

Use these test cards:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Any future expiry date (e.g., 12/25)**
- **Any 3-digit CVC**

**I can help implement the Stripe payment flow - just let me know!**

---

## 3️⃣ Production Deployment (Do This THIRD)

### Recommended Stack for MVP

```
✅ Domain: Ionos
✅ Frontend: Vercel (Free)
✅ Backend: Railway ($5/month)
✅ Database: Neon Postgres (Free tier)
✅ Storage: AWS S3 ($1-3/month)
✅ Email: AWS SES (Free tier)
```

**Total Cost: ~$6-10/month**

---

### Option A: Quick Deploy (Railway + Vercel) - RECOMMENDED

#### Backend Deployment (Railway)

1. **Sign up:** https://railway.app
2. **New Project** → **Deploy from GitHub**
3. **Connect GitHub** and select `koihire` repo
4. **Select service:** Choose `backend` folder
5. **Add environment variables:**
   ```
   DATABASE_URL=postgresql://...  (Railway will provide this)
   JWT_SECRET=your-secret-here
   JWT_REFRESH_SECRET=your-refresh-secret-here
   STRIPE_SECRET_KEY=sk_live_... (use LIVE keys for production)
   PORT=5003
   NODE_ENV=production
   ```
6. **Deploy!** Railway will give you a URL like `backend-production.up.railway.app`

#### Database Setup (Neon)

1. **Sign up:** https://neon.tech
2. **Create project:** Name it "koihire"
3. **Copy connection string:** Something like `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/koihire`
4. **Add to Railway:** Paste as `DATABASE_URL` environment variable
5. **Run migrations:** In Railway dashboard, run:
   ```bash
   npx prisma migrate deploy
   ```

#### Frontend Deployment (Vercel)

1. **Sign up:** https://vercel.com
2. **Import Project** → **Import Git Repository**
3. **Connect GitHub** and select `koihire` repo
4. **Root Directory:** Change to `frontend`
5. **Add environment variables:**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```
6. **Deploy!** Vercel gives you a URL like `koihire.vercel.app`

#### Domain Setup (Ionos)

1. **Buy domain** on Ionos (e.g., `koihire.com`)
2. **In Vercel:** Settings → Domains → Add `koihire.com`
3. **In Ionos DNS:** Add records Vercel provides:
   ```
   A Record: @ → 76.76.21.21
   CNAME: www → cname.vercel-dns.com
   ```
4. Wait 24-48 hours for DNS propagation

---

### Option B: Full AWS Deploy (More Complex)

**I can provide detailed AWS deployment steps if you choose this route!**

---

## 4️⃣ Email Notifications (Do This LAST)

### AWS SES Setup

1. **Sign up for AWS:** https://aws.amazon.com
2. **Go to SES:** Search for "Simple Email Service"
3. **Verify domain:** Add your Ionos domain
4. **Add DNS records to Ionos:**
   - DKIM records (3 CNAME records)
   - SPF record (TXT record)
   - DMARC record (TXT record)
5. **Request production access** (moves you out of sandbox)
6. **Get SMTP credentials** from SES console

### Backend Integration

```bash
# Install email library
cd backend
npm install nodemailer @aws-sdk/client-ses
```

**I can implement the full email service once you're ready!**

---

## 🔐 Security Checklist

Before going live:

- [ ] All `.env` files are in `.gitignore`
- [ ] Using **LIVE** Stripe keys (not test keys)
- [ ] JWT secrets are strong random strings
- [ ] Database has backups enabled
- [ ] HTTPS is enabled (Vercel does this automatically)
- [ ] CORS is configured for your domain only
- [ ] Rate limiting is enabled on API
- [ ] File upload limits are set

---

## 📊 Monitoring & Maintenance

### Free Tools to Set Up

1. **Uptime Monitoring:** https://uptimerobot.com (Free)
2. **Error Tracking:** https://sentry.io (Free tier)
3. **Analytics:** Vercel Analytics (Built-in)
4. **Database Monitoring:** Neon dashboard (Built-in)

---

## 🆘 Troubleshooting Common Issues

### "Cannot connect to database"
- Check `DATABASE_URL` format
- Ensure database allows connections from Railway IP
- Run migrations: `npx prisma migrate deploy`

### "CORS errors"
- Update backend CORS to allow your frontend domain
- Check `NEXT_PUBLIC_API_URL` is correct

### "Stripe webhooks not working"
- Set up webhook endpoint in Stripe dashboard
- Point to: `https://your-backend.railway.app/api/webhooks/stripe`
- Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### "Emails not sending"
- Verify domain in SES
- Check DNS records are correct
- Request production access if in sandbox mode

---

## 📞 Getting Help

1. **Check logs:**
   - Railway: View logs in dashboard
   - Vercel: Runtime logs in dashboard
   - Browser console for frontend errors

2. **Ask for help:**
   - Share specific error messages
   - Include relevant logs
   - Describe what you tried

3. **Your Stripe friend can help with:**
   - Payment flow review
   - Webhook setup
   - Security best practices
   - PCI compliance

---

## ✅ Success Checklist

Once deployed, verify:

- [ ] Frontend loads at your domain
- [ ] Can create account and login
- [ ] Can post a project
- [ ] Can create a service
- [ ] Can send messages
- [ ] Can make test payment (use test card)
- [ ] Emails are sending (once configured)
- [ ] Mobile responsive works
- [ ] All images/uploads work

---

## 🎉 You're Live!

Congratulations! Your marketplace is now live and accepting real users.

**Next Steps:**
1. Monitor for errors daily
2. Set up customer support email
3. Create social media accounts
4. Start marketing to first users
5. Gather feedback and iterate

---

**Need help with any of these steps? Just ask!** 🚀
