import mongoose from "mongoose";

const AlertDeliveryLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: "AlertChannel", default: null, index: true },
    event: { type: String, required: true, index: true },
    status: { type: String, enum: ["success", "failed"], required: true, index: true },
    attempts: { type: Number, default: 1 },
    responseStatus: { type: Number, default: null },
    error: { type: String, default: null },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export const AlertDeliveryLog =
  mongoose.models.AlertDeliveryLog ||
  mongoose.model("AlertDeliveryLog", AlertDeliveryLogSchema);
