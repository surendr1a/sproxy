import mongoose from "mongoose";

const StickySessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    proxy: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

StickySessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const StickySession =
  mongoose.models.StickySession ||
  mongoose.model("StickySession", StickySessionSchema);
