import { Modal } from '../../components/Modal'
import { btnPrimary } from '../styles/theme'
import type { ImportResult } from '../api'

interface Props {
  open: boolean
  result: ImportResult | null
  fileName: string
  onClose: () => void
}

export function ImportResultModal({ open, result, fileName, onClose }: Props) {
  if (!result) return null

  const allOk = result.failed === 0 && result.imported > 0
  const noneImported = result.imported === 0

  return (
    <Modal
      open={open}
      title={allOk ? '✅ Import successful' : '📥 Import results'}
      onClose={onClose}
      width={640}
      footer={
        <button style={btnPrimary} onClick={onClose}>
          Done
        </button>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
          File: <strong>{fileName}</strong>
        </div>
      </div>

      {/* Summary cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{result.totalRows}</div>
          <div style={styles.summaryLabel}>Total rows</div>
        </div>
        <div style={{ ...styles.summaryCard, borderLeft: '3px solid #10b981' }}>
          <div style={{ ...styles.summaryValue, color: '#10b981' }}>
            {result.imported}
          </div>
          <div style={styles.summaryLabel}>Imported</div>
        </div>
        <div
          style={{
            ...styles.summaryCard,
            borderLeft: `3px solid ${result.failed > 0 ? '#ef4444' : '#e5e7eb'}`,
          }}
        >
          <div
            style={{
              ...styles.summaryValue,
              color: result.failed > 0 ? '#ef4444' : 'var(--color-text-muted)',
            }}
          >
            {result.failed}
          </div>
          <div style={styles.summaryLabel}>Failed</div>
        </div>
      </div>

      {/* Message */}
      {allOk && (
        <div style={styles.successBanner}>
          🎉 All {result.imported} contacts were imported successfully.
        </div>
      )}

      {noneImported && result.failed > 0 && (
        <div style={styles.errorBanner}>
          ⚠️ No contacts were imported. See errors below.
        </div>
      )}

      {/* Errors table */}
      {result.errors.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>
            Errors ({result.errors.length})
          </h4>
          <div style={styles.errorTableWrapper}>
            <table style={styles.errorTable}>
              <thead>
                <tr>
                  <th style={{ ...styles.errorTh, width: 70 }}>Line</th>
                  <th style={styles.errorTh}>Message</th>
                </tr>
              </thead>
              <tbody>
                {result.errors.map((e, i) => (
                  <tr key={i}>
                    <td style={{ ...styles.errorTd, color: 'var(--color-danger-text)', fontWeight: 600 }}>
                      {e.line}
                    </td>
                    <td style={styles.errorTd}>{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    background: 'var(--color-surface-muted)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 16px',
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 4,
  },
  successBanner: {
    padding: 14,
    background: 'var(--color-success-bg)',
    color: 'var(--color-success-text)',
    borderRadius: 'var(--radius-md)',
    fontSize: 14,
    fontWeight: 500,
  },
  errorBanner: {
    padding: 14,
    background: 'var(--color-danger-bg)',
    color: 'var(--color-danger-text)',
    borderRadius: 'var(--radius-md)',
    fontSize: 14,
    fontWeight: 500,
  },
  errorTableWrapper: {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    maxHeight: 260,
    overflowY: 'auto',
  },
  errorTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  errorTh: {
    textAlign: 'left',
    padding: '8px 12px',
    background: 'var(--color-surface-muted)',
    fontSize: 12,
    color: 'var(--color-text-muted)',
    fontWeight: 600,
    borderBottom: '1px solid var(--color-border)',
    position: 'sticky',
    top: 0,
  },
  errorTd: {
    padding: '8px 12px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: 13,
  },
}