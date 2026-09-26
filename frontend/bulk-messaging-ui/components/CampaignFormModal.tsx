import { useEffect, useMemo, useState } from 'react'
import { Modal } from './Modal'
import { btnPrimary, btnSecondary, inputStyle, labelStyle } from '../src/styles/theme'
import { Spinner } from './Spinner'
import { Channel } from '../src/api'
import type { Contact } from '../src/api'

interface Props {
  open: boolean
  groupName: string
  contacts: Contact[]
  onClose: () => void
  submitLabel?: string
  onSubmit: (data: {
    channel: Channel
    subject?: string
    body: string
  }) => Promise<void>
}

function renderTemplate(template: string, contact: Contact | null): string {
  if (!contact) return template
  return template
    .replace(/\{Name\}/gi, contact.name ?? '')
    .replace(/\{Phone\}/gi, contact.phone ?? '')
    .replace(/\{Email\}/gi, contact.email ?? '')
    .replace(/\{Notes\}/gi, contact.notes ?? '')
}

export function CampaignFormModal({
  open,
  groupName,
  contacts,
  onClose,
  submitLabel = 'Save draft',
  onSubmit,
}: Props) {
  const [channel, setChannel] = useState<Channel>(Channel.Sms)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setChannel(Channel.Sms)
      setSubject('')
      setBody('Hi {Name}, ')
      setError(null)
      setSaving(false)
    }
  }, [open])

  // Sample contact for preview
  const sampleContact = contacts[0] ?? null

  const previewBody = useMemo(
    () => renderTemplate(body, sampleContact),
    [body, sampleContact],
  )

  // Count valid recipients for the chosen channel
  const recipientCount = useMemo(() => {
    return contacts.filter(c =>
      channel === Channel.Email ? !!c.email : !!c.phone,
    ).length
  }, [contacts, channel])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!body.trim()) {
      setError('Message body is required.')
      return
    }
    if (channel === Channel.Email && !subject.trim()) {
      setError('Subject is required for email campaigns.')
      return
    }
    if (recipientCount === 0) {
      setError(
        channel === Channel.Email
          ? 'No contacts in this group have an email address.'
          : 'No contacts in this group have a phone number.',
      )
      return
    }

    try {
      setSaving(true)
      await onSubmit({
        channel,
        subject: channel === Channel.Email ? subject.trim() : undefined,
        body: body.trim(),
      })
      onClose()
    } catch (err: any) {
      const msg =
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.message || err.message || 'Something went wrong'
      setError(String(msg))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={`New campaign → ${groupName}`}
      onClose={onClose}
      width={720}
      footer={
        <>
          <button
            type="button"
            style={btnSecondary}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="campaign-form"
            style={{
              ...btnPrimary,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner size={14} color="white" />
                Saving...
              </>
            ) : (
              <>{submitLabel} ({recipientCount} recipients)</>
            )}
          </button>
        </>
      }
    >
      <form id="campaign-form" onSubmit={handleSubmit}>
        {/* Channel picker */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Channel</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setChannel(Channel.Sms)}
              className={channel === Channel.Sms ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{
                ...btnSecondary,
                flex: 1,
                background:
                channel === Channel.Sms
                  ? 'var(--color-selected-bg)'
                  : 'var(--color-surface)',
              color:
                channel === Channel.Sms
                  ? 'var(--color-selected-text)'
                  : 'var(--color-text)',
                borderColor:
                  channel === Channel.Sms
                    ? 'var(--color-primary)'
                    : 'var(--color-border)',
              }}
            >
              📱 SMS
            </button>
            <button
              type="button"
              onClick={() => setChannel(Channel.Email)}
              className={channel === Channel.Email ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{
                ...btnSecondary,
                flex: 1,
                background:
                channel === Channel.Email
                  ? 'var(--color-selected-bg)'
                  : 'var(--color-surface)',
              color:
                channel === Channel.Email
                  ? 'var(--color-selected-text)'
                  : 'var(--color-text)',
                borderColor:
                  channel === Channel.Email
                    ? 'var(--color-primary)'
                    : 'var(--color-border)',
              }}
            >
              ✉️ Email
            </button>
          </div>
        </div>

        {/* Subject (email only) */}
        {channel === Channel.Email && (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Subject</label>
            <input
              style={inputStyle}
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g., Welcome to our program"
            />
          </div>
        )}

        {/* Body */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Message body</label>
          <textarea
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical', fontFamily: 'inherit' }}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Hi {Name}, ..."
          />
          <div
            style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
              marginTop: 6,
            }}
          >
            Placeholders: <code>{'{Name}'}</code> <code>{'{Phone}'}</code>{' '}
            <code>{'{Email}'}</code> <code>{'{Notes}'}</code>
          </div>
        </div>

        {/* Live preview */}
        <div
          style={{
            background: 'var(--color-surface-muted)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              marginBottom: 8,
            }}
          >
            Preview
            {sampleContact && (
              <span style={{ marginLeft: 6, textTransform: 'none' }}>
                — for "{sampleContact.name || sampleContact.phone}"
              </span>
            )}
          </div>

          {channel === Channel.Email && subject && (
            <div
              style={{
                fontWeight: 600,
                marginBottom: 8,
                paddingBottom: 8,
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              {subject}
            </div>
          )}

          <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>
            {previewBody || <span style={{ color: 'var(--color-text-muted)' }}>(empty)</span>}
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: 10,
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger-text)',
              borderRadius: 8,
              fontSize: 13,
              marginTop: 16,
            }}
          >
            {error}
          </div>
        )}
      </form>
    </Modal>
  )
}