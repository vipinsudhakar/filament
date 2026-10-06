import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { Params } from '@/model/params'
import { PRESETS, presetById } from '@/model/presets'
import { paramsFromHash, paramsToHash } from '@/model/share'
import { useStudio } from '@/pages/studio/store'
import { Stage } from './Stage'

/**
 * Resolve the run to open — a share link's hash beats ?preset=, which beats the first preset — then
 * hand off to the stage. Decoding a link is async (it's deflated), so the stage waits for it rather
 * than starting one run and immediately replacing it.
 */
export function Studio() {
  const [search] = useSearchParams()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const fromLink = await paramsFromHash(window.location.hash)
      const preset = presetById(search.get('preset')) ?? PRESETS[0]
      const params: Params = fromLink ?? preset.params
      if (cancelled) return
      useStudio.getState().replaceParams(params, fromLink ? null : preset.id)
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
    // Only the URL the studio was opened with matters; later changes are the studio's own writes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useHashSync(ready)

  useEffect(() => {
    document.title = 'Filament — Darkroom'
  }, [])

  return ready ? <Stage /> : <div style={{ height: '100svh', background: 'var(--dark-0)' }} />
}

/** Keep the address bar a live share link for the current run, without flooding history. */
function useHashSync(enabled: boolean) {
  const timer = useRef(0)
  useEffect(() => {
    if (!enabled) return
    return useStudio.subscribe((state, prev) => {
      if (state.params === prev.params) return
      clearTimeout(timer.current)
      timer.current = window.setTimeout(async () => {
        const hash = await paramsToHash(useStudio.getState().params)
        const url = `${window.location.pathname}${hash}`
        window.history.replaceState(window.history.state, '', url)
      }, 400)
    })
  }, [enabled])
}
