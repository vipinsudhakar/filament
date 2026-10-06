import { useEffect, useState } from 'react'
import { getGpu } from '@/engine/device'
import { Simulation } from '@/engine/Simulation'
import { PRESETS } from '@/model/presets'

/**
 * Preset prints, developed in the browser rather than shipped as images: each preset runs for a
 * few hundred steps on a small hidden canvas and is printed to a PNG. They stay true to the engine
 * by construction, and cost nothing to keep in step when a preset is retuned.
 *
 * Prints develop one at a time, in the order they're asked for, and are cached for the session and
 * shared by every caller. The work happens once; after that a print is just an <img>.
 */
const cache = new Map<string, string>()
const listeners = new Set<() => void>()
const queue: string[] = []
let developing = false

/** How far a print is developed. A live run that should pick up where a print left off steps this far first. */
export const PRINT_STEPS = 360

async function developQueued() {
  if (developing) return
  developing = true
  const gpu = await getGpu()
  if (!gpu.ok) {
    developing = false
    return
  }
  const canvas = document.createElement('canvas')
  // Laid out (so it has a size) but never seen.
  canvas.style.cssText = 'position:fixed;left:-10000px;top:0;width:448px;height:280px;visibility:hidden'
  document.body.appendChild(canvas)
  try {
    while (queue.length) {
      const id = queue.shift()!
      const preset = PRESETS.find((p) => p.id === id)
      if (!preset || cache.has(id)) continue
      const sim = new Simulation(gpu.gpu.device, canvas, { ...preset.params, speed: 8 })
      for (let i = 0; i < PRINT_STEPS / 8; i++) sim.tick()
      const blob = await sim.snapshot()
      sim.destroy()
      if (blob) cache.set(id, URL.createObjectURL(blob))
      listeners.forEach((l) => l())
      // Let the page breathe between prints.
      await gpu.gpu.device.queue.onSubmittedWorkDone()
      await new Promise((r) => setTimeout(r, 30))
    }
  } finally {
    canvas.remove()
    developing = false
  }
}

/** Prints for the given presets (all of them by default), developed on first use. */
export function usePresetPrints(
  ids: string[] = PRESETS.map((p) => p.id),
  enabled = true,
): Map<string, string> {
  const [, force] = useState(0)
  const key = ids.join(',')
  useEffect(() => {
    if (!enabled) return
    const listener = () => force((n) => n + 1)
    listeners.add(listener)
    for (const id of key.split(',')) if (!cache.has(id) && !queue.includes(id)) queue.push(id)
    void developQueued()
    return () => {
      listeners.delete(listener)
    }
  }, [key, enabled])
  return cache
}
