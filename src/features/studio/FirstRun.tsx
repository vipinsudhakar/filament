import { useEffect, useState } from 'react'
import styles from './FirstRun.module.css'

const KEY = 'filament:first-run-done'

function seen(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/**
 * The one hint a first visit gets: a grease-pencil note by the tools saying what to do. It leaves
 * the moment someone paints, or after a while, and doesn't come back.
 */
export function FirstRun() {
  const [show, setShow] = useState(() => !seen())

  useEffect(() => {
    if (!show) return
    const done = () => {
      setShow(false)
      try {
        localStorage.setItem(KEY, '1')
      } catch {
        // Blocked storage just means the hint may show again next time.
      }
    }
    window.addEventListener('filament:painted', done)
    const id = setTimeout(done, 14000)
    return () => {
      window.removeEventListener('filament:painted', done)
      clearTimeout(id)
    }
  }, [show])

  if (!show) return null
  return (
    <div className={styles.note} aria-live="polite">
      <svg className={styles.arrow} viewBox="0 0 90 60" aria-hidden="true">
        <path d="M86 10 C60 6 34 14 14 44" pathLength={1} />
        <path d="M6 32 L13 46 L28 41" pathLength={1} />
      </svg>
      <p>
        Drag on the print to lay down food.
        <br />
        It will find it.
      </p>
    </div>
  )
}
