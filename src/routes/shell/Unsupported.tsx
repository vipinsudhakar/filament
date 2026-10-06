import { Link } from 'react-router'
import type { GpuFailure } from '@/engine/device'
import styles from './Unsupported.module.css'

const MESSAGES: Record<GpuFailure['kind'], { title: string; body: string }> = {
  'no-webgpu': {
    title: 'This browser can’t develop the print.',
    body: 'Filament runs entirely on the graphics card through WebGPU, and this browser doesn’t have it. Recent Chrome, Edge, Safari 26 and Firefox 141 or newer all do.',
  },
  'no-adapter': {
    title: 'No graphics card answered.',
    body: 'The browser has WebGPU but couldn’t reach a usable GPU — usually because it’s disabled or blocklisted. chrome://gpu will say which.',
  },
  'device-failed': {
    title: 'The graphics card refused to start.',
    body: 'WebGPU is here and a GPU was found, but starting it failed. Reloading often helps.',
  },
}

/**
 * The fallback is a designed page, never a black screen: a still of the organism as a developed
 * print, what went wrong in one line, and the way forward.
 */
export function Unsupported({ failure }: { failure: GpuFailure }) {
  const { title, body } = MESSAGES[failure.kind]
  return (
    <main className={styles.page} data-notice>
      <figure className={styles.print}>
        <video
          src={`${import.meta.env.BASE_URL}fallback.webm`}
          poster={`${import.meta.env.BASE_URL}fallback.jpg`}
          autoPlay
          muted
          loop
          playsInline
        />
        <figcaption>A recording of the organism, for browsers that can’t run it live.</figcaption>
      </figure>
      <div className={styles.copy}>
        <h1>{title}</h1>
        <p>{body}</p>
        {failure.kind === 'device-failed' && <pre>{failure.message}</pre>}
        <Link to="/" className={styles.back}>
          Back to the start
        </Link>
      </div>
    </main>
  )
}
