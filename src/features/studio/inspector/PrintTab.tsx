import { DEFAULTS, LOOK_BOUNDS } from '@/model/params'
import { useStudio } from '@/state/studio'
import { Mark } from '@/ui/Mark'
import { Scale } from '@/ui/Scale'
import t from './tab.module.css'

/** Darkroom grounds the print can be laid on. All dark: the organism is light and screens over it. */
const GROUNDS = [
  { value: '#0b0908', label: 'Darkroom' },
  { value: '#000000', label: 'Black' },
  { value: '#0a0e16', label: 'Night' },
  { value: '#170907', label: 'Oxblood' },
  { value: '#0c120d', label: 'Moss' },
]

export function PrintTab() {
  const look = useStudio((s) => s.params.look)
  const { setLook } = useStudio.getState()

  return (
    <>
      <section className={t.section}>
        <h3 className={t.heading}>Exposure</h3>
        <Scale
          bound={LOOK_BOUNDS.exposure}
          value={look.exposure}
          defaultValue={DEFAULTS.look.exposure}
          onChange={(exposure) => setLook({ exposure })}
        />
        <Scale
          bound={LOOK_BOUNDS.glow}
          value={look.glow}
          defaultValue={DEFAULTS.look.glow}
          onChange={(glow) => setLook({ glow })}
        />
        <Scale
          bound={LOOK_BOUNDS.glowRadius}
          value={look.glowRadius}
          defaultValue={DEFAULTS.look.glowRadius}
          onChange={(glowRadius) => setLook({ glowRadius })}
        />
        <Scale
          bound={LOOK_BOUNDS.vignette}
          value={look.vignette}
          defaultValue={DEFAULTS.look.vignette}
          onChange={(vignette) => setLook({ vignette })}
        />
      </section>
      <section className={t.section}>
        <h3 className={t.heading}>Ground</h3>
        <div className={t.grounds} role="radiogroup" aria-label="Background">
          {GROUNDS.map((g, i) => (
            <button
              key={g.value}
              type="button"
              role="radio"
              aria-checked={look.background === g.value}
              aria-label={g.label}
              title={g.label}
              onClick={() => setLook({ background: g.value })}
            >
              <Mark active={look.background === g.value} seed={i + 61}>
                <span className={t.ground} style={{ '--c': g.value } as React.CSSProperties} />
              </Mark>
            </button>
          ))}
        </div>
      </section>
    </>
  )
}
