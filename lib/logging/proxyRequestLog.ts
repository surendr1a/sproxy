import { connectDB } from "@/lib/db";
import { ProxyRequestLog } from "@/lib/models/ProxyRequestLog";

function safeDomain(url: string) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "invalid-domain";
  }
}

export async function persistProxyRequestLog(input: {
  userId?: string;
  workspaceId?: string | null;
  apiKey?: string | null;
  targetUrl: string;
  method?: string;
  status?: number;
  success: boolean;
  error?: string | null;
  provider?: string;
  proxyMode?: string;
  country?: string;
  latencyMs?: number;
  usedDirectFallback?: boolean;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responsePreview?: string;
}) {
  if (!input.userId) return;

  try {
    await connectDB();

    await ProxyRequestLog.create({
      userId: input.userId,
      workspaceId: input.workspaceId || null,
      apiKey: input.apiKey || null,
      targetUrl: input.targetUrl,
      domain: safeDomain(input.targetUrl),
      method: (input.method || "GET").toUpperCase(),
      status: Number.isFinite(input.status) ? Number(input.status) : 0,
      success: Boolean(input.success),
      error: input.error || null,
      provider: input.provider || "unknown",
      proxyMode: input.proxyMode || "rotate",
      country: input.country || "Random",
      latencyMs: Math.max(0, Math.round(Number(input.latencyMs) || 0)),
      usedDirectFallback: Boolean(input.usedDirectFallback),
      requestHeaders: input.requestHeaders || {},
      requestBody: (input.requestBody || "").slice(0, 5000),
      responsePreview: (input.responsePreview || "").slice(0, 8000),
    });
  } catch (error) {
    console.error("persistProxyRequestLog error:", error);
  }
}
