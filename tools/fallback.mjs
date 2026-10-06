/**
 * Records the clip and poster the no-WebGPU page shows (public/fallback.webm, public/fallback.jpg),
 * from the live engine itself — so the fallback is a real recording of the organism, not a mockup.
 *
 * Usage:  node tools/fallback.mjs [preset] [seconds]     (dev server must be up on :5173)
 */
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const preset = process.argv[2] ?? 'tribes'
const seconds = Number(process.argv[3] ?? 8)

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL ?? 'msedge',
  args: ['--enable-unsafe-webgpu'],
})
const page = await browser.newPage({ viewport: { width: 1080, height: 720 } })
await page.goto(`http://localhost:5173/studio?preset=${preset}`, { waitUntil: 'networkidle' })
await page.waitForFunction(() => window.__filament?.sim, null, { timeout: 15000 })
await page.keyboard.press('h')
// Let the run develop before rolling, so the clip opens on structure rather than noise.
await page.waitForTimeout(2500)

const base64 = await page.evaluate(async (ms) => {
  const canvas = document.querySelector('canvas')
  const rec = new MediaRecorder(canvas.captureStream(30), {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 3_500_000,
  })
  const chunks = []
  rec.ondataavailable = (e) => chunks.push(e.data)
  const done = new Promise((r) => (rec.onstop = r))
  rec.start(250)
  await new Promise((r) => setTimeout(r, ms))
  rec.stop()
  await done
  const buf = await new Blob(chunks).arrayBuffer()
  let s = ''
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b)
  return btoa(s)
}, seconds * 1000)

writeFileSync('public/fallback.webm', Buffer.from(base64, 'base64'))
await page.locator('canvas').first().screenshot({ path: 'public/fallback.jpg', type: 'jpeg', quality: 82 })
await browser.close()
console.log(
  `saved public/fallback.webm (${((base64.length * 0.75) / 1e6).toFixed(1)} MB) and public/fallback.jpg`,
)
