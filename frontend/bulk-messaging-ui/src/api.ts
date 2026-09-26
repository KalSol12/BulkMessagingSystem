import axios from 'axios'

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim()
export const API_BASE = (
  configuredApiBase || 'http://localhost:5101/api'
).replace(/\/+$/, '')

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface AuthUser {
  email: string
  displayName: string
  isAdmin: boolean
  mustChangePassword?: boolean
}

export interface AdminUser extends AuthUser {
  id: string
}

export interface LoginResult extends AuthUser {
  accessToken: string
}

export function setAccessToken(token: string | null) {
  if (token) {
    sessionStorage.setItem('bulk-messaging-access-token', token)
  } else {
    sessionStorage.removeItem('bulk-messaging-access-token')
  }
}

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('bulk-messaging-access-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    const requestUrl = String(error.config?.url ?? '')
    if (error.response?.status === 401 && !requestUrl.endsWith('/auth/login')) {
      setAccessToken(null)
      window.dispatchEvent(new Event('bulk-messaging-unauthorized'))
    }
    return Promise.reject(error)
  },
)

export const authApi = {
  login: (email: string, password: string) =>
    api
      .post<LoginResult>('/auth/login', { email, password })
      .then(response => response.data),
  me: () => api.get<AuthUser>('/auth/me').then(response => response.data),
  logout: () => api.post('/auth/logout'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  listUsers: () =>
    api.get<AdminUser[]>('/admin/users').then(response => response.data),
  createUser: (data: {
    email: string
    displayName: string
    temporaryPassword: string
  }) => api.post<AdminUser>('/admin/users', data).then(response => response.data),
}

// ---------- Types ----------

export interface Group {
  id: number
  name: string
  description: string | null
  createdAt: string
  contactCount?: number
  contacts?: Contact[]
}

export interface Contact {
  id: number
  name: string
  phone: string
  email: string | null
  notes: string | null
  createdAt: string
  groupId: number
}

export interface ImportResult {
  totalRows: number
  imported: number
  failed: number
  errors: { line: number; message: string }[]
}

// ---------- API calls ----------

export const groupsApi = {
  list: () => api.get<Group[]>('/groups').then(r => r.data),

  get: (id: number) =>
    api.get<Group>(`/groups/${id}`).then(r => r.data),

  create: (name: string, description?: string) =>
    api.post<Group>('/groups', { name, description }).then(r => r.data),

  update: (id: number, name: string, description?: string) =>
    api.put(`/groups/${id}`, { id, name, description }),

  delete: (id: number) => api.delete(`/groups/${id}`),
}

export const contactsApi = {
  listByGroup: (groupId: number) =>
    api.get<Contact[]>(`/groups/${groupId}/contacts`).then(r => r.data),

  create: (groupId: number, data: Partial<Contact>) =>
    api.post<Contact>(`/groups/${groupId}/contacts`, data).then(r => r.data),

  update: (id: number, data: Partial<Contact>) =>
    api.put(`/contacts/${id}`, { ...data, id }),

  delete: (id: number) => api.delete(`/contacts/${id}`),

  importFile: (groupId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post<ImportResult>(`/groups/${groupId}/contacts/import`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(r => r.data)
  },

  
}


// ---------- Campaigns ----------

export const Channel = {
  Sms: 0,
  Email: 1,
} as const
export type Channel = typeof Channel[keyof typeof Channel]

export const CampaignStatus = {
  Draft: 0,
  Sending: 1,
  Completed: 2,
  Failed: 3,
  Cancelled: 4,
} as const
export type CampaignStatus = typeof CampaignStatus[keyof typeof CampaignStatus]

export const MessageStatus = {
  Pending: 0,
  Sent: 1,
  Failed: 2,
} as const
export type MessageStatus = typeof MessageStatus[keyof typeof MessageStatus]

export interface Campaign {
  id: number
  groupId: number
  groupName: string
  channel: Channel
  subject: string | null
  body: string
  status: CampaignStatus
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  totalCount: number
  sentCount: number
  failedCount: number
}

export interface CampaignMessage {
  id: number
  contactId: number | null
  contactName: string | null
  phone: string
  email: string | null
  body: string
  status: MessageStatus
  providerMessageId: string | null
  error: string | null
  attempts: number
  createdAt: string
  sentAt: string | null
}

export interface CampaignDetail extends Campaign {
  messages: CampaignMessage[]
}

export const campaignsApi = {
  listByGroup: (groupId: number) =>
    api.get<Campaign[]>(`/groups/${groupId}/campaigns`).then(r => r.data),

  get: (id: number) =>
    api.get<CampaignDetail>(`/campaigns/${id}`).then(r => r.data),

  create: (groupId: number, data: { channel: Channel; subject?: string; body: string }) =>
    api.post<Campaign>(`/groups/${groupId}/campaigns`, data).then(r => r.data),

  send: (id: number) =>
    api.post<Campaign>(`/campaigns/${id}/send`).then(r => r.data),

  delete: (id: number) => api.delete(`/campaigns/${id}`),

  preview: (id: number, contactId: number) =>
    api
      .get<{
        campaignId: number
        contactId: number
        contactName: string | null
        phone: string
        email: string | null
        subject: string | null
        body: string
      }>(`/campaigns/${id}/preview`, { params: { contactId } })
      .then(r => r.data),
}


// ---------- Dashboard ----------

export interface DashboardStats {
  subscribers: {
    total: number
    thisMonth: number
    thisWeek: number
    today: number
  }
  unsubscribers: {
    total: number
    thisMonth: number
    thisWeek: number
    today: number
  }
  groups: number
  campaigns: number
  messages: {
    total: number
    sent: number
    failed: number
    thisMonth: number
    thisWeek: number
    today: number
  }
  topGroups?: {
    id: number
    name: string
    contacts: number
    messagesSent: number
  }[]
  recentActivity?: {
    type: 'campaign' | 'group' | 'contact'
    title: string
    detail: string
    date: string
  }[]
}

export const dashboardApi = {
  stats: () => api.get<DashboardStats>('/dashboard/stats').then(r => r.data),
}