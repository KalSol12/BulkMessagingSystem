import { Modal } from './Modal'
import { btnDanger, btnSecondary } from '../src/styles/theme'
import { Spinner } from './Spinner'
interface Props {
  open: boolean
  title: string
  message: string
  confirmText?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Delete',
  onConfirm,
  onCancel,
  loading = false,
}: Props) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      width={420}
      footer={
        <>
          <button
            type="button"
            style={btnSecondary}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        <button
  type="button"
  style={{
    ...btnDanger,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }}
  onClick={onConfirm}
  disabled={loading}
>
  {loading ? (
    <>
      <Spinner size={14} color="white" />
      Deleting...
    </>
  ) : (
    confirmText
  )}
</button>
        </>
      }
    >
      <p style={{ margin: 0, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
        {message}
      </p>
    </Modal>
  )
}