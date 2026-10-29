/**
 * SaaS Subscription Plans & Dynamic Super Admin Pricing Manager
 * Currency: INR (India-First default)
 * Policy: Super Admin configurable amounts (e.g. ₹2,500/mo, ₹5,000/6-mo)
 */

import fs from "fs";
import path from "path";

// Legacy baseline plans for unit testing and fallback
export const PLANS = {
  STARTER: {
    id: "STARTER",
    name: "Starter",
    description: "Ideal for early-stage startups and small local businesses.",
    priceINR: 2499,
    priceMonthly: "₹2,499",
    currency: "INR",
    interval: "monthly",
    intervalCount: 1,
    periodLabel: "per month",
    trialDays: 7,
    maxBots: 1,
    maxMessagesPerMonth: Infinity,
    maxKnowledgePages: 50,
    features: [
      "1 AI Sales Bot (Strict Limit)",
      "Unlimited Messages & Token Inquiries",
      "50 Website knowledge pages",
      "Lead capture with email/phone",
      "Standard email support",
    ],
    razorpayPlanId: process.env.RAZORPAY_PLAN_STARTER || "plan_starter_sandbox",
  },

  GROWTH: {
    id: "GROWTH",
    name: "Growth",
    description: "For growing businesses requiring multi-channel sales automation.",
    priceINR: 7999,
    priceMonthly: "₹7,999",
    currency: "INR",
    interval: "monthly",
    intervalCount: 1,
    periodLabel: "per month",
    trialDays: 7,
    maxBots: 1,
    maxMessagesPerMonth: Infinity,
    maxKnowledgePages: 100,
    features: [
      "1 AI Sales Bot (Strict Limit)",
      "Unlimited Messages & Token Inquiries",
      "100 Website knowledge pages",
      "WhatsApp Cloud API integration",
      "Custom domain locking & branding",
      "Priority webhook dispatching",
    ],
    razorpayPlanId: process.env.RAZORPAY_PLAN_GROWTH || "plan_growth_sandbox",
  },

  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    description: "High-volume IT firms, institutions, and corporate sales desks.",
    priceINR: 24999,
    priceMonthly: "₹24,999",
    currency: "INR",
    interval: "yearly",
    intervalCount: 1,
    periodLabel: "per year",
    trialDays: 7,
    maxBots: 1,
    maxMessagesPerMonth: Infinity,
    maxKnowledgePages: 500,
    features: [
      "1 AI Sales Bot (Strict Limit)",
      "Unlimited Messages & Token Inquiries",
      "500 Website knowledge pages",
      "Fine-tuned custom LoRA weights",
      "Dedicated account manager",
      "Custom SLA & 99.9% uptime",
    ],
    razorpayPlanId: process.env.RAZORPAY_PLAN_ENTERPRISE || "plan_enterprise_sandbox",
  },
};

const PLANS_FILE_PATH = path.join(process.cwd(), "frontend", "data", "plans.json");
const ALT_PLANS_FILE_PATH = path.join(process.cwd(), "data", "plans.json");

function getStoragePath() {
  if (fs.existsSync(PLANS_FILE_PATH)) return PLANS_FILE_PATH;
  if (fs.existsSync(ALT_PLANS_FILE_PATH)) return ALT_PLANS_FILE_PATH;
  return PLANS_FILE_PATH;
}

// In-memory cache for ultra-fast lookups
let cachedPlans = null;

export function loadPlansFromDisk() {
  try {
    const targetPath = getStoragePath();
    if (fs.existsSync(targetPath)) {
      const raw = fs.readFileSync(targetPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedPlans = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[PLANS_STORE_WARN] Failed to load plans from disk, using defaults", err.message);
  }

  // Fallback defaults
  cachedPlans = [
    {
      id: "PLAN_STARTER_MONTHLY",
      name: "Starter Monthly",
      description: "₹2,500/month after 7-day free trial. Full access to AI chatbot & lead extraction.",
      priceINR: 2500,
      priceMonthly: "₹2,500",
      currency: "INR",
      interval: "monthly",
      intervalCount: 1,
      periodLabel: "per month",
      trialDays: 7,
      maxBots: 1,
      maxMessagesPerMonth: null,
      maxKnowledgePages: 50,
      isDefault: true,
      isActive: true,
      features: [
        "1 AI Sales Bot (Strict Limit)",
        "Unlimited Messages & Token Inquiries",
        "50 Website knowledge pages",
        "7-Day Free Trial (₹0 charged today)",
        "Live Lead CRM capture",
        "Standard Support",
      ],
      razorpayPlanId: "plan_starter_monthly",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "PLAN_PRO_6MONTHS",
      name: "Pro (6 Months Pass)",
      description: "₹5,000 for 6 months. Save over 66% compared to monthly billing!",
      priceINR: 5000,
      priceMonthly: "₹5,000",
      currency: "INR",
      interval: "monthly",
      intervalCount: 6,
      periodLabel: "per 6 months",
      trialDays: 7,
      maxBots: 1,
      maxMessagesPerMonth: null,
      maxKnowledgePages: 150,
      isDefault: false,
      isActive: true,
      features: [
        "1 AI Sales Bot (Strict Limit)",
        "Unlimited Messages & Token Inquiries",
        "150 Website knowledge pages",
        "7-Day Free Trial (₹0 charged today)",
        "WhatsApp Cloud API integration",
        "Best Value: 6 Months for ₹5,000",
      ],
      razorpayPlanId: "plan_pro_6months",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "PLAN_ENTERPRISE_ANNUAL",
      name: "Annual VIP Pass",
      description: "₹9,999/year for 12 months. Maximum savings and highest capability.",
      priceINR: 9999,
      priceMonthly: "₹9,999",
      currency: "INR",
      interval: "yearly",
      intervalCount: 1,
      periodLabel: "per year",
      trialDays: 7,
      maxBots: 1,
      maxMessagesPerMonth: null,
      maxKnowledgePages: 500,
      isDefault: false,
      isActive: true,
      features: [
        "1 AI Sales Bot (Strict Limit)",
        "Unlimited Messages & Token Inquiries",
        "500 Knowledge & PDF pages",
        "7-Day Free Trial (₹0 charged today)",
        "Meta WhatsApp Cloud API integration",
        "Dedicated priority support",
      ],
      razorpayPlanId: "plan_enterprise_annual",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return cachedPlans;
}

export function savePlansToDisk(plans) {
  try {
    cachedPlans = plans;
    const targetPath = getStoragePath();
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, JSON.stringify(plans, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[PLANS_SAVE_ERR] Failed saving plans to disk:", err);
    return false;
  }
}

/**
 * Returns all configured plans (for Super Admin dashboard)
 */
export function getPlans() {
  if (!cachedPlans) {
    loadPlansFromDisk();
  }
  return cachedPlans || [];
}

/**
 * Returns only active plans for user onboarding & checkout
 */
export function getActivePlans() {
  const all = getPlans();
  return all.filter((p) => p.isActive !== false);
}

/**
 * Resolve plan by ID (handles dynamic plan IDs as well as legacy STARTER/GROWTH/ENTERPRISE)
 */
export function getPlan(planId = "STARTER") {
  if (!planId) return PLANS.STARTER;

  const normalized = String(planId).trim();

  // 1. Check legacy static baseline PLANS first (STARTER, GROWTH, ENTERPRISE)
  const legacyMatch = PLANS[normalized.toUpperCase()];
  if (legacyMatch) return legacyMatch;

  // 2. Check dynamic plans
  const all = getPlans();
  const match = all.find(
    (p) =>
      p.id.toLowerCase() === normalized.toLowerCase() ||
      p.name.toLowerCase() === normalized.toLowerCase() ||
      p.razorpayPlanId === normalized
  );
  if (match) {
    return {
      ...match,
      maxMessagesPerMonth: match.maxMessagesPerMonth || Infinity,
      priceMonthly: match.priceMonthly || `₹${Number(match.priceINR).toLocaleString("en-IN")}`,
    };
  }

  // 3. Default fallback to STARTER
  return PLANS.STARTER;
}

/**
 * Super Admin: Create a new custom Razorpay plan/pricing
 */
export function createPlan({
  name,
  priceINR,
  interval = "monthly",
  intervalCount = 1,
  trialDays = 7,
  description = "",
  features = [],
  razorpayPlanId = "",
  isDefault = false,
  isActive = true,
}) {
  const all = getPlans();
  const numPrice = Number(priceINR);

  const cleanInterval = ["monthly", "yearly", "weekly", "daily"].includes(interval) ? interval : "monthly";
  const numIntervalCount = Math.max(1, Number(intervalCount) || 1);

  let periodLabel = "per month";
  if (cleanInterval === "monthly" && numIntervalCount === 1) periodLabel = "per month";
  else if (cleanInterval === "monthly" && numIntervalCount === 6) periodLabel = "per 6 months";
  else if (cleanInterval === "monthly" && numIntervalCount === 3) periodLabel = "per 3 months";
  else if (cleanInterval === "yearly" && numIntervalCount === 1) periodLabel = "per year";
  else periodLabel = `every ${numIntervalCount} ${cleanInterval}`;

  const cleanId = `PLAN_${name.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}_${Date.now()}`;
  const now = new Date().toISOString();

  // If new plan is set as default, reset other plans' isDefault
  if (isDefault) {
    all.forEach((p) => {
      p.isDefault = false;
    });
  }

  const newPlan = {
    id: cleanId,
    name: name.trim(),
    description: description ? description.trim() : `₹${numPrice.toLocaleString("en-IN")} ${periodLabel}.`,
    priceINR: numPrice,
    priceMonthly: `₹${numPrice.toLocaleString("en-IN")}`,
    currency: "INR",
    interval: cleanInterval,
    intervalCount: numIntervalCount,
    periodLabel,
    trialDays: Number(trialDays) >= 0 ? Number(trialDays) : 7,
    maxBots: 1,
    maxMessagesPerMonth: Infinity,
    maxKnowledgePages: numPrice >= 9999 ? 500 : numPrice >= 5000 ? 150 : 50,
    isDefault: Boolean(isDefault),
    isActive: isActive !== false,
    features: Array.isArray(features) && features.length > 0 ? features : [
      "1 AI Sales Bot (Strict Limit)",
      "Unlimited Messages & Token Inquiries",
      `${numPrice >= 9999 ? 500 : numPrice >= 5000 ? 150 : 50} Knowledge pages`,
      `${Number(trialDays) || 7}-Day Free Trial (₹0 charged today)`,
      "Live Lead CRM capture",
      "Razorpay Autopay Protection",
    ],
    razorpayPlanId: razorpayPlanId?.trim() || `plan_${cleanId.toLowerCase()}`,
    createdAt: now,
    updatedAt: now,
  };

  all.push(newPlan);
  savePlansToDisk(all);
  return newPlan;
}

/**
 * Super Admin: Update existing pricing plan
 */
export function updatePlan(planId, updates = {}) {
  const all = getPlans();
  const idx = all.findIndex((p) => p.id === planId);
  if (idx === -1) {
    throw new Error(`Plan with ID ${planId} not found.`);
  }

  if (updates.isDefault) {
    all.forEach((p) => {
      p.isDefault = false;
    });
  }

  const existing = all[idx];
  const numPrice = updates.priceINR !== undefined ? Number(updates.priceINR) : existing.priceINR;
  const cleanInterval = updates.interval || existing.interval;
  const numIntervalCount = updates.intervalCount !== undefined ? Number(updates.intervalCount) : existing.intervalCount;

  let periodLabel = existing.periodLabel;
  if (cleanInterval === "monthly" && numIntervalCount === 1) periodLabel = "per month";
  else if (cleanInterval === "monthly" && numIntervalCount === 6) periodLabel = "per 6 months";
  else if (cleanInterval === "monthly" && numIntervalCount === 3) periodLabel = "per 3 months";
  else if (cleanInterval === "yearly" && numIntervalCount === 1) periodLabel = "per year";

  all[idx] = {
    ...existing,
    ...updates,
    priceINR: numPrice,
    priceMonthly: `₹${numPrice.toLocaleString("en-IN")}`,
    interval: cleanInterval,
    intervalCount: numIntervalCount,
    periodLabel,
    updatedAt: new Date().toISOString(),
  };

  savePlansToDisk(all);
  return all[idx];
}

/**
 * Super Admin: Delete plan
 */
export function deletePlan(planId) {
  const all = getPlans();
  if (all.length <= 1) {
    throw new Error("Cannot delete the only remaining plan.");
  }
  const filtered = all.filter((p) => p.id !== planId);
  if (filtered.length === all.length) {
    throw new Error(`Plan ${planId} not found.`);
  }
  // If the deleted plan was default, mark the first one as default
  if (!filtered.some((p) => p.isDefault)) {
    filtered[0].isDefault = true;
  }
  savePlansToDisk(filtered);
  return true;
}

/**
 * Super Admin: Set a plan as default
 */
export function setDefaultPlan(planId) {
  const all = getPlans();
  let found = false;
  all.forEach((p) => {
    if (p.id === planId) {
      p.isDefault = true;
      found = true;
    } else {
      p.isDefault = false;
    }
  });

  if (!found) throw new Error(`Plan with ID ${planId} not found.`);
  savePlansToDisk(all);
  return all.find((p) => p.id === planId);
}
