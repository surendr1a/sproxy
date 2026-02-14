"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

interface User {
  email: string
  planId: string | null
  trialRequestsRemaining: number
}

export function DashboardHeader() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div />
      <div className="flex items-center gap-4">
        {user && (
          <>
            <Badge variant={user.planId ? "default" : "secondary"}>
              {user.planId ? user.planId.charAt(0).toUpperCase() + user.planId.slice(1) : "Free Trial"}
            </Badge>
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </>
        )}
      </div>
    </header>
  )
}
