// app/api/billing/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import { Subscription } from "@/lib/models/Subscription"
import { ApiKey } from "@/lib/models/ApiKey"
import { plans } from "@/lib/billing/plans"
import { getAuthUser } from "@/lib/auth/getAuthUser"
import { createCheckoutSession } from "@/lib/billing/provider"
import { grantPlanRequests } from "@/lib/billing/requestCredits"
import { trackEvent } from "@/lib/analytics/trackEvent"

/**
 * ======================
 * GET → Billing overview
 * ======================
 */
export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(authUser.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const subscription = await Subscription.findOne({
      userId: user._id,
      status: "active",
    })

    const currentPlan = user.planId
      ? plans.find((p) => p.id === user.planId) || null
      : null

    return NextResponse.json({
      plans,
      provider: process.env.BILLING_PROVIDER || "manual",
      currentPlan,
      subscription: subscription
        ? {
            planId: subscription.planId,
            status: subscription.status,
            renewsAt: subscription.renewsAt,
          }
        : null,
      isOnTrial: !user.planId,
      trialRequestsRemaining: user.trialRequestsRemaining,
    })
  } catch (err) {
    console.error("Billing GET error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * =========================
 * POST → Create subscription
 * =========================
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { planId } = await req.json()
    if (!planId) {
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
    }

    const plan = plans.find((p) => p.id === planId)
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    await connectDB()
    const user = await User.findById(authUser.id).select("email")
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await trackEvent({
      userId: authUser.id,
      event: "plan_checkout_started",
      source: "billing.api",
      metadata: { planId },
    })

    const checkout = await createCheckoutSession({
      userId: authUser.id,
      userEmail: user.email,
      planId,
    })

    // Razorpay flow: complete on webhook after payment success.
    if (checkout.mode === "razorpay") {
      return NextResponse.json({
        success: true,
        mode: "razorpay",
        checkoutUrl: checkout.checkoutUrl,
      })
    }

    // 1️⃣ Expire existing active subscription (safety)
    await Subscription.updateMany(
      { userId: authUser.id, status: "active" },
      { status: "expired" }
    )

    // 2️⃣ Calculate renewal date
    const renewsAt = new Date()
    renewsAt.setDate(renewsAt.getDate() + plan.durationDays)

    // 3️⃣ Create new subscription
    const subscription = await Subscription.create({
      userId: authUser.id,
      planId,
      renewsAt,
      provider: "manual",
    })

    // 4️⃣ Update user plan snapshot
    await grantPlanRequests({
      userId: authUser.id,
      planId,
      renewsAt,
    })
    await ApiKey.updateMany({ userId: authUser.id }, { planSnapshot: planId })

    await trackEvent({
      userId: authUser.id,
      event: "plan_subscription_activated",
      source: "billing.manual",
      metadata: { planId },
    })

    return NextResponse.json({
      success: true,
      message: "Subscription activated",
      subscription: {
        planId: subscription.planId,
        status: subscription.status,
        renewsAt: subscription.renewsAt,
      },
    })
  } catch (err) {
    console.error("Billing POST error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
