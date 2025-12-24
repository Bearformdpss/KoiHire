# Load Testing Quick Start

## 🚀 First Time? Start Here!

### Step 1: Install k6 (One-Time Setup)

**Windows:**
1. Go to: https://github.com/grafana/k6/releases/latest
2. Download `k6-v0.xx.x-windows-amd64.msi`
3. Run the installer
4. Open a NEW terminal/PowerShell window
5. Type: `k6 version` (should show version number)

### Step 2: Get Your Production URL

Find your Railway backend URL:
1. Go to https://railway.app
2. Click your RowFlow backend project
3. Go to "Settings" → "Domains"
4. Copy the URL (looks like: `https://xyz.railway.app`)

### Step 3: Run Your First Load Test

Open terminal in the `backend` folder:

```bash
cd backend

# Test with 100s of concurrent users
k6 run -e API_URL=https://YOUR-RAILWAY-URL/api load-tests/03-realistic-mixed.js
```

Replace `YOUR-RAILWAY-URL` with your actual Railway URL.

**Example:**
```bash
k6 run -e API_URL=https://rowflow-production.railway.app/api load-tests/03-realistic-mixed.js
```

### Step 4: Watch the Results

The test will run for about **19 minutes**. You'll see:
- Current VUs (virtual users)
- Requests per second
- Response times
- Error rate

**What you're looking for:**
- ✅ Response times (p95) under 3000ms
- ✅ Error rate under 2%
- ✅ All checks passing

---

## Alternative: Using npm Scripts

```bash
# Set your production URL first (one time)
# Windows PowerShell:
$env:PROD_API_URL="https://your-app.railway.app/api"

# Then run:
npm run load-test:prod
```

---

## Quick Tests

### Just want to see if it works?
```bash
# Quick 6-minute test with only 100 users max
k6 run -e API_URL=https://YOUR-RAILWAY-URL/api load-tests/01-basic-browsing.js
```

### Test login flows?
```bash
# 5-minute test of authenticated users
k6 run -e API_URL=https://YOUR-RAILWAY-URL/api load-tests/02-authenticated-users.js
```

---

## Understanding Results (Simple Version)

**Good Results:**
```
✓ All checks passing (95%+)
✓ p(95) under 2000ms
✓ http_req_failed under 1%
```

**You're ready to launch!** 🎉

**Bad Results:**
```
✗ Many checks failing
✗ p(95) over 3000ms
✗ http_req_failed over 5%
```

**You need to optimize before launch.**

Common fixes:
- Upgrade Railway plan (more CPU/RAM)
- Add database indexes
- Optimize slow queries
- Add caching

---

## Need More Help?

Read the full guide: [README.md](README.md)

---

## TL;DR - Copy and Paste This

```bash
# 1. Install k6 from: https://github.com/grafana/k6/releases

# 2. Run this (replace YOUR-RAILWAY-URL):
cd backend
k6 run -e API_URL=https://YOUR-RAILWAY-URL/api load-tests/03-realistic-mixed.js

# 3. Wait 19 minutes

# 4. Check if p95 is under 3000ms and errors under 2%

# 5. If yes → you're good to launch! If no → optimize first.
```

That's it! 🚀
