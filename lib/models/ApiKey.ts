// lib/models/ApiKey.ts
import mongoose from "mongoose"

const ApiKeySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  key: { type: String, required: true, unique: true },
  maskedKey: { type: String, required: true },

  status: { type: String, enum: ["active", "disabled"], default: "active" },
  
  planSnapshot: {
    type: String,
    enum: ["free", "starter", "pro", "business", "enterprise"],
  },

  lastUsedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
})

export const ApiKey =
  mongoose.models.ApiKey || mongoose.model("ApiKey", ApiKeySchema)
