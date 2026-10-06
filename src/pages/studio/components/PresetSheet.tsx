import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { PRESETS } from '@/model/presets'
import { useStudio } from '@/pages/studio/store'
import { usePresetPrints } from '@/lib/prints'
import { forgetRun, listRuns, type KeptRun } from '@/pages/studio/runs'
import { Mark } from '@/components/Mark'
import styles from './PresetSheet.module.css'

/**
 * The contact sheet: every preset as a developed print on a strip, then the runs kept in this
 * browser. The current frame is circled in china marker, the way you'd mark the one to print.
 */
export function PresetSheet({ onPick }: { onPick: () => void }) {
  const prints = usePresetPrints()
  const presetId = useStudio((s) => s.presetId)
  const runs = useKeptRuns()

  return (
    <div className={styles.sheet}>
      <h2 className={styles.title}>Presets</h2>
      <ol className={styles.strip}>
        {PRESETS.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              className={styles.frame}
              onClick={() => {
                useStudio.getState().replaceParams(p.params, p.id)
                onPick()
              }}
            >
              <span className={styles.rebate}>
                <span>{p.code}</span>
                <span aria-hidden="true">▸</span>
              </span>
              <Mark active={p.id === presetId} seed={i + 31} className={styles.markWrap}>
                <span className={styles.print}>
                  {prints.get(p.id) ? (
                    <img src={prints.get(p.id)} alt="" />
                  ) : (
                    <span className={styles.developing} aria-label="Developing" />
                  )}
                </span>
              </Mark>
              <span className={styles.name}>{p.name}</span>
            </button>
          </li>
        ))}
      </ol>

      <h2 className={styles.title}>Your prints</h2>
      {runs.length === 0 ? (
        <p className={styles.empty}>Keep a run with the bookmark and it lands here, in this browser.</p>
      ) : (
        <ol className={styles.strip}>
          {runs.map((run, i) => (
            <li key={run.id} className={styles.kept}>
              <button
                type="button"
                className={styles.frame}
                onClick={() => {
                  useStudio.getState().replaceParams(run.params, null)
                  onPick()
                }}
              >
                <span className={styles.rebate}>
                  <span>{String(runs.length - i).padStart(2, '0')}K</span>
                  <span>
                    {new Date(run.createdAt).toLocaleDateString(undefined, {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                </span>
                <span className={styles.print}>
                  <img src={run.thumb} alt="" />
                </span>
              </button>
              <button
                type="button"
                className={styles.forget}
                aria-label="Remove this print"
                onClick={() => forgetRun(run.id)}
              >
                <X size={12} strokeWidth={2} />
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function useKeptRuns(): KeptRun[] {
  const [runs, setRuns] = useState(listRuns)
  useEffect(() => {
    const update = () => setRuns(listRuns())
    window.addEventListener('filament:runs', update)
    return () => window.removeEventListener('filament:runs', update)
  }, [])
  return runs
}
