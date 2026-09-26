import type { CSSProperties } from 'react'

export const colors = {
  bg: 'var(--color-bg)',
  surface: 'var(--color-surface)',
  border: 'var(--color-border)',
  text: 'var(--color-text)',
  textMuted: 'var(--color-text-muted)',
  primary: 'var(--color-primary)',
  primaryHover: 'var(--color-primary-hover)',
  success: 'var(--color-success)',
  danger: 'var(--color-danger)',
  warning: 'var(--color-warning)',
}

export const btnPrimary: CSSProperties = {
  padding: '9px 16px',
  background: 'var(--color-primary)',
  color: 'var(--color-on-primary)',
  borderRadius: 'var(--radius-md)',
  fontWeight: 600,
  transition: 'background 0.15s',
}

export const btnSecondary: CSSProperties = {
  padding: '9px 16px',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontWeight: 500,
  transition: 'background 0.15s',
}

export const btnDanger: CSSProperties = {
  padding: '9px 16px',
  background: 'var(--color-danger)',
  color: 'var(--color-on-primary)',
  borderRadius: 'var(--radius-md)',
  fontWeight: 600,
}

export const btnGhost: CSSProperties = {
  padding: '6px 10px',
  background: 'transparent',
  color: 'var(--color-text-muted)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 13,
}

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: 14,
  outline: 'none',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

export const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text-muted)',
}

export const cardStyle: CSSProperties = {
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-sm)',
}