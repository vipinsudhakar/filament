// Fullscreen triangle, shared by every screen-space pass. Three vertices covering the clip cube;
// cheaper than a quad and needs no vertex buffer.

struct VertexOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vs(@builtin(vertex_index) i: u32) -> VertexOut {
  let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
  var out: VertexOut;
  out.pos = vec4f(p * 2.0 - 1.0, 0.0, 1.0);
  // Clip space is y-up, textures and the grid are y-down.
  out.uv = vec2f(p.x, 1.0 - p.y);
  return out;
}
