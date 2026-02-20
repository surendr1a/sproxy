import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Subscription } from "@/lib/models/Subscription";
import { User } from "@/lib/models/User";
import { ApiKey } from "@/lib/models/ApiKey";
import { plans } from "@/lib/billing/plans";
import { verifyRazorpayWebhook } from "@/lib/billing/provider";
import { dispatchUserAlert } from "@/lib/alerts/dispatchAlert";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { BillingWebhookEvent } from "@/lib/models/BillingWebhookEvent";
import crypto from "crypto";

function getNotes(obj: any) {
  return {
    userId: obj?.notes?.userId || null,
    planId: obj?.notes?.planId || null,
  };
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-razorpay-signature");
  const rawBody = await req.text();

  if (!signature || !verifyRazorpayWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventId =
    event?.id ||
    event?.payload?.payment_link?.entity?.id ||
    event?.payload?.payment?.entity?.id ||
    crypto.createHash("sha256").update(rawBody).digest("hex");
  const eventType = event?.event;
  const payloadObj =
    event?.payload?.payment_link?.entity ||
    event?.payload?.payment?.entity ||
    event?.payload?.subscription?.entity;

  const { userId, planId } = getNotes(payloadObj);
  await connectDB();

  if (eventId) {
    const previous = await BillingWebhookEvent.findOneAndUpdate(
      { provider: "razorpay", eventId },
      {
        $setOnInsert: {
          provider: "razorpay",
          eventId,
          eventType: eventType || "unknown",
          processedAt: new Date(),
        },
      },
      { upsert: true, new: false }
    ).select("_id");
    if (previous) {
      return NextResponse.json({ received: true, duplicate: true });
    }
  }

  if ((eventType === "payment_link.paid" || eventType === "payment.captured") && userId && planId) {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return NextResponse.json({ received: true });

    const renewsAt = new Date();
    renewsAt.setDate(renewsAt.getDate() + plan.durationDays);

    await Subscription.updateMany({ userId, status: "active" }, { status: "expired" });
    await Subscription.create({
      userId,
      planId,
      status: "active",
      provider: "razorpay",
      providerSubId: payloadObj?.id || payloadObj?.payment_link_id || null,
      renewsAt,
    });

    await User.findByIdAndUpdate(userId, {
      planId,
      planExpiresAt: renewsAt,
      trialRequestsRemaining: 0,
    });
    await ApiKey.updateMany({ userId }, { planSnapshot: planId });

    await trackEvent({
      userId,
      event: "plan_subscription_activated",
      source: "billing.webhook",
      metadata: { planId, eventType },
    });
  }

  if (eventType === "payment.failed") {
    if (userId) {
      await Subscription.updateMany(
        { userId, status: "active" },
        { status: "canceled", canceledAt: new Date() }
      );
    }
    await dispatchUserAlert({
      userId: userId || undefined,
      event: "billing.payment_failed",
      payload: {
        reason: payloadObj?.error_description || "payment.failed",
      },
    });
  }

  if (eventType === "subscription.cancelled" && userId) {
    await Subscription.updateMany(
      { userId, status: "active" },
      { status: "canceled", canceledAt: new Date() }
    );
    await User.findByIdAndUpdate(userId, { planId: null, planExpiresAt: null });
    await ApiKey.updateMany({ userId }, { planSnapshot: "free" });
    await dispatchUserAlert({
      userId,
      event: "billing.subscription_canceled",
      payload: { eventType },
    });
  }

  // Recurring subscription lifecycle events from Razorpay
  if (
    (eventType === "subscription.charged" || eventType === "subscription.activated") &&
    userId &&
    planId
  ) {
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      const renewsAt = new Date();
      renewsAt.setDate(renewsAt.getDate() + plan.durationDays);
      await Subscription.findOneAndUpdate(
        { userId, providerSubId: payloadObj?.id || payloadObj?.subscription_id },
        {
          userId,
          planId,
          status: "active",
          provider: "razorpay",
          providerSubId: payloadObj?.id || payloadObj?.subscription_id || null,
          renewsAt,
        },
        { upsert: true, new: true }
      );
      await User.findByIdAndUpdate(userId, {
        planId,
        planExpiresAt: renewsAt,
      });
      await ApiKey.updateMany({ userId }, { planSnapshot: planId });
    }
  }

  return NextResponse.json({ received: true });
}
