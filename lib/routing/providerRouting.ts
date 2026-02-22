import { connectDB } from "@/lib/db";
import { ProviderRoutingConfig } from "@/lib/models/ProviderRoutingConfig";
import { resolveWorkspaceForUser } from "@/lib/auth/rbac";
import { getProviderProxyPools, type ProxyProviderName } from "@/lib/proxy/providerFactory";

const DEFAULT_PRIORITY: ProxyProviderName[] = ["smartproxy", "oxylabs", "custom"];

export type RoutingConfigSnapshot = {
  mode: "auto" | "manual";
  manualProvider: ProxyProviderName | null;
  providerPriority: ProxyProviderName[];
  failoverOnTimeout: boolean;
  failoverOn5xx: boolean;
  maxProviderAttempts: number;
  enabled: boolean;
  workspaceId: string;
};

function normalizeProviders(input: unknown): ProxyProviderName[] {
  const unique = new Set<ProxyProviderName>();
  if (Array.isArray(input)) {
    input.forEach((item) => {
      if (item === "smartproxy" || item === "oxylabs" || item === "custom") {
        unique.add(item);
      }
    });
  }
  DEFAULT_PRIORITY.forEach((provider) => unique.add(provider));
  return [...unique];
}

export async function getRoutingConfigForUser(userId: string, requestedWorkspaceId?: string | null) {
  await connectDB();
  const workspaceId = await resolveWorkspaceForUser(userId, requestedWorkspaceId, "viewer");
  if (!workspaceId) return null;

  let config = await ProviderRoutingConfig.findOne({ userId, workspaceId });
  if (!config) {
    config = await ProviderRoutingConfig.create({
      userId,
      workspaceId,
      mode: "auto",
      manualProvider: null,
      providerPriority: DEFAULT_PRIORITY,
      failoverOnTimeout: true,
      failoverOn5xx: true,
      maxProviderAttempts: 3,
      enabled: true,
    });
  }

  return {
    config,
    workspaceId,
  };
}

export async function getEffectiveProviderOrder(userId: string, requestedWorkspaceId?: string | null) {
  const result = await getRoutingConfigForUser(userId, requestedWorkspaceId);
  if (!result) return null;

  const { config, workspaceId } = result;
  const pools = getProviderProxyPools();
  const providerPriority = normalizeProviders(config.providerPriority);

  const order: ProxyProviderName[] =
    config.mode === "manual" && config.manualProvider
      ? [config.manualProvider, ...providerPriority.filter((p) => p !== config.manualProvider)]
      : providerPriority;

  const availableOrder = order.filter((provider) => pools[provider].length > 0);

  return {
    workspaceId,
    config: {
      mode: config.mode,
      manualProvider: config.manualProvider,
      providerPriority,
      failoverOnTimeout: Boolean(config.failoverOnTimeout),
      failoverOn5xx: Boolean(config.failoverOn5xx),
      maxProviderAttempts: Math.max(1, Math.min(Number(config.maxProviderAttempts) || 3, 6)),
      enabled: Boolean(config.enabled),
      workspaceId,
    } as RoutingConfigSnapshot,
    pools,
    availableOrder,
  };
}

export function getProxyProviderName(proxyUrl: string): ProxyProviderName | "unknown" {
  const host = proxyUrl.split("@").pop()?.split(":")[0]?.toLowerCase() || "";
  if (host.includes("smartproxy")) return "smartproxy";
  if (host.includes("oxylabs")) return "oxylabs";
  if (host) return "custom";
  return "unknown";
}
