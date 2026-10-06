import { useEffect, useRef, useState, type RefObject } from 'react'
import { getGpu, type Gpu, type GpuFailure } from '@/engine/device'
import { Simulation } from '@/engine/Simulation'
import { frameLoop } from '@/engine/frameLoop'
import type { Params } from '@/model/params'

export type SimStatus =
  { phase: 'starting' } | { phase: 'running'; gpu: Gpu } | { phase: 'failed'; failure: GpuFailure }

type Options = {
  /** Read every frame: 'run' steps the sim, 'frozen' only applies brushes and redraws, 'off' skips it. */
  mode?: RefObject<'run' | 'frozen' | 'off'>
}

/**
 * The brand face has to be in memory before a run starts: the 'text' world rasterises it into the
 * food layer, and a canvas silently uses a fallback face when the real one hasn't arrived.
 */
const fontsReady =
  typeof document !== 'undefined'
    ? Promise.race([
        document.fonts.load('expanded 800 32px "Archivo Variable"').then(() => undefined),
        new Promise<void>((resolve) => setTimeout(resolve, 1500)),
      ])
    : Promise.resolve()

/**
 * Mounts a Simulation on a canvas and ticks it from the app's single frame loop. The params passed
 * on the first render start the run; later changes go through the returned sim's setParams, so
 * callers decide whether those come from React state or a store subscription.
 */
export function useSimulation(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  initialParams: Params,
  options: Options = {},
) {
  const [status, setStatus] = useState<SimStatus>({ phase: 'starting' })
  const [sim, setSim] = useState<Simulation | null>(null)
  const initial = useRef(initialParams)
  const mode = options.mode

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    let instance: Simulation | null = null
    let unsubscribe: (() => void) | null = null

    void Promise.all([getGpu(), fontsReady]).then(([result]) => {
      // The await gives React time to unmount us; don't touch the GPU if it has.
      if (cancelled) return
      if (!result.ok) {
        setStatus({ phase: 'failed', failure: result.failure })
        return
      }
      try {
        instance = new Simulation(result.gpu.device, canvas, initial.current)
      } catch (err) {
        setStatus({
          phase: 'failed',
          failure: { kind: 'device-failed', message: err instanceof Error ? err.message : String(err) },
        })
        return
      }
      const sim = instance
      unsubscribe = frameLoop.add(() => {
        const m = mode?.current ?? 'run'
        if (m === 'run') sim.tick()
        else if (m === 'frozen') sim.frozenTick()
      })
      frameLoop.start()
      setSim(sim)
      setStatus({ phase: 'running', gpu: result.gpu })
    })

    return () => {
      cancelled = true
      unsubscribe?.()
      instance?.destroy()
      setSim(null)
    }
  }, [canvasRef, mode])

  return { sim, status }
}
