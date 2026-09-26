import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpDown, CalendarDays, ChevronDown, Download, Eye, FileText, Pencil, Phone, Plus, Search, SlidersHorizontal, Trash2, Users, Mail } from 'lucide-react'
import { authApi, groupsApi, contactsApi, campaignsApi, setAccessToken } from './api'
import type { AuthUser, Group, Contact, ImportResult } from './api'
import { GroupFormModal } from '../components/GroupFormModal'
import { ContactFormModal } from '../components/ContactFormModal'
import { ConfirmModal } from '../components/ConfirmModal'
import { ImportResultModal } from './components/ImportResultModal'
import { DropZone } from './components/DropZone'
import { InlineSpinner, Spinner } from '../components/Spinner'
import { SkeletonTable } from './components/SkeletonTable'
import { useToast } from '../components/useToast '
import { CampaignFormModal } from '../components/CampaignFormModal'
import { CampaignDetailModal } from '../components/CampaignDetailModal'
import { Header } from '../components/Header'
import { OutboxView } from '../components/OutboxView'
import { Dashboard } from './components/Dashboard'
import { AdminUsers, ChangePasswordScreen, LoginScreen } from './components/AuthScreens'
import { btnPrimary, btnSecondary, btnGhost } from './styles/theme'

type Page =
  | 'dashboard'
  | 'groups'
  | 'outbox'
  | 'inbox'
  | 'blacklist'
  | 'settings'
  | 'admin'

function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [checkedGroupId, setCheckedGroupId] = useState<number | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Navigation
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  // Modal state
  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  // Confirm dialog
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    message: string
    confirmText?: string
    onConfirm: () => Promise<void> | void
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })
  const [confirmLoading, setConfirmLoading] = useState(false)

  // Import result
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importFileName, setImportFileName] = useState('')
  const [importModalOpen, setImportModalOpen] = useState(false)

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [groupSearch, setGroupSearch] = useState('')

  // Campaigns
  const [campaignModalOpen, setCampaignModalOpen] = useState(false)
  const [sendCampaignImmediately, setSendCampaignImmediately] = useState(false)
  const [campaignDetailId, setCampaignDetailId] = useState<number | null>(null)
  const [campaignDetailOpen, setCampaignDetailOpen] = useState(false)

  const toast = useToast()

  useEffect(() => {
    const token = sessionStorage.getItem('bulk-messaging-access-token')
    if (!token) {
      setAuthLoading(false)
      return
    }

    authApi.me()
      .then(setAuthUser)
      .catch(() => setAccessToken(null))
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => setAuthUser(null)
    window.addEventListener('bulk-messaging-unauthorized', handleUnauthorized)
    return () => window.removeEventListener('bulk-messaging-unauthorized', handleUnauthorized)
  }, [])

  // Load groups after authentication
  useEffect(() => {
    if (authUser) void loadGroups()
  }, [authUser])

  // Load contacts when selection changes
  useEffect(() => {
    if (!selectedGroup) return
    setSearchQuery('')
    loadContacts(selectedGroup.id)
  }, [selectedGroup])

  async function loadGroups() {
    try {
      setLoading(true)
      const data = await groupsApi.list()
      setGroups(data)
      setError(null)
    } catch (e: any) {
      setError('Failed to load groups: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadContacts(groupId: number) {
    try {
      setLoadingContacts(true)
      const data = await contactsApi.listByGroup(groupId)
      setContacts(data)
    } catch (e: any) {
      setError('Failed to load contacts: ' + e.message)
    } finally {
      setLoadingContacts(false)
    }
  }

  // ---------- Derived data ----------

  const filteredGroups = groups.filter(g => {
    if (!groupSearch.trim()) return true
    const q = groupSearch.trim().toLowerCase()
    return (
      g.name.toLowerCase().includes(q) ||
      (g.description?.toLowerCase().includes(q) ?? false)
    )
  })

  const filteredContacts = contacts.filter(c => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.trim().toLowerCase()
    return (
      (c.name?.toLowerCase().includes(q) ?? false) ||
      c.phone.toLowerCase().includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false) ||
      (c.notes?.toLowerCase().includes(q) ?? false)
    )
  })

  // ---------- Navigation ----------

  function handleNavigate(page: Page) {
    setCurrentPage(page)
    if (page === 'groups') {
      setSelectedGroup(null)
      setContacts([])
      setCheckedGroupId(null)
    }
  }

  // ---------- Groups ----------

  async function handleGroupSubmit(name: string, description: string) {
    if (editingGroup) {
      await groupsApi.update(editingGroup.id, name, description)
      await loadGroups()
      if (selectedGroup?.id === editingGroup.id) {
        setSelectedGroup({ ...selectedGroup, name, description })
      }
      toast.success('Group updated')
    } else {
      const g = await groupsApi.create(name, description)
      setGroups(prev => [g, ...prev])
      setSelectedGroup(g)
      setContacts([])
      setCurrentPage('groups')
      toast.success(`Group "${g.name}" created`)
    }
  }

  function handleDeleteGroup(g: Group) {
    setConfirmState({
      open: true,
      title: 'Delete group?',
      message: `Are you sure you want to delete "${g.name}"? All its contacts will also be removed. This cannot be undone.`,
      confirmText: 'Delete group',
      onConfirm: async () => {
        try {
          setConfirmLoading(true)
          await groupsApi.delete(g.id)
          setGroups(prev => prev.filter(x => x.id !== g.id))
          if (selectedGroup?.id === g.id) {
            setSelectedGroup(null)
            setContacts([])
          }
          toast.success(`Group "${g.name}" deleted`)
          setConfirmState(s => ({ ...s, open: false }))
        } catch (e: any) {
          toast.error('Failed to delete: ' + e.message)
        } finally {
          setConfirmLoading(false)
        }
      },
    })
  }

  // ---------- Contacts ----------

  async function handleContactSubmit(data: {
    name: string
    phone: string
    email: string
    notes: string
  }) {
    if (!selectedGroup) return

    if (editingContact) {
      await contactsApi.update(editingContact.id, data)
      await loadContacts(selectedGroup.id)
      toast.success('Contact updated')
    } else {
      const c = await contactsApi.create(selectedGroup.id, data)
      setContacts(prev => [c, ...prev])
      toast.success(`Contact "${c.name}" added`)
    }
  }

  function handleDeleteContact(c: Contact) {
    setConfirmState({
      open: true,
      title: 'Delete contact?',
      message: `Are you sure you want to delete "${c.name || c.phone}"? This cannot be undone.`,
      confirmText: 'Delete contact',
      onConfirm: async () => {
        try {
          setConfirmLoading(true)
          await contactsApi.delete(c.id)
          setContacts(prev => prev.filter(x => x.id !== c.id))
          toast.success(`Contact "${c.name || c.phone}" deleted`)
          setConfirmState(s => ({ ...s, open: false }))
        } catch (e: any) {
          toast.error('Failed to delete: ' + e.message)
        } finally {
          setConfirmLoading(false)
        }
      },
    })
  }

  // ---------- Import ----------

  function handleImportClick() {
    if (!selectedGroup) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) importFile(file)
    }
    input.click()
  }

  function handleExportContacts() {
    if (!selectedGroup || contacts.length === 0) {
      toast.info('There are no contacts to export in this group.')
      return
    }

    const escapeCsv = (value: string | null | undefined) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`
    const rows = [
      ['Name', 'Phone', 'Email', 'Notes'],
      ...contacts.map(contact => [
        contact.name,
        contact.phone,
        contact.email,
        contact.notes,
      ]),
    ]
    const csv = rows.map(row => row.map(escapeCsv).join(',')).join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedGroup.name.replace(/[^\w.-]+/g, '_')}-contacts.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${contacts.length} contacts`)
  }

  async function importFile(file: File) {
    if (!selectedGroup) return

    try {
      setImporting(true)
      const result = await contactsApi.importFile(selectedGroup.id, file)

      setImportResult(result)
      setImportFileName(file.name)
      setImportModalOpen(true)

      if (result.imported > 0) {
        toast.success(
          `Imported ${result.imported} of ${result.totalRows} contacts`,
        )
      }
      if (result.failed > 0) {
        toast.warning(`${result.failed} rows failed`, 6000)
      }
      if (result.imported === 0 && result.failed === 0) {
        toast.info('File contained no contacts')
      }

      await loadContacts(selectedGroup.id)
      await loadGroups()
    } catch (e: any) {
      const msg =
        typeof e.response?.data === 'string'
          ? e.response.data
          : e.response?.data?.message || e.message
      toast.error('Import failed: ' + msg)
    } finally {
      setImporting(false)
    }
  }

  // ---------- Campaigns ----------

  async function handleCreateCampaign(data: {
    channel: 0 | 1
    subject?: string
    body: string
  }) {
    if (!selectedGroup) return
    const campaign = await campaignsApi.create(selectedGroup.id, data)
    if (sendCampaignImmediately) {
      const sentCampaign = await campaignsApi.send(campaign.id)
      toast.success(
        `Sent ${sentCampaign.sentCount} of ${sentCampaign.totalCount} messages`,
      )
    } else {
      toast.success('Campaign draft created')
    }
  }

  async function openSendCampaign(group: Group) {
    await loadContacts(group.id)
    setSelectedGroup(group)
    setSendCampaignImmediately(true)
    setCampaignModalOpen(true)
  }

  async function handleLogout() {
    let revocationFailed = false
    try {
      await authApi.logout()
    } catch {
      revocationFailed = true
    } finally {
      setAccessToken(null)
      setAuthUser(null)
      setSelectedGroup(null)
      setContacts([])
      setGroups([])
      setCurrentPage('dashboard')
    }
    if (revocationFailed) {
      toast.warning(
        'Signed out locally, but server token revocation failed. The token may remain valid until it expires.',
      )
    }
  }

  // ---------- Render ----------

  if (authLoading) {
    return (
      <div style={pageColumn}>
        <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
          <Spinner size={32} />
        </div>
      </div>
    )
  }

  if (!authUser) {
    return <LoginScreen onLogin={setAuthUser} />
  }

  if (authUser.mustChangePassword) {
    return (
      <ChangePasswordScreen
        onChanged={async () => {
          setAccessToken(null)
          setAuthUser(null)
        }}
      />
    )
  }

  return (
    <div style={pageColumn}>
      <Header
        userName={authUser.displayName}
        isAdmin={authUser.isAdmin}
        onLogout={handleLogout}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onHome={() => {
          setSelectedGroup(null)
          setCurrentPage('dashboard')
        }}
        onCreateGroup={() => {
          setEditingGroup(null)
          setGroupModalOpen(true)
        }}
        onSendBulkSms={() => {
          const checkedGroup = groups.find(group => group.id === checkedGroupId)
          if (!checkedGroup) return
          void openSendCampaign(checkedGroup)
        }}
        canSend={checkedGroupId !== null}
      />

      <div style={layout}>
        {/* Sidebar — only visible on Groups page */}
        {currentPage === 'groups' && false && (
          <aside style={sidebar}>
            <button
              style={btnPrimary}
              onClick={() => {
                setEditingGroup(null)
                setGroupModalOpen(true)
              }}
            >
              + New Group
            </button>

            {groups.length > 0 && (
              <div style={sidebarSearch}>
                <span style={searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={groupSearch}
                  onChange={e => setGroupSearch(e.target.value)}
                  style={searchInput}
                />
                {groupSearch && (
                  <button
                    style={clearButton}
                    onClick={() => setGroupSearch('')}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            <div style={groupList}>
              {loading && (
                <div style={{ padding: '10px 12px' }}>
                  <InlineSpinner label="Loading groups..." />
                </div>
              )}

              {filteredGroups.map(g => {
                const isSelected = selectedGroup?.id === g.id
                return (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGroup(g)}
                    style={{
                      ...groupItem,
                      background: isSelected
                        ? 'var(--color-primary)'
                        : 'transparent',
                      color: isSelected ? 'white' : 'var(--color-text)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {g.name}
                      </div>
                      {g.description && (
                        <div
                          style={{
                            fontSize: 12,
                            opacity: 0.75,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {g.description}
                        </div>
                      )}
                    </div>

                    {typeof g.contactCount === 'number' && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 20,
                          background: isSelected
                            ? 'rgba(255,255,255,0.25)'
                            : '#f3f4f6',
                          color: isSelected
                            ? 'white'
                            : 'var(--color-text-muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {g.contactCount}
                      </span>
                    )}

                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleDeleteGroup(g)
                      }}
                      style={{
                        ...btnGhost,
                        color: isSelected
                          ? 'white'
                          : 'var(--color-text-muted)',
                      }}
                      title="Delete group"
                    >
                      🗑
                    </button>
                  </div>
                )
              })}

              {groupSearch &&
                filteredGroups.length === 0 &&
                groups.length > 0 && (
                  <div style={{ padding: '20px 12px', textAlign: 'center' }}>
                    <div style={muted}>No groups match "{groupSearch}"</div>
                    <button
                      style={{
                        ...btnSecondary,
                        padding: '6px 12px',
                        fontSize: 13,
                        marginTop: 10,
                      }}
                      onClick={() => setGroupSearch('')}
                    >
                      Clear search
                    </button>
                  </div>
                )}

              {!loading && groups.length === 0 && (
                <div style={muted}>No groups yet. Create one!</div>
              )}
            </div>

            {groupSearch && (
              <div
                style={{
                  padding: '10px 4px 0',
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                  borderTop: '1px solid var(--color-border)',
                  marginTop: 8,
                }}
              >
                Showing {filteredGroups.length} of {groups.length} groups
              </div>
            )}
          </aside>
        )}

        {/* Main content area */}
        {currentPage === 'groups' && !selectedGroup ? (
          <GroupsHome
            groups={filteredGroups}
            search={groupSearch}
            onSearch={setGroupSearch}
            onSelect={setSelectedGroup}
            checkedGroupId={checkedGroupId}
            onCheck={setCheckedGroupId}
            canSend={checkedGroupId !== null}
            onSend={() => {
              const checkedGroup = groups.find(
                group => group.id === checkedGroupId,
              )
              if (!checkedGroup) return
              void openSendCampaign(checkedGroup)
            }}
            onEdit={group => {
              setEditingGroup(group)
              setGroupModalOpen(true)
            }}
            onDelete={handleDeleteGroup}
            onCreate={() => {
              setEditingGroup(null)
              setGroupModalOpen(true)
            }}
          />
        ) : currentPage === 'dashboard' ? (
          <Dashboard />
        ) : currentPage === 'outbox' ? (
          <OutboxView
            onBack={() => setCurrentPage('dashboard')}
            onOpenCampaign={id => {
              setCampaignDetailId(id)
              setCampaignDetailOpen(true)
            }}
            onSelectGroup={g => {
              setSelectedGroup(g)
              setCurrentPage('groups')
            }}
          />
        ) : currentPage === 'inbox' ? (
          <PlaceholderPage
            icon="📥"
            title="Inbox"
            message="Inbox coming soon."
          />
        ) : currentPage === 'blacklist' ? (
          <PlaceholderPage
            icon="🚫"
            title="Black List"
            message="Manage contacts who have opted out of receiving messages."
          />
        ) : currentPage === 'settings' ? (
          <PlaceholderPage
            icon="⚙️"
            title="Settings"
            message="Settings coming soon."
          />
        ) : currentPage === 'admin' ? (
          authUser.isAdmin ? (
            <AdminUsers />
          ) : (
            <PlaceholderPage icon="🔒" title="Access denied" message="Administrator access is required." />
          )
        ) : (
          <DropZone enabled={!!selectedGroup} onFileDropped={importFile}>
            <main style={contactMain}>
              {!selectedGroup ? (
                <div style={empty}>
                  <div style={{ fontSize: 64, marginBottom: 12 }}>📨</div>
                  <h2 style={{ margin: '0 0 8px' }}>
                    Welcome to Bulk Messaging
                  </h2>
                  <p
                    style={{
                      margin: '0 0 24px',
                      textAlign: 'center',
                      maxWidth: 360,
                    }}
                  >
                    Select a group from the sidebar, or create your first one
                    to start importing contacts.
                  </p>
                  <button
                    style={btnPrimary}
                    onClick={() => {
                      setEditingGroup(null)
                      setGroupModalOpen(true)
                    }}
                  >
                    + Create your first group
                  </button>
                </div>
              ) : (
                <>
                  <div style={contactToolbar}>
                    <header style={contactHeader}>
                      <div style={groupHeaderTitle}>
                        <button
                          type="button"
                          style={backToGroupsButton}
                          className="back-button"
                          onClick={() => {
                            setSelectedGroup(null)
                            setContacts([])
                            setCheckedGroupId(null)
                          }}
                        >
                          <ArrowLeft size={16} /> <span>Back</span>
                        </button>
                        <div>
                          <h2 style={{ margin: 0, fontSize: 26 }}>{selectedGroup.name}</h2>
                          <div style={muted}>
                            {selectedGroup.description || 'No description'} ·{' '}
                            {searchQuery ? (
                              <>
                                <strong>{filteredContacts.length}</strong> of{' '}
                                {contacts.length} contacts
                              </>
                            ) : (
                              <>{contacts.length} contacts</>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={contactActions}>
                        <button
                          style={contactSecondaryButton}
                          onClick={() => {
                            setEditingGroup(selectedGroup)
                            setGroupModalOpen(true)
                          }}
                        >
                          <Pencil size={15} /> Edit group
                        </button>
                        <button
                          style={contactSecondaryButton}
                          onClick={() => {
                            setEditingContact(null)
                            setContactModalOpen(true)
                          }}
                        >
                          <Plus size={16} /> Contact
                        </button>
                        <button
                          style={contactSecondaryButton}
                          onClick={handleExportContacts}
                        >
                          <Download size={16} /> Export
                        </button>
                        <button
                          style={{
                            ...btnPrimary,
                            padding: '10px 16px',
                            opacity: importing ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                          onClick={handleImportClick}
                          disabled={importing}
                        >
                          {importing ? (
                            <>
                              <Spinner size={14} color="white" />
                              Importing...
                            </>
                          ) : (
                            <><Download size={16} /> Import CSV/XLSX</>
                          )}
                        </button>
                      </div>
                    </header>

                    {!loadingContacts && (
                      <div style={contactSearchBar}>
                        <Search size={17} style={{ color: 'var(--color-text-muted)' }} />
                        <input
                          type="text"
                          placeholder="Search by name, phone, email, or notes..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          style={searchInput}
                        />
                        {searchQuery && (
                          <>
                            <span style={searchCount}>
                              {filteredContacts.length} of {contacts.length}
                            </span>
                            <button
                              style={clearButton}
                              onClick={() => setSearchQuery('')}
                              title="Clear search"
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {loadingContacts ? (
                    <SkeletonTable rows={6} cols={5} />
                  ) : (
                    <>
                      <div style={tableWrapper}>
                        <table style={table}>
                          <thead>
                            <tr>
                              <th style={th}>Name</th>
                              <th style={th}>Phone</th>
                              <th style={th}>Email</th>
                              <th style={th}>Notes</th>
                              <th style={{ ...th, width: 80 }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredContacts.map(c => (
                              <tr key={c.id} className="contact-row">
                                <td style={contactTd}><span style={contactNameCell}><span style={contactAvatar}>{(c.name || c.phone || '?').charAt(0).toUpperCase()}</span>{c.name || '—'}</span></td>
                                <td style={contactTd}><span style={contactValue}><Phone size={15} />{c.phone}</span></td>
                                <td style={contactTd}><span style={contactValue}><Mail size={15} />{c.email || '—'}</span></td>
                                <td style={contactTd}><span style={contactValue}><FileText size={15} />{c.notes || '—'}</span></td>
                                <td style={contactTd}>
                                  <button
                                    style={contactEditButton}
                                    onClick={() => {
                                      setEditingContact(c)
                                      setContactModalOpen(true)
                                    }}
                                    title="Edit contact"
                                  >
                                    <Pencil size={16} />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    style={contactDeleteButton}
                                    onClick={() => handleDeleteContact(c)}
                                    title="Delete contact"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}

                            {filteredContacts.length === 0 &&
                              contacts.length > 0 && (
                                <tr>
                                  <td
                                    colSpan={5}
                                    style={{
                                      ...td,
                                      textAlign: 'center',
                                      padding: 40,
                                    }}
                                  >
                                    <div style={muted}>
                                      No contacts match "
                                      <strong>{searchQuery}</strong>"
                                      <div style={{ marginTop: 8 }}>
                                        <button
                                          style={{
                                            ...btnSecondary,
                                            padding: '6px 12px',
                                            fontSize: 13,
                                          }}
                                          onClick={() => setSearchQuery('')}
                                        >
                                          Clear search
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}

                            {contacts.length === 0 && !loadingContacts && (
                              <tr>
                                <td
                                  colSpan={5}
                                  style={{
                                    ...td,
                                    textAlign: 'center',
                                    padding: 40,
                                  }}
                                >
                                  <div style={muted}>
                                    No contacts yet. Add one or import a file.
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}

              {error && <div style={errorStyle}>{error}</div>}
            </main>
          </DropZone>
        )}
      </div>

      {/* Modals */}
      <GroupFormModal
        open={groupModalOpen}
        group={editingGroup}
        onClose={() => {
          setGroupModalOpen(false)
          setEditingGroup(null)
        }}
        onSubmit={handleGroupSubmit}
      />

      <ContactFormModal
        open={contactModalOpen}
        contact={editingContact}
        groupName={selectedGroup?.name ?? ''}
        onClose={() => {
          setContactModalOpen(false)
          setEditingContact(null)
        }}
        onSubmit={handleContactSubmit}
      />

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        loading={confirmLoading}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
      />

      <ImportResultModal
        open={importModalOpen}
        result={importResult}
        fileName={importFileName}
        onClose={() => setImportModalOpen(false)}
      />

      <CampaignFormModal
        open={campaignModalOpen}
        groupName={selectedGroup?.name ?? ''}
        contacts={contacts}
        submitLabel={sendCampaignImmediately ? 'Send now' : 'Save draft'}
        onClose={() => setCampaignModalOpen(false)}
        onSubmit={handleCreateCampaign}
      />

      <CampaignDetailModal
        open={campaignDetailOpen}
        campaignId={campaignDetailId}
        onClose={() => setCampaignDetailOpen(false)}
      />
    </div>
  )
}

// ---------- Placeholder page for unbuilt sections ----------

function PlaceholderPage({
  icon,
  title,
  message,
}: {
  icon: string
  title: string
  message: string
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        color: 'var(--color-text-muted)',
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 12 }}>{icon}</div>
      <h2 style={{ margin: '0 0 8px', color: 'var(--color-text)' }}>
        {title}
      </h2>
      <p style={{ margin: 0, fontSize: 14 }}>{message}</p>
    </div>
  )
}

function GroupsHome({
  groups,
  search,
  onSearch,
  onSelect,
  checkedGroupId,
  onCheck,
  canSend,
  onSend,
  onEdit,
  onDelete,
  onCreate,
}: {
  groups: Group[]
  search: string
  onSearch: (value: string) => void
  onSelect: (group: Group) => void
  checkedGroupId: number | null
  onCheck: (groupId: number | null) => void
  canSend: boolean
  onSend: () => void
  onEdit: (group: Group) => void
  onDelete: (group: Group) => void
  onCreate: () => void
}) {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const pageCount = Math.max(1, Math.ceil(groups.length / pageSize))
  const visibleGroups = groups.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setPage(currentPage => Math.min(currentPage, pageCount))
  }, [pageCount])

  useEffect(() => {
    setPage(1)
  }, [search])

  return (
    <main style={groupsMain}>
      <div style={groupsToolbar}>
        <div style={header}>
          <div>
            <h2 style={groupsTitle}><Users size={22} color="var(--color-primary)" /> Groups</h2>
            <p style={{ ...muted, margin: '6px 0 0' }}>
              Check a group to send a campaign, or use View to open its contacts.
            </p>
          </div>
          <button
            type="button"
            style={{
              ...btnPrimary,
              opacity: canSend ? 1 : 0.5,
              cursor: canSend ? 'pointer' : 'not-allowed',
            }}
            onClick={onSend}
            disabled={!canSend}
          >
            ✈ Send Bulk SMS
          </button>
        </div>

        <div style={searchBar}>
          <Search size={17} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            style={searchInput}
          />
          {search && (
            <button style={clearButton} onClick={() => onSearch('')}>
              ✕
            </button>
          )}
          <button type="button" style={filterButton}>
            <SlidersHorizontal size={15} /> All Groups <ChevronDown />
          </button>
          <button type="button" style={filterButton}>
            <ArrowUpDown size={15} /> Sort by <ChevronDown />
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div style={empty}>
          <div style={{ fontSize: 56 }}>👥</div>
          <h2 style={{ margin: '12px 0 8px' }}>No groups found</h2>
          <button style={btnPrimary} onClick={onCreate}>
            + Create group
          </button>
        </div>
      ) : (
        <div style={groupsList}>
          {visibleGroups.map(group => (
            <div
              key={group.id}
              style={groupRow}
            >
              <input
                type="checkbox"
                checked={checkedGroupId === group.id}
                onChange={() =>
                  onCheck(checkedGroupId === group.id ? null : group.id)
                }
                aria-label={`Select ${group.name} for sending`}
                style={groupCheckbox}
              />
              <span style={groupCardIcon}><Users size={21} /></span>
              <span style={groupCardContent}>
                <strong>{group.name}</strong>
                <span style={muted}>
                  {group.contactCount ?? 0} contacts
                </span>
                {group.description && (
                  <span style={groupCardDescription}>{group.description}</span>
                )}
              </span>
              <span style={groupCreated}><CalendarDays size={16} /><span>Created<br /><b>{new Date(group.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</b></span></span>
              <span style={groupActions}>
                <button
                  type="button"
                  className="group-view-button"
                  style={groupViewButton}
                  onClick={() => onSelect(group)}
                >
                  <Eye size={15} /> View
                </button>
                <button
                  type="button"
                  style={groupEditButton}
                  onClick={() => onEdit(group)}
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  type="button"
                  style={groupDeleteButton}
                  onClick={() => onDelete(group)}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {groups.length > pageSize && (
        <div style={pagination}>
          <span style={paginationSummary}>
            Showing {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, groups.length)} of {groups.length}
          </span>
          <div style={paginationControls}>
            <button
              type="button"
              style={paginationButton}
              disabled={page === 1}
              onClick={() => setPage(currentPage => currentPage - 1)}
            >
              ‹
            </button>
            <span style={paginationPage}>
              {page}
            </span>
            <button
              type="button"
              style={paginationButton}
              disabled={page === pageCount}
              onClick={() => setPage(currentPage => currentPage + 1)}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

// ---------- Styles ----------

const pageColumn: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  overflow: 'hidden',
}

const layout: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
  overflowX: 'hidden',
  overflowY: 'auto',
}

const sidebar: React.CSSProperties = {
  width: 290,
  flexShrink: 0,
  background: 'var(--color-surface)',
  borderRight: '1px solid var(--color-border)',
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  overflow: 'hidden',
}

const groupList: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  margin: '0 -8px',
  padding: '0 8px',
}

const groupItem: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  transition: 'background 0.15s',
}

const groupsList: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  paddingRight: 4,
}

const groupRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 16px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-sm)',
}

const groupsTitle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  margin: 0,
}

const stickyToolbar: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  margin: '0 -24px',
  padding: '10px 24px 16px',
  background: 'var(--color-bg)',
  boxShadow: '0 8px 14px -14px rgba(0, 0, 0, 0.8)',
}

const groupsToolbar: React.CSSProperties = {
  ...stickyToolbar,
}

const groupCardIcon: React.CSSProperties = {
  width: 40,
  height: 40,
  display: 'grid',
  placeItems: 'center',
  color: 'white',
  background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
  borderRadius: '50%',
  flexShrink: 0,
}

const groupCheckbox: React.CSSProperties = {
  width: 18,
  height: 18,
  accentColor: 'var(--color-primary)',
  cursor: 'pointer',
  flexShrink: 0,
}

const groupCardContent: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  flex: 1,
  minWidth: 0,
}

const groupCardDescription: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: 12,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const groupActions: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginLeft: 'auto',
  flexShrink: 0,
}

const groupCreated: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 170,
  color: 'var(--color-text-muted)',
  fontSize: 11,
}

const groupViewButton: React.CSSProperties = {
  ...btnSecondary,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 13px',
  fontSize: 13,
  color: '#38bdf8',
  background: 'rgba(3, 105, 161, 0.28)',
  borderColor: 'transparent',
}

const groupEditButton: React.CSSProperties = {
  ...btnSecondary,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 13px',
  fontSize: 13,
  color: '#2f03df',
  background: 'rgba(79, 70, 229, 0.35)',
  borderColor: 'transparent',
}

const groupDeleteButton: React.CSSProperties = {
  ...btnGhost,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 13px',
  fontSize: 13,
  color: '#fb7185',
  background: 'rgba(190, 24, 93, 0.25)',
}

const filterButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '8px 12px',
  color: 'var(--color-text-muted)',
  background: 'var(--color-surface-muted)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  whiteSpace: 'nowrap',
}

const pagination: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  paddingTop: 4,
  borderTop: '1px solid var(--color-border)',
}

const paginationSummary: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: 13,
}

const paginationControls: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

const paginationButton: React.CSSProperties = {
  padding: '7px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: 13,
}

const paginationPage: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: 13,
  whiteSpace: 'nowrap',
}

const main: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: 24,
  overflow: 'visible',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const groupsMain: React.CSSProperties = {
  ...main,
  overflow: 'hidden',
}

const contactMain: React.CSSProperties = {
  ...main,
  overflow: 'hidden',
}

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
}

const groupHeaderTitle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 8,
}

const contactHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  alignItems: 'flex-end',
}

const contactToolbar: React.CSSProperties = {
  ...stickyToolbar,
}

const contactActions: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginLeft: 'auto',
}

const backToGroupsButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  width: 'fit-content',
  padding: '8px 13px',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-primary)',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  whiteSpace: 'nowrap',
  transition: 'background 0.15s, border-color 0.15s, transform 0.15s',
}

const contactSecondaryButton: React.CSSProperties = {
  ...btnSecondary,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '10px 16px',
}

const contactSearchBar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  height: 48,
  padding: '0 16px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
}

const contactTd: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-border)',
  fontSize: 14,
  height: 78,
  color: 'var(--color-text)',
}

const contactNameCell: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 14,
  fontWeight: 600,
}

const contactAvatar: React.CSSProperties = {
  width: 40,
  height: 40,
  display: 'grid',
  placeItems: 'center',
  borderRadius: '50%',
  color: '#2563eb',
  background: '#dbeafe',
  fontWeight: 700,
  fontSize: 17,
}

const contactValue: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 12,
  color: 'var(--color-text-muted)',
}

const contactEditButton: React.CSSProperties = {
  ...btnGhost,
  minWidth: 70,
  padding: '0 10px',
  height: 44,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  color: 'var(--color-text)',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 12,
  marginRight: 8,
}

const contactDeleteButton: React.CSSProperties = {
  ...contactEditButton,
  color: 'var(--color-danger)',
  marginRight: 0,
}

const empty: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: 'var(--color-text-muted)',
}

const tableWrapper: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  overflow: 'auto',
  boxShadow: 'var(--shadow-sm)',
}

const table: React.CSSProperties = {
  width: '100%',
  minWidth: 640,
  borderCollapse: 'collapse',
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  background: 'var(--color-surface-muted)',
  fontSize: 12,
  color: 'var(--color-text-muted)',
  fontWeight: 600,
  borderBottom: '1px solid var(--color-border)',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
}

const td: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #f3f4f6',
  fontSize: 14,
}

const muted: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: 13,
}

const errorStyle: React.CSSProperties = {
  padding: 12,
  background: 'var(--color-danger-bg)',
  color: 'var(--color-danger-text)',
  borderRadius: 8,
  fontSize: 13,
}

const searchBar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '0 14px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  height: 42,
}

const sidebarSearch: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 12px',
  background: 'var(--color-surface-muted)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  height: 36,
}

const searchIcon: React.CSSProperties = {
  fontSize: 14,
  opacity: 0.5,
}

const searchInput: React.CSSProperties = {
  flex: 1,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: 14,
  padding: '10px 0',
}

const searchCount: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-muted)',
  whiteSpace: 'nowrap',
}

const clearButton: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-text-muted)',
  fontSize: 12,
}

export default App