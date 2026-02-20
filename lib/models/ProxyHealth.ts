import mongoose from "mongoose";

const ProxyHealthSchema = new mongoose.Schema(
  {
    proxy: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["healthy", "bad"],
      default: "healthy",
      index: true,
    },
    badUntil: { type: Date, default: null, index: true },
    lastFailureAt: { type: Date, default: null },
    lastSuccessAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const ProxyHealth =
  mongoose.models.ProxyHealth || mongoose.model("ProxyHealth", ProxyHealthSchema);
