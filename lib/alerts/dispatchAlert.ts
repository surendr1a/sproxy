import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { AlertChannel } from "@/lib/models/AlertChannel";
import { AlertDeliveryLog } from "@/lib/models/AlertDeliveryLog";
import type { AlertEventType } from "@/lib/alerts/config";

type DispatchAlertInput = {
  userId?: string;
  event: AlertEventType;
  payload: Record<string, unknown>;
};

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 300;

function signPayload(secret: string, body: string) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

export async function dispatchUserAlert(input: DispatchAlertInput) {
  if (!input.userId) return;

  try {
    await connectDB();
    const channels = await AlertChannel.find({
      userId: input.userId,
      status: "active",
      subscribedEvents: input.event,
    }).select("webhookUrl secret");

    const body = JSON.stringify({
      event: input.event,
      occurredAt: new Date().toISOString(),
      payload: input.payload,
    });

    await Promise.all(
      channels.map(async (channel: any) => {
        const headers: Record<string, string> = {
          "content-type": "application/json",
        };
        if (channel.secret) {
          headers["x-sproxy-signature"] = signPayload(channel.secret, body);
        }
        let delivered = false;
        let attempts = 0;
        let responseStatus: number | null = null;
        let errorText: string | null = null;

        while (!delivered && attempts < MAX_ATTEMPTS) {
          attempts += 1;
          try {
            const res = await fetch(channel.webhookUrl, {
              method: "POST",
              headers,
              body,
            });
            responseStatus = res.status;
            if (res.ok) {
              delivered = true;
              break;
            }
            errorText = `HTTP ${res.status}`;
          } catch (error: any) {
            errorText = error?.message || "Network error";
          }

          if (!delivered && attempts < MAX_ATTEMPTS) {
            await new Promise((resolve) =>
              setTimeout(resolve, BASE_BACKOFF_MS * Math.pow(2, attempts - 1))
            );
          }
        }

        await AlertDeliveryLog.create({
          userId: input.userId,
          channelId: channel._id,
          event: input.event,
          status: delivered ? "success" : "failed",
          attempts,
          responseStatus,
          error: delivered ? null : errorText,
          createdAt: new Date(),
        });
      })
    );
  } catch (error) {
    console.error("dispatchUserAlert error:", error);
  }
}
