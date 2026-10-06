/**
 * Proves a run replays: the same params and seed, loaded twice in fresh pages and stepped the
 * same number of times, must leave a bit-identical trail field. A different seed must not.
 *
 * This is the guarantee share links rest on. It holds per GPU: different hardware rounds
 * sin/cos differently, so a link replays exactly on the machine type that made it and closely
 * everywhere else. The CPU and GPU random streams are checked separately by scripts/rng-check.mjs.
 *
 * Steps are driven directly through the dev hook rather than left to requestAnimationFrame, so
 * frame timing can't make two runs differ.
 *
 * Usage:  node scripts/determinism.mjs [steps]      (dev server must be up on :5173)
 */
import { chromium } from '@playwright/test'

const STEPS = Number(process.argv[2] ?? 200)
const PRESETS = ['tribes', 'tokyo', 'chase']

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL ?? 'msedge',
  headless: !process.argv.includes('--headed'),
  args: ['--enable-unsafe-webgpu'],
})

async function hashFor(preset, seedOverride) {
  const page = await browser.newPage({ viewport: { width: 960, height: 600 } })
  await page.goto(`http://localhost:5173/studio?preset=${preset}`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__filament?.sim, null, { timeout: 15000 })
  const hash = await page.evaluate(
    async ({ steps, seedOverride }) => {
      const { sim, store } = window.__filament
      const s = store.getState()
      s.set({ paused: true })
      if (seedOverride !== undefined) s.setParams({ seed: seedOverride })
      sim.reset()
      for (let i = 0; i < steps; i++) sim.stepOnce()
      return sim.fieldHash()
    },
    { steps: STEPS, seedOverride },
  )
  await page.close()
  return hash
}

let failed = false
for (const preset of PRESETS) {
  const a = await hashFor(preset)
  const b = await hashFor(preset)
  const c = await hashFor(preset, 424242)
  const replay = a === b
  const differs = a !== c
  failed ||= !replay || !differs
  console.log(
    `${preset.padEnd(8)} ${a} ${b}  replay ${replay ? 'PASS' : 'FAIL'}   other seed ${c} ${differs ? 'PASS' : 'FAIL'}`,
  )
}

await browser.close()
console.log(failed ? 'FAIL' : `PASS — ${PRESETS.length} presets replay bit-for-bit after ${STEPS} steps`)
process.exit(failed ? 1 : 0)
