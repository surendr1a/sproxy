import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, index: true },
    providerPaymentId: { type: String, default: null, index: true },
    providerOrderId: { type: String, default: null, index: true },
    providerPaymentLinkId: { type: String, default: null, index: true },
    providerSubscriptionId: { type: String, default: null, index: true },
    providerInvoiceId: { type: String, default: null, index: true },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    planId: { type: String, default: null, index: true },

    amount: { type: Number, default: null },
    currency: { type: String, default: null },
    status: { type: String, default: "created", index: true },
    method: { type: String, default: null },
    email: { type: String, default: null },
    contact: { type: String, default: null },

    failureCode: { type: String, default: null },
    failureReason: { type: String, default: null },

    lastEventId: { type: String, default: null, index: true },
    lastEventType: { type: String, default: null, index: true },
    notes: { type: mongoose.Schema.Types.Mixed, default: null },
    rawPayload: { type: mongoose.Schema.Types.Mixed, default: null },

    paidAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PaymentSchema.index(
  { provider: 1, providerPaymentId: 1 },
  { unique: true, partialFilterExpression: { providerPaymentId: { $type: "string" } } }
);

PaymentSchema.index(
  { provider: 1, providerPaymentLinkId: 1 },
  { partialFilterExpression: { providerPaymentLinkId: { $type: "string" } } }
);

export const Payment =
  mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
