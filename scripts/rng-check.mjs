/**
 * Proves the CPU and GPU RNGs agree, bit for bit.
 *
 * The determinism story (share links, and scripts/determinism.mjs replaying a run bit-for-bit)
 * rests on pcgHash in src/engine/rng.ts and pcg_hash in src/engine/shaders/rng.wgsl producing
 * identical output. This runs the WGSL version on a real GPU over a range of inputs, reads the
 * results back, and compares them to the TS version over the same inputs.
 *
 * Both sides are imported from the exact source files the app ships — the dev server serves
 * rng.ts as an ES module and rng.wgsl?raw as its text — so there's no second copy to drift.
 *
 * Runs headless in Edge by default (pass --headed if a machine only gets a WebGPU adapter
 * with a visible window).
 *
 * Usage:  node scripts/rng-check.mjs        (dev server must be up on :5173)
 */
import { chromium } from '@playwright/test'

const N = 4096

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL ?? 'msedge',
  headless: !process.argv.includes('--headed'),
  args: ['--enable-unsafe-webgpu'],
})
const page = await browser.newPage()
page.on('pageerror', (e) => console.error('page error:', String(e)))

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })

const result = await page.evaluate(async (count) => {
  const { pcgHash } = await import('/src/engine/rng.ts')
  const rngWgsl = (await import('/src/engine/shaders/rng.wgsl?raw')).default

  const adapter = await navigator.gpu?.requestAdapter()
  if (!adapter) return { error: 'no WebGPU adapter' }
  const device = await adapter.requestDevice()

  // The shared functions plus a throwaway entry point that just writes pcg_hash(index).
  const code =
    rngWgsl +
    `
@group(0) @binding(0) var<storage, read_write> out: array<u32>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  out[id.x] = pcg_hash(id.x);
}`

  const pipeline = device.createComputePipeline({
    layout: 'auto',
    compute: { module: device.createShaderModule({ code }), entryPoint: 'main' },
  })

  const bytes = count * 4
  const storage = device.createBuffer({
    size: bytes,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  })
  const readback = device.createBuffer({
    size: bytes,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  })
  const bind = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: storage } }],
  })

  const enc = device.createCommandEncoder()
  const pass = enc.beginComputePass()
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, bind)
  pass.dispatchWorkgroups(count / 64)
  pass.end()
  enc.copyBufferToBuffer(storage, 0, readback, 0, bytes)
  device.queue.submit([enc.finish()])

  await readback.mapAsync(GPUMapMode.READ)
  const gpu = new Uint32Array(readback.getMappedRange().slice(0))
  readback.unmap()

  let mismatches = 0
  const samples = []
  for (let i = 0; i < count; i++) {
    const ts = pcgHash(i)
    if (ts !== gpu[i]) {
      mismatches++
      if (samples.length < 5) samples.push({ i, ts, gpu: gpu[i] })
    }
  }
  return { mismatches, samples, gpu0: gpu[0], ts0: pcgHash(0), gpu1: gpu[1], ts1: pcgHash(1) }
}, N)

await browser.close()

if (result.error) {
  console.error(`FAIL — ${result.error}`)
  process.exit(1)
}

console.log(`checked  ${N} inputs`)
console.log(`sample   pcg_hash(0) gpu=${result.gpu0} ts=${result.ts0}`)
console.log(`sample   pcg_hash(1) gpu=${result.gpu1} ts=${result.ts1}`)
console.log(
  `result   ${result.mismatches === 0 ? 'PASS — TS and WGSL agree' : `FAIL — ${result.mismatches} mismatches`}`,
)
if (result.mismatches > 0) console.error(result.samples)

process.exit(result.mismatches === 0 ? 0 : 1)
