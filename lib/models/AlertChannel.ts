import mongoose from "mongoose";

const AlertChannelSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    webhookUrl: { type: String, required: true, trim: true },
    subscribedEvents: {
      type: [String],
      default: ["proxy.all_failed", "billing.payment_failed"],
    },
    secret: { type: String, default: null },
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

AlertChannelSchema.index({ userId: 1, name: 1 }, { unique: true });

export const AlertChannel =
  mongoose.models.AlertChannel ||
  mongoose.model("AlertChannel", AlertChannelSchema);
