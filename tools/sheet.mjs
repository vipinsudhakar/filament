/**
 * Tile a set of PNGs into one contact sheet, so a batch of captures can be reviewed in one look.
 *
 * Usage:  node tools/sheet.mjs <out.png> <img1.png> <img2.png> ... [--cols 4]
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const colsAt = args.indexOf('--cols')
const cols = colsAt > -1 ? Number(args.splice(colsAt, 2)[1]) : 4
const [out, ...files] = args

const cells = files
  .map((f) => {
    const data = readFileSync(resolve(f)).toString('base64')
    return `<figure><img src="data:image/png;base64,${data}"><figcaption>${f.split(/[\\/]/).pop()}</figcaption></figure>`
  })
  .join('')

const html = `<!doctype html><style>
  body{margin:0;background:#222;display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;padding:6px;font:12px sans-serif;color:#ccc}
  figure{margin:0} img{width:100%;display:block} figcaption{padding:2px 0}
</style>${cells}`

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'msedge' })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
await page.setContent(html)
await page.screenshot({ path: out, fullPage: true })
await browser.close()
console.log(`saved ${out}`)
