import { useEffect, useState } from 'react'
import { useStudio } from '@/pages/studio/store'
import { Mark } from '@/components/Mark'
import styles from './Toast.module.css'

/** One short confirmation at a time, ticked in china marker, gone on its own. */
export function Toast() {
  const toast = useStudio((s) => s.toast)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!toast) return
    setVisible(true)
    const id = setTimeout(() => setVisible(false), 2400)
    return () => clearTimeout(id)
  }, [toast])

  return (
    <div className={styles.toast} data-visible={visible || undefined} role="status" aria-live="polite">
      {toast && (
        <Mark key={toast.id} active={visible} shape="tick" seed={toast.id}>
          <span>{toast.text}</span>
        </Mark>
      )}
    </div>
  )
}
