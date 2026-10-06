import { useEffect, useRef } from 'react'
import {
  Dices,
  Keyboard,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  SkipForward,
  SlidersHorizontal,
} from 'lucide-react'
import type { Simulation } from '@/engine/Simulation'
import { frameLoop } from '@/engine/frameLoop'
import { mutate } from '@/model/mutate'
import { randomSeed } from '@/model/params'
import { useStudio } from '@/state/studio'
import { IconButton } from '@/ui/IconButton'
import { Mark } from '@/ui/Mark'
import styles from './Transport.module.css'

const SPEEDS = [0, 1, 2, 4, 8]

/**
 * The darkroom timer: play and step, the frame counter running in timer digits, speed, and the
 * three ways to start over — the same run fresh, a new seed, or a mutation.
 */
export function Transport({ sim, onShortcuts }: { sim: Simulation | null; onShortcuts: () => void }) {
  const paused = useStudio((s) => s.paused)
  const speed = useStudio((s) => s.params.speed)
  const stats = useStudio((s) => s.stats)
  const inspectorOpen = useStudio((s) => s.inspectorOpen)
  const set = useStudio((s) => s.set)

  return (
    <div className={styles.transport} role="toolbar" aria-label="Playback">
      <button
        type="button"
        className={styles.play}
        aria-label={paused ? 'Play (Space)' : 'Pause (Space)'}
        onClick={() => set({ paused: !paused })}
      >
        {paused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
      </button>
      <IconButton
        icon={<SkipForward />}
        label="Step one frame"
        shortcut="."
        tipSide="top"
        disabled={!paused}
        onClick={() => sim?.stepOnce()}
      />

      <div className={styles.timer}>
        <FrameCounter sim={sim} />
        <span className={styles.meta}>
          {stats.fps.toFixed(0)} fps · {formatCount(stats.agents)} agents
        </span>
      </div>

      <div className={styles.speeds} role="radiogroup" aria-label="Steps per frame">
        {SPEEDS.map((s, i) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={speed === s}
            className={styles.speed}
            title={s === 0 ? 'Hold still (keeps drawing)' : `${s} steps per frame`}
            onClick={() => useStudio.getState().setParams({ speed: s })}
          >
            <Mark active={speed === s} shape="underline" seed={i + 40}>
              {s}×
            </Mark>
          </button>
        ))}
      </div>

      <span className={styles.divider} aria-hidden="true" />
      <IconButton
        icon={<RotateCcw />}
        label="Start over"
        shortcut="R"
        tipSide="top"
        onClick={() => sim?.reset()}
      />
      <IconButton
        icon={<Shuffle />}
        label="New seed"
        shortcut="N"
        tipSide="top"
        onClick={() => useStudio.getState().reseed()}
      />
      <button
        type="button"
        className={styles.mutate}
        title="Mutate: a new random run (M)"
        onClick={() => {
          const s = useStudio.getState()
          s.replaceParams(mutate(s.params, randomSeed()))
        }}
      >
        <Dices size={16} strokeWidth={1.8} aria-hidden="true" />
        Mutate
      </button>

      <span className={styles.divider} aria-hidden="true" />
      <IconButton
        icon={<SlidersHorizontal />}
        label={inspectorOpen ? 'Hide adjustments' : 'Show adjustments'}
        tipSide="top"
        className={styles.adjust}
        onClick={() => set({ inspectorOpen: !inspectorOpen })}
      />
      <IconButton
        icon={<Keyboard />}
        label="Shortcuts"
        shortcut="?"
        tipSide="top"
        className={styles.keys}
        onClick={onShortcuts}
      />
    </div>
  )
}

/**
 * The frame number, updated every frame straight into the DOM. Routing it through React state
 * would re-render the transport sixty times a second for one number.
 */
function FrameCounter({ sim }: { sim: Simulation | null }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!sim) return
    return frameLoop.add(() => {
      if (ref.current) ref.current.textContent = String(sim.stats.frame).padStart(7, '0')
    })
  }, [sim])
  return (
    <span className={styles.frame}>
      <span className={styles.frameLabel}>Frame</span>
      <span ref={ref} className={styles.digits}>
        0000000
      </span>
    </span>
  )
}

function formatCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${Math.round(n / 1e3)}K`
  return String(n)
}
