import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { btnPrimary, btnSecondary, inputStyle, labelStyle } from '../src/styles/theme'
import type { Group } from '../src/api'
import { Spinner } from './Spinner'

interface Props {
  open: boolean
  group?: Group | null         // when provided → edit mode
  onClose: () => void
  onSubmit: (name: string, description: string) => Promise<void>
}

export function GroupFormModal({ open, group, onClose, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName(group?.name ?? '')
      setDescription(group?.description ?? '')
      setError(null)
      setSaving(false)
    }
  }, [open, group])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    try {
      setSaving(true)
      await onSubmit(name.trim(), description.trim())
      onClose()
    } catch (err: any) {
      setError(err.response?.data || err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={group ? 'Edit group' : 'New group'}
      onClose={onClose}
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
  form="group-form"
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
  ) : group ? (
    'Save changes'
  ) : (
    'Create group'
  )}
</button>
        </>
      }
    >
      <form id="group-form" onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Name *</label>
          <input
            style={inputStyle}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Employees"
            autoFocus
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={labelStyle}>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>

        {error && (
          <div style={styles.error}>{String(error)}</div>
        )}
      </form>
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  error: {
    padding: 10,
    background: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
    borderRadius: 8,
    fontSize: 13,
    marginTop: 12,
  },
}