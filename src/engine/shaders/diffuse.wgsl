// One thread per cell: fold in this step's deposits, blur toward the 3x3 mean, decay, and let
// food breathe attractant into the field. Reads one trail buffer and writes the other — sharing
// one would let a cell read neighbours already updated this step, so the blur would depend on
// GPU scheduling order.

@group(0) @binding(1) var<storage, read> src: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> dst: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> deposit: array<atomic<u32>>;
@group(0) @binding(4) var<storage, read> world: array<vec4f>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= u.width || id.y >= u.height) {
    return;
  }
  let x = i32(id.x);
  let y = i32(id.y);
  let i = id.y * u.width + id.x;

  var sum = vec4f(0.0);
  for (var dy = -1; dy <= 1; dy++) {
    for (var dx = -1; dx <= 1; dx++) {
      sum += src[cell_at(x + dx, y + dy)];
    }
  }
  let mean = sum / 9.0;

  // The mean is of the pre-deposit field, so a fresh deposit lands sharp on its own cell and
  // only starts spreading next step — which is what a trail should do.
  let d = i * 4u;
  let deposited = vec4f(
    f32(atomicLoad(&deposit[d])),
    f32(atomicLoad(&deposit[d + 1u])),
    f32(atomicLoad(&deposit[d + 2u])),
    f32(atomicLoad(&deposit[d + 3u])),
  ) / u.depositScale;

  // An empty world contributes nothing; skip the read.
  var w = vec4f(0.0);
  if (u.hasWorld != 0u) {
    w = world[i];
  }
  let blurred = mix(src[i] + deposited, mean, u.diffuseRate);
  var next = blurred * u.decayRate + vec4f(w.x * u.foodEmit) * species_mask();
  // Walls soak up trail so nothing glows through them.
  next = next * (1.0 - clamp(w.y, 0.0, 1.0));
  // A runaway deposit can't be allowed to reach inf and poison the blur for the rest of the run.
  dst[i] = clamp(next, vec4f(0.0), vec4f(1e4));

  // This cell is the only writer to its accumulator slots, so no contention clearing them.
  atomicStore(&deposit[d], 0u);
  atomicStore(&deposit[d + 1u], 0u);
  atomicStore(&deposit[d + 2u], 0u);
  atomicStore(&deposit[d + 3u], 0u);
}
