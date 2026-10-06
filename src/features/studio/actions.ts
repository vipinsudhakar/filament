import { useMemo, useRef, type RefObject } from 'react'
import type { Simulation } from '@/engine/Simulation'
import { presetById } from '@/model/presets'
import { paramsToHash } from '@/model/share'
import { useStudio } from '@/state/studio'
import { keepRun } from '@/features/studio/runs'

export type StudioActions = ReturnType<typeof useStudioActions>

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

const fileStem = () => {
  const { presetId, params } = useStudio.getState()
  const name = presetById(presetId)?.id ?? 'print'
  return `filament-${name}-${params.seed}`
}

/** The studio's outward actions: print, record, share, keep, fullscreen. */
export function useStudioActions(sim: Simulation | null, canvasRef: RefObject<HTMLCanvasElement | null>) {
  const recorder = useRef<MediaRecorder | null>(null)

  return useMemo(() => {
    const notify = (text: string) => useStudio.getState().notify(text)

    const savePrint = async () => {
      const blob = await sim?.snapshot()
      if (!blob) return notify('Could not save the print')
      download(blob, `${fileStem()}.png`)
      notify('Print saved')
    }

    const share = async () => {
      const hash = await paramsToHash(useStudio.getState().params)
      const url = `${window.location.origin}${window.location.pathname}${hash}`
      try {
        await navigator.clipboard.writeText(url)
        notify('Link copied — it replays this exact run')
      } catch {
        window.prompt('Copy this link', url)
      }
    }

    const keep = async () => {
      const blob = await sim?.snapshot()
      if (!blob) return
      await keepRun(useStudio.getState().params, blob)
      notify('Kept in your prints')
    }

    const toggleFullscreen = () => {
      if (document.fullscreenElement) void document.exitFullscreen()
      else void document.documentElement.requestFullscreen?.()
    }

    /**
     * Record the canvas — just the print, never the chrome — to WebM. VP9 when the browser has it;
     * the bitrate is high because the fine filaments are exactly what low bitrates smear.
     */
    const toggleRecording = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      if (recorder.current) {
        recorder.current.stop()
        return
      }
      const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((t) =>
        MediaRecorder.isTypeSupported(t),
      )
      if (!mimeType) return notify('This browser cannot record video')
      const chunks: Blob[] = []
      const rec = new MediaRecorder(canvas.captureStream(60), { mimeType, videoBitsPerSecond: 16_000_000 })
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      rec.onstop = () => {
        recorder.current = null
        useStudio.getState().set({ recording: false })
        download(new Blob(chunks, { type: 'video/webm' }), `${fileStem()}.webm`)
        notify('Recording saved')
      }
      rec.start(250)
      recorder.current = rec
      useStudio.getState().set({ recording: true })
    }

    return { savePrint, share, keep, toggleFullscreen, toggleRecording }
  }, [sim, canvasRef])
}
