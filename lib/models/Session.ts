// lib/models/Session.ts
import mongoose from "mongoose"

const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  proxy: { type: String },
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date,
})

export const Session =
  mongoose.models.Session || mongoose.model("Session", SessionSchema)
