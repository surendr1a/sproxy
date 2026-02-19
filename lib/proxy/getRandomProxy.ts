// lib/proxy/getRandomProxy.ts

let badProxies = new Set<string>();

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

function getConfiguredProxies(): string[] {
  const singleProxy = process.env.PROXY_URL?.trim();
  const pooledProxies = (process.env.PROXY_POOL || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const all = singleProxy ? [singleProxy, ...pooledProxies] : pooledProxies;
  return [...new Set(all)];
}

export function getConfiguredProxyCount(): number {
  return getConfiguredProxies().length;
}

export function getRandomProxy(
  country?: string,
  type?: string,
  excluded: Set<string> = new Set()
): string {
  const configured = getConfiguredProxies();
  if (configured.length === 0) {
    throw new Error("No proxies configured. Set PROXY_URL or PROXY_POOL.");
  }

  let proxies = configured.filter((p) => !badProxies.has(p) && !excluded.has(p));

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

export function markProxyAsBad(proxy: string) {
  console.log("🚫 Marking proxy as bad:", proxy);
  badProxies.add(proxy);
}
