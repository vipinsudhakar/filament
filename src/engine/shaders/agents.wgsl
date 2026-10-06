// One thread per agent: sense the field ahead at three points, steer toward the strongest, step,
// deposit. Every pattern the organism makes emerges from this single rule — no agent ever reads
// another, they only read and write the shared trail.

// Layout must match AGENT_STRIDE and the field order in engine/spawn.ts.
struct Agent {
  pos: vec2f,
  angle: f32,
  species: u32,
};

@group(0) @binding(1) var<storage, read_write> agents: array<Agent>;
@group(0) @binding(2) var<storage, read_write> deposit: array<atomic<u32>>;
@group(0) @binding(3) var<storage, read> trail: array<vec4f>;
@group(0) @binding(4) var<storage, read> world: array<vec4f>;

/**
 * One sensor: a point sensorDistance ahead along `heading`, averaged over a (2r+1)^2 block. What
 * a species "smells" is its own weighting of the four trail channels, so the same field reads as
 * attractive to one species and repellent to another. Repellent paint and walls read as strongly
 * negative, so agents steer around them before they arrive.
 */
fn sense(pos: vec2f, heading: f32, s: u32) -> f32 {
  let ahead = pos + vec2f(cos(heading), sin(heading)) * u.motion[s].y;
  let cx = i32(floor(ahead.x));
  let cy = i32(floor(ahead.y));
  let r = i32(u.senses[s].y);
  let weights = u.interaction[s];

  var sum = 0.0;
  for (var dy = -r; dy <= r; dy++) {
    for (var dx = -r; dx <= r; dx++) {
      let i = cell_at(cx + dx, cy + dy);
      let w = world[i];
      sum += dot(trail[i], weights) - w.z * u.repelStrength - w.y * 1000.0;
    }
  }
  return sum / f32((2 * r + 1) * (2 * r + 1));
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= u.agentCount) {
    return;
  }

  var agent = agents[i];
  let s = agent.species;
  let motion = u.motion[s];

  let left = sense(agent.pos, agent.angle - motion.x, s);
  let centre = sense(agent.pos, agent.angle, s);
  let right = sense(agent.pos, agent.angle + motion.x, s);

  // The turn rule (Jones 2010): head toward the strongest reading.
  var turn = 0.0;
  if (centre >= left && centre >= right) {
    turn = 0.0;
  } else if (centre < left && centre < right) {
    // Both sides beat the centre with no reason to prefer one: pick at random. This is what stops
    // agents locking into straight lines and carving grid artefacts.
    turn = select(-motion.z, motion.z, agent_random(i, 0x68e31da4u) < 0.5);
  } else if (right > left) {
    turn = motion.z;
  } else {
    turn = -motion.z;
  }

  var heading = agent.angle + turn;
  var p = agent.pos + vec2f(cos(heading), sin(heading)) * motion.w;

  let w = f32(u.width);
  let h = f32(u.height);
  if (u.boundary == 0u) {
    p = p - floor(p / vec2f(w, h)) * vec2f(w, h);
    // Float rounding can land a tiny negative exactly on w; fold it back to 0.
    p = select(p, vec2f(0.0), p >= vec2f(w, h));
  } else {
    if (p.x < 0.0 || p.x >= w) {
      heading = PI - heading;
      p.x = clamp(p.x, 0.0, w - 0.01);
    }
    if (p.y < 0.0 || p.y >= h) {
      heading = -heading;
      p.y = clamp(p.y, 0.0, h - 0.01);
    }
  }

  var cell = u32(p.y) * u.width + u32(p.x);
  if (world[cell].y > 0.5) {
    // Walked into a wall: stay put and pick a fresh heading, the way the real organism probes.
    p = agent.pos;
    heading = agent_random(i, 0x1b873593u) * TAU;
    cell = u32(p.y) * u.width + u32(p.x);
  }

  agent.pos = p;
  // Keep the angle bounded so f32 precision doesn't erode over a long run.
  agent.angle = heading - floor(heading / TAU) * TAU;
  agents[i] = agent;

  // Fixed-point deposit into this species' channel; diffuse.wgsl divides depositScale back out.
  atomicAdd(&deposit[cell * 4u + s], u32(u.senses[s].x * u.depositScale));
}
