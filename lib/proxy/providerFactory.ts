function csv(value?: string) {
  return (value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function buildProviderUrls(
  host: string,
  port: string,
  username: string,
  password: string,
  countries: string[]
) {
  if (!countries.length) {
    return [`http://${username}:${password}@${host}:${port}`];
  }
  return countries.map(
    (country) =>
      `http://${username}-${country.toLowerCase()}:${password}@${host}:${port}`
  );
}

function fromSmartproxy() {
  const host = process.env.SMARTPROXY_HOST || "gate.smartproxy.com";
  const port = process.env.SMARTPROXY_PORT || "7000";
  const username = process.env.SMARTPROXY_USERNAME;
  const password = process.env.SMARTPROXY_PASSWORD;
  const countries = csv(process.env.SMARTPROXY_COUNTRIES);

  if (!username || !password) return [];
  return buildProviderUrls(host, port, username, password, countries);
}

function fromOxylabs() {
  const host = process.env.OXYLABS_HOST || "pr.oxylabs.io";
  const port = process.env.OXYLABS_PORT || "7777";
  const username = process.env.OXYLABS_USERNAME;
  const password = process.env.OXYLABS_PASSWORD;
  const countries = csv(process.env.OXYLABS_COUNTRIES);

  if (!username || !password) return [];
  return buildProviderUrls(host, port, username, password, countries);
}

export function getRuntimeProxyPool(): string[] {
  const explicitPool = csv(process.env.PROXY_POOL);
  const explicitSingle = process.env.PROXY_URL?.trim();
  const provider = (process.env.PROXY_PROVIDER || "custom").toLowerCase();

  const providerPool =
    provider === "smartproxy"
      ? fromSmartproxy()
      : provider === "oxylabs"
        ? fromOxylabs()
        : [];

  const merged = [
    ...(explicitSingle ? [explicitSingle] : []),
    ...explicitPool,
    ...providerPool,
  ];
  return [...new Set(merged)];
}
