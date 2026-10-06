import type { Params } from '@/model/params'
import { makeRng } from '@/engine/rng'

/**
 * Agent buffer layout: position (x, y), heading, species — four 32-bit words, matching
 * `struct Agent` in agents.wgsl. The species word is a u32, written through a Uint32Array view of
 * the same buffer.
 */
export const AGENT_STRIDE = 4
export const AGENT_BYTES = AGENT_STRIDE * 4

const TAU = Math.PI * 2

/**
 * Builds the initial agents on the CPU. Positions are grid cells, headings radians.
 *
 * Everything runs through the seeded RNG so the same (seed, pattern, count, grid) always lays
 * agents down the same way — the CPU end of the determinism guarantee. Species are interleaved
 * (agent a belongs to a % speciesCount) so every pattern starts with every species mixed in.
 *
 * `world` is the world layer (four floats per cell, food in the first), used by the 'food' pattern; without any food that
 * pattern falls back to a scatter so it still yields a live sim.
 */
export function spawnAgents(
  params: Params,
  count: number,
  width: number,
  height: number,
  world?: Float32Array,
): ArrayBuffer {
  const rng = makeRng(params.seed)
  const buffer = new ArrayBuffer(count * AGENT_BYTES)
  const f32 = new Float32Array(buffer)
  const u32 = new Uint32Array(buffer)

  const cx = width / 2
  const cy = height / 2
  const minSide = Math.min(width, height)

  const foodCells = params.spawnPattern === 'food' && world ? collectFood(world, width, height) : null
  const pattern = params.spawnPattern === 'food' && !foodCells?.length ? 'random' : params.spawnPattern

  // Grid pattern: a lattice with roughly square spacing that holds `count` points.
  const cols = Math.max(1, Math.round(Math.sqrt((count * width) / height)))
  const rows = Math.max(1, Math.ceil(count / cols))

  for (let a = 0; a < count; a++) {
    let x: number
    let y: number
    let angle: number

    switch (pattern) {
      case 'centre': {
        // A filled disc; sqrt keeps the density uniform rather than piling up in the middle.
        const r = Math.sqrt(rng.nextFloat()) * minSide * 0.18
        const t = rng.nextFloat() * TAU
        x = cx + Math.cos(t) * r
        y = cy + Math.sin(t) * r
        angle = rng.nextFloat() * TAU
        break
      }
      case 'ring': {
        const t = rng.nextFloat() * TAU
        const r = minSide * (0.3 + rng.nextFloat() * 0.04)
        x = cx + Math.cos(t) * r
        y = cy + Math.sin(t) * r
        angle = rng.nextFloat() * TAU
        break
      }
      case 'inward': {
        const t = rng.nextFloat() * TAU
        const r = minSide * 0.45
        x = cx + Math.cos(t) * r
        y = cy + Math.sin(t) * r
        angle = Math.atan2(cy - y, cx - x)
        break
      }
      case 'grid': {
        x = ((a % cols) + 0.5) * (width / cols)
        y = (Math.floor(a / cols) + 0.5) * (height / rows)
        angle = rng.nextFloat() * TAU
        break
      }
      case 'food': {
        const cell = foodCells![Math.floor(rng.nextFloat() * foodCells!.length)]
        x = (cell % width) + rng.nextFloat()
        y = Math.floor(cell / width) + rng.nextFloat()
        angle = rng.nextFloat() * TAU
        break
      }
      default: {
        x = rng.nextFloat() * width
        y = rng.nextFloat() * height
        angle = rng.nextFloat() * TAU
      }
    }

    const o = a * AGENT_STRIDE
    f32[o] = clampTo(x, width)
    f32[o + 1] = clampTo(y, height)
    f32[o + 2] = angle
    u32[o + 3] = a % params.speciesCount
  }

  return buffer
}

const clampTo = (v: number, size: number) => Math.min(size - 0.01, Math.max(0, v))

function collectFood(world: Float32Array, width: number, height: number): number[] {
  const cells: number[] = []
  for (let i = 0; i < width * height; i++) {
    if (world[i * 4] > 0.3) cells.push(i)
  }
  return cells
}
