import {
  DEFAULTS,
  MAX_SPECIES,
  SPECIES_COLORS,
  fromUnknown,
  type Look,
  type Params,
  type Species,
} from '@/model/params'

export type Preset = {
  id: string
  name: string
  /** Edge-print code, the way a frame is marked on a strip of film. */
  code: string
  params: Params
}

type SpeciesPatch = Partial<Species>

/** Build a full Params from DEFAULTS plus a patch, applying one species patch to every species. */
function make(
  patch: Partial<Omit<Params, 'species' | 'look'>> & {
    species?: SpeciesPatch | SpeciesPatch[]
    look?: Partial<Look>
  },
): Params {
  const { species, ...rest } = patch
  const list = Array.isArray(species) ? species : Array.from({ length: MAX_SPECIES }, () => species ?? {})
  return fromUnknown({
    ...DEFAULTS,
    ...rest,
    look: { ...DEFAULTS.look, ...rest.look },
    species: DEFAULTS.species.map((base, i) => ({ ...base, ...(list[i] ?? list[0]) })),
  })
}

/** Species s follows s+1's trail and flees s-1's — a ring of pursuit with no winner. */
function chaseMatrix(n: number): number[] {
  const m: number[] = []
  for (let s = 0; s < MAX_SPECIES; s++) {
    for (let c = 0; c < MAX_SPECIES; c++) {
      if (s >= n || c >= n) m.push(0)
      else if (c === s) m.push(1)
      else if (c === (s + 1) % n) m.push(0.7)
      else if (c === (s + n - 1) % n) m.push(-0.9)
      else m.push(0)
    }
  }
  return m
}

const RAW: Preset[] = [
  {
    id: 'web',
    name: 'Web',
    code: '01A',
    params: make({
      density: 0.3,
      diffuseRate: 0.2,
      species: { sensorDistance: 10 },
      look: { exposure: 0.7, glow: 0.35 },
    }),
  },
  {
    id: 'rivers',
    name: 'Rivers',
    code: '02A',
    params: make({
      density: 0.12,
      decayRate: 0.97,
      diffuseRate: 0.45,
      species: {
        sensorAngle: 22,
        sensorDistance: 28,
        turnSpeed: 12,
        moveSpeed: 1.8,
        depositAmount: 0.06,
        color: '#7fb7ff',
      },
      look: { exposure: 0.55, glow: 0.7, glowRadius: 2.2 },
      seed: 7,
    }),
  },
  {
    id: 'tribes',
    name: 'Three Tribes',
    code: '03A',
    params: make({ speciesCount: 3, density: 0.3, look: { exposure: 0.6, glow: 0.4 }, seed: 3 }),
  },
  {
    id: 'cells',
    name: 'Cells',
    code: '04A',
    params: make({
      density: 0.5,
      decayRate: 0.85,
      diffuseRate: 0.2,
      species: {
        sensorAngle: 60,
        sensorDistance: 5,
        sensorSize: 0,
        turnSpeed: 55,
        moveSpeed: 0.8,
        depositAmount: 0.08,
        color: '#d4513a',
      },
      look: { exposure: 0.55, glow: 0.35 },
      seed: 11,
    }),
  },
  {
    id: 'chase',
    name: 'Chase',
    code: '05A',
    params: make({
      speciesCount: 4,
      density: 0.16,
      interaction: chaseMatrix(4),
      decayRate: 0.94,
      species: { sensorAngle: 28, sensorDistance: 20, turnSpeed: 24, moveSpeed: 1.3 },
      look: { exposure: 0.6, glow: 0.45 },
      seed: 5,
    }),
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    code: '06A',
    params: make({
      density: 0.05,
      spawnPattern: 'food',
      world: { kind: 'cities', map: 'tokyo' },
      decayRate: 0.95,
      foodEmit: 0.6,
      look: { exposure: 0.8, glow: 0.5 },
    }),
  },
  {
    id: 'bloom',
    name: 'Bloom',
    code: '07A',
    params: make({
      speciesCount: 2,
      density: 0.18,
      spawnPattern: 'centre',
      decayRate: 0.93,
      diffuseRate: 0.25,
      species: [
        { sensorAngle: 35, sensorDistance: 20, turnSpeed: 20, moveSpeed: 1.6, color: SPECIES_COLORS[0] },
        { sensorAngle: 35, sensorDistance: 20, turnSpeed: 20, moveSpeed: 1.6, color: '#6b9ec4' },
      ],
      look: { exposure: 0.6, glow: 0.6 },
      seed: 21,
    }),
  },
  {
    id: 'signal',
    name: 'Signal',
    code: '08A',
    params: make({
      density: 0.08,
      spawnPattern: 'food',
      world: { kind: 'text', text: 'filament' },
      foodEmit: 0.25,
      decayRate: 0.92,
      species: { color: '#ebe4d4' },
      look: { exposure: 0.7, glow: 0.5 },
    }),
  },
]

export const presetById = (id: string | null | undefined) => PRESETS.find((p) => p.id === id)

/** Showcase order: the most arresting frames first. Codes follow the order, like frames on a strip. */
const ORDER = ['tribes', 'bloom', 'rivers', 'tokyo', 'cells', 'chase', 'signal', 'web']

export const PRESETS: Preset[] = ORDER.map((id, i) => ({
  ...RAW.find((p) => p.id === id)!,
  code: `${String(i + 1).padStart(2, '0')}A`,
}))
