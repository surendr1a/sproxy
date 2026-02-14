// lib/usage/usageStore.ts

import { PlanType } from "@/lib/guards/requestGuards";

type LogEntry = {
  userId?: string;        // ✅ ADD
  apiKey?: string;        // ✅ ADD
  plan?: PlanType;        // ✅ ADD

  time: number;
  url: string;
  proxy: string;
  success: boolean;
  status?: number;
  error?: string;
};

let totalRequests = 0;
let successRequests = 0;
let failedRequests = 0;

const lastLogs: LogEntry[] = [];
const MAX_LOGS = 10;

export function recordRequest(log: LogEntry) {
  totalRequests++;

  if (log.success) successRequests++;
  else failedRequests++;

  lastLogs.unshift(log);
  if (lastLogs.length > MAX_LOGS) {
    lastLogs.pop();
  }
}

export function getUsageStats() {
  return {
    totalRequests,
    successRequests,
    failedRequests,
    lastLogs,
  };
}
