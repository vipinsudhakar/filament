import { useEffect, useRef, type CSSProperties } from 'react'
import { useSimulation } from '@/lib/useSimulation'
import type { Params } from '@/model/params'
import type { Simulation } from '@/engine/Simulation'

/**
 * A live run in a canvas that only ticks while it's on screen. The landing page runs a hero, eight
 * contact-sheet frames and a test strip; ticking the ones scrolled out of view would spend the GPU
 * on pixels nobody sees.
 */
export function LiveFrame({
  params,
  className,
  style,
  onSim,
  label,
}: {
  params: Params
  className?: string
  style?: CSSProperties
  onSim?: (sim: Simulation | null) => void
  label?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mode = useRef<'run' | 'frozen' | 'off'>('off')
  const { sim } = useSimulation(canvasRef, params, { mode })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const io = new IntersectionObserver(([entry]) => {
      mode.current = entry.isIntersecting ? 'run' : 'off'
    })
    io.observe(canvas)
    return () => io.disconnect()
  }, [])

  useEffect(() => onSim?.(sim), [sim, onSim])

  return <canvas ref={canvasRef} className={className} style={style} role="img" aria-label={label} />
}
