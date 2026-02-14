// lib/models/Subscription.ts
import mongoose from "mongoose"

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    planId: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "canceled", "expired"],
      default: "active",
      index: true,
    },

    provider: {
      type: String,
      default: null,
    },

    providerSubId: {
      type: String,
      default: null,
      index: true,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    renewsAt: {
      type: Date,
      required: true,
      index: true,
    },

    canceledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

SubscriptionSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
)

export const Subscription =
  mongoose.models.Subscription ||
  mongoose.model("Subscription", SubscriptionSchema)
