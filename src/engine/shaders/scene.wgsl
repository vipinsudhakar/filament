// Turns the trail field into linear HDR light. Each species emits its own colour in proportion to
// its trail; overlapping species add, the way light does. Tone mapping waits for the composite,
// so the bloom works on unclipped values.

@group(0) @binding(0) var<uniform> r: LookUniforms;
@group(0) @binding(1) var<storage, read> trail: array<vec4f>;
@group(0) @binding(2) var<storage, read> world: array<vec4f>;

fn grid_cell(x: i32, y: i32) -> u32 {
  let w = i32(r.gridWidth);
  let h = i32(r.gridHeight);
  var cx = clamp(x, 0, w - 1);
  var cy = clamp(y, 0, h - 1);
  if (r.wrap == 1u) {
    cx = ((x % w) + w) % w;
    cy = ((y % h) + h) % h;
  }
  return u32(cy) * u32(w) + u32(cx);
}

// The grid is usually coarser than the canvas (simScale, high-DPI backing stores), so it's
// sampled bilinearly — nearest would show the grid as blocks.
fn bilinear_trail(g: vec2f) -> vec4f {
  let base = floor(g);
  let f = g - base;
  let x = i32(base.x);
  let y = i32(base.y);
  let a = mix(trail[grid_cell(x, y)], trail[grid_cell(x + 1, y)], f.x);
  let b = mix(trail[grid_cell(x, y + 1)], trail[grid_cell(x + 1, y + 1)], f.x);
  return mix(a, b, f.y);
}

fn bilinear_world(g: vec2f) -> vec4f {
  let base = floor(g);
  let f = g - base;
  let x = i32(base.x);
  let y = i32(base.y);
  let a = mix(world[grid_cell(x, y)], world[grid_cell(x + 1, y)], f.x);
  let b = mix(world[grid_cell(x, y + 1)], world[grid_cell(x + 1, y + 1)], f.x);
  return mix(a, b, f.y);
}

@fragment
fn fs(in: VertexOut) -> @location(0) vec4f {
  let g = in.uv * vec2f(r.gridWidth, r.gridHeight) - 0.5;
  let t = max(bilinear_trail(g), vec4f(0.0));
  let w = bilinear_world(g);

  var col = vec3f(0.0);
  for (var s = 0u; s < r.speciesCount; s++) {
    col += r.colors[s].rgb * t[s];
  }
  col *= r.exposure;

  col += r.foodColor.rgb * smoothstep(0.02, 0.9, w.x) * 0.45;
  col += r.repelColor.rgb * smoothstep(0.02, 1.0, w.z) * 0.5;
  col = mix(col, r.wallColor.rgb, smoothstep(0.35, 0.65, w.y));

  return vec4f(col, 1.0);
}
