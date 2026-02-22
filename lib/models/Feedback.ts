import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planId: { type: String, default: null, index: true },
    overallExperience: { type: Number, min: 1, max: 10, required: true },
    proxyQuality: { type: Number, min: 1, max: 5, required: true },
    speedStability: { type: Number, min: 1, max: 5, required: true },
    dashboardEase: { type: Number, min: 1, max: 5, required: true },
    recommendationScore: { type: Number, min: 0, max: 10, required: true },
    recommendedFeatures: [{ type: String }],
    painPoints: [{ type: String }],
    requestedFeature: { type: String, default: "" },
    improvementIdeas: { type: String, default: "" },
    biggestWin: { type: String, default: "" },
  },
  { timestamps: true }
);

FeedbackSchema.index({ userId: 1, createdAt: -1 });

export const Feedback =
  mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);
