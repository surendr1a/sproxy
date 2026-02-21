import mongoose, { Schema, models } from "mongoose"

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },

    role: { type: String, default: "user" }, // user | admin
    status: { type: String, default: "active" }, // active | blocked

    trialRequestsRemaining: { type: Number, default: 50 },
    paidRequestsRemaining: { type: Number, default: null },

    planId: { type: String, default: null },
    planExpiresAt: { type: Date, default: null },
    lastActiveAt: Date,
  },
  { timestamps: true }
)

export const User = models.User || mongoose.model("User", UserSchema)
