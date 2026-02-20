// lib/models/UsageLog.ts
import mongoose from "mongoose"

const UsageLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  apiKeyId: { type: mongoose.Schema.Types.ObjectId, ref: "ApiKey" },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", default: null, index: true },

  date: { type: String, required: true }, 
  requestCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  bytesTransferred: Number,
})

UsageLogSchema.index({ userId: 1, workspaceId: 1, date: 1 }, { unique: true });

export const UsageLog =
  mongoose.models.UsageLog || mongoose.model("UsageLog", UsageLogSchema)
