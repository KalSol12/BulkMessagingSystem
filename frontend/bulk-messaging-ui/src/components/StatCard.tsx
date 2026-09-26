interface Props {
  value: number | string
  label: string
  color: 'green' | 'pink' | 'blue' | 'yellow'
}

const palettes: Record<Props['color'], { accent: string; iconBg: string }> = {
  green: { accent: '#10b981', iconBg: 'rgba(16, 185, 129, 0.16)' },
  pink: { accent: '#f472b6', iconBg: 'rgba(244, 114, 182, 0.16)' },
  blue: { accent: '#38bdf8', iconBg: 'rgba(56, 189, 248, 0.16)' },
  yellow: { accent: '#fbbf24', iconBg: 'rgba(251, 191, 36, 0.16)' },
}

export function StatCard({ value, label, color }: Props) {
  const p = palettes[color]

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 100,
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div>
        <div
          style={{
            fontSize: 38,
            fontWeight: 800,
            lineHeight: 1,
            color: 'var(--color-text)',
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: 14,
            color: 'var(--color-text-muted)',
            marginTop: 8,
            opacity: 0.85,
          }}
        >
          {label}
        </div>
      </div>

      {/* Users icon, right side */}
      <div
        style={{
          width: 42,
          height: 42,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 12,
          background: p.iconBg,
          color: p.accent,
          fontSize: 20,
        }}
      >
        {label.includes('Message') || label === 'Sent' ? '➤' : '👥'}
      </div>
    </div>
  )
}
