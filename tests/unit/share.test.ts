import { describe, expect, it } from 'vitest'
import { DEFAULTS, SPECIES_BOUNDS, fromUnknown } from '@/model/params'
import { decodeParams, encodeParams, migrate, paramsFromHash, paramsToHash } from '@/model/share'
import { PRESETS } from '@/model/presets'
import { mutate } from '@/model/mutate'

describe('share links', () => {
  it('round-trips every preset exactly', async () => {
    for (const preset of PRESETS) {
      expect(await decodeParams(await encodeParams(preset.params))).toEqual(preset.params)
    }
  })

  it('round-trips through the URL hash', async () => {
    const p = { ...DEFAULTS, speciesCount: 3, seed: 123456789 }
    const hash = await paramsToHash(p)
    expect(hash.startsWith('#run=')).toBe(true)
    expect(hash.slice('#run='.length)).not.toMatch(/[+/=]/)
    expect(await paramsFromHash(hash)).toEqual(p)
  })

  it('stays short enough to paste anywhere', async () => {
    const hash = await paramsToHash(PRESETS[0].params)
    expect(hash.length).toBeLessThan(700)
  })

  it('returns null for something that is not a payload, and defaults for an empty hash', async () => {
    expect(await decodeParams('not-a-payload')).toBeNull()
    expect(await paramsFromHash('')).toBeNull()
    expect(await paramsFromHash('#other=1')).toBeNull()
  })

  it('migrates a v1 single-species payload', () => {
    const p = migrate({ v: 1, p: { sensorAngle: 40, decayRate: 0.95, seed: 9, boundary: 'bounce' } })
    expect(p.speciesCount).toBe(1)
    expect(p.species[0].sensorAngle).toBe(40)
    expect(p.decayRate).toBe(0.95)
    expect(p.boundary).toBe('bounce')
    expect(p.seed).toBe(9)
  })
})

describe('mutate', () => {
  it('is reproducible from its seed and always valid', () => {
    for (let seed = 1; seed < 40; seed++) {
      const a = mutate(DEFAULTS, seed)
      expect(mutate(DEFAULTS, seed)).toEqual(a)
      expect(fromUnknown(a)).toEqual(a)
      expect(a.seed).toBe(seed)
      for (const s of a.species) {
        expect(s.sensorAngle).toBeGreaterThanOrEqual(SPECIES_BOUNDS.sensorAngle.min)
        expect(s.sensorAngle).toBeLessThanOrEqual(SPECIES_BOUNDS.sensorAngle.max)
      }
    }
  })

  it('actually varies', () => {
    expect(mutate(DEFAULTS, 1)).not.toEqual(mutate(DEFAULTS, 2))
  })
})
