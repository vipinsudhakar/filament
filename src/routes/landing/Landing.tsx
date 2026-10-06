import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { GithubMark } from '@/ui/GithubMark'
import { PRESETS, presetById } from '@/model/presets'
import type { Simulation } from '@/engine/Simulation'
import { frameLoop } from '@/engine/frameLoop'
import { useSimulation } from '@/hooks/useSimulation'
import { LiveFrame } from '@/features/LiveFrame'
import { PRINT_STEPS, usePresetPrints } from '@/features/prints'
import { Mark } from '@/ui/Mark'
import { Unsupported } from '@/routes/shell/Unsupported'
import { prefersReducedMotion, useLandingMotion } from './motion'
import styles from './Landing.module.css'

const REPO = 'https://github.com/vipinsudhakar/physarum'
const CYCLE_MS = 9000
const WIPE_MS = 1100

export function Landing() {
  const root = useRef<HTMLElement>(null)
  useLandingMotion(root)
  useEffect(() => {
    document.title = 'Filament'
  }, [])

  return (
    <main ref={root} className={styles.page}>
      <Hero />
      <ContactSheet />
      <TestStrip />
      <FeedIt />
      <Close />
    </main>
  )
}

/* ─── Hero: the print develops, frame after frame ───────────────────────────────────────────── */

function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mode = useRef<'run' | 'frozen' | 'off'>('run')
  const { sim, status } = useSimulation(canvasRef, PRESETS[0].params, { mode })
  const [index, setIndex] = useState(0)
  const indexRef = useRef(0)
  const [wipe, setWipe] = useState(0)
  const startedAt = useRef(performance.now())
  const heroRef = useRef<HTMLElement>(null)
  const frameEl = useRef<HTMLSpanElement>(null)
  const expEl = useRef<HTMLSpanElement>(null)

  const goTo = useCallback(
    (next: number) => {
      if (!sim) return
      startedAt.current = performance.now()
      setWipe((w) => w + 1)
      // Swap under the densest part of the safelight wipe, so the new run develops out of red.
      window.setTimeout(() => {
        sim.setParams(PRESETS[next].params)
        startedAt.current = performance.now()
        indexRef.current = next
        setIndex(next)
      }, WIPE_MS * 0.42)
    },
    [sim],
  )

  // Advance on its own while the hero is in view.
  useEffect(() => {
    if (!sim) return
    let visible = true
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      mode.current = visible ? 'run' : 'off'
    })
    if (heroRef.current) io.observe(heroRef.current)
    // Measured from the last switch, not a fixed interval: picking a frame by hand restarts the
    // count, so the run you chose isn't swapped out a second later.
    const id = window.setInterval(() => {
      if (!visible || document.hidden) return
      if (performance.now() - startedAt.current >= CYCLE_MS) goTo((indexRef.current + 1) % PRESETS.length)
    }, 250)
    return () => {
      io.disconnect()
      clearInterval(id)
    }
  }, [sim, goTo])

  // The timer readouts tick every frame, straight into the DOM.
  useEffect(() => {
    if (!sim) return
    return frameLoop.add(() => {
      if (frameEl.current) frameEl.current.textContent = String(sim.stats.frame).padStart(6, '0')
      if (expEl.current) {
        const s = Math.floor((performance.now() - startedAt.current) / 1000)
        expEl.current.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
      }
    })
  }, [sim])

  if (status.phase === 'failed') return <Unsupported failure={status.failure} />
  const preset = PRESETS[index]

  return (
    <section ref={heroRef} className={styles.hero} data-hero>
      <div className={styles.heroCanvasWrap}>
        <canvas
          ref={canvasRef}
          className={styles.heroCanvas}
          data-hero-canvas
          aria-label={`Live simulation: ${preset.name}`}
        />
      </div>
      {/* Darkens the print on scroll. A plain overlay, not a filter on the canvas: filtering a live
          WebGPU canvas makes the compositor re-process every frame at full resolution. */}
      <div className={styles.heroShade} data-hero-shade aria-hidden="true" />
      <div key={wipe} className={styles.wipe} data-active={wipe > 0 || undefined} aria-hidden="true" />

      <header className={styles.rebate} data-hero-ui>
        <span className={styles.rebateBrand}>Filament</span>
        <ol className={styles.rebateFrames} aria-label="Showcase frames">
          {PRESETS.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                className={styles.rebateFrame}
                aria-current={i === index || undefined}
                onClick={() => i !== index && goTo(i)}
              >
                <span aria-hidden="true">▸</span>
                {p.code}
              </button>
            </li>
          ))}
        </ol>
        <nav className={styles.rebateNav}>
          <Link to="/studio">Darkroom</Link>
          <a href={REPO} target="_blank" rel="noreferrer" aria-label="Source on GitHub">
            <GithubMark size={15} />
          </a>
        </nav>
      </header>

      <div className={styles.heroBottom}>
        <div className={styles.timer} data-hero-ui>
          <p className={styles.timerName}>
            <span className={styles.timerCode}>{preset.code}</span>
            {preset.name}
          </p>
          <p className={styles.timerRead}>
            <span className={styles.timerLabel}>Frame</span>
            <span ref={frameEl}>000000</span>
            <span className={styles.timerLabel}>Exp</span>
            <span ref={expEl}>00:00</span>
          </p>
        </div>
        <p className={styles.tagline} data-hero-ui>
          A slime mould that draws with light. One rule, run by every agent, live on your GPU.
        </p>
        <Link to={`/studio?preset=${preset.id}`} className={styles.cta} data-hero-ui>
          Enter the darkroom
          <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      </div>

      <h1 className={styles.wordmark} data-wordmark aria-label="Filament">
        {'FILAMENT'.split('').map((c, i) => (
          <span key={i} aria-hidden="true">
            {c}
          </span>
        ))}
      </h1>
    </section>
  )
}

/* ─── Contact sheet: every preset, live, on strips of film laid on paper ───────────────────── */

/** Four frames, chosen to differ: one radiating, one network, one cellular, one lettered. */
const SHEET = ['bloom', 'tokyo', 'cells', 'signal']

/**
 * The contact sheet is prints, not live runs: they're developed once in the background and then
 * cost nothing. Only the frame under the pointer comes alive, so the section never runs more than
 * one simulation. The prints develop when the sheet is nearly in view, not at page load, so they
 * never compete with the hero.
 */
function ContactSheet() {
  const ref = useRef<HTMLElement>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), {
      rootMargin: '600px 0px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const prints = usePresetPrints(SHEET, near)

  return (
    <section ref={ref} className={styles.sheet} aria-labelledby="sheet-title">
      <div className={styles.sheetHead}>
        <h2 id="sheet-title" className={styles.sheetTitle} data-sheet-title>
          <span>Contact</span> <span>sheet</span>
        </h2>
        <p className={styles.sheetNote}>
          Hold over a frame and it comes alive. Pick one and it opens in the darkroom, yours to change.
        </p>
      </div>
      <div className={styles.strip} data-strip>
        <div className={styles.sprockets} aria-hidden="true" />
        <ol className={styles.frames}>
          {SHEET.map((id, i) => (
            <li key={id}>
              <SheetFrame id={id} seed={i} print={prints.get(id)} />
            </li>
          ))}
        </ol>
        <div className={styles.sprockets} aria-hidden="true" />
      </div>
    </section>
  )
}

function SheetFrame({ id, seed, print }: { id: string; seed: number; print?: string }) {
  const preset = presetById(id)!
  const [hover, setHover] = useState(false)
  const [live, setLive] = useState(false)

  // Bring the live run up to where the print was developed before showing it, so hovering
  // continues the image instead of restarting it from noise.
  const warmUp = useCallback(
    (sim: Simulation | null) => {
      if (!sim) return setLive(false)
      sim.setParams({ ...preset.params, speed: 8 })
      for (let i = 0; i < PRINT_STEPS / 8; i++) sim.tick()
      sim.setParams(preset.params)
      setLive(true)
    },
    [preset.params],
  )

  return (
    <Link
      to={`/studio?preset=${id}`}
      className={styles.frame}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => (setHover(false), setLive(false))}
      onFocus={() => setHover(true)}
      onBlur={() => (setHover(false), setLive(false))}
    >
      <span className={styles.frameEdge}>
        <span>{preset.code}</span>
        <span>{preset.name}</span>
      </span>
      <Mark active={hover} seed={seed + 80} className={styles.frameMark}>
        <span className={styles.frameImage} data-develop>
          {print ? (
            <img src={print} alt={preset.name} className={styles.framePrint} />
          ) : (
            <span className={styles.frameDeveloping} />
          )}
          {hover && (
            <LiveFrame
              params={preset.params}
              className={styles.frameCanvas}
              style={{ opacity: live ? 1 : 0 }}
              onSim={warmUp}
              label={`${preset.name}, live`}
            />
          )}
        </span>
      </Mark>
    </Link>
  )
}

/* ─── Test strip: one rule, exposed band by band as you scroll ──────────────────────────────── */

const STEPS = [
  { time: '4s', word: 'Sense', line: 'Three feelers read the trail ahead.', exposure: 0.32 },
  { time: '8s', word: 'Turn', line: 'It steers toward the strongest.', exposure: 0.58 },
  { time: '16s', word: 'Deposit', line: 'Every step leaves trail behind.', exposure: 0.86 },
  { time: '32s', word: 'Diffuse', line: 'The trail blurs, fades, and is read again.', exposure: 1.25 },
]

const TEST_PARAMS = (() => {
  const web = presetById('web')!.params
  return { ...web, look: { ...web.look, exposure: 1.1, glow: 0.5 } }
})()

/**
 * The bands are exposed in the shader, not with CSS filters over the canvas: a backdrop-filter
 * over a live canvas makes the compositor re-filter it every frame. The scroll timeline in motion.ts
 * still animates each band's --exposure; this just hands those values to the shader each frame.
 */
function TestStrip() {
  const reduced = prefersReducedMotion()
  const [sim, setSim] = useState<Simulation | null>(null)
  const bandsRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const list = bandsRef.current
    if (!sim || !list) return
    const stacked = window.matchMedia('(max-width: 640px)')
    const bands = Array.from(list.children) as HTMLElement[]
    let last = ''
    return frameLoop.add(() => {
      const values = bands.map((b) => Number(b.style.getPropertyValue('--exposure')) || 1)
      const key = values.join() + stacked.matches
      if (key === last) return
      last = key
      sim.setBands({ exposure: values as [number, number, number, number], axis: stacked.matches ? 2 : 1 })
    })
  }, [sim])

  return (
    <section className={styles.test} aria-labelledby="test-title">
      <h2 id="test-title" className={styles.testTitle}>
        One rule, every agent, every frame.
      </h2>
      <div className={styles.testStrip} data-teststrip>
        <LiveFrame
          params={TEST_PARAMS}
          className={styles.testCanvas}
          onSim={setSim}
          label="Live simulation"
        />
        <ol ref={bandsRef} className={styles.bands}>
          {STEPS.map((s) => (
            <li
              key={s.word}
              className={styles.band}
              data-band={s.exposure}
              style={{ '--exposure': reduced ? s.exposure : 0.04 } as CSSProperties}
            >
              <span className={styles.bandTime}>{s.time}</span>
              <div className={styles.bandCopy} data-band-copy>
                <h3>{s.word}</h3>
                <p>{s.line}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ─── Feed it: the one hands-on moment before the close ─────────────────────────────────────── */

const FEED_PARAMS = (() => {
  const base = presetById('web')!.params
  return {
    ...base,
    density: 0.06,
    decayRate: 0.94,
    species: base.species.map((s) => ({ ...s, color: '#ebe4d4' })),
    look: { ...base.look, exposure: 0.9, glow: 0.55 },
    seed: 77,
  }
})()

/**
 * Hovering lays a fading lure the organism turns toward; pressing lays food it settles on. No
 * instructions beyond two words — the print answering the cursor is the instruction.
 */
function FeedIt() {
  const [sim, setSim] = useState<Simulation | null>(null)
  const pressed = useRef(false)

  const brush = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    sim?.setBrush({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      radius: pressed.current ? 16 : 26,
      tool: pressed.current ? 'food' : 'attract',
      strength: pressed.current ? 0.8 : 0.35,
    })
  }

  return (
    <section className={styles.feed} aria-labelledby="feed-title">
      <div className={styles.feedHead}>
        <h2 id="feed-title" className={styles.feedTitle}>
          Feed it.
        </h2>
        <p className={styles.feedNote}>
          Move across the print and it turns toward you. Press to leave food it will hold on to.
        </p>
      </div>
      <div
        className={styles.feedPrint}
        onPointerMove={brush}
        onPointerDown={(e) => {
          pressed.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          brush(e)
        }}
        onPointerUp={(e) => {
          pressed.current = false
          brush(e)
        }}
        onPointerLeave={() => {
          pressed.current = false
          sim?.setBrush(null)
        }}
      >
        <LiveFrame
          params={FEED_PARAMS}
          className={styles.feedCanvas}
          onSim={setSim}
          label="Interactive simulation: move to lure, press to feed"
        />
        <button type="button" className={styles.feedReset} onClick={() => sim?.reset()}>
          Clear the print
        </button>
      </div>
    </section>
  )
}

/* ─── Close ─────────────────────────────────────────────────────────────────────────────────── */

function Close() {
  return (
    <section className={styles.close} data-close>
      <h2 className={styles.closeTitle}>
        <span className={styles.closeLine}>
          <span data-line>Make</span>
        </span>{' '}
        <span className={styles.closeLine}>
          <span data-line>a print.</span>
        </span>
      </h2>
      <div className={styles.closeRow}>
        <Link to="/studio" className={styles.cta}>
          Enter the darkroom
          <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
        </Link>
        <p className={styles.closeNote}>Runs on your graphics card. Needs a browser with WebGPU.</p>
      </div>
      <footer className={styles.footer}>
        <span>Filament</span>
        <a href={REPO} target="_blank" rel="noreferrer">
          <GithubMark size={14} />
          vipinsudhakar/physarum
        </a>
        <span>After Jones (2010) and Tero et al. (2010)</span>
      </footer>
    </section>
  )
}
