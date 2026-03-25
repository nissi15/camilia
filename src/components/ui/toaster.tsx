"use client"

import { Toaster as Sonner } from "sonner"

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "font-sans text-sm rounded-xl border border-border/40 shadow-lg",
          title: "font-semibold",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground rounded-lg",
          cancelButton: "bg-muted text-muted-foreground rounded-lg",
        },
      }}
    />
  )
}
