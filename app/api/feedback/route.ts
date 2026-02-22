import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { Feedback } from "@/lib/models/Feedback";
import { trackEvent } from "@/lib/analytics/trackEvent";

const MAX_FEEDBACKS_PER_MONTH = 3;

function getMonthRange(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { start, end };
}

function cleanList(value: unknown, maxItems = 8) {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)
    .slice(0, maxItems);
}

function cleanText(value: unknown, maxLen = 800) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

function toIntInRange(value: unknown, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < min || rounded > max) return null;
  return rounded;
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!user.planId) {
    return NextResponse.json(
      { error: "Feedback is available for paid users only." },
      { status: 403 }
    );
  }

  await connectDB();
  const { start, end } = getMonthRange();
  const latest = await Feedback.findOne({ userId: user.id }).sort({ createdAt: -1 });
  const count = await Feedback.countDocuments({ userId: user.id });
  const monthCount = await Feedback.countDocuments({
    userId: user.id,
    createdAt: { $gte: start, $lt: end },
  });
  const remainingThisMonth = Math.max(MAX_FEEDBACKS_PER_MONTH - monthCount, 0);

  return NextResponse.json({
    latest,
    count,
    monthCount,
    maxPerMonth: MAX_FEEDBACKS_PER_MONTH,
    remainingThisMonth,
    resetsAt: end,
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!user.planId) {
    return NextResponse.json(
      { error: "Feedback is available for paid users only." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const overallExperience = toIntInRange(body?.overallExperience, 1, 10);
  const proxyQuality = toIntInRange(body?.proxyQuality, 1, 5);
  const speedStability = toIntInRange(body?.speedStability, 1, 5);
  const dashboardEase = toIntInRange(body?.dashboardEase, 1, 5);
  const recommendationScore = toIntInRange(body?.recommendationScore, 0, 10);

  if (
    overallExperience === null ||
    proxyQuality === null ||
    speedStability === null ||
    dashboardEase === null ||
    recommendationScore === null
  ) {
    return NextResponse.json(
      { error: "Please complete all required rating fields." },
      { status: 400 }
    );
  }

  const recommendedFeatures = cleanList(body?.recommendedFeatures, 12);
  const painPoints = cleanList(body?.painPoints, 12);
  const requestedFeature = cleanText(body?.requestedFeature, 500);
  const improvementIdeas = cleanText(body?.improvementIdeas, 1200);
  const biggestWin = cleanText(body?.biggestWin, 600);

  await connectDB();
  const { start, end } = getMonthRange();
  const monthCount = await Feedback.countDocuments({
    userId: user.id,
    createdAt: { $gte: start, $lt: end },
  });
  if (monthCount >= MAX_FEEDBACKS_PER_MONTH) {
    return NextResponse.json(
      {
        error: "Monthly feedback limit reached. You can submit again next month.",
        monthCount,
        maxPerMonth: MAX_FEEDBACKS_PER_MONTH,
        remainingThisMonth: 0,
        resetsAt: end,
      },
      { status: 429 }
    );
  }

  const created = await Feedback.create({
    userId: user.id,
    planId: user.planId,
    overallExperience,
    proxyQuality,
    speedStability,
    dashboardEase,
    recommendationScore,
    recommendedFeatures,
    painPoints,
    requestedFeature,
    improvementIdeas,
    biggestWin,
  });

  await trackEvent({
    userId: user.id,
    event: "feedback_submitted",
    source: "dashboard.feedback",
    metadata: {
      overallExperience,
      recommendationScore,
      recommendedCount: recommendedFeatures.length,
      painPointsCount: painPoints.length,
    },
  });

  return NextResponse.json({
    success: true,
    id: created._id.toString(),
    message: "Feedback submitted successfully.",
    monthCount: monthCount + 1,
    maxPerMonth: MAX_FEEDBACKS_PER_MONTH,
    remainingThisMonth: Math.max(MAX_FEEDBACKS_PER_MONTH - (monthCount + 1), 0),
    resetsAt: end,
  });
}
