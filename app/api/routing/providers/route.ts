import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { getEffectiveProviderOrder, getRoutingConfigForUser } from "@/lib/routing/providerRouting";

const VALID_PROVIDERS = ["smartproxy", "oxylabs", "custom"] as const;
type ProviderName = (typeof VALID_PROVIDERS)[number];

function sanitizePriority(input: unknown): ProviderName[] {
  const picked: ProviderName[] = [];
  if (Array.isArray(input)) {
    input.forEach((item) => {
      if (VALID_PROVIDERS.includes(item as ProviderName) && !picked.includes(item as ProviderName)) {
        picked.push(item as ProviderName);
      }
    });
  }
  VALID_PROVIDERS.forEach((provider) => {
    if (!picked.includes(provider)) picked.push(provider);
  });
  return picked;
}

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const routing = await getEffectiveProviderOrder(authUser.id, req.nextUrl.searchParams.get("workspaceId"));
  if (!routing) {
    return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
  }

  return NextResponse.json({
    workspaceId: routing.workspaceId,
    config: routing.config,
    providerAvailability: {
      smartproxy: routing.pools.smartproxy.length,
      oxylabs: routing.pools.oxylabs.length,
      custom: routing.pools.custom.length,
    },
    activeOrder: routing.availableOrder,
  });
}

export async function PATCH(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const result = await getRoutingConfigForUser(authUser.id, req.nextUrl.searchParams.get("workspaceId"));
  if (!result) {
    return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
  }

  const { config, workspaceId } = result;
  const body = await req.json().catch(() => ({}));

  if (body.mode === "auto" || body.mode === "manual") {
    config.mode = body.mode;
  }
  if (body.manualProvider === null || VALID_PROVIDERS.includes(body.manualProvider)) {
    config.manualProvider = body.manualProvider;
  }
  if (typeof body.failoverOnTimeout === "boolean") {
    config.failoverOnTimeout = body.failoverOnTimeout;
  }
  if (typeof body.failoverOn5xx === "boolean") {
    config.failoverOn5xx = body.failoverOn5xx;
  }
  if (typeof body.maxProviderAttempts === "number") {
    config.maxProviderAttempts = Math.max(1, Math.min(body.maxProviderAttempts, 6));
  }
  if (typeof body.enabled === "boolean") {
    config.enabled = body.enabled;
  }

  config.providerPriority = sanitizePriority(body.providerPriority || config.providerPriority);

  await config.save();

  const routing = await getEffectiveProviderOrder(authUser.id, workspaceId);

  return NextResponse.json({
    workspaceId,
    config: routing?.config,
    providerAvailability: {
      smartproxy: routing?.pools.smartproxy.length || 0,
      oxylabs: routing?.pools.oxylabs.length || 0,
      custom: routing?.pools.custom.length || 0,
    },
    activeOrder: routing?.availableOrder || [],
  });
}
