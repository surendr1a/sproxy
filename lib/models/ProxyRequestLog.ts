import mongoose, { Schema, models } from "mongoose";

const ProxyRequestLogSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true,
    },
    apiKey: { type: String, default: null, index: true },
    targetUrl: { type: String, required: true },
    domain: { type: String, required: true, index: true },
    method: { type: String, default: "GET" },
    status: { type: Number, default: 0 },
    success: { type: Boolean, default: false, index: true },
    error: { type: String, default: null },
    provider: {
      type: String,
      enum: ["smartproxy", "oxylabs", "custom", "direct-fallback", "unknown"],
      default: "unknown",
      index: true,
    },
    proxyMode: { type: String, default: "rotate" },
    country: { type: String, default: "Random" },
    latencyMs: { type: Number, default: 0 },
    usedDirectFallback: { type: Boolean, default: false, index: true },
    requestHeaders: { type: mongoose.Schema.Types.Mixed, default: {} },
    requestBody: { type: String, default: "" },
    responsePreview: { type: String, default: "" },
  },
  { timestamps: true }
);

ProxyRequestLogSchema.index({ userId: 1, workspaceId: 1, createdAt: -1 });
ProxyRequestLogSchema.index({ userId: 1, domain: 1, createdAt: -1 });

export const ProxyRequestLog =
  models.ProxyRequestLog || mongoose.model("ProxyRequestLog", ProxyRequestLogSchema);
