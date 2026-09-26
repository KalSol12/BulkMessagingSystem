import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { btnPrimary, btnSecondary, inputStyle, labelStyle } from '../src/styles/theme'
import type { Contact } from '../src/api'
import { Spinner } from './Spinner'

interface Props {
  open: boolean
  contact?: Contact | null
  groupName: string
  onClose: () => void
  onSubmit: (data: {
    name: string
    phone: string
    email: string
    notes: string
  }) => Promise<void>
}

export function ContactFormModal({
  open,
  contact,
  groupName,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(contact?.name ?? '')
      setPhone(contact?.phone ?? '')
      setEmail(contact?.email ?? '')
      setNotes(contact?.notes ?? '')
      setError(null)
      setSaving(false)
    }
  }, [open, contact])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!phone.trim()) {
      setError('Phone is required')
      return
    }

    try {
      setSaving(true)
      await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notes: notes.trim(),
      })
      onClose()
    } catch (err: any) {
      const msg = err.response?.data || err.message || 'Something went wrong'
      setError(String(msg))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={contact ? 'Edit contact' : `New contact in "${groupName}"`}
      onClose={onClose}
      width={520}
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
  form="contact-form"
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
  ) : contact ? (
    'Save changes'
  ) : (
    'Add contact'
  )}
</button>
        </>
      }
    >
      <form id="contact-form" onSubmit={handleSubmit}>
        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Name *</label>
            <input
              style={inputStyle}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name"
              autoFocus
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Phone *</label>
            <input
              style={inputStyle}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+251..."
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            style={inputStyle}
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="optional"
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>Notes</label>
          <textarea
            style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="optional"
          />
        </div>

        {error && (
          <div
            style={{
              padding: 10,
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              borderRadius: 8,
              fontSize: 13,
              marginTop: 12,
            }}
          >
            {error}
          </div>
        )}
      </form>
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    gap: 12,
  },
}