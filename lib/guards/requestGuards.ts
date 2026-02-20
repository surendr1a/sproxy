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
  fetchExecutor: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetchExecutor(controller.signal);
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
  body?: any;
  arrayBuffer(): Promise<ArrayBuffer>;
};

export async function readResponseWithLimit(
  response: ArrayBufferResponse,
  maxBytes: number
): Promise<string> {
  if (response.body) {
    const reader = response.body.getReader();
    let total = 0;
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.length;
      if (total > maxBytes) {
        reader.releaseLock();
        throw new Error(
          `Response size limit exceeded (${Math.round(maxBytes / (1024 * 1024))}MB)`
        );
      }
      chunks.push(value);
    }

    const merged = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    return new TextDecoder("utf-8").decode(merged);
  }

  const fallbackBuffer = Buffer.from(await response.arrayBuffer());
  if (fallbackBuffer.length > maxBytes) {
    throw new Error(
      `Response size limit exceeded (${Math.round(maxBytes / (1024 * 1024))}MB)`
    );
  }
  return fallbackBuffer.toString("utf-8");
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
