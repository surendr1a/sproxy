"use client"

import { Button } from "@/components/ui/button"

type ConfirmModalProps = {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirm",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 px-4">
      <div
        className="
          w-full
          max-w-md
          rounded-t-2xl md:rounded-xl
          bg-background
          p-5 md:p-6
          shadow-lg
          animate-in fade-in zoom-in-95
        "
      >
        <h2 className="text-base md:text-lg font-semibold">
          {title}
        </h2>

        {description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse md:flex-row md:justify-end gap-2 md:gap-3">
          <Button
            variant="ghost"
            className="w-full md:w-auto"
            onClick={onCancel}
          >
            Cancel
          </Button>

          <Button
            variant="destructive"
            className="w-full md:w-auto"
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
