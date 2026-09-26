import { useEffect, useRef, useState } from 'react'
import {
  Megaphone,
  Send,
  Inbox,
  Ban,
  Wrench,
  UserCog,
  User,
  ChevronDown,
  LogOut,
  Settings,
  Users,
  LayoutDashboard,
  Moon,
  Sun,
} from 'lucide-react'
import { btnPrimary } from '../src/styles/theme'
import { useToast } from './useToast '

export type Page =
  | 'dashboard'
  | 'groups'
  | 'outbox'
  | 'inbox'
  | 'blacklist'
  | 'settings'
  | 'admin'

interface HeaderProps {
  userName?: string
  currentPage: Page
  onNavigate: (page: Page) => void
  onHome: () => void
  onCreateGroup: () => void
  onSendBulkSms: () => void
  canSend: boolean
  isAdmin?: boolean
  onLogout?: () => void | Promise<void>
}

interface MenuItemDef {
  label: string
  icon: React.ReactNode
  onClick?: () => void
  divider?: boolean
  active?: boolean
  disabled?: boolean
}

export function Header({
  userName = 'MK sms',
  currentPage,
  onNavigate,
  onHome,
  onCreateGroup,
  onSendBulkSms,
  canSend,
  isAdmin = false,
  onLogout,
}: HeaderProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('bulk-messaging-theme') === 'dark',
  )
  const navRef = useRef<HTMLElement>(null)
  const toast = useToast()

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    localStorage.setItem('bulk-messaging-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function toggle(name: string) {
    setOpenMenu(prev => (prev === name ? null : name))
  }

  function go(page: Page) {
    setOpenMenu(null)
    onNavigate(page)
  }

  function handleSendBulkSms() {
    setOpenMenu(null)
    if (!canSend) {
      toast.info('Select a group first, then click Send Bulk SMS.')
      return
    }
    onSendBulkSms()
  }

  return (
    <header style={styles.header} ref={navRef}>
      {/* Brand */}
      <div style={styles.brand}>
        <div style={styles.logoCircle}>
          <Megaphone size={20} color="white" />
        </div>
        <div>
          <div style={styles.brandName}>Bulk Messaging</div>
          <div style={styles.brandTag}>by {userName}</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={styles.nav}>
        <NavButton
          icon={<LayoutDashboard size={16} />}
          label="Dashboard"
          active={currentPage === 'dashboard'}
          onClick={() => {
            setOpenMenu(null)
            onHome()
          }}
        />

        <NavDropdown
          icon={<Megaphone size={16} />}
          label="Bulk SMS"
          open={openMenu === 'sms'}
          onToggle={() => toggle('sms')}
          items={[
            {
              label: 'Send Bulk SMS',
              icon: <Send size={15} />,
              onClick: handleSendBulkSms,
            },
            {
              label: 'Bulk SMS Groups',
              icon: <Users size={15} />,
              onClick: () => go('groups'),
              active: currentPage === 'groups',
            },
            {
              label: 'Bulk SMS Outbox',
              icon: <Send size={15} />,
              onClick: () => go('outbox'),
              active: currentPage === 'outbox',
            },
          ]}
        />

        <NavButton
          icon={<Inbox size={16} />}
          label="Inbox"
          active={currentPage === 'inbox'}
          onClick={() => go('inbox')}
        />

        <NavButton
          icon={<Ban size={16} />}
          label="Black List"
          active={currentPage === 'blacklist'}
          onClick={() => go('blacklist')}
        />

        <NavDropdown
          icon={<Wrench size={16} />}
          label="Settings"
          open={openMenu === 'settings'}
          onToggle={() => toggle('settings')}
          items={[
            {
              label: 'General',
              icon: <Settings size={15} />,
              onClick: () => go('settings'),
            },
            {
              label: 'Senders',
              icon: <User size={15} />,
            },
          ]}
        />

        {isAdmin && <NavDropdown
          icon={<UserCog size={16} />}
          label="Administration"
          open={openMenu === 'admin'}
          onToggle={() => toggle('admin')}
          items={[
            {
              label: 'Users',
              icon: <User size={15} />,
              onClick: () => go('admin'),
            },
            {
              label: 'Roles',
              icon: <UserCog size={15} />,
            },
          ]}
        />}
      </nav>

      {/* Right side */}
      <div style={styles.right}>
        <button
          type="button"
          style={styles.themeButton}
          onClick={() => setDarkMode(value => !value)}
          aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
          title={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button style={btnPrimary} onClick={onCreateGroup}>
          + New Group
        </button>

        <NavDropdown
          icon={<User size={16} />}
          label={userName}
          open={openMenu === 'account'}
          onToggle={() => toggle('account')}
          align="right"
          items={[
            { label: 'Profile', icon: <User size={15} /> },
            { label: 'Settings', icon: <Settings size={15} /> },
            { label: '', icon: <></>, divider: true },
            { label: 'Log out', icon: <LogOut size={15} />, onClick: onLogout },
          ]}
        />
      </div>
    </header>
  )
}

// ---------- Sub-components ----------

function NavButton({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      style={{
        ...styles.navButton,
        background: active
          ? 'var(--color-selected-bg)'
          : 'var(--header-nav-bg)',
        color: active ? 'var(--color-on-primary)' : 'var(--color-text)',
        fontWeight: active ? 600 : 400,
      }}
      className={`header-nav-button${active ? ' is-active' : ''}`}
      onClick={onClick}
    >
      <span
        style={{
          ...styles.navIcon,
          color: active ? 'var(--color-on-primary)' : undefined,
        }}
      >
        {icon}
      </span>
      <span>{label}</span>
    </button>
  )
}

function NavDropdown({
  icon,
  label,
  open,
  onToggle,
  items,
  align = 'left',
}: {
  icon: React.ReactNode
  label: string
  open: boolean
  onToggle: () => void
  items: MenuItemDef[]
  align?: 'left' | 'right'
}) {
  const hasActive = items.some(i => i.active)

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        style={{
          ...styles.navButton,
          background: open || hasActive
            ? 'var(--color-selected-bg)'
            : 'var(--header-nav-bg)',
          color: open || hasActive
            ? 'var(--color-on-primary)'
            : 'var(--color-text)',
          fontWeight: hasActive ? 600 : 400,
        }}
        className={`header-nav-button${open || hasActive ? ' is-active' : ''}`}
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span
          style={{
            ...styles.navIcon,
            color:
              open || hasActive ? 'var(--color-on-primary)' : undefined,
          }}
        >
          {icon}
        </span>
        <span>{label}</span>
        <ChevronDown
          size={14}
          style={{
            marginLeft: 2,
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.15s',
          }}
        />
      </button>

      {open && (
        <div
          style={{
            ...styles.dropdown,
            [align === 'right' ? 'right' : 'left']: 0,
          }}
        >
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} style={styles.divider} />
            ) : (
              <button
                key={i}
                type="button"
                style={{
                  ...styles.dropdownItem,
                  background: item.active
                    ? 'var(--color-selected-bg)'
                    : 'transparent',
                  color: item.active
                    ? 'var(--color-on-primary)'
                    : 'var(--color-text)',
                  opacity: item.disabled ? 0.5 : 1,
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                }}
                className={`header-dropdown-item${item.active ? ' is-active' : ''}`}
                disabled={item.disabled}
                onClick={() => {
                  item.onClick?.()
                  onToggle()
                }}
                onMouseEnter={e => {
                  if (!item.active)
                    e.currentTarget.style.background =
                      'var(--header-hover-bg)'
                }}
                onMouseLeave={e => {
                  if (!item.active)
                    e.currentTarget.style.background = 'transparent'
                }}
              >
                <span style={styles.dropdownIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}

// ---------- Styles ----------

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    background: 'var(--header-bg)',
    borderBottom: '1px solid var(--color-border)',
    flexShrink: 0,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    paddingRight: 12,
    borderRight: '1px solid var(--color-border)',
    flexShrink: 0,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981 0%, #4f46e5 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.35)',
    flexShrink: 0,
  },
  brandName: { fontSize: 14, fontWeight: 700, lineHeight: 1.1 },
  brandTag: {
    fontSize: 11,
    color: 'var(--color-text-muted)',
    lineHeight: 1.1,
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    flex: 1,
    minWidth: 0,
    overflow: 'visible',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    fontSize: 13,
    color: 'var(--color-text)',
    borderRadius: 6,
    background: 'var(--header-nav-bg)',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  navIcon: {
    color: 'var(--color-text-muted)',
    display: 'flex',
    alignItems: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    minWidth: 220,
    background: 'var(--header-dropdown-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
    padding: 6,
    zIndex: 1000,
    animation: 'fadeIn 0.12s ease',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '8px 10px',
    fontSize: 13,
    background: 'transparent',
    border: 'none',
    borderRadius: 5,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.1s',
  },
  dropdownIcon: {
    color: 'var(--color-text-muted)',
    display: 'flex',
    alignItems: 'center',
    width: 16,
  },
  divider: {
    height: 1,
    background: 'var(--color-border)',
    margin: '4px 0',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 12,
    borderLeft: '1px solid var(--color-border)',
    flexShrink: 0,
  },
  themeButton: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--color-border)',
    borderRadius: '50%',
    color: 'var(--color-text-muted)',
    background: 'var(--color-surface)',
  },
}