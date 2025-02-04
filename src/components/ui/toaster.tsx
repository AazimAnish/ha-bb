'use client';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

interface ToastItem {
  id: string; // or number, depending on your ID type
  title?: string;
  description?: string;
  action?: React.ReactNode; // Adjust type as necessary
  type?: string; // Added for the new type prop
  [key: string]: any; // For any additional props
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, type, ...props }) => (
        <Toast key={id} type={mapToastType(type)} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && (
              <ToastDescription>{description}</ToastDescription>
            )}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}

// Helper function to map toast types
const mapToastType = (type?: string) => {
  switch (type) {
    case 'success':
      return 'foreground'; // Map to expected type
    case 'error':
      return 'background'; // Map to expected type
    case 'warning':
      return 'background'; // Map to expected type
    default:
      return undefined; // Default case
  }
}; 