interface Props {
  size?: number
  color?: string
  strokeWidth?: number
}

export function Spinner({
  size = 20,
  color = 'var(--color-primary)',
  strokeWidth = 2.5,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ animation: 'spin 0.7s linear infinite', display: 'block' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeOpacity="0.2"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  )
}

export function InlineSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: 'var(--color-text-muted)',
        fontSize: 13,
      }}
    >
      <Spinner size={16} />
      <span>{label}</span>
    </div>
  )
}