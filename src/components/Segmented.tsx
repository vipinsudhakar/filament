import type { ReactNode } from 'react'
import { Mark } from '@/components/Mark'
import styles from './Segmented.module.css'

/** A row of mutually exclusive options; the chosen one is underlined in china marker. */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  hideLabel,
}: {
  label: string
  options: { value: T; label: ReactNode; title?: string }[]
  value: T
  onChange: (value: T) => void
  hideLabel?: boolean
}) {
  return (
    <div className={styles.field}>
      {!hideLabel && <span className={styles.label}>{label}</span>}
      <div className={styles.row} role="radiogroup" aria-label={label}>
        {options.map((o, i) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            className={styles.option}
            title={o.title}
            onClick={() => onChange(o.value)}
          >
            <Mark active={o.value === value} shape="underline" seed={i + 7}>
              {o.label}
            </Mark>
          </button>
        ))}
      </div>
    </div>
  )
}
