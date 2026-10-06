/**
 * The seeded RNG, CPU half.
 *
 * A run has to be bit-for-bit reproducible from (params, seed) — that's the whole basis of
 * share links — so the randomness can't come from Math.random(). It comes from a hash: given
 * an integer input, `pcgHash` returns a well-scrambled u32, deterministically.
 *
 * This is the single-word PCG hash (Jarzynski 2020), not the 64-bit PCG32 generator. WGSL has
 * no u64, and matching a 64-bit generator across TS and the GPU would mean emulating 64-bit
 * multiplies on both sides. The single-word variant is all u32 arithmetic, so `src/engine/shaders/rng.wgsl`
 * is a line-for-line copy and the two produce identical output — which is what the CPU
 * reference vs GPU readback test (tools/determinism.mjs) depends on. Keep the two files in step.
 */

/**
 * One round of the PCG hash. `Math.imul` is load-bearing: it does a 32-bit wrapping multiply
 * exactly like WGSL's `u * 747796405u`. Plain `*` would promote to a 53-bit float partway
 * through and silently diverge from the shader.
 */
export function pcgHash(input: number): number {
  const state = (Math.imul(input >>> 0, 747796405) + 2891336453) >>> 0
  const word = Math.imul((state >>> ((state >>> 28) + 4)) ^ state, 277803737) >>> 0
  return ((word >>> 22) ^ word) >>> 0
}

export type Rng = {
  /** Next raw 32-bit value. */
  nextU32(): number
  /** Next float in [0, 1). */
  nextFloat(): number
}

/**
 * A counter-based stream seeded by `seed`. Counter-based rather than state-feedback so the CPU
 * and GPU can draw the same value for the same entity without threading a state through — the
 * GPU hashes (agent index, frame); this hashes (base, i). The seed is mixed in once through the
 * hash so adjacent seeds don't produce streams that are just shifted copies of each other.
 */
export function makeRng(seed: number): Rng {
  const base = pcgHash(seed >>> 0)
  let i = 0
  const nextU32 = () => pcgHash((base + i++) >>> 0)
  return { nextU32, nextFloat: () => nextU32() / 4_294_967_296 }
}
