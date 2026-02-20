import mongoose from "mongoose";

const ProductEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    event: { type: String, required: true, index: true },
    source: { type: String, default: "web" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

ProductEventSchema.index({ event: 1, createdAt: -1 });

export const ProductEvent =
  mongoose.models.ProductEvent ||
  mongoose.model("ProductEvent", ProductEventSchema);
