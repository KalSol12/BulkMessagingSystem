import { useEffect } from 'react'

export type ToastKind = 'success' | 'error' | 'warning' | 'info'

export interface ToastData {
  id: number
  kind: ToastKind
  message: string
  duration?: number
}

interface Props {
  toast: ToastData
  onDismiss: (id: number) => void
}

const icons: Record<ToastKind, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
}

export function Toast({ toast, onDismiss }: Props) {
  const duration = toast.duration ?? 4000

  useEffect(() => {
    if (duration <= 0) return
    const t = setTimeout(() => onDismiss(toast.id), duration)
    return () => clearTimeout(t)
  }, [toast.id, duration, onDismiss])

  const palette = colors[toast.kind]

  return (
    <div
      style={{
        ...styles.toast,
        background: palette.bg,
        borderLeft: `4px solid ${palette.border}`,
        color: palette.text,
      }}
      role="alert"
    >
      <span style={{ fontSize: 16 }}>{icons[toast.kind]}</span>
      <span style={{ flex: 1, wordBreak: 'break-word' }}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        style={styles.close}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}

const colors: Record<
  ToastKind,
  { bg: string; border: string; text: string }
> = {
  success: { bg: '#ecfdf5', border: '#10b981', text: '#065f46' },
  error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
  warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
  info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
}

const styles: Record<string, React.CSSProperties> = {
  toast: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '12px 14px',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-md)',
    fontSize: 14,
    fontWeight: 500,
    maxWidth: 360,
    animation: 'slideInRight 0.25s ease',
    pointerEvents: 'auto',
  },
  close: {
    color: 'inherit',
    opacity: 0.5,
    fontSize: 13,
    padding: 2,
    lineHeight: 1,
  },
}