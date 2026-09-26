import { Channel, CampaignStatus } from '../src/api'
import type { Campaign } from '../src/api'
import { btnPrimary, btnSecondary, btnGhost } from '../src/styles/theme'

interface Props {
  campaigns: Campaign[]
  onSend: (c: Campaign) => void
  onView: (c: Campaign) => void
  onDelete: (c: Campaign) => void
}

const statusLabel: Record<CampaignStatus, string> = {
  [CampaignStatus.Draft]: 'Draft',
  [CampaignStatus.Sending]: 'Sending',
  [CampaignStatus.Completed]: 'Completed',
  [CampaignStatus.Failed]: 'Failed',
  [CampaignStatus.Cancelled]: 'Cancelled',
}

const statusColor: Record<CampaignStatus, { bg: string; text: string }> = {
  [CampaignStatus.Draft]: { bg: '#f3f4f6', text: '#374151' },
  [CampaignStatus.Sending]: { bg: '#fef3c7', text: '#92400e' },
  [CampaignStatus.Completed]: { bg: '#ecfdf5', text: '#065f46' },
  [CampaignStatus.Failed]: { bg: '#fef2f2', text: '#991b1b' },
  [CampaignStatus.Cancelled]: { bg: '#f3f4f6', text: '#6b7280' },
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function CampaignList({ campaigns, onSend, onView, onDelete }: Props) {
  if (campaigns.length === 0) return null

  return (
    <div style={styles.wrapper}>
      {campaigns.map(c => {
        const isDraft = c.status === CampaignStatus.Draft
        const chip = statusColor[c.status]
        const channelIcon = c.channel === Channel.Email ? '✉️' : '📱'

        return (
          <div key={c.id} className="hover-card" style={styles.card}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span>{channelIcon}</span>
                <span
                  style={{
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.subject || c.body.slice(0, 60) || '(empty)'}
                  {c.body.length > 60 && !c.subject ? '…' : ''}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: chip.bg,
                    color: chip.text,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {statusLabel[c.status]}
                </span>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  gap: 12,
                }}
              >
                <span>{relativeTime(c.createdAt)}</span>
                {c.status === CampaignStatus.Completed ||
                c.status === CampaignStatus.Failed ? (
                  <span>
                    {c.sentCount} sent
                    {c.failedCount > 0 && (
                      <span style={{ color: 'var(--color-danger)' }}>
                        {' '}
                        · {c.failedCount} failed
                      </span>
                    )}
                    {' '}/ {c.totalCount}
                  </span>
                ) : (
                  <span>{c.totalCount} recipients</span>
                )}
              </div>
              {(c.status === CampaignStatus.Completed ||
                c.status === CampaignStatus.Failed) && (
                <div
                  style={{
                    marginTop: 6,
                    color: 'var(--color-text)',
                    fontSize: 13,
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={c.body}
                >
                  Message: {c.body}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {isDraft && (
                <button className="btn btn-primary" style={btnPrimary} onClick={() => onSend(c)}>
                  Send now
                </button>
              )}
              <button className="btn btn-secondary" style={btnSecondary} onClick={() => onView(c)}>
                View
              </button>
              {isDraft && (
                <button
                  className="btn btn-danger-ghost"
                  style={{ ...btnGhost, color: 'var(--color-danger)' }}
                  onClick={() => onDelete(c)}
                  title="Delete draft"
                >
                  🗑
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
  },
}