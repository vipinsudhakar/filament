// Paints into the world layer (food, repellent, walls) or straight into the live trail
// (attract). Dispatched over just the brush's bounding box, not the whole grid.

@group(0) @binding(1) var<storage, read_write> trail: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> world: array<vec4f>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  if (u.brushActive == 0u) {
    return;
  }
  let r = u.brushRadius;
  let size = u32(ceil(r * 2.0)) + 1u;
  if (id.x >= size || id.y >= size) {
    return;
  }

  let x = i32(floor(u.brushX - r)) + i32(id.x);
  let y = i32(floor(u.brushY - r)) + i32(id.y);
  let d = distance(vec2f(f32(x) + 0.5, f32(y) + 0.5), vec2f(u.brushX, u.brushY));
  if (d > r) {
    return;
  }

  let w = i32(u.width);
  let h = i32(u.height);
  // Bounce mode has no other side to wrap onto; strokes past the edge just stop there.
  if (u.boundary == 1u && (x < 0 || y < 0 || x >= w || y >= h)) {
    return;
  }
  let i = cell_at(x, y);

  let fall = 1.0 - smoothstep(r * 0.35, r, d);
  let k = fall * u.brushStrength;
  var cell = world[i];

  switch u.brushTool {
    case 0u: { // attract: a burst of trail every species wants to follow
      trail[i] = trail[i] + vec4f(k * 0.6) * species_mask();
    }
    case 1u: { // repel
      cell.z = min(1.0, cell.z + k * 0.2);
    }
    case 2u: { // wall: a hard edge, and nothing left glowing underneath it
      if (d < r * 0.85) {
        cell.y = 1.0;
        trail[i] = vec4f(0.0);
      }
    }
    case 3u: { // food
      cell.x = min(1.0, cell.x + k * 0.2);
    }
    default: { // erase
      cell = cell * (1.0 - clamp(k * 1.5, 0.0, 1.0));
    }
  }
  world[i] = cell;
}
