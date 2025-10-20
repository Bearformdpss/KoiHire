# 💳 Stripe Payment Integration Guide

Complete guide to implement Stripe payments for KoiHire marketplace.

---

## 📋 Overview

KoiHire needs Stripe for two payment flows:

1. **Service Orders** - Client pays upfront, funds held in escrow, released when work approved
2. **Project Orders** - Client pays milestone-based, funds released as milestones complete

---

## 🎯 What We Need to Build

### Service Order Payment Flow
```
Client places order → Stripe Payment Intent created →
Client pays → Funds held in escrow →
Freelancer delivers → Client approves →
Funds released to freelancer (minus platform fee)
```

### Project Order Payment Flow
```
Application accepted → Stripe Payment Intent for milestone →
Client pays → Work completed → Client approves →
Payment released → Repeat for next milestone
```

---

## 🔧 Step 1: Install Stripe Libraries

```bash
# Backend
cd backend
npm install stripe

# Frontend
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

---

## 🔐 Step 2: Get Stripe Keys

1. Sign up at https://dashboard.stripe.com
2. Go to **Developers** → **API keys**
3. Copy:
   - **Secret key** (sk_test_...) → Backend `.env`
   - **Publishable key** (pk_test_...) → Frontend `.env.local`

### Add to backend/.env:
```env
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### Add to frontend/.env.local:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

---

## 🏗️ Step 3: Backend Implementation

### Create Stripe Service

**File:** `backend/src/services/stripeService.ts`

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const stripeService = {
  // Create payment intent for service order
  async createServiceOrderPayment(orderId: string, amount: number, clientId: string) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId,
        clientId,
        type: 'service_order'
      },
      // Capture funds but don't release yet (escrow)
      capture_method: 'manual'
    });

    return paymentIntent;
  },

  // Capture payment (release from escrow to freelancer)
  async capturePayment(paymentIntentId: string) {
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    return paymentIntent;
  },

  // Refund payment (if order cancelled)
  async refundPayment(paymentIntentId: string, amount?: number) {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined
    });
    return refund;
  },

  // Create Stripe Connect account for freelancer (for payouts)
  async createConnectAccount(freelancerId: string, email: string) {
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      metadata: { freelancerId }
    });
    return account;
  },

  // Transfer funds to freelancer
  async transferToFreelancer(
    amount: number,
    freelancerStripeAccountId: string,
    orderId: string
  ) {
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      destination: freelancerStripeAccountId,
      metadata: { orderId }
    });
    return transfer;
  }
};
```

### Add Payment API Route

**File:** `backend/src/api/payments.ts`

```typescript
import express from 'express';
import { stripeService } from '../services/stripeService';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Create payment intent for service order
router.post('/create-payment-intent', authMiddleware, async (req, res) => {
  const { orderId } = req.body;

  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: { client: true }
  });

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.clientId !== req.user!.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const paymentIntent = await stripeService.createServiceOrderPayment(
    orderId,
    order.totalAmount,
    order.clientId
  );

  res.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id
  });
});

// Webhook handler (Stripe events)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        // Update order payment status
        const paymentIntent = event.data.object;
        await prisma.serviceOrder.update({
          where: { id: paymentIntent.metadata.orderId },
          data: { paymentStatus: 'PAID' }
        });
        break;

      case 'payment_intent.payment_failed':
        // Handle failed payment
        break;
    }

    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

export default router;
```

---

## ⚛️ Step 4: Frontend Implementation

### Create Stripe Provider

**File:** `frontend/app/providers.tsx`

```typescript
'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export function StripeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}
```

### Create Payment Component

**File:** `frontend/components/payment/CheckoutForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import axios from 'axios';

export function CheckoutForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'An error occurred');
        setLoading(false);
        return;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders/${orderId}/success`,
        },
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />

      {error && (
        <div className="text-red-500 text-sm mt-2">{error}</div>
      )}

      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full mt-4"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </Button>
    </form>
  );
}
```

---

## 🧪 Step 5: Test Stripe Integration

### Test Cards

Use these in **Test Mode**:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0027 6000 3184` | Requires authentication (3D Secure) |

**Expiry:** Any future date (e.g., 12/25)
**CVC:** Any 3 digits (e.g., 123)
**ZIP:** Any 5 digits (e.g., 12345)

### Testing Checklist

- [ ] Client can initiate payment
- [ ] Payment form loads correctly
- [ ] Successful payment updates order status
- [ ] Failed payment shows error
- [ ] Webhook receives payment events
- [ ] Funds are held in escrow (not immediately captured)
- [ ] Freelancer delivery triggers capture
- [ ] Refunds work for cancellations

---

## 🔔 Step 6: Set Up Webhooks

1. **Go to:** Stripe Dashboard → **Developers** → **Webhooks**
2. **Add endpoint:** `https://your-backend.railway.app/api/payments/webhook`
3. **Select events:**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
4. **Copy webhook signing secret** → Add to `.env` as `STRIPE_WEBHOOK_SECRET`

---

## 💰 Platform Fee Structure

### Recommended Fee Model

```typescript
// Example: 10% platform fee + Stripe processing fee
const PLATFORM_FEE_PERCENTAGE = 0.10; // 10%

function calculateFees(orderAmount: number) {
  const platformFee = orderAmount * PLATFORM_FEE_PERCENTAGE;
  const stripeFee = (orderAmount * 0.029) + 0.30; // Stripe's 2.9% + $0.30
  const totalFees = platformFee + stripeFee;
  const freelancerPayout = orderAmount - totalFees;

  return {
    orderAmount,
    platformFee,
    stripeFee,
    totalFees,
    freelancerPayout
  };
}
```

---

## 🚨 Important Considerations

### Security
- ✅ Never expose secret key in frontend
- ✅ Validate webhook signatures
- ✅ Use HTTPS in production
- ✅ Implement rate limiting on payment endpoints

### Compliance
- ✅ Save customer consent for payments
- ✅ Display clear pricing (including fees)
- ✅ Provide receipts/invoices
- ✅ Handle disputes properly

### User Experience
- ✅ Show loading states during payment
- ✅ Clear error messages
- ✅ Email confirmation after payment
- ✅ Allow saved payment methods (future)

---

## 📞 Getting Help from Your Stripe Friend

### Questions to Ask Them:

1. **Architecture Review:**
   - Is our payment flow secure?
   - Should we use Payment Intents or Checkout Sessions?
   - How should we handle platform fees?

2. **Stripe Connect:**
   - Should freelancers have Connect accounts?
   - Direct charges vs. destination charges?
   - How to handle payouts?

3. **Testing:**
   - What scenarios should we test?
   - How to test webhooks locally?
   - Best practices for error handling?

4. **Production:**
   - Checklist before going live?
   - How to handle disputes?
   - PCI compliance requirements?

### Files to Have Them Review:

- `backend/src/services/stripeService.ts`
- `backend/src/api/payments.ts`
- `frontend/components/payment/CheckoutForm.tsx`
- Database schema (Prisma schema for transactions)

---

## ✅ Pre-Launch Checklist

Before switching to **LIVE mode**:

- [ ] All tests pass with test cards
- [ ] Webhooks working locally
- [ ] Error handling implemented
- [ ] Stripe account fully activated
- [ ] Business details added to Stripe
- [ ] Terms of Service mention Stripe
- [ ] Privacy Policy covers payment data
- [ ] Support email configured
- [ ] Refund policy documented

---

## 🎉 Ready to Implement?

**I can help you:**
1. Write the complete Stripe service
2. Create payment API endpoints
3. Build the checkout UI components
4. Set up webhook handlers
5. Test the entire payment flow

**Just let me know when you're ready to start!** 🚀

---

## 📚 Resources

- [Stripe Docs](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Payment Intents](https://stripe.com/docs/payments/payment-intents)
- [Stripe Connect](https://stripe.com/docs/connect)
