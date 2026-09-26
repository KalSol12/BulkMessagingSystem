import { useEffect, useState, type FormEvent } from 'react'
import axios from 'axios'
import { KeyRound, Plus, ShieldCheck, Users } from 'lucide-react'
import { authApi, setAccessToken } from '../api'
import type { AdminUser, AuthUser } from '../api'
import { btnPrimary, inputStyle, labelStyle } from '../styles/theme'

interface LoginProps {
  onLogin: (user: AuthUser) => void
}

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (typeof data === 'string') return data
    if (typeof data?.message === 'string') return data.message
    if (Array.isArray(data?.errors)) {
      return data.errors
        .map((item: unknown) =>
          typeof item === 'string'
            ? item
            : typeof item === 'object' && item !== null && 'description' in item
              ? String(item.description)
              : '',
        )
        .filter(Boolean)
        .join(' ')
    }
    return error.message
  }
  return error instanceof Error ? error.message : 'Unexpected error.'
}

export function LoginScreen({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await authApi.login(email.trim(), password)
      const { accessToken, ...user } = result
      setAccessToken(accessToken)
      onLogin(user)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main style={authStyles.page}>
      <form style={authStyles.card} onSubmit={submit}>
        <div style={authStyles.brandIcon}><KeyRound size={22} /></div>
        <h1 style={authStyles.title}>Sign in</h1>
        <p style={authStyles.muted}>Sign in to manage your bulk messaging workspace.</p>
        <label style={labelStyle} htmlFor="login-email">Email address</label>
        <input id="login-email" type="email" autoComplete="username" required style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} />
        <label style={labelStyle} htmlFor="login-password">Password</label>
        <input id="login-password" type="password" autoComplete="current-password" required style={inputStyle} value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div role="alert" style={authStyles.error}>{error}</div>}
        <button type="submit" style={{ ...btnPrimary, width: '100%', marginTop: 8 }} disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}

export function ChangePasswordScreen({ onChanged }: { onChanged: () => Promise<void> }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (newPassword !== confirmation) {
      setError('The new passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await authApi.changePassword(currentPassword, newPassword)
      await onChanged()
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main style={authStyles.page}>
      <form style={authStyles.card} onSubmit={submit}>
        <div style={authStyles.brandIcon}><KeyRound size={22} /></div>
        <h1 style={authStyles.title}>Set a new password</h1>
        <p style={authStyles.muted}>Change your temporary password before continuing.</p>
        <label style={labelStyle} htmlFor="current-password">Temporary password</label>
        <input id="current-password" type="password" autoComplete="current-password" required style={inputStyle} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
        <label style={labelStyle} htmlFor="new-password">New password</label>
        <input id="new-password" type="password" autoComplete="new-password" minLength={12} required style={inputStyle} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <label style={labelStyle} htmlFor="confirm-password">Confirm new password</label>
        <input id="confirm-password" type="password" autoComplete="new-password" minLength={12} required style={inputStyle} value={confirmation} onChange={e => setConfirmation(e.target.value)} />
        {error && <div role="alert" style={authStyles.error}>{error}</div>}
        <button type="submit" style={{ ...btnPrimary, width: '100%', marginTop: 8 }} disabled={busy}>
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </main>
  )
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadUsers() {
    setLoading(true)
    try {
      setUsers(await authApi.listUsers())
      setError('')
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  async function createUser(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const created = await authApi.createUser({
        email: email.trim(),
        displayName: displayName.trim(),
        temporaryPassword,
      })
      setUsers(current => [...current, created])
      setDisplayName('')
      setEmail('')
      setTemporaryPassword('')
      setNotice(`Account created for ${created.email}. Share its temporary password securely.`)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main style={authStyles.adminPage}>
      <div>
        <h1 style={authStyles.title}>User administration</h1>
        <p style={authStyles.muted}>Create accounts for trusted team members.</p>
      </div>
      <form style={authStyles.adminCard} onSubmit={createUser}>
        <h2 style={authStyles.sectionTitle}><Plus size={18} /> Create user</h2>
        <label style={labelStyle} htmlFor="user-name">Display name</label>
        <input id="user-name" autoComplete="name" required style={inputStyle} value={displayName} onChange={e => setDisplayName(e.target.value)} />
        <label style={labelStyle} htmlFor="user-email">Email address</label>
        <input id="user-email" type="email" autoComplete="off" required style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} />
        <label style={labelStyle} htmlFor="temporary-password">Temporary password</label>
        <input id="temporary-password" type="password" autoComplete="new-password" minLength={12} required style={inputStyle} value={temporaryPassword} onChange={e => setTemporaryPassword(e.target.value)} />
        <p style={authStyles.hint}>Use at least 12 characters. The user should change it after their first sign-in.</p>
        {error && <div role="alert" style={authStyles.error}>{error}</div>}
        {notice && <div role="status" style={authStyles.success}>{notice}</div>}
        <button type="submit" style={btnPrimary} disabled={saving}>{saving ? 'Creating…' : 'Create account'}</button>
      </form>
      <section style={authStyles.adminCard}>
        <h2 style={authStyles.sectionTitle}><Users size={18} /> Existing users</h2>
        {loading ? <p style={authStyles.muted}>Loading users…</p> : users.length === 0 ? (
          <p style={authStyles.muted}>No accounts found.</p>
        ) : users.map(user => (
          <div key={user.id} style={authStyles.userRow}>
            <span style={authStyles.userIcon}><ShieldCheck size={17} /></span>
            <span style={authStyles.userText}><strong>{user.displayName}</strong><small>{user.email}</small></span>
            <span style={authStyles.role}>{user.isAdmin ? 'Admin' : 'User'}</span>
          </div>
        ))}
      </section>
    </main>
  )
}

const authStyles: Record<string, React.CSSProperties> = {
  page: { minHeight: 0, flex: 1, display: 'grid', placeItems: 'center', padding: 24, background: 'var(--color-bg)' },
  card: { display: 'flex', flexDirection: 'column', gap: 10, width: 'min(100%, 420px)', padding: 28, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' },
  brandIcon: { width: 46, height: 46, display: 'grid', placeItems: 'center', borderRadius: 14, background: 'var(--color-success-bg)', color: 'var(--color-primary)' },
  title: { margin: 0, color: 'var(--color-text)', fontSize: 25 },
  muted: { margin: '0 0 12px', color: 'var(--color-text-muted)' },
  error: { padding: 10, borderRadius: 8, background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', fontSize: 13 },
  success: { padding: 10, borderRadius: 8, background: 'var(--color-success-bg)', color: 'var(--color-success-text)', fontSize: 13 },
  adminPage: { flex: 1, minHeight: 0, overflowY: 'auto', padding: 24, display: 'grid', alignContent: 'start', gap: 18, gridTemplateColumns: 'minmax(280px, 380px) minmax(320px, 1fr)' },
  adminCard: { display: 'flex', flexDirection: 'column', gap: 10, padding: 20, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 8px', fontSize: 16, color: 'var(--color-text)' },
  hint: { margin: '-4px 0 4px', color: 'var(--color-text-muted)', fontSize: 12 },
  userRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--color-border)' },
  userIcon: { width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: '50%', background: 'var(--color-success-bg)', color: 'var(--color-primary)' },
  userText: { display: 'flex', flexDirection: 'column', gap: 3, flex: 1, color: 'var(--color-text)' },
  role: { padding: '4px 8px', borderRadius: 999, background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', fontSize: 11 },
}
