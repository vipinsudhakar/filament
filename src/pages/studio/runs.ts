import { fromUnknown, type Params } from '@/model/params'

/**
 * "Your prints": runs kept in this browser. localStorage is right for this — personal, per-device,
 * and the link is the durable way to keep or send one. Every access is guarded: storage can be
 * blocked, full, or missing in a private window, and the studio must work regardless.
 */
const KEY = 'filament:prints'
const MAX = 24

export type KeptRun = { id: string; createdAt: number; params: Params; thumb: string }

export function listRuns(): KeptRun[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown
    if (!Array.isArray(raw)) return []
    return raw
      .filter((r) => r && typeof r === 'object' && typeof r.thumb === 'string')
      .map((r) => ({
        id: String(r.id),
        createdAt: Number(r.createdAt),
        thumb: r.thumb,
        params: fromUnknown(r.params),
      }))
  } catch {
    return []
  }
}

function save(runs: KeptRun[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(runs.slice(0, MAX)))
    window.dispatchEvent(new Event('filament:runs'))
  } catch {
    // Full or blocked: keeping is best-effort; the share link still works.
  }
}

/** A small JPEG thumbnail of the print, so a couple of dozen runs fit comfortably in storage. */
async function thumbnail(blob: Blob): Promise<string> {
  const bitmap = await createImageBitmap(blob)
  const w = 320
  const h = Math.round((bitmap.height / bitmap.width) * w)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.82)
}

export async function keepRun(params: Params, print: Blob) {
  const run: KeptRun = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    params,
    thumb: await thumbnail(print),
  }
  save([run, ...listRuns()])
}

export function forgetRun(id: string) {
  save(listRuns().filter((r) => r.id !== id))
}
