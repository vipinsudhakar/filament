/**
 * Uniform blocks declared once, in TypeScript, and turned into both the WGSL struct and the
 * packer that fills it.
 *
 * The prototype kept a hand-written WGSL struct and a hand-written packer in step by comment
 * alone, and a mismatch didn't error — it quietly read garbage from the wrong offset. Generating
 * both from one field list removes the pairing entirely.
 *
 * Offsets follow WGSL's uniform layout rules: each member starts at the next multiple of its
 * alignment, and the struct's size rounds up to 16.
 */
export type FieldType = 'u32' | 'f32' | 'vec4f' | 'vec4f[4]'

const SPEC: Record<FieldType, { size: number; align: number; wgsl: string; length: number }> = {
  u32: { size: 4, align: 4, wgsl: 'u32', length: 1 },
  f32: { size: 4, align: 4, wgsl: 'f32', length: 1 },
  vec4f: { size: 16, align: 16, wgsl: 'vec4f', length: 4 },
  'vec4f[4]': { size: 64, align: 16, wgsl: 'array<vec4f, 4>', length: 16 },
}

export type FieldList = readonly (readonly [name: string, type: FieldType])[]

type ValueOf<T extends FieldType> = T extends 'u32' | 'f32' ? number : ArrayLike<number>

export type LayoutValues<F extends FieldList> = {
  [K in F[number] as K[0]]: ValueOf<K[1]>
}

export type Layout<F extends FieldList> = {
  readonly name: string
  readonly size: number
  readonly offsets: Readonly<Record<F[number][0], number>>
  readonly wgsl: string
  pack(values: LayoutValues<F>, into?: ArrayBuffer): ArrayBuffer
}

const roundUp = (n: number, to: number) => Math.ceil(n / to) * to

export function defineLayout<const F extends FieldList>(name: string, fields: F): Layout<F> {
  const offsets: Record<string, number> = {}
  let end = 0
  for (const [field, type] of fields) {
    if (field in offsets) throw new Error(`${name}: duplicate field ${field}`)
    const { size, align } = SPEC[type]
    const offset = roundUp(end, align)
    offsets[field] = offset
    end = offset + size
  }
  const size = roundUp(end, 16)

  const wgsl = `struct ${name} {\n${fields.map(([f, t]) => `  ${f}: ${SPEC[t].wgsl},`).join('\n')}\n};`

  const pack = (values: LayoutValues<F>, into?: ArrayBuffer): ArrayBuffer => {
    const buffer = into ?? new ArrayBuffer(size)
    const u32 = new Uint32Array(buffer)
    const f32 = new Float32Array(buffer)
    const v = values as Record<string, number | ArrayLike<number>>
    for (const [field, type] of fields) {
      const value = v[field]
      if (value === undefined) throw new Error(`${name}: missing value for ${field}`)
      const word = offsets[field] / 4
      if (type === 'u32') u32[word] = value as number
      else if (type === 'f32') f32[word] = value as number
      else {
        const arr = value as ArrayLike<number>
        const length = SPEC[type].length
        if (arr.length !== length)
          throw new Error(`${name}: ${field} needs ${length} values, got ${arr.length}`)
        for (let i = 0; i < length; i++) f32[word + i] = arr[i]
      }
    }
    return buffer
  }

  return { name, size, offsets: offsets as Layout<F>['offsets'], wgsl, pack }
}
