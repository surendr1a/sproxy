// lib/guards/requestGuards.ts

/**
 * Central place for request protection:
 * - Timeout guard
 * - Response size guard
 * - Plan based limits
 */

export type PlanType = "free" | "starter" | "pro" | "business" | "enterprise";

const MB = 1024 * 1024;

/**
 * 🔐 Limits per plan
 * (ye values tum baad me pricing ke hisaab se tweak kar sakte ho)
 */
export const PLAN_GUARDS: Record<
  PlanType,
  {
    timeoutMs: number;
    maxResponseSize: number;
  }
> = {
  free: {
    timeoutMs: 15_000, // 15s
    maxResponseSize: 2 * MB, // 2 MB
  },
  starter: {
    timeoutMs: 20_000,
    maxResponseSize: 5 * MB, // 5 MB
  },
  pro: {
    timeoutMs: 30_000,
    maxResponseSize: 10 * MB, // 10 MB
  },
  business: {
    timeoutMs: 45_000,
    maxResponseSize: 25 * MB, // 25 MB
  },
  enterprise: {
    timeoutMs: 60_000,
    maxResponseSize: 100 * MB, // 100 MB (custom usually)
  },
};

/**
 * ⏱️ Wrap fetch with timeout
 */
export async function fetchWithTimeout<T>(
  fetchPromise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    // undici fetch respects AbortController
    // @ts-ignore
    return await fetchPromise;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Request timeout exceeded");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 📦 Read response safely with size limit
 */

type ArrayBufferResponse = {
  arrayBuffer(): Promise<ArrayBuffer>;
};

export async function readResponseWithLimit(
  response: ArrayBufferResponse,
  maxBytes: number
): Promise<string> {
  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length > maxBytes) {
    throw new Error(
      `Response size limit exceeded (${Math.round(maxBytes / (1024 * 1024))}MB)`
    );
  }

  return buffer.toString("utf-8");
}

/**
 * 🎯 Helper to resolve plan safely
 */
export function resolvePlan(plan?: string): PlanType {
  if (!plan) return "free";

  if (plan in PLAN_GUARDS) {
    return plan as PlanType;
  }

  return "free";
}
