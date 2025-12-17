# Race Condition Fix Testing Guide (HIGH #6)

## 🎯 What Was Fixed

This security update addresses race condition vulnerabilities in payment release and refund operations. The fix implements PostgreSQL row-level locking to prevent concurrent requests from processing the same payment multiple times.

### Files Modified

**Backend:**
- `backend/src/services/stripeService.ts` - Added row-level locking to 4 functions:
  - `releaseProjectEscrowPayment()` (Lines 252-466)
  - `releaseServiceOrderPayment()` (Lines 730-936)
  - `refundProjectEscrowPayment()` (Lines 472-571)
  - `refundServiceOrderPayment()` (Lines 983-1081)

**Frontend:**
- `frontend/app/admin/payments/page.tsx` - Added double-click prevention
- `frontend/app/admin/service-orders/page.tsx` - Added double-click prevention

---

## 🔒 How the Fix Works

### Backend Protection (Row-Level Locking)

Each payment function now:
1. Wraps the entire operation in a database transaction with `Serializable` isolation level
2. Uses `SELECT FOR UPDATE` to lock the Escrow/ServiceOrder row
3. Only one request can acquire the lock at a time; others wait
4. Handles Stripe's idempotent errors gracefully (if payment already captured/canceled)
5. Logs performance warnings if operations take >5 seconds

### Frontend Protection (Double-Click Prevention)

Admin pages now:
1. Track which payment is currently processing via `processingEscrowId` / `processingOrderId` state
2. Disable buttons during processing with visual loading state
3. Prevent multiple API calls for the same payment
4. Show spinner and "Releasing..." / "Refunding..." text during operations

---

## ✅ Manual Testing Checklist

### Test 1: Normal Release Operation (Happy Path)

**Steps:**
1. Log in as admin
2. Navigate to Admin → Payments
3. Find an escrow with status "FUNDED"
4. Click "Release" button
5. Confirm the action
6. Enter optional reason

**Expected Results:**
- ✅ Button shows "Releasing..." with spinner
- ✅ Button is disabled during operation
- ✅ Success toast appears: "Escrow released successfully"
- ✅ Escrow status changes to "RELEASED"
- ✅ Page refreshes with updated data
- ✅ Railway logs show: "✅ Escrow payment released successfully (XXXms)"
- ✅ Operation completes in < 5 seconds

---

### Test 2: Double-Click Prevention (Frontend)

**Steps:**
1. Navigate to Admin → Payments
2. Find an escrow with status "FUNDED"
3. Rapidly click "Release" button 5 times before confirming

**Expected Results:**
- ✅ Confirmation dialog appears only once
- ✅ After confirming, button immediately disables
- ✅ Button shows loading state (spinner)
- ✅ Additional clicks do nothing (button is disabled)
- ✅ Only ONE API request sent (check Network tab in browser DevTools)
- ✅ Only ONE release operation occurs in database

**How to Verify:**
- Open Browser DevTools → Network tab
- Filter by "release"
- Should see exactly ONE POST request to `/api/admin/escrow/*/release`

---

### Test 3: Race Condition (Backend Protection)

**Purpose:** Test that backend prevents concurrent API requests from double-processing

**Steps:**
1. Navigate to Admin → Payments page
2. Find an escrow with status "FUNDED" and copy its ID from the URL or page
3. Open browser DevTools Console (F12 → Console tab)
4. Paste and run this code (replace `ESCROW_ID` with actual ID):

```javascript
const escrowId = 'ESCROW_ID_HERE'; // Replace with actual escrow ID
const token = localStorage.getItem('accessToken');

// Fire 3 concurrent release requests
Promise.all([
  fetch(`http://localhost:5003/api/admin/escrow/${escrowId}/release`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason: 'Test concurrent request 1' })
  }),
  fetch(`http://localhost:5003/api/admin/escrow/${escrowId}/release`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason: 'Test concurrent request 2' })
  }),
  fetch(`http://localhost:5003/api/admin/escrow/${escrowId}/release`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason: 'Test concurrent request 3' })
  })
]).then(responses => Promise.all(responses.map(r => r.json())))
  .then(results => {
    console.log('Results:', results);
    results.forEach((r, i) => console.log(`Request ${i+1}:`, r.success ? 'SUCCESS' : 'FAILED', r.message || r.error));
  });
```

**Expected Results:**
- ✅ Request 1: SUCCESS - "Payment released to freelancer successfully"
- ✅ Request 2: FAILED - "Escrow status is RELEASED, expected FUNDED"
- ✅ Request 3: FAILED - "Escrow status is RELEASED, expected FUNDED"
- ✅ Escrow status is "RELEASED" (not corrupted)
- ✅ Exactly ONE set of transactions created (not duplicated)
- ✅ User.totalEarnings incremented only once
- ✅ Railway logs show lock acquisition and 2 rejections

**Railway Logs to Check:**
```
🔍 releaseProjectEscrowPayment called for projectId: xxx
💰 Escrow found (locked): ...
📥 Capturing payment: pi_xxx
✅ Escrow payment released successfully (XXXms)

🔍 releaseProjectEscrowPayment called for projectId: xxx
💰 Escrow found (locked): ...
❌ Error: Escrow status is RELEASED, expected FUNDED
```

---

### Test 4: Already Released Error Handling

**Steps:**
1. Release an escrow successfully (Test 1)
2. Try to release the same escrow again

**Expected Results:**
- ✅ "Release" button should NOT be visible (escrow status is no longer "FUNDED")
- ✅ If you manually trigger API call: Error "Escrow status is RELEASED, expected FUNDED"
- ✅ No duplicate transactions created
- ✅ User balances remain correct

---

### Test 5: Service Order Release (Same Flow)

**Steps:**
1. Navigate to Admin → Service Orders
2. Find an order with paymentStatus "PAID"
3. Click "Release Payment" button

**Expected Results:**
- Same as Test 1, but for service orders
- ✅ Loading state works correctly
- ✅ Double-click prevention works
- ✅ Success toast appears
- ✅ Order status changes to "COMPLETED"
- ✅ Payment status changes to "RELEASED"

**Concurrent Test (like Test 3):**
```javascript
const orderId = 'ORDER_ID_HERE';
const token = localStorage.getItem('accessToken');

Promise.all([
  fetch(`http://localhost:5003/api/admin/service-orders/${orderId}/release`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Test 1' })
  }),
  fetch(`http://localhost:5003/api/admin/service-orders/${orderId}/release`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Test 2' })
  })
]).then(responses => Promise.all(responses.map(r => r.json())))
  .then(results => console.log('Results:', results));
```

**Expected:** One success, one failure with "Order payment status is RELEASED, expected PAID"

---

### Test 6: Refund Operations

**Test 6A: Normal Refund**
1. Create a test project with funded escrow
2. Navigate to Admin → Payments
3. Click "Refund" button
4. Enter required reason
5. Confirm action

**Expected Results:**
- ✅ Button shows "Refunding..." with spinner
- ✅ Success toast appears
- ✅ Escrow status changes to "REFUNDED"
- ✅ Refund transaction created
- ✅ Stripe payment canceled

**Test 6B: Concurrent Refund Attempts**
```javascript
const escrowId = 'FUNDED_ESCROW_ID';
const token = localStorage.getItem('accessToken');

Promise.all([
  fetch(`http://localhost:5003/api/admin/escrow/${escrowId}/refund`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Test refund 1' })
  }),
  fetch(`http://localhost:5003/api/admin/escrow/${escrowId}/refund`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Test refund 2' })
  })
]).then(responses => Promise.all(responses.map(r => r.json())))
  .then(results => console.log('Results:', results));
```

**Expected:** One success, one failure

---

### Test 7: Performance Monitoring

**Purpose:** Verify operations complete within acceptable timeframes

**Steps:**
1. Release a payment normally
2. Check Railway logs for performance metrics

**Expected Railway Logs:**
```
✅ Escrow payment released successfully (1234ms)
```

**Acceptance Criteria:**
- ✅ Most operations complete in < 2 seconds
- ⚠️ If operation takes > 5 seconds, warning logged: "⚠️ Slow payment release: XXXXms"
- ✅ Operations don't timeout (15 second timeout configured)

---

### Test 8: Stripe Integration Verification

**Steps:**
1. Release a payment
2. Open Stripe Dashboard (https://dashboard.stripe.com/test/payments)
3. Find the payment intent

**Expected Results:**
- ✅ Payment intent status is "succeeded" (captured)
- ✅ No duplicate capture attempts in Stripe logs
- ✅ Amount matches escrow amount
- ✅ Transfer to Connect account (if freelancer has Stripe Connect)

---

## 🚨 What to Watch For

### Signs the Fix is Working

✅ **Good Signs:**
- Buttons disable immediately when clicked
- Loading spinners show during processing
- Only ONE database transaction per payment
- Railway logs show "Escrow found (locked)" messages
- Concurrent requests properly rejected with status errors
- User balances correct after operations

### Signs of Issues

❌ **Red Flags:**
- Duplicate transactions in database
- User.totalEarnings incremented twice
- Multiple "Payment released" log entries for same escrow
- Buttons not disabling on click
- API responses taking > 5 seconds consistently
- Timeouts or deadlock errors in logs

---

## 📊 Database Verification Queries

If you gain database access later, run these to verify data integrity:

### Check for Duplicate Transactions
```sql
-- Should return 0 rows
SELECT "escrowId", "type", COUNT(*) as count
FROM "Transaction"
WHERE "type" IN ('WITHDRAWAL', 'FEE')
  AND "createdAt" > '2025-01-01'  -- Adjust date to after deployment
GROUP BY "escrowId", "type"
HAVING COUNT(*) > 1;
```

### Check for Status Mismatches
```sql
-- Should return 0 rows
SELECT e.id, e.status as escrow_status, p."paymentStatus" as project_status
FROM "Escrow" e
JOIN "Project" p ON p.id = e."projectId"
WHERE e.status = 'RELEASED' AND p."paymentStatus" != 'RELEASED';
```

### Check User Balance Consistency
```sql
-- Compare calculated vs stored totalEarnings
SELECT
  u.id,
  u."totalEarnings" as stored_earnings,
  COALESCE(SUM(CASE WHEN t.type = 'WITHDRAWAL' AND t.status = 'COMPLETED' THEN t.amount ELSE 0 END), 0) as calculated_earnings,
  u."totalEarnings" - COALESCE(SUM(CASE WHEN t.type = 'WITHDRAWAL' AND t.status = 'COMPLETED' THEN t.amount ELSE 0 END), 0) as difference
FROM "User" u
LEFT JOIN "Transaction" t ON t."userId" = u.id
WHERE u.role = 'FREELANCER'
GROUP BY u.id, u."totalEarnings"
HAVING ABS(u."totalEarnings" - COALESCE(SUM(CASE WHEN t.type = 'WITHDRAWAL' AND t.status = 'COMPLETED' THEN t.amount ELSE 0 END), 0)) > 0.01;
```

---

## 🔧 Troubleshooting

### Issue: Button Stuck in Loading State

**Symptoms:** Button shows spinner forever, never resets

**Causes:**
- API request failed but finally block didn't execute
- Network error or timeout

**Solution:**
- Check browser console for errors
- Check Railway logs for backend errors
- Refresh page to reset state

---

### Issue: Error "Transaction timeout"

**Symptoms:** Railway logs show transaction timeout after 15 seconds

**Causes:**
- Database under heavy load
- Lock held by another long-running transaction
- Stripe API slow to respond

**Solution:**
- Check Railway database metrics
- Verify Stripe API status (https://status.stripe.com)
- If persistent, may need to increase timeout from 15s to 30s

---

### Issue: Deadlock Detected

**Symptoms:** PostgreSQL error "deadlock detected"

**Causes:**
- Two transactions trying to lock multiple rows in different orders

**Solution:**
- This should NOT happen with current implementation (we only lock ONE row per transaction)
- If it occurs, report immediately - indicates a bug

---

## 📈 Success Metrics

After testing and deployment, monitor for 24-48 hours:

| Metric | Target | How to Check |
|--------|--------|--------------|
| **Duplicate Transactions** | 0 | Database query above |
| **Balance Mismatches** | 0 | Database query above |
| **Operation Success Rate** | >99% | Railway logs - count successes vs errors |
| **Average Response Time** | < 2s | Railway logs - check duration in success messages |
| **Slow Operation Warnings** | < 5% | Railway logs - count "Slow payment release" warnings |
| **Frontend Button Issues** | 0 reports | User feedback |

---

## 🎉 Deployment Checklist

Before marking this issue as complete:

- [x] All 4 backend functions updated with row-level locking
- [x] Frontend double-click prevention added to both admin pages
- [x] Code pushed to GitHub (triggers Railway/Vercel deploy)
- [ ] Railway deployment successful (check Railway dashboard)
- [ ] Vercel deployment successful (check Vercel dashboard)
- [ ] Test 1 (Normal Release) - PASSED
- [ ] Test 2 (Double-Click Prevention) - PASSED
- [ ] Test 3 (Race Condition) - PASSED
- [ ] Test 4 (Already Released) - PASSED
- [ ] Test 5 (Service Orders) - PASSED
- [ ] Test 6A (Normal Refund) - PASSED
- [ ] Test 6B (Concurrent Refund) - PASSED
- [ ] Test 7 (Performance) - PASSED
- [ ] Test 8 (Stripe Integration) - PASSED
- [ ] Railway logs reviewed - no errors
- [ ] Monitor for 24 hours - no issues

---

## 🔄 Rollback Plan

If critical issues occur:

1. **Identify the commit:**
   ```bash
   git log --oneline -5
   ```

2. **Revert the changes:**
   ```bash
   git revert <commit-hash> -m "Revert race condition fix - [REASON]"
   git push origin main
   ```

3. **Railway auto-deploys revert** (~2-3 minutes)

4. **Verify rollback:**
   - Check Railway logs show old version
   - Test normal payment release works
   - No ongoing errors

**Rollback Time:** 5-10 minutes from decision to production

---

## 📞 Questions or Issues?

If you encounter any problems during testing:

1. **Check Railway Logs:**
   - Railway Dashboard → Backend Service → Logs
   - Look for errors, warnings, or unexpected behavior

2. **Check Browser Console:**
   - F12 → Console tab
   - Look for JavaScript errors or failed API calls

3. **Document the Issue:**
   - What test were you running?
   - What was the expected result?
   - What actually happened?
   - Screenshots of error messages
   - Railway log excerpts

---

**Testing completed by:** _________________
**Date:** _________________
**All tests passed:** ☐ Yes  ☐ No (details below)

**Notes:**
