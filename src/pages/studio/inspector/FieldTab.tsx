import { DEFAULTS, GLOBAL_BOUNDS } from '@/model/params'
import { useStudio } from '@/pages/studio/store'
import { Scale } from '@/components/Scale'
import { Segmented } from '@/components/Segmented'
import t from './tab.module.css'

export function FieldTab() {
  const params = useStudio((s) => s.params)
  const { setParams } = useStudio.getState()

  return (
    <>
      <section className={t.section}>
        <h3 className={t.heading}>Trail</h3>
        <Scale
          bound={GLOBAL_BOUNDS.decayRate}
          value={params.decayRate}
          defaultValue={DEFAULTS.decayRate}
          onChange={(decayRate) => setParams({ decayRate })}
        />
        <Scale
          bound={GLOBAL_BOUNDS.diffuseRate}
          value={params.diffuseRate}
          defaultValue={DEFAULTS.diffuseRate}
          onChange={(diffuseRate) => setParams({ diffuseRate })}
        />
        <Scale
          bound={GLOBAL_BOUNDS.foodEmit}
          value={params.foodEmit}
          defaultValue={DEFAULTS.foodEmit}
          onChange={(foodEmit) => setParams({ foodEmit })}
        />
      </section>
      <section className={t.section}>
        <h3 className={t.heading}>Edges</h3>
        <Segmented
          label="At the edge"
          options={[
            { value: 'wrap', label: 'Wrap around', title: 'Leave one side, come back on the other' },
            { value: 'bounce', label: 'Bounce', title: 'The edge is a wall' },
          ]}
          value={params.boundary}
          onChange={(boundary) => setParams({ boundary })}
        />
      </section>
      <section className={t.section}>
        <h3 className={t.heading}>Grid</h3>
        <Scale
          bound={GLOBAL_BOUNDS.simScale}
          value={params.simScale}
          defaultValue={DEFAULTS.simScale}
          onChange={(simScale) => setParams({ simScale })}
        />
        <p className={t.note}>Lower resolution is faster and grows broader, softer structure.</p>
      </section>
    </>
  )
}
