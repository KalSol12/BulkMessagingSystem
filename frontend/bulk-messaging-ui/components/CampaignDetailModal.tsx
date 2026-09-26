import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { btnPrimary } from '../src/styles/theme'
import { Spinner } from './Spinner'
import { Channel, MessageStatus, campaignsApi } from '../src/api'
import type { CampaignDetail } from '../src/api'

interface Props {
  open: boolean
  campaignId: number | null
  onClose: () => void
}

const msgStatusLabel: Record<MessageStatus, string> = {
  [MessageStatus.Pending]: 'Pending',
  [MessageStatus.Sent]: 'Sent',
  [MessageStatus.Failed]: 'Failed',
}

const msgStatusColor: Record<MessageStatus, { bg: string; text: string }> = {
  [MessageStatus.Pending]: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-text)' },
  [MessageStatus.Sent]: { bg: 'var(--color-success-bg)', text: 'var(--color-success-text)' },
  [MessageStatus.Failed]: { bg: 'var(--color-danger-bg)', text: 'var(--color-danger-text)' },
}

export function CampaignDetailModal({ open, campaignId, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)

  useEffect(() => {
    if (!open || !campaignId) return
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const data = await campaignsApi.get(campaignId!)
        if (!cancelled) setCampaign(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()

    return () => {
      cancelled = true
    }
  }, [open, campaignId])

  return (
    <Modal
      open={open}
      title={campaign ? `Campaign #${campaign.id}` : 'Campaign'}
      onClose={onClose}
      width={760}
      footer={
        <button style={btnPrimary} onClick={onClose}>
          Close
        </button>
      }
    >
      {loading || !campaign ? (
        <div
          style={{
            padding: 40,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Spinner size={28} />
        </div>
      ) : (
        <>
          {/* Summary */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 10,
              marginBottom: 16,
            }}
          >
            <Stat label="Channel" value={campaign.channel === Channel.Email ? '✉️ Email' : '📱 SMS'} />
            <Stat label="Total" value={String(campaign.totalCount)} />
            <Stat label="Sent" value={String(campaign.sentCount)} color="#065f46" />
            <Stat
              label="Failed"
              value={String(campaign.failedCount)}
              color={campaign.failedCount > 0 ? '#991b1b' : undefined}
            />
          </div>

          {/* Body preview */}
          <div
            style={{
              padding: 12,
              background: 'var(--color-surface-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 16,
            }}
          >
            {campaign.subject && (
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Subject: {campaign.subject}
              </div>
            )}
            <div
              style={{
                fontSize: 13,
                color: 'var(--color-text-muted)',
                marginBottom: 6,
              }}
            >
              Template:
            </div>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
              {campaign.body}
            </div>
          </div>

          {/* Messages */}
          <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>
            Messages ({campaign.messages.length})
          </h4>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Contact</th>
                  <th style={styles.th}>Destination</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Info</th>
                </tr>
              </thead>
              <tbody>
                {campaign.messages.map(m => {
                  const chip = msgStatusColor[m.status]
                  const dest = campaign.channel === Channel.Email ? m.email : m.phone
                  return (
                    <tr key={m.id}>
                      <td style={styles.td}>{m.contactName || '—'}</td>
                      <td style={styles.td}>{dest || '—'}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 20,
                            background: chip.bg,
                            color: chip.text,
                          }}
                        >
                          {msgStatusLabel[m.status]}
                        </span>
                      </td>
                      <td style={{ ...styles.td, fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {m.error ? (
                          <span style={{ color: 'var(--color-danger)' }}>❌ {m.error}</span>
                        ) : m.providerMessageId ? (
                          <span>ID: {m.providerMessageId.slice(0, 16)}…</span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  )
                })}
                {campaign.messages.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ ...styles.td, textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}
                    >
                      No messages yet. Click Send to dispatch.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  )
}

function Stat({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div
      style={{
        padding: 12,
        background: 'var(--color-surface-muted)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color }}>
        {value}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  tableWrapper: {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    maxHeight: 300,
    overflowY: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '8px 12px',
    background: 'var(--color-surface-muted)',
    fontSize: 11,
    color: 'var(--color-text-muted)',
    fontWeight: 600,
    borderBottom: '1px solid var(--color-border)',
    position: 'sticky',
    top: 0,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: 13,
  },
}