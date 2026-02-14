// lib/models/UsageLog.ts
import mongoose from "mongoose"

const UsageLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  apiKeyId: { type: mongoose.Schema.Types.ObjectId, ref: "ApiKey" },

  date: { type: String, required: true }, 
  requestCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  bytesTransferred: Number,
})

export const UsageLog =
  mongoose.models.UsageLog || mongoose.model("UsageLog", UsageLogSchema)
