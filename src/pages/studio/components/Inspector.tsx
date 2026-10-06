import { Tabs } from 'radix-ui'
import { X } from 'lucide-react'
import { useStudio, type InspectorTab } from '@/pages/studio/store'
import { Mark } from '@/components/Mark'
import { presetById } from '@/model/presets'
import { SpeciesTab } from '@/pages/studio/inspector/SpeciesTab'
import { MixTab } from '@/pages/studio/inspector/MixTab'
import { FieldTab } from '@/pages/studio/inspector/FieldTab'
import { WorldTab } from '@/pages/studio/inspector/WorldTab'
import { PrintTab } from '@/pages/studio/inspector/PrintTab'
import styles from './Inspector.module.css'

const TABS: { id: InspectorTab; label: string }[] = [
  { id: 'species', label: 'Species' },
  { id: 'mix', label: 'Mix' },
  { id: 'field', label: 'Field' },
  { id: 'world', label: 'World' },
  { id: 'print', label: 'Print' },
]

/** Every parameter, grouped by what it acts on: who the agents are, how they mix, the field, the world, the print. */
export function Inspector() {
  const open = useStudio((s) => s.inspectorOpen)
  const tab = useStudio((s) => s.tab)
  const set = useStudio((s) => s.set)
  const preset = presetById(useStudio((s) => s.presetId))
  const seed = useStudio((s) => s.params.seed)

  return (
    <aside
      className={styles.panel}
      data-open={open || undefined}
      aria-label="Adjustments"
      aria-hidden={!open}
    >
      {/* The film edge: the strip this frame sits on, printed with its code, name and seed. */}
      <div className={styles.rebate} aria-hidden="true">
        <span>▸ {preset?.code ?? '00X'}</span>
        <span>{preset?.name ?? 'Your print'}</span>
        <span>Seed {seed}</span>
      </div>
      <Tabs.Root value={tab} onValueChange={(v) => set({ tab: v as InspectorTab })} className={styles.tabs}>
        <div className={styles.head}>
          <Tabs.List className={styles.list} aria-label="Adjustment groups">
            {TABS.map((t, i) => (
              <Tabs.Trigger key={t.id} value={t.id} className={styles.trigger}>
                <Mark active={tab === t.id} shape="underline" seed={i + 13}>
                  {t.label}
                </Mark>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <button
            type="button"
            className={styles.close}
            aria-label="Hide adjustments"
            onClick={() => set({ inspectorOpen: false })}
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>
        <div className={styles.body}>
          <Tabs.Content value="species" className={styles.content}>
            <SpeciesTab />
          </Tabs.Content>
          <Tabs.Content value="mix" className={styles.content}>
            <MixTab />
          </Tabs.Content>
          <Tabs.Content value="field" className={styles.content}>
            <FieldTab />
          </Tabs.Content>
          <Tabs.Content value="world" className={styles.content}>
            <WorldTab />
          </Tabs.Content>
          <Tabs.Content value="print" className={styles.content}>
            <PrintTab />
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </aside>
  )
}
