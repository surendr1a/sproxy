// lib/models/Plan.ts
import mongoose from "mongoose"

const PlanSchema = new mongoose.Schema({
  name: String,
  monthlyRequestLimit: Number,
  price: Number,
  limits: {
    requestPerMonth: Number,
    timeoutMs: Number,
    maxResponseSizeMB: Number,
  },
})

export const Plan =
  mongoose.models.Plan || mongoose.model("Plan", PlanSchema)
