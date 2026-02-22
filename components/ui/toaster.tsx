'use client'

import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const Icon =
          variant === 'destructive'
            ? XCircle
            : variant === 'success'
              ? CheckCircle2
              : variant === 'warning'
                ? AlertTriangle
                : Info

        const iconClass =
          variant === 'destructive'
            ? 'text-rose-600'
            : variant === 'success'
              ? 'text-emerald-600'
              : variant === 'warning'
                ? 'text-amber-600'
                : 'text-sky-600'

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="mt-0.5">
              <Icon className={`h-5 w-5 ${iconClass}`} />
            </div>
            <div className="grid flex-1 gap-1.5 pr-1">
              {title && <ToastTitle className="text-[13px]">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-[13px]">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
