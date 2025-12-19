import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// In-memory cache for fast duplicate detection (avoids DB query on recent webhooks)
const MAX_CACHE_SIZE = 10000;
const recentWebhooks = new Map<string, { processedAt: Date; eventType: string }>();

// Clean cache every 5 minutes to prevent memory growth
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  let deleted = 0;

  for (const [id, data] of recentWebhooks.entries()) {
    if (data.processedAt.getTime() < fiveMinutesAgo) {
      recentWebhooks.delete(id);
      deleted++;
    }
  }

  // Enforce max size with LRU eviction (remove oldest 20%)
  if (recentWebhooks.size > MAX_CACHE_SIZE) {
    const entries = Array.from(recentWebhooks.entries());
    const sortedEntries = entries.sort((a, b) => a[1].processedAt.getTime() - b[1].processedAt.getTime());
    const toDelete = sortedEntries.slice(0, Math.floor(MAX_CACHE_SIZE * 0.2));
    toDelete.forEach(([id]) => recentWebhooks.delete(id));
    deleted += toDelete.length;
  }

  if (deleted > 0) {
    console.log(`🧹 Cleaned ${deleted} webhook cache entries`);
  }
}, 5 * 60 * 1000);

/**
 * Check if a payment webhook has already been processed
 * Uses two-tier cache: in-memory first (fast), then Transaction table (reliable)
 *
 * @param paymentIntentId - Stripe PaymentIntent ID
 * @param eventType - Webhook event type for cache key
 * @returns true if webhook already processed, false otherwise
 */
export async function isPaymentWebhookProcessed(
  paymentIntentId: string,
  eventType: string
): Promise<boolean> {
  // Create composite cache key to avoid false positives across event types
  const cacheKey = `${eventType}:${paymentIntentId}`;

  // Tier 1: In-memory cache check (< 0.1ms)
  if (recentWebhooks.has(cacheKey)) {
    console.log(`✅ Webhook ${eventType} for ${paymentIntentId} found in cache (duplicate)`);
    return true;
  }

  // Tier 2: Database check using existing Transaction table (< 5ms)
  // For payment authorization events, check if DEPOSIT transaction already exists
  if (eventType === 'payment_intent.amount_capturable_updated') {
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        stripeId: paymentIntentId,
        type: 'DEPOSIT',
        status: 'COMPLETED'
      }
    });

    if (existingTransaction) {
      console.log(`✅ Transaction already exists for ${paymentIntentId} (duplicate webhook)`);

      // Add to cache for future fast lookups
      recentWebhooks.set(cacheKey, {
        processedAt: existingTransaction.createdAt,
        eventType
      });

      return true;
    }
  }

  return false;
}

/**
 * Mark webhook as processed by adding to in-memory cache
 * The actual Transaction record creation acts as the persistent marker in the database
 *
 * @param paymentIntentId - Stripe PaymentIntent ID
 * @param eventType - Webhook event type
 */
export function markPaymentWebhookProcessed(
  paymentIntentId: string,
  eventType: string
): void {
  const cacheKey = `${eventType}:${paymentIntentId}`;
  recentWebhooks.set(cacheKey, {
    processedAt: new Date(),
    eventType
  });
}

/**
 * Wrapper for payment webhook handlers with automatic idempotency protection
 * Prevents duplicate processing when Stripe retries webhooks
 *
 * @param event - Stripe webhook event
 * @param paymentIntentId - Payment intent ID from event data
 * @param handler - Async function to execute if webhook not already processed
 * @returns Object with processing status and result
 */
export async function withPaymentIdempotency<T>(
  event: Stripe.Event,
  paymentIntentId: string,
  handler: () => Promise<T>
): Promise<{ processed: boolean; result?: T; duplicate: boolean }> {

  // Check if already processed (cache + database)
  const isDuplicate = await isPaymentWebhookProcessed(paymentIntentId, event.type);
  if (isDuplicate) {
    console.log(`⏭️ Skipped duplicate webhook: ${event.type} for ${paymentIntentId}`);
    return { processed: true, duplicate: true };
  }

  try {
    // Process webhook (first time)
    const result = await handler();

    // Mark as processed in cache
    // The Transaction record created by handler serves as persistent marker in DB
    markPaymentWebhookProcessed(paymentIntentId, event.type);

    return { processed: true, result, duplicate: false };
  } catch (error) {
    console.error(`❌ Webhook processing failed for ${paymentIntentId}:`, error);
    // Don't mark as processed - allow Stripe to retry
    throw error;
  }
}

/**
 * Wrapper for non-payment webhooks (like account.updated)
 * Uses in-memory cache only since these don't create persistent Transaction records
 *
 * @param event - Stripe webhook event
 * @param handler - Async function to execute if webhook not already processed
 * @returns Object with processing status and result
 */
export async function withSimpleIdempotency<T>(
  event: Stripe.Event,
  handler: () => Promise<T>
): Promise<{ processed: boolean; result?: T; duplicate: boolean }> {

  // Check cache only (no persistent storage for non-payment events)
  const cacheKey = `${event.type}:${event.id}`;

  if (recentWebhooks.has(cacheKey)) {
    console.log(`⏭️ Skipped duplicate webhook: ${event.id}`);
    return { processed: true, duplicate: true };
  }

  try {
    const result = await handler();

    // Mark as processed in cache
    recentWebhooks.set(cacheKey, {
      processedAt: new Date(),
      eventType: event.type
    });

    return { processed: true, result, duplicate: false };
  } catch (error) {
    console.error(`❌ Webhook processing failed for ${event.id}:`, error);
    throw error;
  }
}
