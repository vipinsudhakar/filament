import { useEffect, useState } from 'react'
import { Eraser } from 'lucide-react'
import { SCATTER_BOUND, TEXT_MAX_LENGTH, type WorldSpec } from '@/model/params'
import { useStudio } from '@/pages/studio/store'
import { Scale } from '@/components/Scale'
import { Segmented } from '@/components/Segmented'
import t from './tab.module.css'

const KINDS: { value: WorldSpec['kind']; label: string }[] = [
  { value: 'none', label: 'Empty' },
  { value: 'scatter', label: 'Scatter' },
  { value: 'text', label: 'Words' },
  { value: 'cities', label: 'Tokyo' },
]

/** What the organism grows across. Generated worlds travel in share links; painted strokes don't. */
export function WorldTab() {
  const world = useStudio((s) => s.params.world)
  const { setParams } = useStudio.getState()

  const choose = (kind: WorldSpec['kind']) => {
    if (kind === world.kind) return
    if (kind === 'scatter') setParams({ world: { kind, count: 40 } })
    else if (kind === 'text') setParams({ world: { kind, text: 'filament' }, spawnPattern: 'food' })
    else if (kind === 'cities') setParams({ world: { kind, map: 'tokyo' }, spawnPattern: 'food' })
    else setParams({ world: { kind: 'none' } })
  }

  return (
    <>
      <section className={t.section}>
        <h3 className={t.heading}>Ground</h3>
        <Segmented label="Start with" options={KINDS} value={world.kind} onChange={choose} />
        {world.kind === 'scatter' && (
          <Scale
            bound={SCATTER_BOUND}
            value={world.count}
            defaultValue={40}
            onChange={(count) => setParams({ world: { kind: 'scatter', count } })}
          />
        )}
        {world.kind === 'text' && <WordsField text={world.text} />}
        {world.kind === 'cities' && (
          <p className={t.note}>
            Food where the cities around Tokyo sit, the bay walled off — after the 2010 experiment where a
            slime mould grew a rail network.
          </p>
        )}
      </section>
      <section className={t.section}>
        <h3 className={t.heading}>Paint</h3>
        <p className={t.note}>
          Paint food, walls and repellent straight onto the print with the tools on the left. Strokes stay
          until you erase them or start over.
        </p>
        <div className={t.actions}>
          <button
            type="button"
            className={t.textButton}
            onClick={() => window.dispatchEvent(new Event('filament:clear-paint'))}
          >
            <Eraser aria-hidden="true" />
            Clear paint
          </button>
        </div>
      </section>
    </>
  )
}

/** Typing restarts the run, so commit on a pause rather than on every keystroke. */
function WordsField({ text }: { text: string }) {
  const [draft, setDraft] = useState(text)
  useEffect(() => setDraft(text), [text])
  useEffect(() => {
    if (draft === text || !draft.trim()) return
    const id = setTimeout(() => useStudio.getState().setParams({ world: { kind: 'text', text: draft } }), 500)
    return () => clearTimeout(id)
  }, [draft, text])

  return (
    <label style={{ display: 'grid', gap: 6, paddingTop: 6 }}>
      <span className="visually-hidden">Words to grow</span>
      <input
        className={t.textField}
        value={draft}
        maxLength={TEXT_MAX_LENGTH}
        placeholder="Type a word"
        spellCheck={false}
        onChange={(e) => setDraft(e.target.value)}
      />
    </label>
  )
}
