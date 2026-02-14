"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Globe, User } from "lucide-react"

type UserType = {
  id: string
  email: string
}

export function PublicHeader() {
  const [user, setUser] = useState<UserType | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) return null
        return res.json()
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  function goToDashboard() {
    if (user) {
      window.location.href = "/dashboard"
    } else {
      window.location.href = "/login"
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Globe className="h-6 w-6" />
            <span className="text-lg font-semibold">ProxyAPI</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
              Docs
            </Link>
            <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
          </nav>

          <div className="relative flex items-center gap-3">
            {!loading && !user && (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get Free API Key</Button>
                </Link>
              </>
            )}

            {!loading && user && (
              <div className="relative">
                <button
                  onClick={() => setOpen(!open)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border hover:bg-muted"
                >
                  <User className="h-5 w-5" />
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-60 rounded-md border bg-background shadow-md">
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                      {user.email}
                    </div>

                    <div className="border-t">
                      <button
                        onClick={goToDashboard}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                      >
                        Dashboard
                      </button>

                      <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-muted"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 🔴 Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Confirm Logout</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to logout?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                onClick={logout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
