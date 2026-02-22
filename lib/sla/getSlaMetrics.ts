import { connectDB } from "@/lib/db";
import { ProxyRequestLog } from "@/lib/models/ProxyRequestLog";

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx] || 0;
}

export async function getSlaMetrics(userId: string, workspaceId?: string | null, windowDays = 30) {
  await connectDB();

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - Math.max(1, Math.min(windowDays, 90)));

  const filter: Record<string, unknown> = {
    userId,
    createdAt: { $gte: fromDate },
  };
  if (workspaceId) filter.workspaceId = workspaceId;

  const logs = await ProxyRequestLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(5000)
    .select("success status latencyMs provider createdAt");

  const total = logs.length;
  const successCount = logs.filter((l: any) => l.success).length;
  const failedCount = total - successCount;
  const uptimePercent = total > 0 ? Number(((successCount / total) * 100).toFixed(2)) : 100;

  const latency = logs
    .filter((l: any) => Number.isFinite(l.latencyMs))
    .map((l: any) => Number(l.latencyMs));

  const p95Latency = percentile(latency, 95);
  const p99Latency = percentile(latency, 99);
  const avgLatency = latency.length
    ? Math.round(latency.reduce((sum, value) => sum + value, 0) / latency.length)
    : 0;

  const budgetRemaining = Number(Math.max(0, 99.9 - (100 - uptimePercent)).toFixed(3));

  const providerSummary = ["smartproxy", "oxylabs", "custom", "direct-fallback", "unknown"].map((provider) => {
    const items = logs.filter((l: any) => l.provider === provider);
    const ok = items.filter((l: any) => l.success).length;
    const count = items.length;
    return {
      provider,
      total: count,
      successRate: count > 0 ? Number(((ok / count) * 100).toFixed(1)) : 0,
      avgLatencyMs: count > 0
        ? Math.round(items.reduce((sum: number, item: any) => sum + (item.latencyMs || 0), 0) / count)
        : 0,
    };
  });

  const lastIncidents = logs
    .filter((l: any) => !l.success)
    .slice(0, 10)
    .map((l: any) => ({
      at: l.createdAt,
      status: l.status || 0,
      provider: l.provider,
      latencyMs: l.latencyMs || 0,
    }));

  return {
    windowDays,
    fromDate,
    total,
    successCount,
    failedCount,
    uptimePercent,
    p95Latency,
    p99Latency,
    avgLatency,
    errorBudgetRemainingPercent: budgetRemaining,
    providerSummary,
    incidents: lastIncidents,
  };
}
