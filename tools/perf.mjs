/**
 * Frame rate at a series of scroll positions, measured from requestAnimationFrame in the page.
 * Run it against two builds on the same machine to compare them; absolute numbers depend on the
 * GPU and on headless rendering, so only the comparison means much.
 *
 * Usage:  node tools/perf.mjs [url] [--stops 0,1000,2000] [--dpr 2] [--size 1440x900]
 *   e.g.  node tools/perf.mjs http://localhost:5173/
 *         node tools/perf.mjs https://vipinsudhakar.github.io/physarum/
 */
import { chromium } from '@playwright/test'

const url = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'http://localhost:5173/'
const flag = (name, fallback) => {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : fallback
}
const stops = flag('--stops', '0,1100,2100,3100,4100').split(',').map(Number)
const dpr = Number(flag('--dpr', '2'))
const [width, height] = flag('--size', '1440x900').split('x').map(Number)

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL ?? 'msedge',
  headless: !process.argv.includes('--headed'),
  args: ['--enable-unsafe-webgpu'],
})
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)

const fpsOver = (ms) =>
  page.evaluate(
    (ms) =>
      new Promise((resolve) => {
        const times = []
        const start = performance.now()
        const tick = (t) => {
          times.push(t)
          if (t - start < ms) requestAnimationFrame(tick)
          else {
            const gaps = times
              .slice(1)
              .map((v, i) => v - times[i])
              .sort((a, b) => a - b)
            resolve({
              fps: (times.length - 1) / ((times.at(-1) - times[0]) / 1000),
              p95: gaps[Math.floor(gaps.length * 0.95)] ?? 0,
            })
          }
        }
        requestAnimationFrame(tick)
      }),
    ms,
  )

console.log(`${url}  ${width}x${height} @${dpr}x`)
console.log('   scroll     fps   p95 frame')
for (const target of stops) {
  for (let i = 0; i < 80; i++) {
    const y = await page.evaluate(() => window.scrollY)
    if (Math.abs(target - y) < 4) break
    await page.mouse.move(width / 2, height / 2)
    await page.mouse.wheel(0, Math.max(-240, Math.min(240, target - y)))
    await page.waitForTimeout(40)
  }
  await page.waitForTimeout(800)
  const { fps, p95 } = await fpsOver(2500)
  console.log(
    `  ${String(target).padStart(6)}  ${fps.toFixed(1).padStart(6)}   ${p95.toFixed(1).padStart(6)} ms`,
  )
}
await browser.close()
