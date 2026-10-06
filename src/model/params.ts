/**
 * The parameter schema.
 *
 * A public contract, not an internal type: a run is fully described by these values plus the
 * seed, which is what makes runs shareable as a link. Once links exist in the wild the shape can
 * only be extended through SCHEMA_VERSION and a migration in model/share.ts — never quietly
 * redesigned, or every posted link goes dead.
 */
export const SCHEMA_VERSION = 2

export const MAX_SPECIES = 4

/** Hard ceiling on the population, whatever the density and screen size work out to. */
export const MAX_AGENTS = 4_000_000

export type SpawnPattern = 'random' | 'centre' | 'ring' | 'inward' | 'grid' | 'food'
export type Boundary = 'wrap' | 'bounce'

export type Species = {
  /** Half-angle between the centre sensor and each side sensor, degrees. */
  sensorAngle: number
  /** How far ahead the sensors sit, in grid cells. */
  sensorDistance: number
  /** Sensor sample radius in cells; 0 samples a single cell. */
  sensorSize: number
  /** Turn per step, degrees. */
  turnSpeed: number
  /** Cells travelled per step. */
  moveSpeed: number
  /** Trail added at the agent's cell each step. */
  depositAmount: number
  /** Emission colour, #rrggbb. */
  color: string
}

/**
 * What the world layer is seeded with. Brush strokes are deliberately not part of this — a
 * share link carries the generator, not a bitmap.
 */
export type WorldSpec =
  | { kind: 'none' }
  | { kind: 'scatter'; count: number }
  | { kind: 'text'; text: string }
  | { kind: 'cities'; map: 'tokyo' }

export type Look = {
  exposure: number
  glow: number
  glowRadius: number
  vignette: number
  background: string
}

export type Params = {
  speciesCount: number
  /** Agents per grid cell. Density rather than a raw count, so a run looks the same on any screen. */
  density: number
  species: Species[]
  /** Row-major MAX_SPECIES x MAX_SPECIES: interaction[s * 4 + c] is how species s weighs channel c. */
  interaction: number[]
  /** Trail retained per step. */
  decayRate: number
  /** How far each cell blends toward its 3x3 mean, 0..1. */
  diffuseRate: number
  /** Chemoattractant a food cell emits into every channel per step. */
  foodEmit: number
  /** Sim grid size as a fraction of the canvas's CSS size. */
  simScale: number
  /** Simulation steps per rendered frame. 0 freezes the organism but keeps drawing. */
  speed: number
  spawnPattern: SpawnPattern
  boundary: Boundary
  world: WorldSpec
  look: Look
  seed: number
}

export type Bound = {
  min: number
  max: number
  step: number
  label: string
  hint?: string
  /** Slider feel for ranges that span orders of magnitude. */
  scale?: 'log'
  unit?: string
}

export type SpeciesNumericKey = Exclude<keyof Species, 'color'>
export type GlobalNumericKey = 'density' | 'decayRate' | 'diffuseRate' | 'foodEmit' | 'simScale' | 'speed'
export type LookNumericKey = Exclude<keyof Look, 'background'>

/**
 * Single source of truth for ranges: sliders read min/max/step from here and fromUnknown()
 * clamps against the same tables, so a hand-edited link can't reach a state the UI never would.
 */
export const SPECIES_BOUNDS: Record<SpeciesNumericKey, Bound> = {
  sensorAngle: {
    min: 1,
    max: 120,
    step: 0.5,
    label: 'Sensor angle',
    unit: '°',
    hint: 'Spread between the side sensors and the centre one',
  },
  sensorDistance: {
    min: 1,
    max: 64,
    step: 0.5,
    label: 'Sensor reach',
    unit: 'px',
    hint: 'How far ahead each agent smells',
  },
  sensorSize: { min: 0, max: 3, step: 1, label: 'Sensor size', hint: 'Radius each sensor averages over' },
  turnSpeed: {
    min: 1,
    max: 120,
    step: 0.5,
    label: 'Turn speed',
    unit: '°',
    hint: 'How sharply an agent steers per step',
  },
  moveSpeed: {
    min: 0.1,
    max: 6,
    step: 0.05,
    label: 'Move speed',
    unit: 'px',
    hint: 'Distance travelled per step',
  },
  depositAmount: { min: 0.01, max: 2, step: 0.01, label: 'Deposit', hint: 'Trail laid down per step' },
}

export const GLOBAL_BOUNDS: Record<GlobalNumericKey, Bound> = {
  density: { min: 0.01, max: 2, step: 0.01, label: 'Density', scale: 'log', hint: 'Agents per grid cell' },
  decayRate: {
    min: 0.5,
    max: 0.999,
    step: 0.001,
    label: 'Persistence',
    hint: 'Trail kept each step — higher means longer memory',
  },
  diffuseRate: {
    min: 0,
    max: 1,
    step: 0.01,
    label: 'Diffusion',
    hint: 'How quickly trails blur into their surroundings',
  },
  foodEmit: { min: 0, max: 2, step: 0.01, label: 'Food scent', hint: 'Attractant each food cell gives off' },
  simScale: { min: 0.25, max: 1, step: 0.05, label: 'Resolution', hint: 'Grid size relative to the screen' },
  speed: { min: 0, max: 8, step: 1, label: 'Speed', unit: '×', hint: 'Simulation steps per frame' },
}

export const LOOK_BOUNDS: Record<LookNumericKey, Bound> = {
  exposure: { min: 0.1, max: 8, step: 0.05, label: 'Exposure', scale: 'log' },
  glow: { min: 0, max: 2, step: 0.01, label: 'Glow' },
  glowRadius: { min: 0.5, max: 4, step: 0.05, label: 'Glow radius' },
  vignette: { min: 0, max: 1, step: 0.01, label: 'Vignette' },
}

export const INTERACTION_BOUND: Bound = { min: -1, max: 1, step: 0.05, label: 'Interaction' }
export const SCATTER_BOUND: Bound = { min: 1, max: 400, step: 1, label: 'Food sources' }
export const TEXT_MAX_LENGTH = 24

export const SPAWN_PATTERNS: SpawnPattern[] = ['random', 'centre', 'ring', 'inward', 'grid', 'food']
export const BOUNDARIES: Boundary[] = ['wrap', 'bounce']
export const WORLD_KINDS: WorldSpec['kind'][] = ['none', 'scatter', 'text', 'cities']

export const SPAWN_LABELS: Record<SpawnPattern, string> = {
  random: 'Scatter',
  centre: 'Centre',
  ring: 'Ring',
  inward: 'Inward ring',
  grid: 'Grid',
  food: 'On food',
}

/**
 * The four default emission colours, from the darkroom's own chemistry: warm-tone amber, paper
 * white, rust, and cyanotype blue. Distinguishable when they blend, and never neon.
 */
export const SPECIES_COLORS = ['#f2b45a', '#e8e0cf', '#d4513a', '#6b9ec4']

export const DEFAULT_SPECIES: Species = {
  sensorAngle: 25,
  sensorDistance: 12,
  sensorSize: 1,
  turnSpeed: 28,
  moveSpeed: 1.1,
  depositAmount: 0.12,
  color: SPECIES_COLORS[0],
}

/** Each species follows its own trail and shies away from the others. */
export function defaultInteraction(): number[] {
  const m: number[] = []
  for (let s = 0; s < MAX_SPECIES; s++) {
    for (let c = 0; c < MAX_SPECIES; c++) m.push(s === c ? 1 : -0.5)
  }
  return m
}

/**
 * The classic dense web: the standard Physarum balance tuned on the original prototype — sensors
 * a little ahead and to the side, a moderate turn, deposit well under what decay removes.
 */
export const DEFAULTS: Params = {
  speciesCount: 1,
  density: 0.3,
  species: SPECIES_COLORS.map((color) => ({ ...DEFAULT_SPECIES, color })),
  interaction: defaultInteraction(),
  decayRate: 0.9,
  diffuseRate: 0.3,
  foodEmit: 0.4,
  simScale: 1,
  speed: 1,
  spawnPattern: 'random',
  boundary: 'wrap',
  world: { kind: 'none' },
  look: { exposure: 0.75, glow: 0.45, glowRadius: 1.5, vignette: 0.35, background: '#0b0908' },
  seed: 1,
}

const clamp = (v: number, { min, max }: Bound) => Math.min(max, Math.max(min, v))

function num(value: unknown, bound: Bound, fallback: number, integer = false): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (value === undefined || value === null || value === '' || !Number.isFinite(n)) return fallback
  const v = clamp(n, bound)
  return integer ? Math.round(v) : v
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

const HEX = /^#[0-9a-f]{6}$/i
const color = (value: unknown, fallback: string) =>
  typeof value === 'string' && HEX.test(value) ? value.toLowerCase() : fallback

const record = (input: unknown) =>
  (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>

function speciesFrom(input: unknown, fallback: Species): Species {
  const o = record(input)
  return {
    sensorAngle: num(o.sensorAngle, SPECIES_BOUNDS.sensorAngle, fallback.sensorAngle),
    sensorDistance: num(o.sensorDistance, SPECIES_BOUNDS.sensorDistance, fallback.sensorDistance),
    sensorSize: num(o.sensorSize, SPECIES_BOUNDS.sensorSize, fallback.sensorSize, true),
    turnSpeed: num(o.turnSpeed, SPECIES_BOUNDS.turnSpeed, fallback.turnSpeed),
    moveSpeed: num(o.moveSpeed, SPECIES_BOUNDS.moveSpeed, fallback.moveSpeed),
    depositAmount: num(o.depositAmount, SPECIES_BOUNDS.depositAmount, fallback.depositAmount),
    color: color(o.color, fallback.color),
  }
}

function worldFrom(input: unknown): WorldSpec {
  const o = record(input)
  switch (o.kind) {
    case 'scatter':
      return { kind: 'scatter', count: num(o.count, SCATTER_BOUND, 40, true) }
    case 'text': {
      const text = typeof o.text === 'string' ? o.text.slice(0, TEXT_MAX_LENGTH) : ''
      return text.trim() ? { kind: 'text', text } : { kind: 'none' }
    }
    case 'cities':
      return { kind: 'cities', map: 'tokyo' }
    default:
      return { kind: 'none' }
  }
}

/**
 * Coerce anything — a decoded link payload, a stored run, a hand-typed object — into a valid
 * Params. Never throws and never returns something out of bounds: a bad field falls back to its
 * default instead of rejecting the whole payload, so one mangled key doesn't cost the whole run.
 */
export function fromUnknown(input: unknown): Params {
  const o = record(input)
  const look = record(o.look)
  const species = Array.isArray(o.species) ? o.species : []
  const interaction = Array.isArray(o.interaction) ? o.interaction : []
  const seed = Number(o.seed)

  return {
    speciesCount: Math.round(
      clamp(Number(o.speciesCount) || DEFAULTS.speciesCount, {
        min: 1,
        max: MAX_SPECIES,
        step: 1,
        label: '',
      }),
    ),
    density: num(o.density, GLOBAL_BOUNDS.density, DEFAULTS.density),
    species: DEFAULTS.species.map((fallback, i) => speciesFrom(species[i], fallback)),
    interaction: DEFAULTS.interaction.map((fallback, i) => num(interaction[i], INTERACTION_BOUND, fallback)),
    decayRate: num(o.decayRate, GLOBAL_BOUNDS.decayRate, DEFAULTS.decayRate),
    diffuseRate: num(o.diffuseRate, GLOBAL_BOUNDS.diffuseRate, DEFAULTS.diffuseRate),
    foodEmit: num(o.foodEmit, GLOBAL_BOUNDS.foodEmit, DEFAULTS.foodEmit),
    simScale: num(o.simScale, GLOBAL_BOUNDS.simScale, DEFAULTS.simScale),
    speed: num(o.speed, GLOBAL_BOUNDS.speed, DEFAULTS.speed, true),
    spawnPattern: oneOf(o.spawnPattern, SPAWN_PATTERNS, DEFAULTS.spawnPattern),
    boundary: oneOf(o.boundary, BOUNDARIES, DEFAULTS.boundary),
    world: worldFrom(o.world),
    look: {
      exposure: num(look.exposure, LOOK_BOUNDS.exposure, DEFAULTS.look.exposure),
      glow: num(look.glow, LOOK_BOUNDS.glow, DEFAULTS.look.glow),
      glowRadius: num(look.glowRadius, LOOK_BOUNDS.glowRadius, DEFAULTS.look.glowRadius),
      vignette: num(look.vignette, LOOK_BOUNDS.vignette, DEFAULTS.look.vignette),
      background: color(look.background, DEFAULTS.look.background),
    },
    // Seeds are unsigned 32-bit; anything else is meaningless to the RNG.
    seed: Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) % 0x1_0000_0000 : DEFAULTS.seed,
  }
}

const sameWorld = (a: WorldSpec, b: WorldSpec) => JSON.stringify(a) === JSON.stringify(b)

/**
 * Which changes define the population rather than tune it. These can't be a uniform write — the
 * agent buffer (and with it the field) is rebuilt, so a given (params, seed) is always a fresh run
 * rather than depending on what came before.
 */
export function needsRestart(a: Params, b: Params): boolean {
  return (
    a.speciesCount !== b.speciesCount ||
    a.density !== b.density ||
    a.spawnPattern !== b.spawnPattern ||
    a.simScale !== b.simScale ||
    a.seed !== b.seed ||
    !sameWorld(a.world, b.world)
  )
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0x1_0000_0000)
}

/** Total agents for a grid, after the density and the hard ceiling. */
export function agentCountFor(params: Params, gridWidth: number, gridHeight: number): number {
  const n = Math.round(params.density * gridWidth * gridHeight)
  return Math.max(params.speciesCount, Math.min(MAX_AGENTS, n))
}
