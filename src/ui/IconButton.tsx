import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import styles from './IconButton.module.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode
  label: string
  /** Keyboard shortcut shown in the tooltip. */
  shortcut?: string
  /** Show the label beside the icon instead of only in the tooltip. */
  showLabel?: boolean
  tone?: 'default' | 'live'
  tipSide?: 'bottom' | 'top' | 'right' | 'left'
}

/** A chrome button: drawn icon, real label for assistive tech, edge-print tooltip with its shortcut. */
export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { icon, label, shortcut, showLabel, tone = 'default', tipSide = 'bottom', className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={showLabel ? undefined : label}
      className={`${styles.button} ${showLabel ? styles.labelled : ''} ${className ?? ''}`}
      data-tone={tone}
      data-tip={showLabel ? undefined : shortcut ? `${label} · ${shortcut}` : label}
      data-tip-side={tipSide}
      {...rest}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      {showLabel && <span className={styles.text}>{label}</span>}
    </button>
  )
})
