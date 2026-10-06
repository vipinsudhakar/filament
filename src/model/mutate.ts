import { makeRng } from '@/engine/rng'
import { DEFAULTS, MAX_SPECIES, SPECIES_COLORS, fromUnknown, type Params } from '@/model/params'

/**
 * A random run that's likely to be beautiful. Not a uniform draw over the bounds — most of that
 * space is noise or a dead black screen — but over the ranges where Physarum makes structure:
 * sensors a little wider than the turn, reach a few to a few dozen cells, deposit well under decay.
 *
 * Seeded, so a mutation is just another reproducible run.
 */
export function mutate(base: Params, seed: number): Params {
  const rng = makeRng(seed ^ 0x2545f491)
  const r = (min: number, max: number) => min + rng.nextFloat() * (max - min)
  const pick = <T>(items: readonly T[]) => items[Math.floor(rng.nextFloat() * items.length)]

  const speciesCount = pick([1, 1, 2, 2, 3, 4])
  const palette = [...SPECIES_COLORS]
  for (let i = palette.length - 1; i > 0; i--) {
    const j = Math.floor(rng.nextFloat() * (i + 1))
    ;[palette[i], palette[j]] = [palette[j], palette[i]]
  }

  const species = Array.from({ length: MAX_SPECIES }, (_, i) => {
    const sensorAngle = r(15, 70)
    return {
      sensorAngle,
      // Turning a bit less than the sensors are spread keeps paths smooth; a bit more makes loops.
      turnSpeed: sensorAngle * r(0.5, 1.3),
      sensorDistance: r(4, 32),
      sensorSize: pick([0, 1, 1, 2]),
      moveSpeed: r(0.6, 2.2),
      depositAmount: r(0.05, 0.25),
      color:
        speciesCount === 1
          ? pick(['#f2b45a', '#e8e0cf', '#d4513a', '#6b9ec4', '#7fb7ff', '#c9a26b'])
          : palette[i % palette.length],
    }
  })

  const interaction: number[] = []
  for (let s = 0; s < MAX_SPECIES; s++) {
    for (let c = 0; c < MAX_SPECIES; c++) interaction.push(s === c ? r(0.6, 1) : r(-1, 0.6))
  }

  return fromUnknown({
    ...base,
    speciesCount,
    species,
    interaction,
    density: r(0.08, 0.45),
    decayRate: r(0.86, 0.97),
    diffuseRate: r(0.1, 0.5),
    spawnPattern: pick(['random', 'random', 'centre', 'ring', 'inward']),
    look: {
      ...base.look,
      exposure: r(0.5, 0.9),
      glow: r(0.3, 0.7),
      background: base.look.background ?? DEFAULTS.look.background,
    },
    seed,
  })
}
