export const ALERT_EVENT_OPTIONS = [
  "proxy.all_failed",
  "proxy.direct_fallback",
  "billing.payment_failed",
  "billing.subscription_canceled",
  "system.test",
] as const;

export type AlertEventType = (typeof ALERT_EVENT_OPTIONS)[number];

const ALLOWED_EVENTS_SET = new Set<string>(ALERT_EVENT_OPTIONS);

export function sanitizeAlertEvents(input: unknown) {
  if (!Array.isArray(input)) return [];
  const cleaned = input
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => ALLOWED_EVENTS_SET.has(v));
  return [...new Set(cleaned)] as AlertEventType[];
}

export function isValidWebhookUrl(raw: unknown) {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false as const, error: "Webhook URL is required." };
  }

  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return { ok: false as const, error: "Webhook URL must be a valid URL." };
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol === "https:") return { ok: true as const, url: parsed.toString() };

  if (protocol === "http:") {
    const host = parsed.hostname.toLowerCase();
    const isLocalhost =
      host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
    if (isLocalhost) {
      return { ok: true as const, url: parsed.toString() };
    }
    return {
      ok: false as const,
      error: "Only HTTPS URLs are allowed (HTTP is allowed for localhost only).",
    };
  }

  return { ok: false as const, error: "Webhook URL must use HTTP/HTTPS." };
}
