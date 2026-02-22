"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Globe,
  LayoutDashboard,
  Key,
  BarChart3,
  CreditCard,
  BookOpen,
  HelpCircle,
  LogOut,
  Layers,
  ShieldCheck,
  BellRing,
  Users,
  Activity,
  MessageSquareHeart,
  Route,
  ChartColumnBig,
  ClipboardList,
  ShieldAlert,
  Code2,
} from "lucide-react"
import { useEffect, useState } from "react"
import { ConfirmModal } from "./ui/confirm-modal"

const baseNavItems = [
  // ---- MAIN ----
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },

  // ---- CORE PROXY TOOLS (PAID VALUE) ----
  { href: "/dashboard/proxy", label: "Proxy Gateway", icon: Globe },
  { href: "/dashboard/proxy/batch", label: "Batch Requests", icon: Layers },
  { href: "/dashboard/proxy/sticky", label: "Sticky Sessions", icon: ShieldCheck },
  { href: "/dashboard/ip-check", label: "IP Check", icon: Globe },

  // ---- ACCOUNT / SIDE ----
  { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
  { href: "/dashboard/usage", label: "Usage", icon: BarChart3 },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/alerts", label: "Alerts", icon: BellRing },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/status", label: "Status", icon: Activity },
  { href: "/dashboard/analytics/domains", label: "Domain Analytics", icon: ChartColumnBig },
  { href: "/dashboard/routing/providers", label: "Provider Routing", icon: Route },
  { href: "/dashboard/logs/requests", label: "Request Logs", icon: ClipboardList },
  { href: "/dashboard/status/sla", label: "SLA Metrics", icon: ShieldAlert },
  { href: "/dashboard/developers/sdk", label: "SDK & Recipes", icon: Code2 },
]

const paidOnlyNavItems = [
  { href: "/dashboard/feedback", label: "Feedback", icon: MessageSquareHeart },
]

const footerNavItems = [
  { href: "/dashboard/how-to-use", label: "How to Use", icon: BookOpen },
  { href: "/dashboard/support", label: "Support", icon: HelpCircle },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isPaidUser, setIsPaidUser] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setIsPaidUser(Boolean(data?.user?.planId))
      })
      .catch(() => {
        setIsPaidUser(false)
      })
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-border bg-card">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2">
          <Globe className="h-6 w-6" />
          <span className="text-lg font-semibold">ProxyAPI</span>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
        {[...baseNavItems, ...(isPaidUser ? paidOnlyNavItems : []), ...footerNavItems].map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => setShowLogoutModal(true)}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>

      <ConfirmModal
        open={showLogoutModal}
        title="Confirm Logout"
        description="Are you sure you want to logout?"
        confirmText="Logout"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </aside>
  )
}
