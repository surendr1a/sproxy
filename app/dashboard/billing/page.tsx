"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle2, AlertTriangle, CreditCard, Loader2 } from "lucide-react"

/* ---------------- TYPES ---------------- */

interface Plan {
  id: string
  name: string
  monthlyRequestLimit: number
  price: number
  features: string[]
}

interface BillingData {
  plans: Plan[]
  currentPlan: Plan | null
  subscription: {
    status: string
    renewsAt: string
  } | null
  isOnTrial: boolean
  trialRequestsRemaining: number
}

/* ---------------- FALLBACK DATA ---------------- */

const FALLBACK_DATA: BillingData = {
  plans: [
    {
      id: "free",
      name: "Free",
      monthlyRequestLimit: 1000,
      price: 0,
      features: ["Basic access", "Community support"],
    },
    {
      id: "pro",
      name: "Pro",
      monthlyRequestLimit: 50000,
      price: 79,
      features: ["Priority support", "Advanced sticky sessions", "Country targeting"],
    },
    {
      id: "business",
      name: "Business",
      monthlyRequestLimit: 200000,
      price: 199,
      features: ["Fast-track support", "Dedicated pools", "Higher concurrency"],
    },
  ],
  currentPlan: null,
  subscription: null,
  isOnTrial: true,
  trialRequestsRemaining: 25,
}

/* ---------------- PAGE ---------------- */

export default function BillingPage() {
  const [data, setData] = useState<BillingData>(FALLBACK_DATA)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  /* ---------------- FETCH ---------------- */

  useEffect(() => {
    fetch("/api/billing")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((billingData) => {
        setData({
          plans: Array.isArray(billingData?.plans)
            ? billingData.plans
            : FALLBACK_DATA.plans,
          currentPlan: billingData?.currentPlan ?? null,
          subscription: billingData?.subscription ?? null,
          isOnTrial: billingData?.isOnTrial ?? true,
          trialRequestsRemaining:
            billingData?.trialRequestsRemaining ?? 0,
        })
      })
      .catch(() => {
        console.warn("⚠️ Using fallback billing data")
        setData(FALLBACK_DATA)
      })
      .finally(() => setLoading(false))
  }, [])

  /* ---------------- HANDLERS ---------------- */

  const handleSelectPlan = (plan: Plan) => {
    if (plan.id === "free") return
    if (plan.id === data.currentPlan?.id) return
    setSelectedPlan(plan)
    setShowCheckout(true)
  }

  const handleCheckout = async () => {
    if (!selectedPlan) return
    setUpgrading(selectedPlan.id)

    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Upgrade failed")
      }
      const payload = await res.json()
      if (payload?.mode === "razorpay" && payload?.checkoutUrl) {
        window.location.href = payload.checkoutUrl
        return
      }
      const refresh = await fetch("/api/billing")
      const refreshedData = await refresh.json()
      setData((prev) => ({
        ...prev,
        plans: Array.isArray(refreshedData?.plans)
          ? refreshedData.plans
          : prev.plans,
        currentPlan: refreshedData?.currentPlan ?? null,
        subscription: refreshedData?.subscription ?? null,
        isOnTrial: refreshedData?.isOnTrial ?? false,
        trialRequestsRemaining:
          refreshedData?.trialRequestsRemaining ?? prev.trialRequestsRemaining,
      }))
      setShowCheckout(false)
    } catch (error: any) {
      alert(error.message || "Upgrade failed")
    } finally {
      setUpgrading(null)
    }
  }

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and payment methods
        </p>
      </div>

      {/* CURRENT PLAN */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold">
                {data.currentPlan?.name ?? "Free Trial"}
              </span>
              <Badge variant={data.isOnTrial ? "secondary" : "default"}>
                {data.isOnTrial ? "Trial" : "Active"}
              </Badge>
            </div>
            {data.isOnTrial && (
              <p className="text-sm text-muted-foreground">
                {data.trialRequestsRemaining} free requests remaining
              </p>
            )}
          </div>

          {data.subscription && (
            <div className="text-right text-sm">
              <p className="text-muted-foreground">Renews on</p>
              <p className="font-medium">
                {new Date(data.subscription.renewsAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TRIAL WARNING */}
      {data.isOnTrial && data.trialRequestsRemaining <= 10 && (
        <Alert variant={data.trialRequestsRemaining === 0 ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {data.trialRequestsRemaining === 0
              ? "Trial Expired"
              : "Trial Ending Soon"}
          </AlertTitle>
          <AlertDescription>
            {data.trialRequestsRemaining === 0
              ? "Your free trial has ended. Please upgrade."
              : `Only ${data.trialRequestsRemaining} requests left.`}
          </AlertDescription>
        </Alert>
      )}

      {/* PLANS */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Available Plans</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(data.plans ?? []).map((plan) => {
            const isCurrent = data.currentPlan?.id === plan.id
            const isPopular = plan.id === "pro"

            return (
              <Card
                key={plan.id}
                className={`relative ${
                  isPopular ? "border-primary shadow-md" : ""
                } ${isCurrent ? "ring-2 ring-primary" : ""}`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}

                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.monthlyRequestLimit.toLocaleString()} requests / month
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground"> / month</span>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {(plan.features ?? []).map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    disabled={isCurrent || plan.id === "free"}
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {isCurrent
                      ? "Current Plan"
                      : plan.id === "free"
                      ? "Free Trial"
                      : "Select Plan"}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      {/* PAYMENT PLACEHOLDER */}
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-4 py-6">
          <CreditCard className="h-8 w-8 text-muted-foreground" />
          <div>
            <h3 className="font-medium">Payment Method</h3>
            <p className="text-sm text-muted-foreground">
              Billing is handled via Razorpay secure checkout.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CHECKOUT MODAL */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Upgrade to {selectedPlan?.name}
            </DialogTitle>
            <DialogDescription>
              This will activate your selected plan immediately.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={!!upgrading}>
              {upgrading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
