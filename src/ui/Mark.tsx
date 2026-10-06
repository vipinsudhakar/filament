import { useMemo, type ReactNode } from 'react'
import { makeRng } from '@/engine/rng'
import styles from './Mark.module.css'

type Shape = 'loop' | 'underline' | 'tick'

/**
 * A china-marker stroke: the hand that circles the chosen frame on a contact sheet. It's the
 * one selection device in the app — active tool, current tab, chosen frame — and it draws itself
 * on rather than appearing.
 *
 * The path is generated, not hand-authored, but seeded per mark so each one keeps its own
 * wobble across renders instead of shimmering.
 */
function loopPath(seed: number): string {
  const rng = makeRng(seed)
  const j = (a: number) => (rng.nextFloat() - 0.5) * a
  // Start a little past the left, go round once and overshoot, the way a hand doesn't close the loop.
  const turns = 1.12 + rng.nextFloat() * 0.08
  const start = Math.PI * (0.9 + j(0.3))
  const steps = 28
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = start + (i / steps) * turns * Math.PI * 2
    const drift = (i / steps) * 4
    const rx = 47 + j(2.5) + drift * 0.4
    const ry = 44 + j(3) - drift * 0.6
    pts.push(`${(50 + Math.cos(t) * rx).toFixed(2)} ${(50 + Math.sin(t) * ry).toFixed(2)}`)
  }
  return `M${pts[0]} ${pts
    .slice(1)
    .map((p, i, all) => (i % 2 === 0 && all[i + 1] ? `Q${p} ${all[i + 1]}` : ''))
    .join(' ')}`
}

function underlinePath(seed: number): string {
  const rng = makeRng(seed)
  const j = (a: number) => (rng.nextFloat() - 0.5) * a
  return `M2 ${60 + j(10)} Q30 ${46 + j(14)} 55 ${54 + j(10)} T98 ${44 + j(12)}`
}

const TICK = 'M8 55 Q22 66 34 86 Q55 40 94 10'

export function Mark({
  active,
  shape = 'loop',
  seed = 1,
  className,
  children,
}: {
  active: boolean
  shape?: Shape
  seed?: number
  className?: string
  children?: ReactNode
}) {
  const d = useMemo(
    () => (shape === 'loop' ? loopPath(seed) : shape === 'underline' ? underlinePath(seed) : TICK),
    [shape, seed],
  )
  return (
    <span className={`${styles.wrap} ${className ?? ''}`}>
      {children}
      <svg
        className={`${styles.mark} ${styles[shape]}`}
        data-active={active}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={d} pathLength={1} />
      </svg>
    </span>
  )
}

/** The wax texture every mark shares. Rendered once at the app root. */
export function MarkDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <filter id="china-marker" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="grain" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="grain"
          scale="1.6"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  )
}
