/**
 * The single requestAnimationFrame for the whole app.
 *
 * Simulations, GSAP's ticker and Lenis's scroll all want a frame. Several rAF loops fighting over
 * one main thread is how a smooth page turns to mush, so there is exactly one, here, and
 * everything that needs a frame registers with it.
 *
 * Callbacks fire in registration order each frame: register the simulations before the motion
 * layers that read what they produced.
 */
export type FrameCallback = (timeMs: number, dtMs: number) => void

export class FrameLoop {
  private readonly callbacks = new Set<FrameCallback>()
  private handle = 0
  private running = false
  private last = 0

  /** Register a per-frame callback. Returns an unsubscribe function. */
  add(callback: FrameCallback): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    const tick = (now: number) => {
      if (!this.running) return
      const dt = now - this.last
      this.last = now
      for (const callback of this.callbacks) callback(now, dt)
      this.handle = requestAnimationFrame(tick)
    }
    this.handle = requestAnimationFrame(tick)
  }

  stop(): void {
    this.running = false
    if (this.handle) cancelAnimationFrame(this.handle)
    this.handle = 0
  }

  get isRunning(): boolean {
    return this.running
  }
}

/** The app's one loop. Started at boot and never stopped; pausing a sim means not ticking it. */
export const frameLoop = new FrameLoop()
