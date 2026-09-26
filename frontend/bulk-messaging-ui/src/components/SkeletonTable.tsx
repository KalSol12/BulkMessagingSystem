interface Props {
  rows?: number
  cols?: number
}

export function SkeletonTable({ rows = 5, cols = 5 }: Props) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th
                key={i}
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  background: 'var(--color-surface-muted)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div style={skeleton(80)} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td
                  key={c}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  <div style={skeleton(c === 0 ? 140 : 100)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function skeleton(width: number): React.CSSProperties {
  return {
    height: 12,
    width,
    background:
      'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
    backgroundSize: '200% 100%',
    borderRadius: 4,
    animation: 'shimmer 1.2s ease-in-out infinite',
  }
}