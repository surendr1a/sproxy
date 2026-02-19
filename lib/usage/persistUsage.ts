import { UsageLog } from "@/lib/models/UsageLog";

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function persistUsageEvent({
  userId,
  success,
}: {
  userId?: string;
  success: boolean;
}) {
  if (!userId) return;

  const date = dayKey();

  await UsageLog.updateOne(
    { userId, date },
    {
      $inc: {
        requestCount: 1,
        failedCount: success ? 0 : 1,
      },
      $setOnInsert: {
        bytesTransferred: 0,
      },
    },
    { upsert: true }
  );
}
