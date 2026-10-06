import { Minus, Plus } from 'lucide-react'
import { useStudio } from '@/pages/studio/store'
import { Mark } from '@/components/Mark'
import { TOOLS, TOOL_ORDER } from '@/pages/studio/tools'
import styles from './ToolRail.module.css'

/** What you paint with. Literal names; the chosen one is circled; number keys pick them. */
export function ToolRail() {
  const tool = useStudio((s) => s.tool)
  const brushSize = useStudio((s) => s.brushSize)
  const set = useStudio((s) => s.set)

  return (
    <nav className={styles.rail} aria-label="Brush tools">
      <ul className={styles.tools}>
        {TOOL_ORDER.map((id, i) => {
          const { label, hint, icon: Icon } = TOOLS[id]
          const active = id === tool
          return (
            <li key={id}>
              <button
                type="button"
                className={styles.tool}
                aria-pressed={active}
                title={`${hint} (${i + 1})`}
                onClick={() => set({ tool: id })}
              >
                <Mark active={active} seed={i + 3} className={styles.mark}>
                  <span className={styles.icon}>
                    <Icon aria-hidden="true" />
                  </span>
                </Mark>
                <span className={styles.label}>{label}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className={styles.size} role="group" aria-label="Brush size">
        <button
          type="button"
          className={styles.step}
          aria-label="Smaller brush"
          title="Smaller brush ( [ )"
          onClick={() => set({ brushSize: Math.max(4, brushSize - 4) })}
        >
          <Minus size={14} strokeWidth={1.8} />
        </button>
        <span className={styles.dot} aria-hidden="true">
          <span style={{ width: Math.min(28, 4 + brushSize / 3), height: Math.min(28, 4 + brushSize / 3) }} />
        </span>
        <output className={styles.reading} aria-label={`Brush size ${brushSize}`}>
          {brushSize}
        </output>
        <button
          type="button"
          className={styles.step}
          aria-label="Bigger brush"
          title="Bigger brush ( ] )"
          onClick={() => set({ brushSize: Math.min(120, brushSize + 4) })}
        >
          <Plus size={14} strokeWidth={1.8} />
        </button>
      </div>
    </nav>
  )
}
