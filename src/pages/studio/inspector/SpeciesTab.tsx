import {
  DEFAULT_SPECIES,
  DEFAULTS,
  GLOBAL_BOUNDS,
  SPAWN_LABELS,
  SPAWN_PATTERNS,
  SPECIES_BOUNDS,
  type SpeciesNumericKey,
} from '@/model/params'
import { useStudio } from '@/pages/studio/store'
import { Mark } from '@/components/Mark'
import { Scale } from '@/components/Scale'
import { Segmented } from '@/components/Segmented'
import t from './tab.module.css'

const LETTERS = ['A', 'B', 'C', 'D']
const SPECIES_KEYS: SpeciesNumericKey[] = [
  'sensorAngle',
  'sensorDistance',
  'sensorSize',
  'turnSpeed',
  'moveSpeed',
  'depositAmount',
]

export function SpeciesTab() {
  const params = useStudio((s) => s.params)
  const selected = useStudio((s) => Math.min(s.selectedSpecies, s.params.speciesCount - 1))
  const { set, setParams, setSpecies } = useStudio.getState()
  const species = params.species[selected]

  return (
    <>
      <section className={t.section}>
        <Segmented
          label="How many"
          options={[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
          value={params.speciesCount}
          onChange={(speciesCount) => {
            setParams({ speciesCount })
            set({ selectedSpecies: Math.min(selected, speciesCount - 1) })
          }}
        />
        {params.speciesCount > 1 && (
          <div className={t.chips} role="group" aria-label="Edit species">
            {params.species.slice(0, params.speciesCount).map((s, i) => (
              <button
                key={i}
                type="button"
                className={t.chip}
                aria-pressed={i === selected}
                onClick={() => set({ selectedSpecies: i })}
              >
                <Mark active={i === selected} seed={i + 51}>
                  <span className={t.swatch} style={{ '--c': s.color } as React.CSSProperties} />
                </Mark>
                {LETTERS[i]}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className={t.section}>
        <h3 className={t.heading}>
          {params.speciesCount > 1 ? `Species ${LETTERS[selected]}` : 'Behaviour'}
        </h3>
        <div className={t.colorRow}>
          <span className={t.colorLabel}>Colour</span>
          <label className={t.colorInput}>
            <span className={t.swatch} style={{ '--c': species.color } as React.CSSProperties} />
            {species.color}
            <input
              type="color"
              value={species.color}
              aria-label="Species colour"
              onChange={(e) => setSpecies(selected, { color: e.target.value })}
            />
          </label>
        </div>
        {SPECIES_KEYS.map((key) => (
          <Scale
            key={key}
            bound={SPECIES_BOUNDS[key]}
            value={species[key]}
            defaultValue={DEFAULT_SPECIES[key]}
            onChange={(v) => setSpecies(selected, { [key]: v })}
          />
        ))}
      </section>

      <section className={t.section}>
        <h3 className={t.heading}>Population</h3>
        <Scale
          bound={GLOBAL_BOUNDS.density}
          value={params.density}
          defaultValue={DEFAULTS.density}
          onChange={(density) => setParams({ density })}
        />
        <Segmented
          label="Spawn"
          options={SPAWN_PATTERNS.map((p) => ({ value: p, label: SPAWN_LABELS[p] }))}
          value={params.spawnPattern}
          onChange={(spawnPattern) => setParams({ spawnPattern })}
        />
      </section>
    </>
  )
}
