/**
 * Screenshot a page of the running dev server after a delay, and print any console errors.
 * A quick look, not a check — scripts/verify.mjs is the measured one.
 *
 * Usage:  node scripts/shot.mjs <path> <out.png> [--wait 3000] [--size 1280x800] [--headed]
 *   e.g.  node scripts/shot.mjs /studio captures/studio.png --wait 4000
 */
import { chromium } from '@playwright/test'

const [path = '/', out = 'captures/shot.png'] = process.argv
  .slice(2)
  .filter(
    (a, i, all) =>
      !a.startsWith('--') && !all[i - 1]?.startsWith('--wait') && !all[i - 1]?.startsWith('--size'),
  )
const flag = (name, fallback) => {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : fallback
}
const wait = Number(flag('--wait', '3000'))
const [width, height] = flag('--size', '1280x800').split('x').map(Number)
const headed = process.argv.includes('--headed')

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL ?? 'msedge',
  headless: !headed,
  args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width, height } })
// --no-webgpu: pretend the browser has no WebGPU, to see the fallback page.
if (process.argv.includes('--no-webgpu')) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'gpu', { value: undefined }))
}
const logs = []
page.on(
  'console',
  (m) => (m.type() === 'error' || m.type() === 'warning') && logs.push(`${m.type()}: ${m.text()}`),
)
page.on('pageerror', (e) => logs.push(`pageerror: ${e}`))

// Git Bash rewrites a bare "/" argument into a Windows path, so the leading slash is optional.
const base = process.env.BASE_URL ?? 'http://localhost:5173'
const route = /^[A-Za-z]:[/]/.test(path) ? '/' : `/${path.replace(/^\/+/, '')}`
await page.goto(`${base}${route}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(wait)

// --scroll 900,2400,3600 : wheel down to each offset in turn (so smooth scroll and scroll-driven
// motion run as they would for a person), capturing one viewport per stop as out-<offset>.png.
const scrollStops = flag('--scroll', '')
if (scrollStops) {
  for (const target of scrollStops.split(',').map(Number)) {
    for (let i = 0; i < 80; i++) {
      const y = await page.evaluate(() => window.scrollY)
      if (Math.abs(target - y) < 4) break
      await page.mouse.move(width / 2, height / 2)
      await page.mouse.wheel(0, Math.max(-240, Math.min(240, target - y)))
      await page.waitForTimeout(60)
    }
    await page.waitForTimeout(1800)
    await page.screenshot({ path: out.replace(/\.png$/, `-${target}.png`) })
  }
} else if (process.argv.includes('--full')) {
  // Full page: wheel through it first so every scroll-triggered reveal has run, then capture.
  const total = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < total; y += 240) {
    await page.mouse.move(width / 2, height / 2)
    await page.mouse.wheel(0, 240)
    await page.waitForTimeout(70)
  }
  await page.waitForTimeout(2500)
  await page.screenshot({ path: out, fullPage: true })
} else {
  await page.screenshot({ path: out })
}
console.log(`title   ${await page.title()}`)
console.log(`saved   ${out}`)
console.log(logs.length ? logs.join('\n') : 'no errors')
await browser.close()
