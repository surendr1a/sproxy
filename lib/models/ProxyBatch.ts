import mongoose, { Schema, models } from "mongoose";

const ProxyBatchSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    proxyType: {
      type: String,
      enum: ["residential", "datacenter", "mobile"],
      default: "residential",
    },
    country: { type: String, default: "Random" },
    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active",
      index: true,
    },
    totalProxies: { type: Number, default: 0 },
    activeProxies: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProxyBatchSchema.index({ userId: 1, name: 1 }, { unique: true });

export const ProxyBatch =
  models.ProxyBatch || mongoose.model("ProxyBatch", ProxyBatchSchema);
