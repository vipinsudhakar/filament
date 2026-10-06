// The final image: scene plus glow, tone mapped, screened over the background, vignetted,
// encoded to sRGB and dithered.

@group(0) @binding(0) var<uniform> r: LookUniforms;
@group(0) @binding(1) var scene: texture_2d<f32>;
@group(0) @binding(2) var glow: texture_2d<f32>;
@group(0) @binding(3) var samp: sampler;

fn dither(p: vec2u) -> f32 {
  return f32(pcg_hash(p.x ^ pcg_hash(p.y ^ pcg_hash(r.frame)))) / 4294967296.0;
}

@fragment
fn fs(in: VertexOut) -> @location(0) vec4f {
  let hdr = textureSampleLevel(scene, samp, in.uv, 0.0).rgb
    + textureSampleLevel(glow, samp, in.uv, 0.0).rgb * r.glow;

  // Exponential tone map: lifts the faint exploratory filaments (an order of magnitude dimmer
  // than the trunk routes) and rolls the trunks off smoothly instead of clipping them.
  let mapped = vec3f(1.0) - exp(-hdr);

  // The organism is emissive, so it screens over the background rather than covering it.
  let bg = r.background.rgb;
  var col = bg + mapped * (vec3f(1.0) - bg);

  let d = length((in.uv - 0.5) * vec2f(r.canvasWidth / r.canvasHeight, 1.0)) / 0.85;
  col *= 1.0 - r.vignette * smoothstep(0.35, 1.25, d);

  // Linear -> sRGB, then a sub-LSB dither so dark gradients don't band in 8 bits.
  var srgb = pow(max(col, vec3f(0.0)), vec3f(1.0 / 2.2));

  // Test-strip bands: the same print at four exposures, done here rather than with CSS filters over
  // the canvas, which would make the compositor re-filter it every frame. Applied after encoding,
  // the way CSS brightness() is, so the steps read as clearly as the design intends.
  if (r.bandAxis != 0u) {
    let t = select(in.uv.y, in.uv.x, r.bandAxis == 1u);
    srgb *= r.bandExposure[min(3u, u32(floor(t * 4.0)))];
  }
  srgb += (dither(vec2u(in.pos.xy)) - 0.5) / 255.0;
  return vec4f(srgb, 1.0);
}
