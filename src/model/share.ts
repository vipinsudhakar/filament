import { SCHEMA_VERSION, fromUnknown, type Params } from '@/model/params'

/**
 * Share links: the full Params, versioned, deflated and base64url-encoded into the URL hash.
 *
 *   #run=<base64url(deflate-raw(JSON { v, p }))>
 *
 * The full object is encoded rather than a diff against DEFAULTS, so retuning the defaults never
 * changes what an old link plays. Decoding always ends in fromUnknown(), so a truncated or
 * hand-mangled link degrades field by field instead of failing.
 */
const HASH_KEY = 'run'

type Payload = { v: number; p: unknown }

/**
 * Older payload shapes, upgraded one version at a time. v1 was the single-species prototype; its
 * links never shipped publicly, but its field names map cleanly, so it's honoured.
 */
const MIGRATIONS: Record<number, (p: Record<string, unknown>) => Record<string, unknown>> = {
  1: (p) => ({
    speciesCount: 1,
    decayRate: p.decayRate,
    diffuseRate: p.diffuseRate,
    spawnPattern: p.spawnPattern,
    boundary: p.boundary,
    seed: p.seed,
    species: [
      {
        sensorAngle: p.sensorAngle,
        sensorDistance: p.sensorDistance,
        sensorSize: p.sensorSize,
        turnSpeed: p.turnSpeed,
        moveSpeed: p.moveSpeed,
        depositAmount: p.depositAmount,
      },
    ],
  }),
}

export function migrate(payload: Payload): Params {
  let version = Number(payload.v) || SCHEMA_VERSION
  let p = (typeof payload.p === 'object' && payload.p !== null ? payload.p : {}) as Record<string, unknown>
  while (version < SCHEMA_VERSION) {
    const step = MIGRATIONS[version]
    if (step) p = step(p)
    version++
  }
  return fromUnknown(p)
}

/** Trim float noise so the payload compresses well; every value is clamped again on decode. */
function round(value: unknown): unknown {
  if (typeof value === 'number') return Math.round(value * 10000) / 10000
  if (Array.isArray(value)) return value.map(round)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, round(v)]))
  }
  return value
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(out).arrayBuffer())
}

function toBase64Url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

export async function encodeParams(params: Params): Promise<string> {
  const json = JSON.stringify({ v: SCHEMA_VERSION, p: round(params) } satisfies Payload)
  return toBase64Url(await pipe(new TextEncoder().encode(json), new CompressionStream('deflate-raw')))
}

/** Null when the text isn't a payload at all; otherwise always a valid Params. */
export async function decodeParams(encoded: string): Promise<Params | null> {
  try {
    const bytes = await pipe(fromBase64Url(encoded), new DecompressionStream('deflate-raw'))
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as Payload
    return migrate(payload)
  } catch {
    return null
  }
}

export async function paramsToHash(params: Params): Promise<string> {
  return `#${HASH_KEY}=${await encodeParams(params)}`
}

/** Read params from a location hash, or null when it carries none. */
export async function paramsFromHash(hash: string): Promise<Params | null> {
  const match = new URLSearchParams(hash.replace(/^#/, '')).get(HASH_KEY)
  return match ? decodeParams(match) : null
}
