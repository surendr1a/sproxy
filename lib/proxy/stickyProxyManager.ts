// lib/proxy/stickyProxyManager.ts

const stickyMap = new Map<string, { proxy: string; expires: number }>();

export function getStickyProxy(sessionId: string, ttl: number, getRandomProxy: () => string): string {
  const now = Date.now();

  if (stickyMap.has(sessionId)) {
    const record = stickyMap.get(sessionId)!;
    if (record.expires > now) {
      return record.proxy; // same proxy within TTL
    }
  }

  // Assign new proxy
  const proxy = getRandomProxy();
  stickyMap.set(sessionId, { proxy, expires: now + ttl * 1000 });
  return proxy;
}
