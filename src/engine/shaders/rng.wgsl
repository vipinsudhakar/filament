// The seeded RNG, GPU half. A line-for-line copy of pcgHash in src/engine/rng.ts — the two must
// produce identical output, so change them together. This file holds functions only; it gets
// prepended to whichever shader needs them, so it declares no bindings and no entry point.

fn pcg_hash(input: u32) -> u32 {
  let state = input * 747796405u + 2891336453u;
  let word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}

// u32 hash mapped to a float in [0, 1). 4294967296.0 is 2^32, matching the TS divisor.
fn pcg_float(input: u32) -> f32 {
  return f32(pcg_hash(input)) / 4294967296.0;
}
