// lib/proxy/provider.ts

type ProxyInfo = {
  id: string
  proxy: string
  country?: string
  type?: "http" | "https"
  status: "healthy" | "bad"
  lastCheckedAt: number
}

/**
 * ⚙️ In-memory proxy provider
 * - zero DB cost
 * - admin dashboard safe
 * - compatible with PROXY_POOL env
 */
class ProxyProvider {
  private proxies: ProxyInfo[] = []

  constructor() {
    this.loadFromEnv()
  }

  private loadFromEnv() {
    const pool = process.env.PROXY_POOL
    if (!pool) return

    this.proxies = pool.split(",").map((raw, index) => {
      const cleaned = raw.trim()

      return {
        id: `proxy_${index}`,
        proxy: cleaned,
        country: this.extractCountry(cleaned),
        type: cleaned.startsWith("https") ? "https" : "http",
        status: "healthy",
        lastCheckedAt: Date.now(),
      }
    })
  }

  private extractCountry(proxy: string): string | undefined {
    // Supports formats like:
    // http://US@1.2.3.4:8080
    // https://IN@1.2.3.4:8080
    const match = proxy.match(/\/\/([A-Z]{2})@/i)
    return match?.[1]?.toUpperCase()
  }

  /* ---------------- PUBLIC METHODS ---------------- */

  getProxies() {
    return this.proxies
  }

  markBad(proxyUrl: string) {
    const proxy = this.proxies.find(p => p.proxy === proxyUrl)
    if (proxy) {
      proxy.status = "bad"
      proxy.lastCheckedAt = Date.now()
    }
  }

  markHealthy(proxyUrl: string) {
    const proxy = this.proxies.find(p => p.proxy === proxyUrl)
    if (proxy) {
      proxy.status = "healthy"
      proxy.lastCheckedAt = Date.now()
    }
  }
}

/* ---------------- SINGLETON ---------------- */

let provider: ProxyProvider | null = null

export function getProxyProvider() {
  if (!provider) {
    provider = new ProxyProvider()
  }
  return provider
}
