import mongoose, { Schema, models } from "mongoose";

const ProviderRoutingConfigSchema = new Schema(
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
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ["auto", "manual"],
      default: "auto",
    },
    manualProvider: {
      type: String,
      enum: ["smartproxy", "oxylabs", "custom", null],
      default: null,
    },
    providerPriority: {
      type: [String],
      default: ["smartproxy", "oxylabs", "custom"],
    },
    failoverOnTimeout: { type: Boolean, default: true },
    failoverOn5xx: { type: Boolean, default: true },
    maxProviderAttempts: { type: Number, default: 3, min: 1, max: 6 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProviderRoutingConfigSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });

export const ProviderRoutingConfig =
  models.ProviderRoutingConfig ||
  mongoose.model("ProviderRoutingConfig", ProviderRoutingConfigSchema);
