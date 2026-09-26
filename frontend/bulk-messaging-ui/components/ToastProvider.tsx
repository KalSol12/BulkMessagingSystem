import { useCallback, useState, type ReactNode } from 'react'
import { Toast, type ToastData, type ToastKind } from './Toast'
import { ToastContext, type ToastContextValue } from './useToast '

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const show = useCallback(
    (kind: ToastKind, message: string, duration = 4000) => {
      const id = Date.now() + Math.random()
      setToasts(prev => [...prev, { id, kind, message, duration }])
    },
    [],
  )

  const value: ToastContextValue = {
    show,
    success: (m, d) => show('success', m, d),
    error: (m, d) => show('error', m, d),
    warning: (m, d) => show('warning', m, d),
    info: (m, d) => show('info', m, d),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={styles.container}>
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 20,
    right: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    zIndex: 2000,
    pointerEvents: 'none',
  },
}