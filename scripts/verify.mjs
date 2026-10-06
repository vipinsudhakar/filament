/**
 * Loads a preset in the studio, lets it run, and measures what actually lands on the canvas —
 * sampled over a timeline, not at one moment.
 *
 * The timeline matters: a run develops out of black and its field decays, so one early or late
 * screenshot of a correctly working sim can legitimately be dark. Watching the numbers move
 * across samples is what tells "it's developing" from "nothing ever rendered".
 *
 * Pixels come from Playwright's screenshot, never from reading the canvas in-page: a WebGPU canvas
 * doesn't preserve its presented image, so createImageBitmap() returns blank even when the GPU
 * drew fine. The studio chrome is hidden first (H) so it isn't measured as simulation output.
 *
 * Usage:  node scripts/verify.mjs [preset] [--at 500,2000,5000] [--headed]
 */
import { mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'

const preset = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'tribes'
const atArg = process.argv.indexOf('--at')
const sampleTimes = (atArg > -1 ? process.argv[atArg + 1] : '500,2000,5000').split(',').map(Number)

mkdirSync('captures', { recursive: true })
const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL ?? 'msedge',
  headless: !process.argv.includes('--headed'),
  args: ['--enable-unsafe-webgpu'],
})
const page = await browser.newPage({ viewport: { width: 1200, height: 750 } })

const errors = []
page.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(`http://localhost:5173/studio?preset=${preset}`, { waitUntil: 'networkidle' })

// data-* hooks, not classes: CSS module class names are hashed and would silently stop matching.
const notice = await page.$('[data-notice] h1')
if (notice) {
  console.error(`FAIL — the app is showing its unsupported notice: "${await notice.textContent()}"`)
  await browser.close()
  process.exit(1)
}

await page.keyboard.press('h')

function measure(buffer) {
  const { data, width, height } = PNG.sync.read(buffer)
  let lit = 0
  let sum = 0
  let max = 0
  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3
    if (lum > 24) lit++
    sum += lum
    if (lum > max) max = lum
  }
  const pixels = width * height
  return { lit: (lit / pixels) * 100, mean: sum / pixels, max }
}

const canvas = page.locator('canvas').first()
const samples = []
let elapsed = 0
for (const t of sampleTimes) {
  await page.waitForTimeout(Math.max(0, t - elapsed))
  elapsed = t
  const file = `captures/verify-${preset}-${t}ms.png`
  samples.push({ t, file, ...measure(await canvas.screenshot({ path: file })) })
}

console.log(`preset  ${preset}`)
console.log('    time      lit%      mean     max')
for (const s of samples) {
  console.log(
    `  ${String(s.t).padStart(6)}ms  ${s.lit.toFixed(1).padStart(6)}  ${s.mean.toFixed(2).padStart(8)}  ${s.max.toFixed(0).padStart(6)}`,
  )
}
console.log(`errors  ${errors.length ? errors.join('; ') : 'none'}`)
await browser.close()

if (samples.every((s) => s.lit < 0.5)) {
  console.error('FAIL — the canvas never developed past black')
  process.exit(1)
}
if (errors.length) process.exit(1)
