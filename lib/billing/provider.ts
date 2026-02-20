import crypto from "crypto";
import { plans } from "@/lib/billing/plans";

type CreateCheckoutInput = {
  userId: string;
  userEmail: string;
  planId: string;
};

type CheckoutResult =
  | { mode: "manual" }
  | { mode: "razorpay"; checkoutUrl: string; externalId: string };

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function getProvider() {
  return (process.env.BILLING_PROVIDER || "manual").toLowerCase();
}

function getRazorpayAuthHeader() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET missing");
  }
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

async function createRazorpayPaymentLink(
  input: CreateCheckoutInput
): Promise<CheckoutResult> {
  const plan = plans.find((p) => p.id === input.planId);
  if (!plan) throw new Error("Invalid plan");

  const amountPaise = Math.round(plan.price * 100);
  const callbackUrl = `${getBaseUrl()}/dashboard/billing?checkout=success`;

  const res = await fetch("https://api.razorpay.com/v1/payment_links", {
    method: "POST",
    headers: {
      Authorization: getRazorpayAuthHeader(),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "USD",
      description: `${plan.name} plan`,
      customer: {
        name: input.userEmail.split("@")[0],
        email: input.userEmail,
      },
      notify: { email: true, sms: false },
      reminder_enable: true,
      callback_url: callbackUrl,
      callback_method: "get",
      notes: {
        userId: input.userId,
        planId: input.planId,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok || !data?.short_url || !data?.id) {
    throw new Error(data?.error?.description || "Razorpay payment link failed");
  }

  return {
    mode: "razorpay",
    checkoutUrl: data.short_url,
    externalId: data.id,
  };
}

async function createRazorpaySubscriptionCheckout(
  input: CreateCheckoutInput
): Promise<CheckoutResult | null> {
  const planEnv = `RAZORPAY_PLAN_${input.planId.toUpperCase()}`;
  const razorpayPlanId = process.env[planEnv];
  if (!razorpayPlanId) return null;

  const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
    method: "POST",
    headers: {
      Authorization: getRazorpayAuthHeader(),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      plan_id: razorpayPlanId,
      total_count: 120,
      customer_notify: 1,
      notes: {
        userId: input.userId,
        planId: input.planId,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok || !data?.id) {
    throw new Error(data?.error?.description || "Razorpay subscription create failed");
  }

  const checkoutUrl = data.short_url || data?.auth_link || null;
  if (!checkoutUrl) return null;

  return {
    mode: "razorpay",
    checkoutUrl,
    externalId: data.id,
  };
}

export async function createCheckoutSession(
  input: CreateCheckoutInput
): Promise<CheckoutResult> {
  const plan = plans.find((p) => p.id === input.planId);
  if (!plan) throw new Error("Invalid plan");

  const provider = getProvider();
  if (provider === "razorpay") {
    const recurring = await createRazorpaySubscriptionCheckout(input);
    if (recurring) return recurring;
    return createRazorpayPaymentLink(input);
  }

  return { mode: "manual" };
}

export function verifyRazorpayWebhook(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
