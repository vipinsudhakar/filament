import { Slider } from 'radix-ui'
import type { Bound } from '@/model/params'
import styles from './Scale.module.css'

const LOG_STEPS = 1000

const decimalsFor = (step: number) => Math.max(0, -Math.floor(Math.log10(step) + 1e-9))

export function formatValue(value: number, bound: Bound): string {
  if (value >= 10000) return `${(value / 1000).toFixed(0)}k`
  return value.toFixed(decimalsFor(bound.step))
}

/**
 * A graduated scale, like the column ruler on an enlarger: a hairline track with ticks, a red index
 * needle, the reading in timer digits. Radix supplies the slider semantics and keyboard handling;
 * double-click resets to the default, which is what you reach for after overshooting.
 */
export function Scale({
  bound,
  value,
  defaultValue,
  onChange,
  label = bound.label,
  disabled,
}: {
  bound: Bound
  value: number
  defaultValue?: number
  onChange: (value: number) => void
  label?: string
  disabled?: boolean
}) {
  const log = bound.scale === 'log'
  const toPos = (v: number) =>
    log ? Math.round((Math.log(v / bound.min) / Math.log(bound.max / bound.min)) * LOG_STEPS) : v
  const fromPos = (p: number) => {
    if (!log) return p
    const raw = bound.min * Math.pow(bound.max / bound.min, p / LOG_STEPS)
    return Math.round(raw / bound.step) * bound.step
  }

  return (
    <div className={styles.row} data-disabled={disabled || undefined} title={bound.hint}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <output className={styles.value}>
          {formatValue(value, bound)}
          {bound.unit && <span className={styles.unit}>{bound.unit}</span>}
        </output>
      </div>
      <Slider.Root
        className={styles.root}
        min={log ? 0 : bound.min}
        max={log ? LOG_STEPS : bound.max}
        step={log ? 1 : bound.step}
        value={[toPos(value)]}
        onValueChange={([p]) => onChange(fromPos(p))}
        onDoubleClick={() => defaultValue !== undefined && onChange(defaultValue)}
        disabled={disabled}
        aria-label={label}
      >
        <Slider.Track className={styles.track}>
          <Slider.Range className={styles.range} />
        </Slider.Track>
        <Slider.Thumb className={styles.thumb} aria-label={label} />
      </Slider.Root>
    </div>
  )
}
