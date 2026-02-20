// lib/proxy/stickyProxyManager.ts
import { connectDB } from "@/lib/db";
import { StickySession } from "@/lib/models/StickySession";

export async function getStickyProxy(
  sessionId: string,
  ttl: number,
  getRandomProxy: () => Promise<string> | string
): Promise<string> {
  await connectDB();
  const now = new Date();

  const existing = await StickySession.findOne({
    sessionId,
    expiresAt: { $gt: now },
  }).select("proxy");
  if (existing?.proxy) return existing.proxy;

  const proxy = await getRandomProxy();
  const expiresAt = new Date(Date.now() + ttl * 1000);

  await StickySession.findOneAndUpdate(
    { sessionId },
    { sessionId, proxy, expiresAt },
    { upsert: true, new: true }
  );

  return proxy;
}

export async function invalidateStickyProxy(sessionId: string, proxy?: string) {
  await connectDB();
  if (!proxy) {
    await StickySession.deleteOne({ sessionId });
    return;
  }

  await StickySession.deleteOne({ sessionId, proxy });
}
