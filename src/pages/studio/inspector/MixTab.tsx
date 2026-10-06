import { useRef } from 'react'
import { INTERACTION_BOUND, MAX_SPECIES, defaultInteraction } from '@/model/params'
import { useStudio } from '@/pages/studio/store'
import t from './tab.module.css'

const LETTERS = ['A', 'B', 'C', 'D']

type Recipe = { label: string; build: (n: number) => number[] }

/** Whole-matrix starting points. Each is a relationship people can name. */
const RECIPES: Recipe[] = [
  { label: 'Loyal', build: () => defaultInteraction() },
  {
    label: 'Chase',
    build: (n) => grid((s, c) => (c === s ? 1 : c === (s + 1) % n ? 0.7 : c === (s + n - 1) % n ? -0.9 : 0)),
  },
  { label: 'Swarm', build: () => grid(() => 0.8) },
  { label: 'Loners', build: () => grid((s, c) => (s === c ? 0.5 : -1)) },
]

function grid(f: (s: number, c: number) => number): number[] {
  const m: number[] = []
  for (let s = 0; s < MAX_SPECIES; s++) for (let c = 0; c < MAX_SPECIES; c++) m.push(f(s, c))
  return m
}

const snap = (v: number) =>
  Math.max(
    INTERACTION_BOUND.min,
    Math.min(INTERACTION_BOUND.max, Math.round(v / INTERACTION_BOUND.step) * INTERACTION_BOUND.step),
  )

/**
 * Who follows whom. Row species, column trail: drag a cell up to make the row species follow that
 * trail, down to make it flee. A filled disc attracts, a red ring repels, size is strength.
 */
export function MixTab() {
  const params = useStudio((s) => s.params)
  const n = params.speciesCount

  if (n === 1) {
    return (
      <section className={t.section}>
        <h3 className={t.heading}>Mix</h3>
        <p className={t.note}>
          With one species there is nothing to mix. Add a second in Species and decide how they treat each
          other here.
        </p>
      </section>
    )
  }

  return (
    <>
      <section className={t.section}>
        <h3 className={t.heading}>Who follows whom</h3>
        <p className={t.note}>
          Each row is a species, each column a trail. Drag a cell up to follow, down to flee.
        </p>
        <div
          className={t.matrix}
          style={{ gridTemplateColumns: `22px repeat(${n}, 44px)` }}
          role="grid"
          aria-label="Interaction matrix"
        >
          <span />
          {Array.from({ length: n }, (_, c) => (
            <span key={`col-${c}`} className={t.axis} role="columnheader" aria-label={`${LETTERS[c]} trail`}>
              <span className={t.swatch} style={{ '--c': params.species[c].color } as React.CSSProperties} />
            </span>
          ))}
          {Array.from({ length: n }, (_, s) => (
            <Row key={s} s={s} n={n} />
          ))}
        </div>
      </section>
      <section className={t.section}>
        <h3 className={t.heading}>Start from</h3>
        <div className={t.actions}>
          {RECIPES.map((r) => (
            <button
              key={r.label}
              type="button"
              className={t.textButton}
              onClick={() => useStudio.getState().setParams({ interaction: r.build(n) })}
            >
              {r.label}
            </button>
          ))}
        </div>
      </section>
    </>
  )
}

function Row({ s, n }: { s: number; n: number }) {
  const params = useStudio((st) => st.params)
  return (
    <>
      <span className={`${t.axis} ${t.row}`} role="rowheader" aria-label={`Species ${LETTERS[s]}`}>
        <span className={t.swatch} style={{ '--c': params.species[s].color } as React.CSSProperties} />
      </span>
      {Array.from({ length: n }, (_, c) => (
        <Cell key={c} index={s * MAX_SPECIES + c} label={`${LETTERS[s]} toward ${LETTERS[c]} trail`} />
      ))}
    </>
  )
}

function Cell({ index, label }: { index: number; label: string }) {
  const value = useStudio((s) => s.params.interaction[index])
  const drag = useRef<{ y: number; start: number } | null>(null)
  const setValue = (v: number) => useStudio.getState().setInteraction(index, snap(v))
  const size = 6 + Math.abs(value) * 22

  return (
    <button
      type="button"
      role="gridcell"
      className={t.cell}
      aria-label={`${label}: ${value.toFixed(2)}`}
      title={`${label}: ${value.toFixed(2)} — drag up or down, double-click to reset`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = { y: e.clientY, start: value }
      }}
      onPointerMove={(e) => {
        if (!drag.current) return
        setValue(drag.current.start + (drag.current.y - e.clientY) / 80)
      }}
      onPointerUp={() => (drag.current = null)}
      onDoubleClick={() => setValue(defaultInteraction()[index])}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') setValue(value + INTERACTION_BOUND.step)
        else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') setValue(value - INTERACTION_BOUND.step)
        else return
        e.preventDefault()
      }}
    >
      {Math.abs(value) >= 0.05 && (
        <span className={t.dot} data-sign={value > 0 ? 'pos' : 'neg'} style={{ width: size, height: size }} />
      )}
      <span className={t.cellValue}>
        {value > 0 ? '+' : ''}
        {value.toFixed(1)}
      </span>
    </button>
  )
}
