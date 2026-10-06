import { MAX_SPECIES, type Params } from '@/model/params'
import { defineLayout } from '@/engine/layout'

const DEG_TO_RAD = Math.PI / 180

/** Brush tools, in the order the brush shader switches on. */
export const BRUSH_TOOLS = ['attract', 'repel', 'wall', 'food', 'erase'] as const
export type BrushTool = (typeof BRUSH_TOOLS)[number]

/** The uniform block every simulation pass shares. */
export const SimLayout = defineLayout('SimUniforms', [
  ['width', 'u32'],
  ['height', 'u32'],
  ['frame', 'u32'],
  ['agentCount', 'u32'],
  ['speciesCount', 'u32'],
  ['boundary', 'u32'],
  ['seed', 'u32'],
  ['depositScale', 'f32'],
  ['decayRate', 'f32'],
  ['diffuseRate', 'f32'],
  ['foodEmit', 'f32'],
  ['repelStrength', 'f32'],
  ['brushX', 'f32'],
  ['brushY', 'f32'],
  ['brushRadius', 'f32'],
  ['brushStrength', 'f32'],
  ['brushTool', 'u32'],
  ['brushActive', 'u32'],
  // 1 once the run has any food, walls or repellent. With an empty world the agents skip reading it.
  ['hasWorld', 'u32'],
  // Per species, one vec4 each: (sensorAngle rad, sensorDistance, turnSpeed rad, moveSpeed).
  ['motion', 'vec4f[4]'],
  // Per species: (depositAmount, sensorSize, 0, 0).
  ['senses', 'vec4f[4]'],
  // Per species: how it weighs each of the four trail channels.
  ['interaction', 'vec4f[4]'],
] as const)

/** The uniform block the scene and composite passes share. */
export const LookLayout = defineLayout('LookUniforms', [
  ['canvasWidth', 'f32'],
  ['canvasHeight', 'f32'],
  ['gridWidth', 'f32'],
  ['gridHeight', 'f32'],
  ['speciesCount', 'u32'],
  ['exposure', 'f32'],
  ['glow', 'f32'],
  ['vignette', 'f32'],
  ['wrap', 'u32'],
  ['frame', 'u32'],
  ['colors', 'vec4f[4]'],
  ['background', 'vec4f'],
  ['foodColor', 'vec4f'],
  ['wallColor', 'vec4f'],
  ['repelColor', 'vec4f'],
  // Optional exposure per band, for the landing page's test strip: 0 = off, 1 = vertical bands
  // across x, 2 = horizontal bands down y.
  ['bandExposure', 'vec4f'],
  ['bandAxis', 'u32'],
] as const)

/** One per blur direction: the separable Gaussian runs once horizontally, once vertically. */
export const BlurLayout = defineLayout('BlurUniforms', [
  ['texelX', 'f32'],
  ['texelY', 'f32'],
  ['dirX', 'f32'],
  ['dirY', 'f32'],
  ['radius', 'f32'],
] as const)

export type Brush = {
  /** Grid-space position. */
  x: number
  y: number
  /** Grid-space radius. */
  radius: number
  tool: BrushTool
  strength: number
}

export type SimRuntime = {
  width: number
  height: number
  frame: number
  agentCount: number
  depositScale: number
  brush: Brush | null
  hasWorld: boolean
}

/**
 * Deposits accumulate as fixed-point integers (WebGPU has no float atomics, and integer adds are
 * order-independent, which keeps a run reproducible). The prototype used a fixed scale of 1024,
 * which overflows u32 once a few million agents stack a full deposit onto one cell. Here the scale
 * is the largest power of two — exact to divide back out — at which the worst case still fits:
 * every agent of the most-depositing species landing on the same cell in the same step.
 */
export function depositScaleFor(params: Params, agentCount: number): number {
  const perSpecies = Math.ceil(agentCount / params.speciesCount)
  let worst = 0
  for (let s = 0; s < params.speciesCount; s++) {
    worst = Math.max(worst, perSpecies * params.species[s].depositAmount)
  }
  const bound = Math.min(4096, 0xffff_ffff / Math.max(worst, 1e-9))
  return Math.max(1, 2 ** Math.floor(Math.log2(bound)))
}

export function simValues(params: Params, runtime: SimRuntime): Parameters<typeof SimLayout.pack>[0] {
  const motion: number[] = []
  const senses: number[] = []
  for (let s = 0; s < MAX_SPECIES; s++) {
    const sp = params.species[s]
    motion.push(sp.sensorAngle * DEG_TO_RAD, sp.sensorDistance, sp.turnSpeed * DEG_TO_RAD, sp.moveSpeed)
    senses.push(sp.depositAmount, sp.sensorSize, 0, 0)
  }
  const brush = runtime.brush
  return {
    width: runtime.width,
    height: runtime.height,
    frame: runtime.frame,
    agentCount: runtime.agentCount,
    speciesCount: params.speciesCount,
    boundary: params.boundary === 'wrap' ? 0 : 1,
    seed: params.seed,
    depositScale: runtime.depositScale,
    decayRate: params.decayRate,
    diffuseRate: params.diffuseRate,
    foodEmit: params.foodEmit,
    repelStrength: 4,
    brushX: brush?.x ?? 0,
    brushY: brush?.y ?? 0,
    brushRadius: brush?.radius ?? 0,
    brushStrength: brush?.strength ?? 0,
    brushTool: brush ? BRUSH_TOOLS.indexOf(brush.tool) : 0,
    brushActive: brush ? 1 : 0,
    hasWorld: runtime.hasWorld ? 1 : 0,
    motion,
    senses,
    interaction: params.interaction,
  }
}

/** #rrggbb → linear-light RGB. Colours are authored in sRGB; all lighting maths happens in linear. */
export function hexToLinear(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  const channel = (c: number) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return [channel((n >> 16) & 255), channel((n >> 8) & 255), channel(n & 255)]
}

const vec4 = (hex: string, a = 1) => [...hexToLinear(hex), a]

export type LookRuntime = {
  canvasWidth: number
  canvasHeight: number
  gridWidth: number
  gridHeight: number
  frame: number
  bands: { exposure: [number, number, number, number]; axis: 1 | 2 } | null
}

export function lookValues(params: Params, runtime: LookRuntime): Parameters<typeof LookLayout.pack>[0] {
  const { bands, ...rest } = runtime
  return {
    ...rest,
    speciesCount: params.speciesCount,
    exposure: params.look.exposure,
    glow: params.look.glow,
    vignette: params.look.vignette,
    wrap: params.boundary === 'wrap' ? 1 : 0,
    colors: params.species.flatMap((s) => vec4(s.color)),
    background: vec4(params.look.background),
    foodColor: vec4('#ffe6a8'),
    wallColor: vec4('#16120f'),
    repelColor: vec4('#ff3b4e'),
    bandExposure: bands?.exposure ?? [1, 1, 1, 1],
    bandAxis: bands?.axis ?? 0,
  }
}
