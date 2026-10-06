import { useEffect, useState } from 'react'
import { getGpu } from '@/engine/device'
import { Simulation } from '@/engine/Simulation'
import { PRESETS } from '@/model/presets'

/**
 * Preset thumbnails, developed in the browser rather than shipped as images: each preset runs for a
 * few hundred steps on a small hidden canvas and is printed to a PNG. They stay true to the engine
 * by construction, and cost nothing to keep in step when a preset is retuned.
 *
 * Prints are developed one at a time, cached for the session, and shared by every caller.
 */
const cache = new Map<string, string>()
const listeners = new Set<() => void>()
let developing: Promise<void> | null = null

const STEPS = 360

async function developAll() {
  const gpu = await getGpu()
  if (!gpu.ok) return
  const canvas = document.createElement('canvas')
  // Laid out (so it has a size) but never seen.
  canvas.style.cssText = 'position:fixed;left:-10000px;top:0;width:384px;height:240px;visibility:hidden'
  document.body.appendChild(canvas)
  try {
    for (const preset of PRESETS) {
      if (cache.has(preset.id)) continue
      const sim = new Simulation(gpu.gpu.device, canvas, { ...preset.params, speed: 8 })
      for (let i = 0; i < STEPS / 8; i++) sim.tick()
      const blob = await sim.snapshot()
      sim.destroy()
      if (blob) cache.set(preset.id, URL.createObjectURL(blob))
      listeners.forEach((l) => l())
      // Let the page breathe between prints.
      await gpu.gpu.device.queue.onSubmittedWorkDone()
      await new Promise((r) => setTimeout(r, 30))
    }
  } finally {
    canvas.remove()
  }
}

export function usePresetPrints(enabled = true): Map<string, string> {
  const [, force] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const listener = () => force((n) => n + 1)
    listeners.add(listener)
    developing ??= developAll()
    return () => {
      listeners.delete(listener)
    }
  }, [enabled])
  return cache
}
