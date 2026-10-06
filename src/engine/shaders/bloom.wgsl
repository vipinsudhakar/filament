// Bloom, in two entry points sharing one module.
//
// `bright` downsamples the scene to quarter resolution, keeping only what's bright enough to glow.
// It reads the blur uniforms only for the quarter-res texel size.
//
// `blur` is a separable 9-tap Gaussian, run horizontally then vertically. The taps sit between
// texels so the linear sampler folds two weights into each fetch: 5 fetches for 9 taps.

@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;
@group(0) @binding(2) var<uniform> b: BlurUniforms;

@fragment
fn bright(in: VertexOut) -> @location(0) vec4f {
  // The glow runs at quarter resolution, so each output texel covers 4x4 scene pixels. Four
  // bilinear taps, one per 2x2 quadrant, average all sixteen; a single tap would skip filaments
  // thinner than four pixels and make the glow shimmer as they move.
  let o = vec2f(b.texelX, b.texelY) * 0.25;
  let c = 0.25 * (
    textureSampleLevel(src, samp, in.uv + vec2f(-o.x, -o.y), 0.0).rgb +
    textureSampleLevel(src, samp, in.uv + vec2f(o.x, -o.y), 0.0).rgb +
    textureSampleLevel(src, samp, in.uv + vec2f(-o.x, o.y), 0.0).rgb +
    textureSampleLevel(src, samp, in.uv + vec2f(o.x, o.y), 0.0).rgb
  );
  // Soft knee: faint filaments contribute a little, the trunks most.
  let luma = dot(c, vec3f(0.2126, 0.7152, 0.0722));
  return vec4f(c * smoothstep(0.05, 0.6, luma), 1.0);
}

@fragment
fn blur(in: VertexOut) -> @location(0) vec4f {
  let step = vec2f(b.texelX, b.texelY) * vec2f(b.dirX, b.dirY) * b.radius;
  var c = textureSampleLevel(src, samp, in.uv, 0.0).rgb * 0.2270270270;
  c += textureSampleLevel(src, samp, in.uv + step * 1.3846153846, 0.0).rgb * 0.3162162162;
  c += textureSampleLevel(src, samp, in.uv - step * 1.3846153846, 0.0).rgb * 0.3162162162;
  c += textureSampleLevel(src, samp, in.uv + step * 3.2307692308, 0.0).rgb * 0.0702702703;
  c += textureSampleLevel(src, samp, in.uv - step * 3.2307692308, 0.0).rgb * 0.0702702703;
  return vec4f(c, 1.0);
}
