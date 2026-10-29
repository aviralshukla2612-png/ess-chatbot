import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { PLANS, getPlan } from "../../frontend/lib/billing/plans.js";
import { billingService } from "../../frontend/lib/billing/billingService.js";
import { quotaGuard } from "../../frontend/lib/billing/quotaGuard.js";

describe("SaaS Subscription Billing & Quota Enforcement Suite", () => {
  beforeEach(() => {
    billingService._resetMemoryStore();
    quotaGuard._resetMemoryStore();
  });

  it("1. Configures INR pricing, 1-bot limit, and unlimited messages correctly", () => {
    assert.equal(PLANS.STARTER.currency, "INR");
    assert.equal(PLANS.STARTER.priceINR, 2499);
    assert.equal(PLANS.STARTER.maxBots, 1);
    assert.equal(PLANS.STARTER.maxMessagesPerMonth, Infinity);

    assert.equal(PLANS.GROWTH.priceINR, 7999);
    assert.equal(PLANS.GROWTH.maxBots, 1);
    assert.equal(PLANS.GROWTH.maxMessagesPerMonth, Infinity);

    assert.equal(PLANS.ENTERPRISE.priceINR, 24999);
    assert.equal(PLANS.ENTERPRISE.maxBots, 1);
    assert.equal(PLANS.ENTERPRISE.maxMessagesPerMonth, Infinity);

    assert.equal(getPlan("unknown").id, "STARTER");
  });

  it("2. Verifies authentic HMAC SHA-256 Razorpay webhook signatures", () => {
    const rawPayload = JSON.stringify({ event: "subscription.activated", id: "evt_123" });
    const secret = "test_webhook_secret_key_999";

    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(rawPayload)
      .digest("hex");

    const verified = billingService.verifyWebhookSignature(rawPayload, validSignature, secret);
    assert.equal(verified, true);

    // Tampered payload must fail
    const tamperedPayload = rawPayload + " ";
    const tamperedVerified = billingService.verifyWebhookSignature(tamperedPayload, validSignature, secret);
    assert.equal(tamperedVerified, false);

    // Invalid signature must fail
    assert.equal(billingService.verifyWebhookSignature(rawPayload, "invalid_sig", secret), false);
  });

  it("3. Enforces strict idempotency on duplicate webhook events", async () => {
    const mockEvent = {
      id: `evt_duplicate_test_${crypto.randomUUID().slice(0, 8)}`,
      event: "subscription.charged",
      payload: {
        subscription: {
          entity: {
            notes: {
              organizationId: "org_subscriber_123",
              planId: "GROWTH",
            },
          },
        },
      },
    };

    // First delivery -> processed
    const firstDelivery = await billingService.processWebhookEvent(mockEvent);
    assert.equal(firstDelivery.processed, true);
    assert.equal(firstDelivery.duplicate, undefined);

    // Second delivery of same eventId -> duplicate skipped
    const secondDelivery = await billingService.processWebhookEvent(mockEvent);
    assert.equal(secondDelivery.processed, false);
    assert.equal(secondDelivery.duplicate, true);
  });

  it("4. Allows usage and atomically increments counter without token limits", async () => {
    const orgId = "org_quota_test_tenant";

    // 1st request -> Allowed
    const res1 = await quotaGuard.checkAndReserveQuota(orgId, "message", 1);
    assert.equal(res1.allowed, true);
    assert.equal(res1.currentUsage, 1);

    // 2nd request -> Allowed
    const res2 = await quotaGuard.checkAndReserveQuota(orgId, "message", 1);
    assert.equal(res2.allowed, true);
    assert.equal(res2.currentUsage, 2);
  });

  it("5. Supports unlimited token/message inference and never rejects with QUOTA_EXCEEDED", async () => {
    const orgId = "org_unlimited_tokens_tenant";

    // Process high volume of messages
    const highVol = await quotaGuard.checkAndReserveQuota(orgId, "message", 100000);
    assert.equal(highVol.allowed, true);
    assert.equal(highVol.currentUsage, 100000);

    // Next message continues to be allowed (No Token/Message Limit)
    const nextMsg = await quotaGuard.checkAndReserveQuota(orgId, "message", 1);
    assert.equal(nextMsg.allowed, true);
    assert.equal(nextMsg.currentUsage, 100001);
  });
});
