# RowFlow Load Testing Guide

## What is Load Testing?

Load testing shows you what happens when hundreds or thousands of users access your site at the same time. It helps you find performance problems BEFORE real users experience them.

## Quick Start (First Time Setup)

### Step 1: Install k6

**Windows (Recommended Method):**
1. Download k6 from: https://github.com/grafana/k6/releases
2. Download the `.msi` installer for Windows
3. Run the installer
4. Open a new terminal and verify: `k6 version`

**Alternative - Using Chocolatey:**
```bash
choco install k6
```

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Step 2: Choose Your Test Target

You can test against:
- **Local development** (http://localhost:5003/api) - for basic testing
- **Production Railway URL** - for realistic testing

---

## Running Your First Load Test

### Test 1: Basic Browsing (Start Here!)

This simulates anonymous users browsing your site. **Start with this one.**

```bash
# Test against localhost (make sure your dev server is running)
k6 run 01-basic-browsing.js

# Test against production
k6 run -e API_URL=https://your-app.railway.app/api 01-basic-browsing.js
```

**What it tests:**
- Homepage/categories loading
- Project browsing
- Service browsing
- Freelancer profiles

**Expected duration:** ~6 minutes
**Max concurrent users:** 100

---

### Test 2: Authenticated Users

This simulates logged-in users performing actions.

```bash
# Local
k6 run 02-authenticated-users.js

# Production
k6 run -e API_URL=https://your-app.railway.app/api 02-authenticated-users.js
```

**What it tests:**
- Login/logout
- Dashboard loading
- Viewing projects
- Checking messages

**Expected duration:** ~5 minutes
**Max concurrent users:** 50

---

### Test 3: Realistic Mixed Traffic (MAIN TEST)

This is the **most important test** - it simulates real-world traffic with 70% browsing and 30% logged-in users.

```bash
# Local (not recommended - use production)
k6 run 03-realistic-mixed.js

# Production (RECOMMENDED)
k6 run -e API_URL=https://your-app.railway.app/api 03-realistic-mixed.js
```

**What it tests:**
- Mixed user behavior
- Peak traffic scenarios
- Sudden traffic spikes (viral moments)

**Expected duration:** ~19 minutes
**Max concurrent users:** 500
**This is your pre-launch stress test!**

---

## Understanding the Results

### Key Metrics Explained

**http_req_duration:** How long requests take to complete
- **p(50) - Median:** 50% of requests are faster than this
- **p(95):** 95% of requests are faster than this (IMPORTANT!)
- **p(99):** 99% of requests are faster than this
- **avg:** Average response time
- **max:** Slowest request

**http_req_failed:** Percentage of failed requests
- Should be under 2%
- Higher means server errors (500s) or timeouts

**Virtual Users (VUs):** Number of concurrent users accessing your site

**Data Received/Sent:** Amount of bandwidth used

---

### What's Good vs Bad?

✅ **GOOD RESULTS:**
```
http_req_duration (p95): 500ms - 1500ms
http_req_failed: 0% - 1%
All checks passing
```

⚠️ **ACCEPTABLE (needs monitoring):**
```
http_req_duration (p95): 1500ms - 3000ms
http_req_failed: 1% - 2%
Most checks passing
```

❌ **BAD RESULTS (fix before launch):**
```
http_req_duration (p95): > 3000ms (3 seconds)
http_req_failed: > 2%
Many checks failing
```

---

## Sample Output Explanation

```
✓ categories loaded................99.5%
✓ projects loaded..................98.2%
✓ services loaded..................97.8%

http_req_duration..........avg=450ms min=120ms med=380ms max=2.1s p(95)=1200ms p(99)=1800ms
http_reqs..................3547 (59.1/s)
http_req_failed............0.50%
```

**Translation:**
- 99.5% of category loads succeeded ✅
- Average response time: 450ms ✅
- 95% of requests under 1200ms ✅
- Only 0.5% errors ✅
- Handling ~59 requests per second ✅

**This is GOOD!** Your app can handle the load.

---

## Common Issues and Solutions

### Issue: "Connection refused"
**Problem:** Your server isn't running
**Solution:** Start your backend: `cd backend && npm run dev`

### Issue: "Login failed: 401"
**Problem:** Test credentials don't exist in database
**Solution:** Run seed script: `cd backend && npm run db:seed`

### Issue: "Too many requests / Rate limited"
**Problem:** Rate limiter blocking test traffic
**Solution:** Temporarily increase rate limits in `backend/src/middleware/rateLimiter.ts` for testing:
```typescript
// TESTING ONLY - revert after load test
windowMs: 15 * 60 * 1000,
max: isProd ? 10000 : 10000,  // Increase from 300 to 10000
```

### Issue: High response times (p95 > 3000ms)
**Problem:** Server struggling under load
**Possible causes:**
- Database connection pool exhausted
- Slow database queries
- Not enough server resources (RAM/CPU)
- No caching in place

**Solutions:**
- Upgrade Railway plan (more RAM/CPU)
- Optimize database queries (add indexes)
- Implement Redis caching
- Add database connection pooling

### Issue: High error rate (> 2%)
**Problem:** Requests failing with 500 errors
**Check:**
- Railway logs: `railway logs` or check Railway dashboard
- Look for out-of-memory errors
- Check database connection errors

---

## What to Test Before Launch

### Week 1: Baseline Testing
```bash
# Run basic test, document baseline performance
k6 run -e API_URL=https://your-app.railway.app/api 01-basic-browsing.js

# Save output to file
k6 run -e API_URL=https://your-app.railway.app/api 01-basic-browsing.js > baseline-results.txt
```

### Week 2: Authentication Testing
```bash
k6 run -e API_URL=https://your-app.railway.app/api 02-authenticated-users.js
```

### Week 3: Full Load Test
```bash
# This is the BIG ONE - simulates launch day traffic
k6 run -e API_URL=https://your-app.railway.app/api 03-realistic-mixed.js
```

### Week 4: Soak Test (Optional but Recommended)
Test sustained load over 24 hours to find memory leaks:
```bash
# Create a custom long-running test
k6 run --duration 24h --vus 50 -e API_URL=https://your-app.railway.app/api 01-basic-browsing.js
```

---

## Monitoring During Tests

### Railway Metrics
While k6 is running, watch your Railway dashboard:
1. Go to railway.app
2. Select your project
3. Click "Metrics" tab
4. Watch:
   - CPU usage (should stay under 80%)
   - Memory usage (should not spike to 100%)
   - Network traffic

### What to Look For
- **CPU spikes** → Need more compute power or code optimization
- **Memory growth** → Possible memory leak
- **Database connections maxed out** → Need connection pooling
- **High network traffic** → Consider response compression

---

## Creating Custom Tests

Want to test a specific scenario? Copy one of the existing files and modify it.

**Example: Test project creation**
```javascript
const createProjectPayload = JSON.stringify({
  title: 'Test Project',
  description: 'Load test project',
  minBudget: 1000,
  maxBudget: 5000,
  timeline: '2-4 weeks',
  categoryId: 'some-category-id',
});

response = http.post(`${BASE_URL}/projects`, createProjectPayload, authHeaders);
check(response, { 'project created': (r) => r.status === 201 });
```

---

## Best Practices

1. **Always test against production environment** (Railway URL) for realistic results
2. **Run tests during off-peak hours** to avoid affecting real users
3. **Start small** (01-basic-browsing.js) before running the big test
4. **Document your results** each time you test
5. **Re-test after performance optimizations** to measure improvement
6. **Don't test against localhost** for realistic numbers (different network conditions)

---

## Quick Command Reference

```bash
# Basic test
k6 run 01-basic-browsing.js

# Test production
k6 run -e API_URL=https://your-app.railway.app/api 03-realistic-mixed.js

# Save results to file
k6 run 03-realistic-mixed.js --out json=results.json

# Run with custom VUs
k6 run --vus 100 --duration 5m 01-basic-browsing.js

# Run and generate HTML report (requires xk6)
k6 run --out json=results.json 03-realistic-mixed.js
```

---

## Next Steps After Testing

### If Tests PASS ✅
- Document your baseline metrics
- Set up monitoring alerts in production (Railway/Sentry)
- Plan for horizontal scaling if needed
- You're ready to launch! 🚀

### If Tests FAIL ❌
1. Check Railway logs for errors
2. Optimize slow database queries
3. Add caching (Redis)
4. Upgrade Railway plan
5. Review code for performance bottlenecks
6. Re-run tests after fixes

---

## Need Help?

- k6 Documentation: https://k6.io/docs/
- Railway Metrics: https://docs.railway.app/reference/metrics
- Prisma Performance: https://www.prisma.io/docs/guides/performance-and-optimization

---

## Summary

**For your first load test, run this:**
```bash
k6 run -e API_URL=https://your-app.railway.app/api 03-realistic-mixed.js
```

This will tell you if your app can handle hundreds of concurrent users before you launch! 🎉
