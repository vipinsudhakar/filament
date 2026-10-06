export type GpuFailure =
  { kind: 'no-webgpu' } | { kind: 'no-adapter' } | { kind: 'device-failed'; message: string }

export type Gpu = { device: GPUDevice; adapterInfo: GPUAdapterInfo; software: boolean; adapterName: string }

export type GpuInit = { ok: true; gpu: Gpu } | { ok: false; failure: GpuFailure }

let shared: Promise<GpuInit> | null = null
const lostListeners = new Set<(info: GPUDeviceLostInfo) => void>()

/**
 * One device for the whole app. The landing page runs several canvases at once (the hero and the
 * explainer demos); each getting its own device would multiply memory and compile every
 * pipeline again for nothing.
 */
export function getGpu(): Promise<GpuInit> {
  shared ??= initGpu()
  return shared
}

/** Subscribe to device loss (driver reset, GPU process crash). Returns an unsubscribe. */
export function onDeviceLost(listener: (info: GPUDeviceLostInfo) => void): () => void {
  lostListeners.add(listener)
  return () => lostListeners.delete(listener)
}

/**
 * The three ways this can fail are worth telling apart in the UI: the browser has no WebGPU at
 * all, it has the API but no usable adapter (common with a blocklisted or disabled GPU), or the
 * device request itself threw.
 */
async function initGpu(): Promise<GpuInit> {
  if (typeof navigator === 'undefined' || !navigator.gpu) {
    return { ok: false, failure: { kind: 'no-webgpu' } }
  }

  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
  if (!adapter) {
    return { ok: false, failure: { kind: 'no-adapter' } }
  }

  try {
    // Millions of agents and a full-screen four-channel field outgrow the default 128 MiB storage
    // binding on large displays; ask for whatever the adapter actually allows.
    const device = await adapter.requestDevice({
      requiredLimits: {
        maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
        maxBufferSize: adapter.limits.maxBufferSize,
      },
    })
    void device.lost.then((info) => {
      shared = null
      for (const listener of lostListeners) listener(info)
    })
    const info = adapter.info
    return {
      ok: true,
      gpu: {
        device,
        adapterInfo: info,
        software: isSoftwareAdapter(info),
        adapterName: describeAdapter(info),
      },
    }
  } catch (err) {
    shared = null
    return {
      ok: false,
      failure: { kind: 'device-failed', message: err instanceof Error ? err.message : String(err) },
    }
  }
}

/**
 * Which adapter we got decides whether a performance number means anything: a software adapter
 * (SwiftShader / lavapipe / WARP) runs the sim correctly but orders of magnitude slower.
 */
export function isSoftwareAdapter(info: GPUAdapterInfo): boolean {
  const haystack = `${info.vendor} ${info.architecture} ${info.description}`.toLowerCase()
  return (
    haystack.includes('swiftshader') ||
    haystack.includes('lavapipe') ||
    haystack.includes('llvmpipe') ||
    haystack.includes('microsoft basic render')
  )
}

export function describeAdapter(info: GPUAdapterInfo): string {
  const parts = [info.vendor, info.architecture, info.description].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : 'GPU'
}
