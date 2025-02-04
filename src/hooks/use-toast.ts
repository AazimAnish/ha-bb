'use client';

import { useState, useCallback } from "react"

type ToastProps = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  type?: "default" | "success" | "error" | "warning"
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = useCallback(
    ({ title, description, type = "default", action }: Omit<ToastProps, "id">) => {
      const id = Math.random().toString(36).slice(2)
      
      setToasts((currentToasts) => [
        ...currentToasts,
        { id, title, description, type, action },
      ])

      return {
        id,
        dismiss: () => setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id)),
      }
    },
    []
  )

  const dismiss = useCallback((toastId: string) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId))
  }, [])

  return {
    toast,
    dismiss,
    toasts,
  }
}

export type { ToastProps } 