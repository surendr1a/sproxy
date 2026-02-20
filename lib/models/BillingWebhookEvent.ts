import mongoose from "mongoose";

const BillingWebhookEventSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, index: true },
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const BillingWebhookEvent =
  mongoose.models.BillingWebhookEvent ||
  mongoose.model("BillingWebhookEvent", BillingWebhookEventSchema);
