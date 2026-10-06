import { describe, expect, it } from 'vitest'
import { DEFAULTS, MAX_AGENTS } from '@/model/params'
import { makeRng, pcgHash } from '@/engine/rng'
import { AGENT_STRIDE, spawnAgents } from '@/engine/spawn'
import { depositScaleFor, hexToLinear } from '@/engine/uniforms'
import { generateWorld, WORLD_STRIDE } from '@/engine/world'

describe('rng', () => {
  it('matches the pinned reference values', () => {
    // If these move, the GPU copy in rng.wgsl no longer matches and every shared link replays
    // differently. scripts/rng-check.mjs checks the GPU side against the same function.
    expect([pcgHash(0), pcgHash(1), pcgHash(0xffffffff)]).toMatchSnapshot()
  })

  it('gives the same stream for the same seed and different streams for neighbouring seeds', () => {
    const a = makeRng(42)
    const b = makeRng(42)
    const c = makeRng(43)
    const sa = Array.from({ length: 8 }, () => a.nextU32())
    expect(Array.from({ length: 8 }, () => b.nextU32())).toEqual(sa)
    expect(Array.from({ length: 8 }, () => c.nextU32())).not.toEqual(sa)
  })

  it('maps into [0, 1)', () => {
    const r = makeRng(7)
    for (let i = 0; i < 1000; i++) {
      const f = r.nextFloat()
      expect(f).toBeGreaterThanOrEqual(0)
      expect(f).toBeLessThan(1)
    }
  })
})

describe('spawnAgents', () => {
  const p = { ...DEFAULTS, speciesCount: 3 }

  it('is deterministic for the same params', () => {
    const a = new Uint8Array(spawnAgents(p, 500, 200, 100))
    const b = new Uint8Array(spawnAgents(p, 500, 200, 100))
    expect(a).toEqual(b)
  })

  it('changes with the seed', () => {
    const a = new Uint8Array(spawnAgents(p, 500, 200, 100))
    const b = new Uint8Array(spawnAgents({ ...p, seed: 2 }, 500, 200, 100))
    expect(a).not.toEqual(b)
  })

  it('keeps every agent on the grid and interleaves species', () => {
    for (const spawnPattern of ['random', 'centre', 'ring', 'inward', 'grid', 'food'] as const) {
      const buf = spawnAgents({ ...p, spawnPattern }, 999, 120, 80)
      const f = new Float32Array(buf)
      const u = new Uint32Array(buf)
      for (let a = 0; a < 999; a++) {
        const o = a * AGENT_STRIDE
        expect(f[o]).toBeGreaterThanOrEqual(0)
        expect(f[o]).toBeLessThan(120)
        expect(f[o + 1]).toBeGreaterThanOrEqual(0)
        expect(f[o + 1]).toBeLessThan(80)
        expect(u[o + 3]).toBe(a % 3)
      }
    }
  })

  it('spawns on food when asked and there is some', () => {
    const world = generateWorld({ kind: 'scatter', count: 3 }, 100, 100, 1)!
    const buf = new Float32Array(spawnAgents({ ...p, spawnPattern: 'food' }, 200, 100, 100, world))
    for (let a = 0; a < 200; a++) {
      const x = Math.floor(buf[a * AGENT_STRIDE])
      const y = Math.floor(buf[a * AGENT_STRIDE + 1])
      expect(world[(y * 100 + x) * WORLD_STRIDE]).toBeGreaterThan(0.3)
    }
  })
})

describe('depositScaleFor', () => {
  it('uses the full 4096 when there is headroom', () => {
    expect(depositScaleFor(DEFAULTS, 1000)).toBe(4096)
  })

  it('never lets the worst case overflow u32, and stays a power of two', () => {
    const p = { ...DEFAULTS, species: DEFAULTS.species.map((s) => ({ ...s, depositAmount: 2 })) }
    const s = depositScaleFor(p, MAX_AGENTS)
    expect(Math.log2(s) % 1).toBe(0)
    expect(MAX_AGENTS * 2 * s).toBeLessThanOrEqual(0xffffffff)
  })
})

describe('generateWorld', () => {
  it('is empty for none and deterministic for scatter', () => {
    expect(generateWorld({ kind: 'none' }, 10, 10, 1)).toBeNull()
    const a = generateWorld({ kind: 'scatter', count: 10 }, 64, 64, 9)
    const b = generateWorld({ kind: 'scatter', count: 10 }, 64, 64, 9)
    expect(a).toEqual(b)
  })

  it('walls off the bay and places food for the cities map', () => {
    const w = generateWorld({ kind: 'cities', map: 'tokyo' }, 300, 200, 1)!
    let walls = 0
    let food = 0
    for (let i = 0; i < 300 * 200; i++) {
      if (w[i * WORLD_STRIDE + 1] > 0) walls++
      if (w[i * WORLD_STRIDE] > 0) food++
    }
    expect(walls).toBeGreaterThan(100)
    expect(food).toBeGreaterThan(100)
  })
})

describe('hexToLinear', () => {
  it('converts sRGB to linear light', () => {
    expect(hexToLinear('#000000')).toEqual([0, 0, 0])
    expect(hexToLinear('#ffffff')).toEqual([1, 1, 1])
    expect(hexToLinear('#808080')[0]).toBeCloseTo(0.2158, 3)
  })
})
