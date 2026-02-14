import Link from "next/link"
import { Globe } from "lucide-react"

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <span className="font-semibold">ProxyAPI</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Fast, simple, usage-based proxy access for developers.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Product</h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="/features"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Pricing
              </Link>
              <Link
                href="/docs"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Documentation
              </Link>
            </nav>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Support</h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="/support"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Help Center
              </Link>
              <Link
                href="/docs"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                API Reference
              </Link>
            </nav>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Contact</h4>
            <p className="text-sm text-muted-foreground">
              support@proxyapi.dev
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ProxyAPI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
