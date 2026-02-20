import { connectDB } from "@/lib/db";
import { ProductEvent } from "@/lib/models/ProductEvent";

type EventInput = {
  userId?: string | null;
  event: string;
  source?: string;
  metadata?: Record<string, unknown>;
};

export async function trackEvent(input: EventInput) {
  try {
    await connectDB();
    await ProductEvent.create({
      userId: input.userId || null,
      event: input.event,
      source: input.source || "web",
      metadata: input.metadata || {},
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("trackEvent error:", error);
  }
}
