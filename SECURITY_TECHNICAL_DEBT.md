# Security Technical Debt

This document tracks security items that are **acceptable for MVP** but **must be addressed before production scale**.

---

## 🔴 CRITICAL - Fix Before Public Launch

### 1. Stripe Webhook Signature Verification Fallback

**Status:** Deferred (Acceptable for MVP)
**Must Fix By:** Before processing >$10,000/month OR before public launch
**Effort:** 2-3 hours + schema migration

**Current Issue:**
- Single webhook endpoint at `/api/payments/webhook`
- Falls back to Connect webhook secret if primary fails
- Allows Connect secret to verify payment events (security risk)
- No idempotency checking (duplicate events could be processed)

**Location:**
- File: `backend/src/api/payments.ts` lines 653-679
- See TODO comments in code

**Attack Vector:**
If an attacker obtains `STRIPE_CONNECT_WEBHOOK_SECRET` (easier target than primary secret), they could:
1. Forge `payment_intent.amount_capturable_updated` webhooks
2. Mark escrows as FUNDED without actual payment
3. Trigger fraudulent payment releases

**Why It's Acceptable for MVP:**
- ✅ Not publicly launched (no external attackers)
- ✅ Using test mode Stripe keys (limited damage)
- ✅ Small team with controlled access to Railway
- ✅ Schema migrations currently problematic
- ✅ Focus should be on product-market fit

**Required Fix:**
1. Create separate webhook endpoints:
   - `/api/payments/webhook` - Payment events only (STRIPE_WEBHOOK_SECRET)
   - `/api/payments/connect-webhook` - Connect events only (STRIPE_CONNECT_WEBHOOK_SECRET)

2. Add `WebhookEvent` model to schema:
   ```prisma
   model WebhookEvent {
     id             String   @id @default(uuid())
     stripeEventId  String   @unique
     eventType      String
     processedAt    DateTime @default(now())
     createdAt      DateTime @default(now())

     @@index([stripeEventId])
     @@index([processedAt])
   }
   ```

3. Implement idempotency checking
4. Configure two webhooks in Stripe Dashboard

**Implementation Guide:**
See the detailed security recommendation provided by security audit.

**Trigger to Implement:**
- [ ] Approaching $10,000/month in transaction volume
- [ ] Planning public launch announcement
- [ ] Adding payment features (subscriptions, etc.)
- [ ] Schema migration issues resolved
- [ ] Onboarding enterprise customers

---

## 🟡 MEDIUM - Fix Within 6 Months

### 2. Rate Limiting on Webhook Endpoint

**Status:** Not implemented
**Impact:** Could be DDoS target
**Effort:** 30 minutes

**Current:** Webhook endpoint has no rate limiting
**Fix:** Add rate limiter specifically for webhook endpoint

---

### 3. Webhook Retry Logic

**Status:** Not implemented
**Impact:** Failed webhooks are lost
**Effort:** 1 hour

**Current:** If webhook processing fails, event is lost
**Fix:** Implement retry mechanism or use Stripe's webhook retry feature

---

## 🟢 LOW - Nice to Have

### 4. Webhook Event Logging

**Status:** Console logs only
**Impact:** Hard to debug webhook issues
**Effort:** 1 hour

**Current:** Webhook events logged to console
**Fix:** Store all webhook attempts in database for audit trail

---

## 📋 Pre-Launch Security Checklist

Before going live with real transactions:

### Stripe Configuration
- [ ] Switch to live Stripe keys
- [ ] Implement webhook endpoint separation (Issue #1)
- [ ] Configure two webhooks in Stripe Dashboard
- [ ] Enable webhook signature verification logging
- [ ] Set up Stripe webhook monitoring/alerts

### Environment Security
- [ ] Enable 2FA on Railway account
- [ ] Enable 2FA on Vercel account
- [ ] Enable 2FA on Stripe account
- [ ] Enable 2FA on GitHub account
- [ ] Audit team member access to all platforms
- [ ] Rotate all secrets (JWT, Stripe, etc.)

### Infrastructure
- [ ] Resolve schema migration issues
- [ ] Set up proper backup strategy
- [ ] Configure error monitoring (Sentry, etc.)
- [ ] Set up uptime monitoring
- [ ] Configure alerting for failed payments

### Compliance
- [ ] Review Stripe's compliance requirements
- [ ] Ensure PCI compliance (Stripe handles card data)
- [ ] Add Terms of Service
- [ ] Add Privacy Policy
- [ ] Add refund/dispute policy

---

## 💰 Transaction Volume Thresholds

| Volume/Month | Required Security Level |
|--------------|------------------------|
| $0 - $1,000 | MVP acceptable (current state) |
| $1,000 - $10,000 | Should fix Issue #1 |
| $10,000+ | **MUST** fix Issue #1 |
| $50,000+ | Full security audit recommended |

---

## 📞 Questions?

This document was created based on security audit findings. For implementation details, see:
- Security recommendation documentation
- TODO comments in `backend/src/api/payments.ts`
- Stripe webhook best practices: https://stripe.com/docs/webhooks/best-practices

**Last Updated:** 2025-12-17
**Next Review:** Before public launch
