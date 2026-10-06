import { useCallback, useEffect, useRef, useState } from 'react'
import { useSimulation } from '@/hooks/useSimulation'
import { useStudio } from '@/state/studio'
import { BRUSH_TOOLS, type BrushTool } from '@/engine/uniforms'
import { mutate } from '@/model/mutate'
import { randomSeed } from '@/model/params'
import { Unsupported } from '@/routes/shell/Unsupported'
import { TopBar } from '@/features/studio/TopBar'
import { ToolRail } from '@/features/studio/ToolRail'
import { Transport } from '@/features/studio/Transport'
import { Inspector } from '@/features/studio/Inspector'
import { Toast } from '@/features/studio/Toast'
import { FirstRun } from '@/features/studio/FirstRun'
import { Shortcuts } from '@/features/studio/Shortcuts'
import { useStudioActions } from '@/features/studio/actions'
import { TOOL_ORDER } from '@/features/studio/tools'
import styles from './Stage.module.css'

/** Strength of a brush stroke per frame. Fixed: the brush size is the one dial people reach for. */
const BRUSH_STRENGTH = 0.8

export function Stage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const modeRef = useRef<'run' | 'frozen' | 'off'>('run')
  const { sim, status } = useSimulation(canvasRef, useStudio.getState().params, { mode: modeRef })
  const paused = useStudio((s) => s.paused)
  const uiHidden = useStudio((s) => s.uiHidden)
  const recording = useStudio((s) => s.recording)
  const tool = useStudio((s) => s.tool)
  const brushSize = useStudio((s) => s.brushSize)
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const actions = useStudioActions(sim, canvasRef)

  modeRef.current = paused ? 'frozen' : 'run'

  // Store → engine. A subscription, not React state, so dragging a slider never re-renders the stage.
  useEffect(() => {
    if (!sim) return
    sim.onStats = (stats) => useStudio.getState().set({ stats })
    const clearPaint = () => sim.clearPaint()
    window.addEventListener('filament:clear-paint', clearPaint)
    const unsubscribe = useStudio.subscribe((state, prev) => {
      if (state.params !== prev.params) sim.setParams(state.params)
    })
    return () => {
      unsubscribe()
      window.removeEventListener('filament:clear-paint', clearPaint)
    }
  }, [sim])

  // Dev-only handle for the tools in tools/ (determinism, verification). Stripped from production builds.
  useEffect(() => {
    if (!import.meta.env.DEV || !sim) return
    Object.assign(window, { __filament: { sim, store: useStudio } })
  }, [sim])

  // On a phone the adjustments are a sheet over the print; start with the print.
  useEffect(() => {
    if (window.matchMedia('(max-width: 760px)').matches) useStudio.getState().set({ inspectorOpen: false })
  }, [])

  // Painting. The brush follows the pointer while a button is held; the right button erases.
  const painting = useRef<BrushTool | null>(null)
  const brushAt = useCallback(
    (e: React.PointerEvent, toolOverride?: BrushTool) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const t = toolOverride ?? painting.current ?? useStudio.getState().tool
      sim?.setBrush({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        radius: useStudio.getState().brushSize,
        tool: t,
        strength: BRUSH_STRENGTH,
      })
    },
    [sim],
  )

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.button !== 2) return
    e.currentTarget.setPointerCapture(e.pointerId)
    painting.current = e.button === 2 ? 'erase' : useStudio.getState().tool
    brushAt(e)
    window.dispatchEvent(new Event('filament:painted'))
  }
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    if (painting.current) brushAt(e)
  }
  const endStroke = () => {
    painting.current = null
    sim?.setBrush(null)
  }

  // Keyboard. Ignored while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable]')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const s = useStudio.getState()
      const key = e.key.toLowerCase()
      const toolIndex = Number(e.key) - 1
      if (toolIndex >= 0 && toolIndex < BRUSH_TOOLS.length) {
        s.set({ tool: TOOL_ORDER[toolIndex] })
        return
      }
      switch (key) {
        case ' ':
          e.preventDefault()
          s.set({ paused: !s.paused })
          break
        case '.':
          if (s.paused) sim?.stepOnce()
          break
        case 'r':
          sim?.reset()
          break
        case 'n':
          s.reseed()
          break
        case 'm':
          s.replaceParams(mutate(s.params, randomSeed()))
          break
        case 'h':
          s.set({ uiHidden: !s.uiHidden })
          break
        case 'f':
          actions.toggleFullscreen()
          break
        case 'p':
          void actions.savePrint()
          break
        case '[':
          s.set({ brushSize: Math.max(4, s.brushSize - 4) })
          break
        case ']':
          s.set({ brushSize: Math.min(120, s.brushSize + 4) })
          break
        case '?':
          setShortcutsOpen((o) => !o)
          break
        case 'escape':
          if (s.uiHidden) s.set({ uiHidden: false })
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sim, actions])

  if (status.phase === 'failed') return <Unsupported failure={status.failure} />

  return (
    <div
      className={styles.stage}
      data-ui-hidden={uiHidden || undefined}
      data-recording={recording || undefined}
    >
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        data-tool={tool}
        aria-label="Simulation canvas. Drag to paint with the selected tool."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onPointerLeave={() => setCursor(null)}
        onContextMenu={(e) => e.preventDefault()}
      />
      {cursor && (
        <div
          className={styles.cursor}
          data-tool={tool}
          style={{
            transform: `translate(${cursor.x}px, ${cursor.y}px)`,
            width: brushSize * 2,
            height: brushSize * 2,
          }}
          aria-hidden="true"
        />
      )}
      <div
        className={styles.develop}
        data-ready={status.phase === 'running' || undefined}
        aria-hidden="true"
      />

      <div className={styles.chrome}>
        <TopBar actions={actions} />
        <ToolRail />
        <Inspector />
        <Transport sim={sim} onShortcuts={() => setShortcutsOpen(true)} />
      </div>

      {uiHidden && <p className={styles.hiddenHint}>H — show controls</p>}
      <FirstRun />
      <Toast />
      <Shortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  )
}
