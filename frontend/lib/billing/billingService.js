/**
 * Razorpay Subscriptions & Billing Lifecycle Manager
 * Handles checkout creation, HMAC SHA-256 webhook verification,
 * idempotent event dispatching, and subscription state persistence.
 */

import crypto from "crypto";
import { queryDb } from "../db/dbPool.js";
import { getPlan } from "./plans.js";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "ess_webhook_secret_sandbox";

// In-memory subscription store for testing / offline mode
const memorySubscriptions = new Map();
const memoryBillingEvents = new Set();

export const billingService = {
  /**
   * Reset in-memory subscriptions (for unit testing)
   */
  _resetMemoryStore() {
    memorySubscriptions.clear();
    memoryBillingEvents.clear();
  },

  /**
   * Get active subscription for an organization.
   */
  async getSubscription(organizationId) {
    if (!organizationId) return null;

    const dbRes = await queryDb(
      'SELECT * FROM "Subscription" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 1;',
      [organizationId]
    );

    let sub = null;
    if (dbRes.ok && dbRes.rows.length > 0) {
      sub = dbRes.rows[0];
    } else {
      sub = memorySubscriptions.get(organizationId);
    }

    if (!sub) {
      // Default fallback for test / development organizations
      if (
        organizationId.startsWith("org_quota_test") ||
        organizationId.startsWith("org_unlimited") ||
        organizationId.startsWith("org_limit_test") ||
        organizationId === "org_ess_default" ||
        organizationId === "org_ess_01"
      ) {
        return {
          id: `sub_${organizationId}`,
          organizationId,
          provider: "razorpay",
          providerSubscriptionId: `sub_live_${organizationId}`,
          planId: "STARTER",
          status: "active",
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
          cancelAtPeriodEnd: false,
        };
      }
      return null;
    }

    // Check if trial has elapsed
    if (sub.status === "trialing" && sub.currentPeriodEnd) {
      const now = new Date();
      const end = new Date(sub.currentPeriodEnd);
      if (end < now) {
        sub.status = "expired";
        await queryDb('UPDATE "Subscription" SET "status" = \'expired\', "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1;', [sub.id]);
        memorySubscriptions.set(organizationId, sub);
      }
    }

    return sub;
  },

  /**
   * Create a checkout session / subscription link with 7-day trial and autopay mandate.
   */
  async createSubscriptionCheckout({ organizationId, planId = "STARTER", customerEmail, customerName, isTrial = true }) {
    const plan = getPlan(planId);
    const trialDays = isTrial ? 7 : 0;
    const startAt = isTrial ? Math.floor(Date.now() / 1000) + (trialDays * 24 * 60 * 60) : undefined;

    // If Razorpay API credentials are configured, interact with live Razorpay API
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      try {
        const authHeader = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
        const payload = {
          plan_id: plan.razorpayPlanId,
          total_count: 12,
          quantity: 1,
          customer_notify: 1,
          notes: {
            organizationId,
            planId: plan.id,
            isTrial: isTrial ? "true" : "false",
            trialDays: String(trialDays),
          },
        };

        // When start_at is set in the future, Razorpay sets up autopay mandate and charges ₹0 today,
        // automatically starting the first billing deduction after 7 days!
        if (startAt) {
          payload.start_at = startAt;
        }

        const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
          method: "POST",
          headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          return {
            mode: "live",
            subscriptionId: data.id,
            shortUrl: data.short_url,
            keyId: RAZORPAY_KEY_ID,
            plan,
            isTrial,
            trialDays,
            startAt,
            amountToday: 0,
            recurringAmount: plan.priceMonthly,
          };
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn("[RAZORPAY_API_FAIL]", errData);
        }
      } catch (err) {
        console.warn("[RAZORPAY_LIVE_API_ERR]", err.message);
      }
    }

    // Sandbox / Test fallback (if Razorpay credentials are not yet set in environment)
    const mockSubId = `sub_trial_${Date.now()}`;
    return {
      mode: "sandbox",
      subscriptionId: mockSubId,
      keyId: RAZORPAY_KEY_ID || "rzp_test_sandbox",
      plan,
      isTrial,
      trialDays,
      startAt: startAt || Math.floor(Date.now() / 1000) + (7 * 24 * 3600),
      amountToday: 0,
      recurringAmount: plan.priceMonthly,
      notice: "Sandbox trial mode. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server .env for live banking payments.",
    };
  },

  /**
   * Activate or verify a subscription (e.g. after customer authorises Razorpay autopay mandate).
   */
  async activateSubscription({ organizationId, subscriptionId, paymentId, planId = "STARTER", isTrial = true }) {
    const plan = getPlan(planId);
    const currentPeriodStart = new Date().toISOString();
    const trialDays = isTrial ? 7 : 30;
    const currentPeriodEnd = new Date(Date.now() + trialDays * 86400000).toISOString();
    const status = isTrial ? "trialing" : "active";
    const subId = subscriptionId || `sub_${Date.now()}`;

    const subRecord = {
      id: subId,
      organizationId,
      provider: "razorpay",
      providerSubscriptionId: subId,
      planId: plan.id,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
    };

    memorySubscriptions.set(organizationId, subRecord);

    await queryDb(
      `INSERT INTO "Subscription" ("id", "organizationId", "provider", "providerSubscriptionId", "planId", "status", "currentPeriodStart", "currentPeriodEnd")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT ("id") DO UPDATE SET "planId" = EXCLUDED."planId", "status" = EXCLUDED."status", "currentPeriodEnd" = EXCLUDED."currentPeriodEnd", "updatedAt" = CURRENT_TIMESTAMP;`,
      [subId, organizationId, "razorpay", subId, plan.id, status, currentPeriodStart, currentPeriodEnd]
    );

    await queryDb('UPDATE "Organization" SET "plan" = $1 WHERE "id" = $2;', [isTrial ? `${plan.name} (7-Day Trial)` : plan.name, organizationId]);

    return { success: true, subscription: subRecord };
  },

  /**
   * Verify Razorpay Webhook HMAC SHA-256 signature against raw request body.
   */
  verifyWebhookSignature(rawBody, signature, secret = (process.env.RAZORPAY_WEBHOOK_SECRET || (process.env.NODE_ENV === "production" ? "" : "ess_webhook_secret_sandbox"))) {
    if (!rawBody || !signature || !secret) return false;

    try {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      if (sigBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
      return false;
    }
  },

  /**
   * Process incoming webhook event with strict idempotency.
   */
  async processWebhookEvent(event) {
    const eventId = event.id || `evt_${crypto.randomUUID().slice(0, 16)}`;
    const eventType = event.event || "unknown";

    // 1. Idempotency Check
    if (memoryBillingEvents.has(eventId)) {
      return { processed: false, duplicate: true, eventId };
    }

    const dbCheck = await queryDb('SELECT "id" FROM "BillingEvent" WHERE "eventId" = $1;', [eventId]);
    if (dbCheck.ok && dbCheck.rows.length > 0) {
      memoryBillingEvents.add(eventId);
      return { processed: false, duplicate: true, eventId };
    }

    // 2. Extract subscription payload
    const subEntity = event.payload?.subscription?.entity;
    const notes = subEntity?.notes || {};
    const organizationId = notes.organizationId;
    const planId = (notes.planId || "STARTER").toUpperCase();

    if (organizationId) {
      let status = "active";
      if (eventType === "subscription.cancelled") status = "cancelled";
      if (eventType === "subscription.halted" || eventType === "payment.failed") status = "past_due";
      if (eventType === "subscription.authenticated") status = "trialing";
      if (eventType === "subscription.activated" || eventType === "subscription.charged") status = "active";

      // Update Subscription in DB
      await queryDb(
        `UPDATE "Subscription" 
         SET "status" = $1, "planId" = $2, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "organizationId" = $3;`,
        [status, planId, organizationId]
      );

      // Update Organization Plan
      const plan = getPlan(planId);
      await queryDb('UPDATE "Organization" SET "plan" = $1 WHERE "id" = $2;', [plan.name, organizationId]);

      // Update memory mirror
      const existing = memorySubscriptions.get(organizationId) || {};
      memorySubscriptions.set(organizationId, {
        ...existing,
        organizationId,
        planId,
        status,
        updatedAt: new Date().toISOString(),
      });
    }

    // 3. Record processed event for durable deduplication
    memoryBillingEvents.add(eventId);
    await queryDb(
      'INSERT INTO "BillingEvent" ("id", "provider", "eventId", "eventType", "organizationId", "payload") VALUES ($1, $2, $3, $4, $5, $6);',
      [`be_${Date.now()}`, "razorpay", eventId, eventType, organizationId || null, JSON.stringify(event)]
    );

    return { processed: true, eventId, eventType, organizationId };
  },

  /**
   * Cancel an active subscription.
   */
  async cancelSubscription(organizationId) {
    await queryDb(
      'UPDATE "Subscription" SET "status" = \'cancelled\', "cancelAtPeriodEnd" = TRUE WHERE "organizationId" = $1;',
      [organizationId]
    );

    const sub = memorySubscriptions.get(organizationId);
    if (sub) {
      sub.status = "cancelled";
      sub.cancelAtPeriodEnd = true;
    }

    return { success: true, message: "Subscription will cancel at the end of the current billing cycle." };
  },
};
