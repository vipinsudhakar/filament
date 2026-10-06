import { agentCountFor, needsRestart, type Params } from '@/model/params'
import {
  BlurLayout,
  LookLayout,
  SimLayout,
  depositScaleFor,
  lookValues,
  simValues,
  type Brush,
  type BrushTool,
  type LookRuntime,
} from '@/engine/uniforms'
import { AGENT_BYTES, spawnAgents } from '@/engine/spawn'
import { WORLD_STRIDE, generateWorld } from '@/engine/world'
import rngShader from '@/engine/shaders/rng.wgsl?raw'
import simCommon from '@/engine/shaders/sim_common.wgsl?raw'
import agentsShader from '@/engine/shaders/agents.wgsl?raw'
import diffuseShader from '@/engine/shaders/diffuse.wgsl?raw'
import brushShader from '@/engine/shaders/brush.wgsl?raw'
import fullscreenShader from '@/engine/shaders/fullscreen.wgsl?raw'
import sceneShader from '@/engine/shaders/scene.wgsl?raw'
import bloomShader from '@/engine/shaders/bloom.wgsl?raw'
import compositeShader from '@/engine/shaders/composite.wgsl?raw'

const AGENT_WORKGROUP = 64
const CELL_WORKGROUP = 8
const BRUSH_WORKGROUP = 8
const CELL_BYTES = 16
const HDR_FORMAT: GPUTextureFormat = 'rgba16float'

/**
 * The backing store is capped. The image is a soft, glowing field drawn from a grid at CSS-pixel
 * resolution, so rendering it at 2x device pixels quadruples the fill work for detail the grid
 * doesn't have; 1.25x keeps edges crisp on high-DPI screens at a third of the cost.
 */
const MAX_DPR = 1.25
const MAX_CANVAS_PIXELS = 3_500_000

/** Simulation steps run at most this often, whatever the display's refresh rate. */
const STEP_INTERVAL_MS = 1000 / 60

/** Simulation passes get the generated struct, the RNG and the grid helpers prepended. */
const simCode = (code: string) => `${SimLayout.wgsl}\n${rngShader}\n${simCommon}\n${code}`
/** Screen passes get both screen-side structs, the RNG (for dither) and the fullscreen triangle. */
const screenCode = (code: string) =>
  `${LookLayout.wgsl}\n${BlurLayout.wgsl}\n${rngShader}\n${fullscreenShader}\n${code}`

export type SimStats = {
  fps: number
  frame: number
  agents: number
  gridWidth: number
  gridHeight: number
}

/** A brush stroke in CSS pixels relative to the canvas — the engine converts to grid space. */
export type BrushInput = { x: number; y: number; radius: number; tool: BrushTool; strength: number }

type Field = {
  width: number
  height: number
  trail: [GPUBuffer, GPUBuffer]
  deposit: GPUBuffer
  world: GPUBuffer
  /** The generated world, kept CPU-side so paint can be cleared back to it and 'food' spawns can read it. */
  baseWorld: Float32Array | null
  /** Whether the world layer holds anything yet. While it doesn't, the shaders skip reading it. */
  hasWorld: boolean
  agents: GPUBuffer
  agentCount: number
  depositScale: number
  agentsGroups: [GPUBindGroup, GPUBindGroup]
  diffuseGroups: [GPUBindGroup, GPUBindGroup]
  brushGroups: [GPUBindGroup, GPUBindGroup]
  sceneGroups: [GPUBindGroup, GPUBindGroup]
}

type Targets = {
  width: number
  height: number
  scene: GPUTexture
  halfA: GPUTexture
  halfB: GPUTexture
  brightGroup: GPUBindGroup
  blurHGroup: GPUBindGroup
  blurVGroup: GPUBindGroup
  compositeGroup: GPUBindGroup
}

/**
 * Owns the canvas, the GPU resources and one run of the organism. Knows nothing about React or
 * the frame loop: construct it, call tick() once per frame, destroy() when done.
 */
export class Simulation {
  private readonly device: GPUDevice
  private readonly canvas: HTMLCanvasElement
  private readonly context: GPUCanvasContext
  private readonly format: GPUTextureFormat
  private readonly sampler: GPUSampler

  private readonly agentsPipeline: GPUComputePipeline
  private readonly diffusePipeline: GPUComputePipeline
  private readonly brushPipeline: GPUComputePipeline
  private readonly scenePipeline: GPURenderPipeline
  private readonly brightPipeline: GPURenderPipeline
  private readonly blurPipeline: GPURenderPipeline
  private readonly compositePipeline: GPURenderPipeline

  private readonly simUniforms: GPUBuffer
  private readonly lookUniforms: GPUBuffer
  private readonly blurH: GPUBuffer
  private readonly blurV: GPUBuffer
  private readonly simStaging = new ArrayBuffer(SimLayout.size)
  private readonly lookStaging = new ArrayBuffer(LookLayout.size)

  private params: Params
  private field: Field | null = null
  private targets: Targets | null = null
  /** Which trail buffer holds the live field. */
  private current: 0 | 1 = 0
  private frame = 0

  private brush: BrushInput | null = null
  private bands: LookRuntime['bands'] = null
  /** Time banked toward the next step; steps run at most 60 times a second. */
  private stepClock = STEP_INTERVAL_MS
  /** Something visible changed while no step was due, so the next frame must redraw. */
  private dirty = true
  private lastBrush: { x: number; y: number } | null = null

  private fps = 0
  private fpsFrames = 0
  private fpsWindowStart = performance.now()
  private resizeObserver: ResizeObserver
  private resizeTimer = 0
  private destroyed = false

  onStats: ((stats: SimStats) => void) | null = null

  constructor(device: GPUDevice, canvas: HTMLCanvasElement, params: Params) {
    this.device = device
    this.canvas = canvas
    this.params = params

    const context = canvas.getContext('webgpu')
    if (!context) throw new Error('canvas has no webgpu context')
    this.context = context
    this.format = navigator.gpu.getPreferredCanvasFormat()
    this.context.configure({ device, format: this.format, alphaMode: 'opaque' })

    this.sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' })

    const uniform = (label: string, size: number) =>
      device.createBuffer({ label, size, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
    this.simUniforms = uniform('sim-uniforms', SimLayout.size)
    this.lookUniforms = uniform('look-uniforms', LookLayout.size)
    this.blurH = uniform('blur-h', BlurLayout.size)
    this.blurV = uniform('blur-v', BlurLayout.size)

    const compute = (label: string, code: string) =>
      device.createComputePipeline({
        label,
        layout: 'auto',
        compute: { module: device.createShaderModule({ label, code: simCode(code) }), entryPoint: 'main' },
      })
    this.agentsPipeline = compute('agents', agentsShader)
    this.diffusePipeline = compute('diffuse', diffuseShader)
    this.brushPipeline = compute('brush', brushShader)

    const screen = (label: string, code: string, entryPoint: string, format: GPUTextureFormat) => {
      const module = device.createShaderModule({ label, code: screenCode(code) })
      return device.createRenderPipeline({
        label,
        layout: 'auto',
        vertex: { module, entryPoint: 'vs' },
        fragment: { module, entryPoint, targets: [{ format }] },
        primitive: { topology: 'triangle-list' },
      })
    }
    this.scenePipeline = screen('scene', sceneShader, 'fs', HDR_FORMAT)
    this.brightPipeline = screen('bright', bloomShader, 'bright', HDR_FORMAT)
    this.blurPipeline = screen('blur', bloomShader, 'blur', HDR_FORMAT)
    this.compositePipeline = screen('composite', compositeShader, 'fs', this.format)

    this.resize()
    this.resizeObserver = new ResizeObserver(() => {
      // Dragging a window edge fires dozens of these; rebuilding the field on each would restart
      // the run dozens of times. Wait for the size to settle.
      clearTimeout(this.resizeTimer)
      this.resizeTimer = window.setTimeout(() => this.resize(), 120)
    })
    this.resizeObserver.observe(canvas)
  }

  get stats(): SimStats {
    return {
      fps: this.fps,
      frame: this.frame,
      agents: this.field?.agentCount ?? 0,
      gridWidth: this.field?.width ?? 0,
      gridHeight: this.field?.height ?? 0,
    }
  }

  /**
   * Update the live parameters. Most changes are free — the uniforms are rewritten every step.
   * The ones that define the population (density, species count, spawn, resolution, world, seed)
   * restart the run from a clean field instead.
   */
  setParams(params: Params): void {
    const restart = needsRestart(this.params, params)
    this.dirty = true
    this.params = params
    if (restart) this.reset()
    else if (this.field) this.field.depositScale = depositScaleFor(params, this.field.agentCount)
  }

  /** Brush held down at a position, or null when released. Applied on the next tick. */
  setBrush(brush: BrushInput | null): void {
    this.brush = brush
    if (!brush) this.lastBrush = null
  }

  /** Clear the field, regenerate the world and respawn the agents. Frame count returns to 0. */
  reset(): void {
    this.frame = 0
    this.allocateField()
  }

  /** Drop every brush stroke, restoring the generated world without restarting the run. */
  clearPaint(): void {
    const field = this.field
    if (!field) return
    this.dirty = true
    field.hasWorld = field.baseWorld !== null
    if (field.baseWorld) this.device.queue.writeBuffer(field.world, 0, field.baseWorld)
    else
      this.device.queue.writeBuffer(
        field.world,
        0,
        new Float32Array(field.width * field.height * WORLD_STRIDE),
      )
  }

  private resize(): void {
    if (this.destroyed) return
    const cssW = Math.max(1, this.canvas.clientWidth)
    const cssH = Math.max(1, this.canvas.clientHeight)

    let dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    if (cssW * cssH * dpr * dpr > MAX_CANVAS_PIXELS) dpr = Math.sqrt(MAX_CANVAS_PIXELS / (cssW * cssH))
    const width = Math.max(1, Math.round(cssW * dpr))
    const height = Math.max(1, Math.round(cssH * dpr))
    if (!this.targets || this.targets.width !== width || this.targets.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
      this.allocateTargets(width, height)
    }

    const grid = this.gridSize()
    if (!this.field || this.field.width !== grid.width || this.field.height !== grid.height) {
      this.allocateField()
    }
  }

  private gridSize() {
    const s = this.params.simScale
    return {
      width: Math.max(8, Math.round(Math.max(1, this.canvas.clientWidth) * s)),
      height: Math.max(8, Math.round(Math.max(1, this.canvas.clientHeight) * s)),
    }
  }

  private allocateField(): void {
    this.destroyField()
    this.dirty = true
    const { device } = this
    const { width, height } = this.gridSize()
    const cells = width * height
    const storage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC

    const trailA = device.createBuffer({ label: 'trail-a', size: cells * CELL_BYTES, usage: storage })
    const trailB = device.createBuffer({ label: 'trail-b', size: cells * CELL_BYTES, usage: storage })
    // Zero-initialised by the spec: the empty state the first agents pass adds onto.
    const deposit = device.createBuffer({
      label: 'deposit',
      size: cells * CELL_BYTES,
      usage: GPUBufferUsage.STORAGE,
    })
    const world = device.createBuffer({ label: 'world', size: cells * CELL_BYTES, usage: storage })

    const baseWorld = generateWorld(this.params.world, width, height, this.params.seed)
    if (baseWorld) device.queue.writeBuffer(world, 0, baseWorld)

    // Never ask for a buffer the device can't bind, whatever the density works out to.
    const maxAgents = Math.floor(device.limits.maxStorageBufferBindingSize / AGENT_BYTES)
    const agentCount = Math.min(agentCountFor(this.params, width, height), maxAgents, AGENT_WORKGROUP * 65535)
    const agents = device.createBuffer({ label: 'agents', size: agentCount * AGENT_BYTES, usage: storage })
    device.queue.writeBuffer(
      agents,
      0,
      spawnAgents(this.params, agentCount, width, height, baseWorld ?? undefined),
    )

    const group = (
      pipeline: GPUComputePipeline | GPURenderPipeline,
      buffers: GPUBuffer[],
      uniforms: GPUBuffer,
    ) =>
      device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [uniforms, ...buffers].map((buffer, binding) => ({ binding, resource: { buffer } })),
      })
    const both = (
      make: (live: GPUBuffer, other: GPUBuffer) => GPUBindGroup,
    ): [GPUBindGroup, GPUBindGroup] => [make(trailA, trailB), make(trailB, trailA)]

    this.field = {
      width,
      height,
      trail: [trailA, trailB],
      deposit,
      world,
      baseWorld,
      hasWorld: baseWorld !== null,
      agents,
      agentCount,
      depositScale: depositScaleFor(this.params, agentCount),
      agentsGroups: both((live) =>
        group(this.agentsPipeline, [agents, deposit, live, world], this.simUniforms),
      ),
      diffuseGroups: both((live, other) =>
        group(this.diffusePipeline, [live, other, deposit, world], this.simUniforms),
      ),
      brushGroups: both((live) => group(this.brushPipeline, [live, world], this.simUniforms)),
      sceneGroups: both((live) => group(this.scenePipeline, [live, world], this.lookUniforms)),
    }
    this.current = 0
  }

  private allocateTargets(width: number, height: number): void {
    this.destroyTargets()
    this.dirty = true
    const { device } = this
    const texture = (label: string, w: number, h: number) =>
      device.createTexture({
        label,
        size: { width: w, height: h },
        format: HDR_FORMAT,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      })
    // The glow is soft by nature, so it lives at quarter resolution.
    const hw = Math.max(1, Math.round(width / 4))
    const hh = Math.max(1, Math.round(height / 4))
    const scene = texture('scene', width, height)
    const halfA = texture('bloom-a', hw, hh)
    const halfB = texture('bloom-b', hw, hh)

    const blurGroup = (src: GPUTexture, uniforms: GPUBuffer) =>
      device.createBindGroup({
        layout: this.blurPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: src.createView() },
          { binding: 1, resource: this.sampler },
          { binding: 2, resource: { buffer: uniforms } },
        ],
      })

    this.targets = {
      width,
      height,
      scene,
      halfA,
      halfB,
      brightGroup: device.createBindGroup({
        layout: this.brightPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: scene.createView() },
          { binding: 1, resource: this.sampler },
          // Only for the quarter-res texel size its four-tap downsample needs.
          { binding: 2, resource: { buffer: this.blurH } },
        ],
      }),
      blurHGroup: blurGroup(halfA, this.blurH),
      blurVGroup: blurGroup(halfB, this.blurV),
      compositeGroup: device.createBindGroup({
        layout: this.compositePipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.lookUniforms } },
          { binding: 1, resource: scene.createView() },
          { binding: 2, resource: halfA.createView() },
          { binding: 3, resource: this.sampler },
        ],
      }),
    }
  }

  private writeSimUniforms(brush: Brush | null): void {
    const field = this.field!
    SimLayout.pack(
      simValues(this.params, {
        width: field.width,
        height: field.height,
        frame: this.frame,
        agentCount: field.agentCount,
        depositScale: field.depositScale,
        brush,
        hasWorld: field.hasWorld,
      }),
      this.simStaging,
    )
    this.device.queue.writeBuffer(this.simUniforms, 0, this.simStaging)
  }

  /**
   * Stamp the brush along the segment since the last frame. A fast flick moves the pointer tens of
   * pixels between frames; stamping only the endpoint would leave a dotted line.
   */
  private applyBrush(): void {
    const field = this.field
    const input = this.brush
    if (!field || !input) return
    // Food, walls and repellent put something in the world layer; from now on the shaders read it.
    if (input.tool === 'food' || input.tool === 'wall' || input.tool === 'repel') field.hasWorld = true

    const sx = field.width / Math.max(1, this.canvas.clientWidth)
    const sy = field.height / Math.max(1, this.canvas.clientHeight)
    const x = input.x * sx
    const y = input.y * sy
    const radius = Math.max(1, input.radius * sx)
    const from = this.lastBrush ?? { x, y }
    const distance = Math.hypot(x - from.x, y - from.y)
    const stamps = Math.min(24, Math.max(1, Math.ceil(distance / (radius * 0.5))))
    const size = Math.ceil(radius * 2) + 1
    const groups = Math.ceil(size / BRUSH_WORKGROUP)

    for (let k = 1; k <= stamps; k++) {
      const t = k / stamps
      this.writeSimUniforms({
        x: from.x + (x - from.x) * t,
        y: from.y + (y - from.y) * t,
        radius,
        tool: input.tool,
        strength: input.strength,
      })
      // One submit per stamp: each needs its own uniform values, and queue writes land in order
      // between submits.
      const encoder = this.device.createCommandEncoder({ label: 'brush' })
      const pass = encoder.beginComputePass({ label: 'brush' })
      pass.setPipeline(this.brushPipeline)
      pass.setBindGroup(0, field.brushGroups[this.current])
      pass.dispatchWorkgroups(groups, groups)
      pass.end()
      this.device.queue.submit([encoder.finish()])
    }
    this.lastBrush = { x, y }
  }

  /** One simulation step: agents sense, move and deposit; then the field diffuses and decays. */
  private step(): void {
    const field = this.field!
    this.writeSimUniforms(null)
    const encoder = this.device.createCommandEncoder({ label: 'step' })

    const agents = encoder.beginComputePass({ label: 'agents' })
    agents.setPipeline(this.agentsPipeline)
    agents.setBindGroup(0, field.agentsGroups[this.current])
    agents.dispatchWorkgroups(Math.ceil(field.agentCount / AGENT_WORKGROUP))
    agents.end()

    const diffuse = encoder.beginComputePass({ label: 'diffuse' })
    diffuse.setPipeline(this.diffusePipeline)
    diffuse.setBindGroup(0, field.diffuseGroups[this.current])
    diffuse.dispatchWorkgroups(
      Math.ceil(field.width / CELL_WORKGROUP),
      Math.ceil(field.height / CELL_WORKGROUP),
    )
    diffuse.end()

    this.device.queue.submit([encoder.finish()])
    // Diffuse wrote the other buffer, so that one is now live.
    this.current = this.current === 0 ? 1 : 0
    this.frame++
  }

  /** Draw the live field: scene → bloom (bright, blur ×2) → composite onto the canvas. */
  render(): void {
    const field = this.field
    const targets = this.targets
    if (!field || !targets) return
    this.dirty = false

    LookLayout.pack(
      lookValues(this.params, {
        canvasWidth: targets.width,
        canvasHeight: targets.height,
        gridWidth: field.width,
        gridHeight: field.height,
        frame: this.frame,
        bands: this.bands,
      }),
      this.lookStaging,
    )
    this.device.queue.writeBuffer(this.lookUniforms, 0, this.lookStaging)

    const hw = targets.halfA.width
    const hh = targets.halfA.height
    // Half the radius at quarter resolution keeps the same on-screen spread as at half resolution.
    const radius = this.params.look.glowRadius * 0.5
    this.device.queue.writeBuffer(
      this.blurH,
      0,
      BlurLayout.pack({ texelX: 1 / hw, texelY: 1 / hh, dirX: 1, dirY: 0, radius }),
    )
    this.device.queue.writeBuffer(
      this.blurV,
      0,
      BlurLayout.pack({ texelX: 1 / hw, texelY: 1 / hh, dirX: 0, dirY: 1, radius }),
    )

    const encoder = this.device.createCommandEncoder({ label: 'render' })
    const draw = (view: GPUTextureView, pipeline: GPURenderPipeline, group: GPUBindGroup) => {
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          { view, clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: 'clear', storeOp: 'store' },
        ],
      })
      pass.setPipeline(pipeline)
      pass.setBindGroup(0, group)
      pass.draw(3)
      pass.end()
    }

    const sceneView = targets.scene.createView()
    const aView = targets.halfA.createView()
    const bView = targets.halfB.createView()
    draw(sceneView, this.scenePipeline, field.sceneGroups[this.current])
    draw(aView, this.brightPipeline, targets.brightGroup)
    for (let i = 0; i < 2; i++) {
      draw(bView, this.blurPipeline, targets.blurHGroup)
      draw(aView, this.blurPipeline, targets.blurVGroup)
    }
    draw(this.context.getCurrentTexture().createView(), this.compositePipeline, targets.compositeGroup)

    this.device.queue.submit([encoder.finish()])
  }

  /**
   * Bank frame time toward the next step and say whether one is due. Steps are capped at 60 a
   * second: on a 120 or 144 Hz display, stepping every refresh would double the GPU work and also
   * run the organism (and the brush) twice as fast. On a frame with nothing due, the canvas just
   * keeps showing its last image.
   */
  private due(dtMs: number): boolean {
    // A frame or two of jitter on a 60 Hz display mustn't drop a step, and a long stall (a hidden
    // tab) mustn't queue up a burst.
    this.stepClock = Math.min(this.stepClock + dtMs, STEP_INTERVAL_MS * 2)
    if (this.stepClock < STEP_INTERVAL_MS - 2) return false
    this.stepClock = Math.max(0, this.stepClock - STEP_INTERVAL_MS)
    return true
  }

  /** Advance `speed` steps (applying any held brush first) and draw. The frame loop calls this. */
  tick(dtMs: number = STEP_INTERVAL_MS): void {
    if (!this.field || this.destroyed || !this.due(dtMs)) return
    this.applyBrush()
    for (let i = 0; i < this.params.speed; i++) this.step()
    this.render()
    this.tickFps()
  }

  /**
   * Paused: no steps, but brush strokes still land and the image redraws — so you can lay out food
   * and walls on a frozen print, change its look, then let it run. A frozen print with nothing
   * changing isn't redrawn at all.
   */
  frozenTick(dtMs: number = STEP_INTERVAL_MS): void {
    if (!this.field || this.destroyed || !this.due(dtMs)) return
    if (!this.brush && !this.dirty) return
    this.applyBrush()
    this.render()
  }

  /** Exposure per band (the landing page's test strip), or null for none. */
  setBands(bands: LookRuntime['bands']): void {
    this.bands = bands
    this.dirty = true
  }

  /** Exactly one step and a draw, regardless of speed — "step while paused". */
  stepOnce(): void {
    if (!this.field || this.destroyed) return
    this.applyBrush()
    this.step()
    this.render()
    this.onStats?.(this.stats)
  }

  /**
   * The current frame as a PNG. Rendered and read back in the same task: a WebGPU canvas only
   * holds its image until the browser presents it, so reading it any later returns blank.
   */
  snapshot(): Promise<Blob | null> {
    this.render()
    return new Promise((resolve) => this.canvas.toBlob(resolve, 'image/png'))
  }

  /**
   * A hash of the live trail field. Two runs with the same params, seed and grid on the same GPU
   * must produce the same hash at the same frame — scripts/determinism.mjs checks exactly that.
   */
  async fieldHash(): Promise<string> {
    const field = this.field
    if (!field) return ''
    const size = field.width * field.height * CELL_BYTES
    const readback = this.device.createBuffer({
      size,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    })
    const encoder = this.device.createCommandEncoder()
    encoder.copyBufferToBuffer(field.trail[this.current], 0, readback, 0, size)
    this.device.queue.submit([encoder.finish()])
    await readback.mapAsync(GPUMapMode.READ)
    const words = new Uint32Array(readback.getMappedRange())
    // FNV-1a over 32-bit words.
    let h = 0x811c9dc5
    for (let i = 0; i < words.length; i++) {
      h ^= words[i]
      h = Math.imul(h, 0x01000193) >>> 0
    }
    readback.unmap()
    readback.destroy()
    return h.toString(16).padStart(8, '0')
  }

  private tickFps(): void {
    this.fpsFrames++
    const now = performance.now()
    const elapsed = now - this.fpsWindowStart
    if (elapsed >= 500) {
      this.fps = (this.fpsFrames * 1000) / elapsed
      this.fpsFrames = 0
      this.fpsWindowStart = now
      this.onStats?.(this.stats)
    }
  }

  private destroyField(): void {
    const f = this.field
    if (!f) return
    f.trail.forEach((b) => b.destroy())
    f.deposit.destroy()
    f.world.destroy()
    f.agents.destroy()
    this.field = null
  }

  private destroyTargets(): void {
    const t = this.targets
    if (!t) return
    t.scene.destroy()
    t.halfA.destroy()
    t.halfB.destroy()
    this.targets = null
  }

  /** Release GPU resources. The device is shared, so it stays alive; the caller stops the loop. */
  destroy(): void {
    this.destroyed = true
    clearTimeout(this.resizeTimer)
    this.resizeObserver.disconnect()
    this.destroyField()
    this.destroyTargets()
    this.simUniforms.destroy()
    this.lookUniforms.destroy()
    this.blurH.destroy()
    this.blurV.destroy()
    this.context.unconfigure()
  }
}
