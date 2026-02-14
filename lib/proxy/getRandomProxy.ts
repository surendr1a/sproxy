// lib/proxy/getRandomProxy.ts

let badProxies = new Set<string>();

/**
 * Returns a random healthy proxy from the pool.
 * Optional filtering by country code and type (http/https).
 * Works for all countries if country/type not specified.
 * Example PROXY_POOL: "http://US@165.227.5.10:8888,https://UK@165.227.5.11:8888,http://IN@165.227.5.12:8888"
 */
export function getRandomProxy(country?: string, type?: string): string {
  const pool = process.env.PROXY_POOL;

  if (!pool) throw new Error("PROXY_POOL not configured");

  let proxies = pool
    .split(",")
    .map(p => p.trim())
    .filter(p => p && !badProxies.has(p));

  // Apply filters only if provided
  if (country) {
    proxies = proxies.filter(p => p.toLowerCase().includes(country.toLowerCase()));
  }
  if (country) {
    proxies = proxies.filter(p => p.toLowerCase().includes(country.toLowerCase()));
    // skip filter if none match
    if (proxies.length === 0) proxies = pool.split(",").map(p => p.trim()).filter(p => p);
  }
  if (type) {
    proxies = proxies.filter(p => p.toLowerCase().startsWith(type.toLowerCase()));
  }

  if (proxies.length === 0) {
    badProxies.clear(); // reset after exhaustion
    throw new Error("No healthy proxies available");
  }

  return proxies[Math.floor(Math.random() * proxies.length)];
}

export function markProxyAsBad(proxy: string) {
  console.log("🚫 Marking proxy as bad:", proxy);
  badProxies.add(proxy);
}
