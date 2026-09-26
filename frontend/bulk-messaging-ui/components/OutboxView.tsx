import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Eye, Filter, MoreVertical, RefreshCw, Search, Send, XCircle } from 'lucide-react'
import { groupsApi, campaignsApi, CampaignStatus, Channel } from '../src/api'
import type { Campaign, Group } from '../src/api'
import { btnSecondary } from '../src/styles/theme'
import { InlineSpinner } from './Spinner'

interface Props {
  onOpenCampaign: (id: number) => void
  onSelectGroup: (g: Group) => void
  onBack?: () => void
}

export function OutboxView({ onOpenCampaign, onSelectGroup, onBack }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [groupsById, setGroupsById] = useState<Record<number, Group>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [channelFilter, setChannelFilter] = useState<'all' | 'sms' | 'email'>('all')

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    try {
      if (campaigns.length === 0) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }
      const groups = await groupsApi.list()
      const map: Record<number, Group> = {}
      groups.forEach(g => (map[g.id] = g))
      setGroupsById(map)

      // Fetch campaigns for each group (small N for now)
      const all: Campaign[] = []
      await Promise.all(
        groups.map(async g => {
          try {
            const cs = await campaignsApi.listByGroup(g.id)
            all.push(...cs)
          } catch {
            // ignore per-group failures
          }
        }),
      )
      all.sort((a, b) => {
        const timeDifference =
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        return timeDifference || b.id - a.id
      })
      setCampaigns(
        all.filter(campaign => campaign.status === CampaignStatus.Completed),
      )
      setError(null)
    } catch (e: any) {
      setError('Failed to load outbox: ' + e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <InlineSpinner label="Loading outbox..." />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 20, color: 'var(--color-danger-text)' }}>{error}</div>
    )
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    if (channelFilter === 'sms') return campaign.channel === Channel.Sms
    if (channelFilter === 'email') return campaign.channel === Channel.Email
    return true
  })
  const totalSent = filteredCampaigns.reduce((sum, c) => sum + c.sentCount, 0)
  const totalFailed = filteredCampaigns.reduce((sum, c) => sum + c.failedCount, 0)

  return (
    <div style={styles.page}>
      <div style={styles.heading}>
        <div>
          {onBack && <button type="button" className="back-button" style={styles.backButton} onClick={onBack}><ArrowLeft size={16} /> <span>Back</span></button>}
          <h2 style={styles.title}>Bulk SMS Outbox</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '6px 0 0' }}>
            View and manage your sent bulk SMS campaigns.
          </p>
        </div>
        <div style={styles.controls}>
          <label style={styles.filterControl}>
            <Filter size={15} />
            <span style={styles.filterLabel}>Filter</span>
            <select
              value={channelFilter}
              onChange={event =>
                setChannelFilter(event.target.value as 'all' | 'sms' | 'email')
              }
              style={{
                ...styles.filterSelect,
                color:
                  channelFilter === 'all'
                    ? 'var(--color-text)'
                    : 'var(--color-primary)',
                fontWeight: channelFilter === 'all' ? 500 : 700,
              }}
              aria-label="Filter campaigns by channel"
            >
              <option value="all">All channels</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
            </select>
          </label>
          <button style={styles.controlButton}><CalendarDays size={15} /> Sep 1, 2026 - Sep 30, 2026</button>
          <label style={styles.search}><Search size={16} /><input style={styles.searchInput} placeholder="Search campaigns..." /></label>
          <button type="button" style={styles.refreshButton} onClick={loadAll} disabled={refreshing} title="Refresh">
            <RefreshCw size={15} className={refreshing ? 'spin' : undefined} />
          </button>
        </div>
      </div>

      {filteredCampaigns.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          {campaigns.length === 0
            ? 'No successful campaigns yet.'
            : `No ${channelFilter.toUpperCase()} campaigns found.`}
        </div>
      ) : (
        <>
        <div style={styles.summaryGrid}>
          <Summary icon={<Send />} label="Total Sent" value={totalSent.toLocaleString()} tone="green" />
          <Summary icon={<CheckCircle2 />} label="Delivered" value={totalSent.toLocaleString()} tone="blue" />
          <Summary icon={<XCircle />} label="Failed" value={totalFailed.toLocaleString()} tone="purple" />
          <Summary icon={<Clock3 />} label="Pending" value="0" tone="orange" />
        </div>
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead><tr>
              <th style={styles.th}>Campaign name</th><th style={styles.th}>Group</th>
              <th style={styles.th}>Recipients</th><th style={styles.th}>Sent at</th>
              <th style={styles.th}>Status</th><th style={styles.th}>Actions</th>
            </tr></thead>
            <tbody>{filteredCampaigns.map(c => {
                  const g = groupsById[c.groupId]
                  return <tr key={c.id}>
                     <td style={styles.td}><span style={styles.campaignName}><span style={styles.campaignIcon}><Send size={15} /></span><span><b>{c.subject || c.body.slice(0, 32) || '(empty)'}</b><small>{c.body.slice(0, 42)}...</small></span></span></td>
                     <td style={styles.td}><button style={styles.groupPill} onClick={() => g && onSelectGroup(g)}>👥 {g?.name ?? `#${c.groupId}`}<small style={styles.groupCount}>{g?.contactCount ?? c.totalCount} contacts</small></button></td>
                     <td style={styles.td}>{c.totalCount}</td>
                     <td style={styles.td}>{new Date(c.createdAt).toLocaleDateString()}<small style={styles.subText}>{new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</small></td>
                     <td style={styles.td}><span style={styles.status}><CheckCircle2 size={14} /> Completed</span></td>
                     <td style={styles.td}><button style={styles.viewButton} onClick={() => onOpenCampaign(c.id)}><Eye size={14} /> View</button><button style={styles.moreButton}><MoreVertical size={16} /></button></td>
                  </tr>
                })}</tbody>
          </table>
          <div style={styles.pagination}><span>Showing 1 to {Math.min(5, filteredCampaigns.length)} of {filteredCampaigns.length} campaigns</span><span>‹ <b>1</b> 2 3 ›</span></div>
        </div>
        </>
      )}
    </div>
  )
}

function Summary({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return <div style={{ ...styles.summaryCard, background: `var(--outbox-${tone}-bg)` }}><span style={{ ...styles.summaryIcon, color: `var(--outbox-${tone})` }}>{icon}</span><span><small>{label}</small><strong>{value}</strong><em>↑ 18% <i>vs. last month</i></em></span></div>
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    maxWidth: 1280,
    margin: '0 auto',
    padding: '10px 24px 24px',
    display: 'flex',
    flexDirection: 'column',
  },
  heading: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  backButton: { display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content', padding: '8px 13px', marginBottom: 8, color: 'var(--color-primary)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600, transition: 'background 0.15s, border-color 0.15s, transform 0.15s' },
  title: { margin: 0, fontSize: 28, color: 'var(--color-text)' },
  controls: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' },
  controlButton: { ...btnSecondary, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 13px', whiteSpace: 'nowrap' },
  filterControl: { ...btnSecondary, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 40, whiteSpace: 'nowrap', cursor: 'pointer' },
  filterLabel: { color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 },
  filterSelect: { border: 0, outline: 0, appearance: 'none', background: 'transparent', font: 'inherit', cursor: 'pointer', minWidth: 104 },
  search: { display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', color: 'var(--color-text-muted)' },
  searchInput: { border: 0, outline: 0, background: 'transparent', color: 'var(--color-text)', width: 190 },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 },
  summaryCard: { display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', minHeight: 76, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' },
  summaryIcon: { width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: '50%' },
  tableCard: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'auto', boxShadow: 'var(--shadow-sm)' },
  table: { width: '100%', minWidth: 900, borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px 16px', color: 'var(--color-text-muted)', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' },
  td: { padding: '13px 16px', borderBottom: '1px solid var(--color-border)', fontSize: 13, whiteSpace: 'nowrap' },
  campaignName: { display: 'flex', alignItems: 'center', gap: 12 },
  campaignIcon: { width: 38, height: 38, display: 'grid', placeItems: 'center', color: '#38bdf8', background: '#dbeafe', borderRadius: '50%' },
  subText: { display: 'block', color: 'var(--color-text-muted)', fontSize: 11, marginTop: 3 },
  groupPill: { display: 'inline-flex', alignItems: 'center', gap: 7, border: 0, borderRadius: 999, padding: '5px 9px', background: 'var(--color-success-bg)', color: 'var(--color-success-text)', fontSize: 12 },
  groupCount: { opacity: 0.75, fontSize: 10 },
  status: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 999, color: 'var(--color-success-text)', background: 'var(--color-success-bg)', fontSize: 12, fontWeight: 600 },
  viewButton: { ...btnSecondary, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', fontSize: 12 },
  moreButton: { ...btnSecondary, padding: 7, marginLeft: 8 },
  pagination: { display: 'flex', justifyContent: 'space-between', padding: '14px 16px', color: 'var(--color-text-muted)', fontSize: 12 },
  campaignList: {
    minHeight: 0,
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '2px 4px 12px 0',
  },
  channelSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  channelCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '14px 16px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  channelIcon: {
    fontSize: 28,
  },
  channelCardText: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: 2,
  },
  channelHeading: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--color-text)',
  },
  channelDescription: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
  },
  channelCount: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 22,
    height: 22,
    padding: '0 6px',
    borderRadius: 999,
    background: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    fontSize: 11,
  },
  channelAction: {
    color: 'var(--color-primary)',
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  channelList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
}