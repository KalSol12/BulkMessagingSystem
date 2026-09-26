import { useEffect, useState, type ReactNode } from 'react'

interface Props {
  onFileDropped: (file: File) => void
  enabled: boolean
  children: ReactNode
}

export function DropZone({ onFileDropped, enabled, children }: Props) {
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (!enabled) return

    let counter = 0
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      counter++
      setDragOver(true)
    }
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      e.preventDefault()   // required to allow drop
    }
    const onDragLeave = () => {
      counter--
      if (counter <= 0) {
        counter = 0
        setDragOver(false)
      }
    }
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      counter = 0
      setDragOver(false)

      const file = e.dataTransfer?.files?.[0]
      if (file) onFileDropped(file)
    }

    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)

    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [enabled, onFileDropped])

  return (
    <>
      {children}
      {dragOver && enabled && (
        <div style={styles.overlay}>
          <div style={styles.box}>
            <div style={{ fontSize: 48 }}>📥</div>
            <h2 style={{ margin: '12px 0 4px', fontSize: 20 }}>
              Drop to import
            </h2>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>
              Release your .csv or .xlsx file
            </p>
          </div>
        </div>
      )}
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(79, 70, 229, 0.08)',
    backdropFilter: 'blur(2px)',
    zIndex: 1500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    animation: 'fadeIn 0.15s ease',
  },
  box: {
    background: 'var(--color-surface)',
    padding: '40px 60px',
    borderRadius: 'var(--radius-lg)',
    border: '2px dashed var(--color-primary)',
    textAlign: 'center',
    boxShadow: 'var(--shadow-lg)',
    pointerEvents: 'none',
  },
}