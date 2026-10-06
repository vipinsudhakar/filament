import type { WorldSpec } from '@/model/params'
import { makeRng } from '@/engine/rng'

/**
 * The world layer: four floats per cell — (food, wall, repellent, unused). Generated on the CPU
 * from a WorldSpec and uploaded once per run; brush strokes then edit it on the GPU.
 */
export const WORLD_STRIDE = 4

/**
 * Greater Tokyo, roughly. The classic Physarum experiment (Tero et al., Science 2010) placed oat
 * flakes where the cities around Tokyo sit and watched the mould grow a network comparable to the
 * real rail system. These are approximate longitude/latitude pairs for the same kind of layout,
 * not the paper's exact map.
 */
const TOKYO_CITIES: [number, number][] = [
  [139.69, 35.69],
  [139.64, 35.44],
  [139.7, 35.53],
  [140.12, 35.61],
  [139.65, 35.86],
  [139.32, 35.66],
  [139.41, 35.7],
  [139.45, 35.55],
  [139.37, 35.57],
  [139.36, 35.44],
  [139.35, 35.33],
  [139.49, 35.34],
  [139.55, 35.32],
  [139.67, 35.28],
  [139.16, 35.26],
  [139.49, 35.92],
  [139.47, 35.8],
  [139.75, 35.98],
  [139.79, 35.89],
  [139.97, 35.87],
  [139.9, 35.79],
  [139.98, 35.69],
  [140.32, 35.78],
  [140.22, 35.72],
  [140.12, 35.5],
  [139.92, 35.38],
  [140.29, 35.43],
  [139.28, 35.79],
  [140.11, 36.08],
  [140.05, 35.91],
  [139.39, 36.15],
]

/** Tokyo Bay as a coarse polygon, walled off so the network has to route around the water. */
const TOKYO_BAY: [number, number][] = [
  [139.78, 35.63],
  [139.9, 35.66],
  [140.03, 35.6],
  [140.05, 35.52],
  [139.96, 35.42],
  [139.86, 35.3],
  [139.75, 35.26],
  [139.7, 35.33],
  [139.72, 35.42],
  [139.76, 35.5],
]

const TOKYO_EXTENT = { lonMin: 139.05, lonMax: 140.45, latMin: 35.18, latMax: 36.22 }

export function generateWorld(
  spec: WorldSpec,
  width: number,
  height: number,
  seed: number,
): Float32Array | null {
  if (spec.kind === 'none') return null
  const world = new Float32Array(width * height * WORLD_STRIDE)
  const blob = Math.max(2, Math.min(width, height) * 0.007)

  switch (spec.kind) {
    case 'scatter': {
      const rng = makeRng(seed ^ 0x5bd1e995)
      for (let i = 0; i < spec.count; i++) {
        stamp(world, width, height, rng.nextFloat() * width, rng.nextFloat() * height, blob)
      }
      break
    }
    case 'cities': {
      const project = projector(width, height)
      const bay = TOKYO_BAY.map(([lon, lat]) => project(lon, lat))
      fillPolygon(world, width, height, bay)
      for (const [lon, lat] of TOKYO_CITIES) {
        const [x, y] = project(lon, lat)
        stamp(world, width, height, x, y, blob * 1.2)
      }
      break
    }
    case 'text':
      rasterizeText(world, width, height, spec.text)
      break
  }
  return world
}

/** Fit the map extent into the grid, preserving its aspect, centred with a margin. */
function projector(width: number, height: number) {
  const { lonMin, lonMax, latMin, latMax } = TOKYO_EXTENT
  // A degree of longitude is shorter than a degree of latitude this far north.
  const lonScale = Math.cos((35.7 * Math.PI) / 180)
  const mapW = (lonMax - lonMin) * lonScale
  const mapH = latMax - latMin
  const scale = Math.min((width * 0.86) / mapW, (height * 0.86) / mapH)
  const ox = (width - mapW * scale) / 2
  const oy = (height - mapH * scale) / 2
  return (lon: number, lat: number): [number, number] => [
    ox + (lon - lonMin) * lonScale * scale,
    oy + (latMax - lat) * scale,
  ]
}

/** A soft round food source. */
function stamp(world: Float32Array, width: number, height: number, cx: number, cy: number, r: number) {
  const x0 = Math.max(0, Math.floor(cx - r))
  const x1 = Math.min(width - 1, Math.ceil(cx + r))
  const y0 = Math.max(0, Math.floor(cy - r))
  const y1 = Math.min(height - 1, Math.ceil(cy + r))
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
      if (d > r) continue
      const i = (y * width + x) * WORLD_STRIDE
      world[i] = Math.max(world[i], 1 - (d / r) ** 2)
    }
  }
}

/** Even-odd scanline fill of a polygon into the wall channel. */
function fillPolygon(world: Float32Array, width: number, height: number, poly: [number, number][]) {
  for (let y = 0; y < height; y++) {
    const py = y + 0.5
    const xs: number[] = []
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i]
      const [xj, yj] = poly[j]
      if (yi > py !== yj > py) xs.push(xi + ((py - yi) / (yj - yi)) * (xj - xi))
    }
    xs.sort((a, b) => a - b)
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const from = Math.max(0, Math.ceil(xs[k] - 0.5))
      const to = Math.min(width - 1, Math.floor(xs[k + 1] - 0.5))
      for (let x = from; x <= to; x++) world[(y * width + x) * WORLD_STRIDE + 1] = 1
    }
  }
}

/**
 * Lay text down as food: the organism grows into the letterforms and then knits them together.
 * Rasterised with a 2D canvas at grid resolution, so it needs a DOM (or OffscreenCanvas).
 */
function rasterizeText(world: Float32Array, width: number, height: number, text: string) {
  if (typeof OffscreenCanvas === 'undefined') return
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // The brand face at its widest cut. The caller makes sure it has loaded first; otherwise the
  // canvas silently rasterises a fallback face.
  let size = height * 0.42
  // Stretch goes inside the shorthand: assigning ctx.font resets a separately set fontStretch.
  const font = (px: number) => `800 expanded ${px}px "Archivo Variable", "Archivo", sans-serif`
  ctx.font = font(size)
  const measured = ctx.measureText(text).width
  if (measured > width * 0.82) size *= (width * 0.82) / measured
  ctx.font = font(size)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // Outlines, not fills: a filled letter emits from its whole area and saturates into a blob; an
  // outline gives the organism a contour to trace and leaves the counters dark.
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = Math.max(1.5, size * 0.035)
  ctx.lineJoin = 'round'
  ctx.strokeText(text, width / 2, height / 2)

  const { data } = ctx.getImageData(0, 0, width, height)
  for (let i = 0; i < width * height; i++) {
    world[i * WORLD_STRIDE] = data[i * 4 + 3] / 255
  }
}
