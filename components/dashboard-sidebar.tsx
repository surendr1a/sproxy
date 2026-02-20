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
} from "lucide-react"
import { useState } from "react"
import { ConfirmModal } from "./ui/confirm-modal"

const navItems = [
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
  { href: "/dashboard/how-to-use", label: "How to Use", icon: BookOpen },
  { href: "/dashboard/support", label: "Support", icon: HelpCircle },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2">
          <Globe className="h-6 w-6" />
          <span className="text-lg font-semibold">ProxyAPI</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
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
