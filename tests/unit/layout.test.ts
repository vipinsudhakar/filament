import { describe, expect, it } from 'vitest'
import { defineLayout } from '@/engine/layout'
import { LookLayout, SimLayout } from '@/engine/uniforms'

describe('defineLayout', () => {
  it('follows WGSL alignment: vec4 and arrays of vec4 start on 16-byte boundaries', () => {
    const L = defineLayout('T', [
      ['a', 'u32'],
      ['b', 'vec4f'],
      ['c', 'f32'],
      ['d', 'vec4f[4]'],
      ['e', 'u32'],
    ] as const)
    expect(L.offsets).toEqual({ a: 0, b: 16, c: 32, d: 48, e: 112 })
    // 116 bytes rounds up to the next multiple of 16.
    expect(L.size).toBe(128)
  })

  it('emits a WGSL struct with the fields in declaration order', () => {
    const L = defineLayout('T', [
      ['a', 'u32'],
      ['m', 'vec4f[4]'],
    ] as const)
    expect(L.wgsl).toBe('struct T {\n  a: u32,\n  m: array<vec4f, 4>,\n};')
  })

  it('packs u32 and f32 into the right words', () => {
    const L = defineLayout('T', [
      ['n', 'u32'],
      ['x', 'f32'],
      ['v', 'vec4f'],
    ] as const)
    const buf = L.pack({ n: 7, x: 0.5, v: [1, 2, 3, 4] })
    expect(new Uint32Array(buf)[0]).toBe(7)
    expect(new Float32Array(buf)[1]).toBe(0.5)
    expect([...new Float32Array(buf, 16, 4)]).toEqual([1, 2, 3, 4])
  })

  it('refuses a missing field or a wrong-length array rather than packing garbage', () => {
    const L = defineLayout('T', [['v', 'vec4f']] as const)
    expect(() => L.pack({ v: [1, 2, 3] })).toThrow(/needs 4/)
    expect(() => L.pack({} as never)).toThrow(/missing/)
  })

  it('rejects duplicate fields', () => {
    expect(() =>
      defineLayout('T', [
        ['a', 'u32'],
        ['a', 'f32'],
      ] as const),
    ).toThrow(/duplicate/)
  })

  it('keeps the real blocks aligned', () => {
    expect(SimLayout.size % 16).toBe(0)
    expect(LookLayout.size % 16).toBe(0)
    expect(SimLayout.offsets.motion % 16).toBe(0)
    expect(LookLayout.offsets.colors % 16).toBe(0)
  })
})
