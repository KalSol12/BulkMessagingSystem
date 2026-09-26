import { useEffect, useState } from 'react'
import { dashboardApi } from '../api'
import type { DashboardStats } from '../api'
import { StatCard } from './StatCard'
import { Spinner } from '../../components/Spinner'
import { BarChart3, CalendarDays, ChevronDown, Plus, Send, Users } from 'lucide-react'

function formatActivityDate(value: string) {
  return new Date(value).toLocaleString()
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      setLoading(true)
      const data = await dashboardApi.stats()
      setStats(data)
    } catch (e) {
      console.error('Failed to load stats:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Spinner size={32} />
      </div>
    )
  }

  const recentActivity = stats.recentActivity ?? []
  const today = new Date()
  const dateLabel = today.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>
            Welcome back, MK SMS! Here&apos;s an overview of your bulk messaging activity.
          </p>
        </div>
        <div style={styles.date}>
          <CalendarDays size={15} />
          {dateLabel}
          <span>•</span>
          {today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      {/* Subscribers Section */}
      <section>
        <h2 style={styles.sectionTitle}>Subscribers</h2>
        <div style={styles.gridFour} className="dashboard-stat-grid-four">
          <StatCard
            value={stats.subscribers.total}
            label="Total Subscribers"
            color="green"
          />
          <StatCard
            value={stats.subscribers.thisMonth}
            label="This Month"
            color="pink"
          />
          <StatCard
            value={stats.subscribers.thisWeek}
            label="This Week"
            color="green"
          />
          <StatCard
            value={stats.subscribers.today}
            label="Today"
            color="pink"
          />
        </div>
      </section>

      {/* Message Reports Section */}
      <section style={{ marginTop: 40 }}>
        <h2 style={styles.sectionTitle}>Message Reports</h2>
        <div style={styles.gridFive} className="dashboard-stat-grid-five">
          <StatCard
            value={stats.messages.total}
            label="Total Messages"
            color="green"
          />
          <StatCard
            value={stats.messages.sent}
            label="Sent"
            color="pink"
          />
          <StatCard
            value={stats.messages.thisMonth}
            label="Sent This Month"
            color="green"
          />
          <StatCard
            value={stats.messages.thisWeek}
            label="Sent This Week"
            color="pink"
          />
          <StatCard
            value={stats.messages.today}
            label="Sent Today"
            color="green"
          />
        </div>
      </section>

      <div style={styles.bottomGrid}>
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}><BarChart3 size={17} /> SMS Activity</h2>
            <button style={styles.periodButton}>Last 7 Days <ChevronDown size={14} /></button>
          </div>
          <div style={styles.chart}>
            {[40, 58, 49, 66, 46, 61, 42].map((height, index) => (
              <div key={index} style={styles.barColumn}>
                <div style={{ ...styles.bar, height: `${height}%` }} />
                <span>Sep {18 + index}</span>
              </div>
            ))}
          </div>
        </section>
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}><Send size={17} /> Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p style={styles.emptyText}>No recent activity.</p>
          ) : (
            <div style={styles.list}>
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div key={`${activity.type}-${activity.date}-${index}`} style={styles.listRow}>
                  <span style={styles.activityIcon}>{activity.type === 'campaign' ? '➤' : '👥'}</span>
                  <div style={styles.listContent}>
                    <strong>{activity.title}</strong>
                    <span style={styles.secondaryText}>{activity.detail}</span>
                  </div>
                  <span style={styles.activityDate}>{formatActivityDate(activity.date)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Quick Actions</h2>
          <div style={styles.quickActions}>
            <button style={styles.quickAction}><Users size={17} /> <span><strong>Create Group</strong><small>Add a new contact group</small></span><span>›</span></button>
            <button style={styles.quickAction}><Plus size={17} /> <span><strong>Add Contact</strong><small>Create a new contact</small></span><span>›</span></button>
            <button style={styles.quickAction}><Send size={17} /> <span><strong>Send SMS</strong><small>Start a new campaign</small></span><span>›</span></button>
          </div>
        </section>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '22px 24px 28px',
    maxWidth: 1500,
    margin: '0 auto',
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 16,
    marginBottom: 20,
    borderBottom: '1px solid var(--color-border)',
  },
  title: { margin: 0, fontSize: 26, fontWeight: 700 },
  subtitle: { margin: '6px 0 0', color: 'var(--color-text-muted)', fontSize: 13 },
  date: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--color-text-muted)',
    fontSize: 12,
  },
  sectionTitle: {
    margin: '0 0 16px',
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  gridFour: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
  },
  gridFive: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 16,
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 16,
    marginTop: 18,
  },
  panel: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 16,
    boxShadow: 'var(--shadow-sm)',
  },
  panelTitle: {
    margin: '0 0 14px',
    fontSize: 15,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  periodButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 9px',
    color: 'var(--color-text-muted)',
    background: 'var(--color-surface-muted)',
    border: '1px solid var(--color-border)',
    borderRadius: 6,
    fontSize: 11,
  },
  chart: {
    height: 190,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: 10,
    padding: '12px 8px 0',
    borderBottom: '1px solid var(--color-border)',
    background: 'repeating-linear-gradient(to bottom, transparent 0, transparent 46px, var(--color-border) 47px)',
  },
  barColumn: {
    height: '100%',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    color: 'var(--color-text-muted)',
    fontSize: 10,
  },
  bar: {
    width: '62%',
    minHeight: 12,
    borderRadius: '4px 4px 0 0',
    background: 'linear-gradient(180deg, var(--color-primary), #14b8a6)',
  },
  quickActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  quickAction: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '10px 11px',
    textAlign: 'left',
    color: 'var(--color-text)',
    background: 'var(--color-surface-muted)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
  },
  quickActionText: {
    display: 'flex',
    flexDirection: 'column',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  listRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minHeight: 42,
    paddingBottom: 10,
    borderBottom: '1px solid var(--color-border)',
  },
  rank: {
    width: 24,
    color: 'var(--color-primary)',
    fontWeight: 700,
  },
  activityIcon: {
    width: 24,
    textAlign: 'center',
  },
  listContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    minWidth: 0,
    flex: 1,
  },
  secondaryText: {
    color: 'var(--color-text-muted)',
    fontSize: 12,
  },
  metric: {
    color: 'var(--color-primary)',
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  activityDate: {
    color: 'var(--color-text-muted)',
    fontSize: 11,
    whiteSpace: 'nowrap',
  },
  emptyText: {
    color: 'var(--color-text-muted)',
    margin: 0,
  },
}