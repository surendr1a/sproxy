import { UsageLog } from "@/lib/models/UsageLog";

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function persistUsageEvent({
  userId,
  workspaceId,
  success,
}: {
  userId?: string;
  workspaceId?: string | null;
  success: boolean;
}) {
  if (!userId) return;

  const date = dayKey();

  await UsageLog.updateOne(
    { userId, workspaceId: workspaceId || null, date },
    {
      $inc: {
        requestCount: 1,
        failedCount: success ? 0 : 1,
      },
      $setOnInsert: {
        bytesTransferred: 0,
        workspaceId: workspaceId || null,
      },
    },
    { upsert: true }
  );
}
