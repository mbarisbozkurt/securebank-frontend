import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { ToastContext, type ToastTone } from './toastContext'

type Toast = {
  id: number
  message: string
  tone: ToastTone
}

const TOAST_DURATION_MS = 3200

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = useCallback((toastId: number) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId),
    )
  }, [])

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const toastId = Date.now() + Math.floor(Math.random() * 1000)

      setToasts((currentToasts) => [
        ...currentToasts.slice(-2),
        { id: toastId, message, tone },
      ])

      window.setTimeout(() => dismissToast(toastId), TOAST_DURATION_MS)
    },
    [dismissToast],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div className={`toast toast-${toast.tone}`} key={toast.id}>
            <span />
            <p>{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
