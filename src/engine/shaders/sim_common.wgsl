// Shared by every simulation pass: the uniform binding and grid helpers. Prepended after the
// generated SimUniforms struct (engine/uniforms.ts) and rng.wgsl.

@group(0) @binding(0) var<uniform> u: SimUniforms;

const TAU: f32 = 6.28318530718;
const PI: f32 = 3.14159265359;

fn wrap_coord(v: i32, n: i32) -> i32 {
  return ((v % n) + n) % n;
}

/**
 * Index of the cell at (x, y), following the boundary: a torus in wrap mode, clamped to the edge
 * in bounce mode. Sensors and the blur both read through this, so structure behaves the same at
 * the border as it does in the middle.
 */
fn cell_at(x: i32, y: i32) -> u32 {
  let w = i32(u.width);
  let h = i32(u.height);
  var cx: i32;
  var cy: i32;
  if (u.boundary == 0u) {
    cx = wrap_coord(x, w);
    cy = wrap_coord(y, h);
  } else {
    cx = clamp(x, 0, w - 1);
    cy = clamp(y, 0, h - 1);
  }
  return u32(cy) * u.width + u32(cx);
}

/** 1 for each trail channel that belongs to a live species, 0 for the rest. */
fn species_mask() -> vec4f {
  let n = u.speciesCount;
  return vec4f(1.0, select(0.0, 1.0, n > 1u), select(0.0, 1.0, n > 2u), select(0.0, 1.0, n > 3u));
}

/**
 * A reproducible random float for (agent, frame, salt). Counter-based, so nothing is threaded
 * between frames — hashing the same inputs always draws the same value.
 */
fn agent_random(i: u32, salt: u32) -> f32 {
  let frame_key = pcg_hash(u.frame ^ (u.seed * 0x9e3779b9u));
  return pcg_float(pcg_hash(i ^ salt) ^ frame_key);
}
