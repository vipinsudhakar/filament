import { describe, expect, it } from 'vitest'
import {
  DEFAULTS,
  GLOBAL_BOUNDS,
  MAX_AGENTS,
  MAX_SPECIES,
  SPECIES_BOUNDS,
  TEXT_MAX_LENGTH,
  agentCountFor,
  fromUnknown,
  needsRestart,
} from '@/model/params'

describe('fromUnknown', () => {
  it('returns the defaults for garbage', () => {
    expect(fromUnknown(null)).toEqual(DEFAULTS)
    expect(fromUnknown('nope')).toEqual(DEFAULTS)
    expect(fromUnknown({})).toEqual(DEFAULTS)
  })

  it('round-trips a valid params object unchanged', () => {
    const p = { ...DEFAULTS, speciesCount: 3, decayRate: 0.95, world: { kind: 'text', text: 'hi' } }
    expect(fromUnknown(p)).toEqual(p)
  })

  it('clamps out-of-range numbers to their bounds', () => {
    const p = fromUnknown({ decayRate: 5, diffuseRate: -1, density: 1e9, speciesCount: 99 })
    expect(p.decayRate).toBe(GLOBAL_BOUNDS.decayRate.max)
    expect(p.diffuseRate).toBe(GLOBAL_BOUNDS.diffuseRate.min)
    expect(p.density).toBe(GLOBAL_BOUNDS.density.max)
    expect(p.speciesCount).toBe(MAX_SPECIES)
  })

  it('falls back per field, so one bad key does not cost the rest', () => {
    const p = fromUnknown({ decayRate: 'banana', diffuseRate: 0.5 })
    expect(p.decayRate).toBe(DEFAULTS.decayRate)
    expect(p.diffuseRate).toBe(0.5)
  })

  it('validates species, colours and the interaction matrix', () => {
    const p = fromUnknown({
      species: [
        { sensorAngle: 500, color: 'red' },
        { color: '#ABCDEF', sensorSize: 1.6 },
      ],
      interaction: [2, -3, 'x'],
    })
    expect(p.species).toHaveLength(MAX_SPECIES)
    expect(p.species[0].sensorAngle).toBe(SPECIES_BOUNDS.sensorAngle.max)
    expect(p.species[0].color).toBe(DEFAULTS.species[0].color)
    expect(p.species[1].color).toBe('#abcdef')
    expect(p.species[1].sensorSize).toBe(2)
    expect(p.interaction.slice(0, 3)).toEqual([1, -1, DEFAULTS.interaction[2]])
    expect(p.interaction).toHaveLength(16)
  })

  it('keeps seeds in u32 range', () => {
    expect(fromUnknown({ seed: -5 }).seed).toBe(5)
    expect(fromUnknown({ seed: 2 ** 32 + 3 }).seed).toBe(3)
    expect(fromUnknown({ seed: 1.9 }).seed).toBe(1)
  })

  it('sanitises world specs', () => {
    expect(fromUnknown({ world: { kind: 'text', text: '   ' } }).world).toEqual({ kind: 'none' })
    const long = fromUnknown({ world: { kind: 'text', text: 'x'.repeat(100) } }).world
    expect(long.kind === 'text' && long.text.length).toBe(TEXT_MAX_LENGTH)
    expect(fromUnknown({ world: { kind: 'scatter', count: 1e6 } }).world).toEqual({
      kind: 'scatter',
      count: 400,
    })
    expect(fromUnknown({ world: { kind: 'lava' } }).world).toEqual({ kind: 'none' })
  })
})

describe('needsRestart', () => {
  it('restarts for population-defining changes only', () => {
    expect(needsRestart(DEFAULTS, { ...DEFAULTS, seed: 2 })).toBe(true)
    expect(needsRestart(DEFAULTS, { ...DEFAULTS, speciesCount: 2 })).toBe(true)
    expect(needsRestart(DEFAULTS, { ...DEFAULTS, world: { kind: 'scatter', count: 5 } })).toBe(true)
    expect(needsRestart(DEFAULTS, { ...DEFAULTS, decayRate: 0.8 })).toBe(false)
    expect(needsRestart(DEFAULTS, { ...DEFAULTS, look: { ...DEFAULTS.look, glow: 1 } })).toBe(false)
  })
})

describe('agentCountFor', () => {
  it('scales with the grid and respects the ceiling', () => {
    expect(agentCountFor({ ...DEFAULTS, density: 0.5 }, 100, 100)).toBe(5000)
    expect(agentCountFor({ ...DEFAULTS, density: 2 }, 4000, 4000)).toBe(MAX_AGENTS)
  })
})
