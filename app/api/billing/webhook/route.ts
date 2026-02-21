import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Subscription } from "@/lib/models/Subscription";
import { User } from "@/lib/models/User";
import { ApiKey } from "@/lib/models/ApiKey";
import { plans } from "@/lib/billing/plans";
import { verifyRazorpayWebhook } from "@/lib/billing/provider";
import { grantPlanRequests } from "@/lib/billing/requestCredits";
import { dispatchUserAlert } from "@/lib/alerts/dispatchAlert";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { BillingWebhookEvent } from "@/lib/models/BillingWebhookEvent";
import { Payment } from "@/lib/models/Payment";
import crypto from "crypto";
import mongoose from "mongoose";

function getNotes(obj: any) {
  return {
    userId: obj?.notes?.userId || null,
    planId: obj?.notes?.planId || null,
  };
}

function toDateFromUnix(value: any) {
  if (!value || typeof value !== "number") return null;
  return new Date(value * 1000);
}

function toObjectIdOrNull(value: any) {
  if (!value || typeof value !== "string") return null;
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
}

function buildPaymentUpsert(event: any, eventId: string, eventType: string) {
  const paymentEntity = event?.payload?.payment?.entity || null;
  const paymentLinkEntity = event?.payload?.payment_link?.entity || null;
  const subscriptionEntity = event?.payload?.subscription?.entity || null;
  const invoiceEntity = event?.payload?.invoice?.entity || null;

  const notesSource =
    paymentEntity?.notes
      ? paymentEntity
      : paymentLinkEntity?.notes
      ? paymentLinkEntity
      : subscriptionEntity?.notes
      ? subscriptionEntity
      : invoiceEntity?.notes
      ? invoiceEntity
      : null;
  const { userId, planId } = getNotes(notesSource);

  const providerPaymentId = paymentEntity?.id || null;
  const providerPaymentLinkId = paymentEntity?.payment_link_id || paymentLinkEntity?.id || null;
  const providerSubscriptionId = paymentEntity?.subscription_id || subscriptionEntity?.id || null;
  const providerInvoiceId = paymentEntity?.invoice_id || invoiceEntity?.id || null;
  const providerOrderId = paymentEntity?.order_id || paymentLinkEntity?.order_id || null;

  const filter = providerPaymentId
    ? { provider: "razorpay", providerPaymentId }
    : providerPaymentLinkId
    ? { provider: "razorpay", providerPaymentLinkId }
    : providerSubscriptionId
    ? { provider: "razorpay", providerSubscriptionId }
    : { provider: "razorpay", lastEventId: eventId };

  const status =
    paymentEntity?.status ||
    (eventType === "payment_link.paid"
      ? "paid"
      : eventType === "payment.captured"
      ? "captured"
      : eventType === "payment.failed"
      ? "failed"
      : null);

  const updateData: Record<string, any> = {
    provider: "razorpay",
    providerPaymentId,
    providerOrderId,
    providerPaymentLinkId,
    providerSubscriptionId,
    providerInvoiceId,
    userId: toObjectIdOrNull(userId),
    planId: planId || null,
    amount: paymentEntity?.amount ?? paymentLinkEntity?.amount ?? invoiceEntity?.amount ?? null,
    currency: paymentEntity?.currency || paymentLinkEntity?.currency || invoiceEntity?.currency || null,
    status,
    method: paymentEntity?.method || null,
    email:
      paymentEntity?.email ||
      paymentLinkEntity?.customer?.email ||
      null,
    contact: paymentEntity?.contact || paymentLinkEntity?.customer?.contact || null,
    failureCode: paymentEntity?.error_code || null,
    failureReason: paymentEntity?.error_description || null,
    lastEventId: eventId,
    lastEventType: eventType,
    notes: notesSource?.notes || null,
    rawPayload: event?.payload || null,
    paidAt:
      eventType === "payment_link.paid" || eventType === "payment.captured"
        ? toDateFromUnix(paymentEntity?.captured_at || paymentEntity?.created_at) || new Date()
        : undefined,
    failedAt:
      eventType === "payment.failed"
        ? toDateFromUnix(paymentEntity?.created_at) || new Date()
        : undefined,
  };

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) delete updateData[key];
  });

  return { filter, updateData };
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

  if (eventType) {
    const { filter, updateData } = buildPaymentUpsert(event, eventId, eventType);
    await Payment.findOneAndUpdate(
      filter,
      {
        $set: updateData,
      },
      { upsert: true, new: true }
    );
  }

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

    await grantPlanRequests({
      userId,
      planId,
      renewsAt,
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
      await grantPlanRequests({
        userId,
        planId,
        renewsAt,
      });
      await ApiKey.updateMany({ userId }, { planSnapshot: planId });
    }
  }

  return NextResponse.json({ received: true });
}
