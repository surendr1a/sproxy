import mongoose from "mongoose";

const RateLimitCounterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

RateLimitCounterSchema.index({ key: 1, dateKey: 1 }, { unique: true });
RateLimitCounterSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimitCounter =
  mongoose.models.RateLimitCounter ||
  mongoose.model("RateLimitCounter", RateLimitCounterSchema);
