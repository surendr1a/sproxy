// lib/proxy/getRandomProxy.ts
import { connectDB } from "@/lib/db";
import { ProxyHealth } from "@/lib/models/ProxyHealth";
import { getRuntimeProxyPool } from "@/lib/proxy/providerFactory";

const badProxies = new Map<string, number>();
const DEFAULT_BAD_TTL_MS = Number(process.env.PROXY_BAD_TTL_MS || 120000);

/**
 * Returns a random healthy proxy from the pool.
 * Optional filtering by country code and type (http/https).
 * Works for all countries if country/type not specified.
 * Example PROXY_POOL: "http://US@165.227.5.10:8888,https://UK@165.227.5.11:8888,http://IN@165.227.5.12:8888"
 */
function normalizeCountry(country?: string): string | undefined {
  const value = country?.trim().toUpperCase();
  if (!value || value === "RANDOM" || value === "ANY" || value === "ALL") {
    return undefined;
  }
  return value;
}

function extractTaggedCountry(proxy: string): string | undefined {
  const match = proxy.match(/\/\/([A-Z]{2})@/i);
  return match?.[1]?.toUpperCase();
}

function clearExpiredBadProxies() {
  const now = Date.now();
  for (const [proxy, until] of badProxies.entries()) {
    if (until <= now) badProxies.delete(proxy);
  }
}

function getConfiguredProxies(): string[] {
  return getRuntimeProxyPool();
}

export function getConfiguredProxyCount(): number {
  return getConfiguredProxies().length;
}

export async function getRandomProxy(
  country?: string,
  type?: string,
  excluded: Set<string> = new Set()
): Promise<string> {
  const configured = getConfiguredProxies();
  if (configured.length === 0) {
    throw new Error("No proxies configured. Set PROXY_URL or PROXY_POOL.");
  }

  clearExpiredBadProxies();
  await connectDB();
  const now = new Date();
  const persistedBad = await ProxyHealth.find({
    status: "bad",
    badUntil: { $gt: now },
  }).select("proxy");
  const persistedBadSet = new Set(persistedBad.map((p: any) => p.proxy as string));

  let proxies = configured.filter(
    (p) => !badProxies.has(p) && !persistedBadSet.has(p) && !excluded.has(p)
  );

  const targetCountry = normalizeCountry(country);
  if (targetCountry) {
    const byCountry = proxies.filter((p) => {
      const tagged = extractTaggedCountry(p);
      if (tagged) return tagged === targetCountry;
      return p.toUpperCase().includes(targetCountry);
    });
    // If no match for requested country, fall back to current healthy pool.
    if (byCountry.length > 0) proxies = byCountry;
  }

  if (type) {
    proxies = proxies.filter((p) =>
      p.toLowerCase().startsWith(type.toLowerCase())
    );
  }

  if (proxies.length === 0) {
    throw new Error("No healthy proxies available");
  }

  return proxies[Math.floor(Math.random() * proxies.length)];
}

export async function markProxyAsBad(proxy: string) {
  console.log("Marking proxy as bad:", proxy);
  const badUntil = new Date(Date.now() + DEFAULT_BAD_TTL_MS);
  badProxies.set(proxy, badUntil.getTime());
  await connectDB();
  await ProxyHealth.updateOne(
    { proxy },
    {
      proxy,
      status: "bad",
      badUntil,
      lastFailureAt: new Date(),
    },
    { upsert: true }
  );
}

export async function markProxyAsHealthy(proxy: string) {
  badProxies.delete(proxy);
  await connectDB();
  await ProxyHealth.updateOne(
    { proxy },
    {
      proxy,
      status: "healthy",
      badUntil: null,
      lastSuccessAt: new Date(),
    },
    { upsert: true }
  );
}

export async function getProxyHealthSnapshot() {
  clearExpiredBadProxies();
  await connectDB();
  const total = getConfiguredProxies();
  const now = new Date();
  const persistedBad = await ProxyHealth.find({
    status: "bad",
    badUntil: { $gt: now },
  }).select("proxy");
  const persistedBadSet = new Set(persistedBad.map((p: any) => p.proxy as string));
  const bad = total.filter((p) => badProxies.has(p) || persistedBadSet.has(p));
  return {
    total: total.length,
    badCount: bad.length,
    healthyCount: total.length - bad.length,
    bad,
  };
}
