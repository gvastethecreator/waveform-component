// Original GLSL ES 3.00 implementation. Local GPL shader/effect source was not inspected,
// copied, translated, or used as a structural reference.
export const SPECTRUM_BARS_VFX_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_band_count;
uniform float u_bands[16];
uniform float u_energy;
uniform float u_peak;
uniform float u_centroid;
uniform float u_bar_count;
uniform float u_height_reactivity;
uniform float u_gap_size;
uniform float u_vertical_position;
uniform float u_random_speed;
uniform float u_glow_strength;
uniform vec4 u_background_color;
uniform vec4 u_gradient_color_1;
uniform vec4 u_gradient_color_2;
uniform vec4 u_gradient_color_3;
uniform vec4 u_gradient_color_4;

out vec4 out_color;

const float TAU = 6.283185307179586;

float sample_band(float position) {
  float count = max(1.0, u_band_count);
  float scaled = clamp(position, 0.0, 0.999999) * count;
  int integer_count = clamp(int(count), 1, 16);
  int lower = clamp(int(floor(scaled)), 0, integer_count - 1);
  int upper = min(lower + 1, integer_count - 1);
  return mix(u_bands[lower], u_bands[upper], fract(scaled));
}

vec3 gradient_color(float position) {
  float scaled = clamp(position, 0.0, 1.0) * 3.0;
  if (scaled < 1.0) return mix(u_gradient_color_1.rgb, u_gradient_color_2.rgb, scaled);
  if (scaled < 2.0) return mix(u_gradient_color_2.rgb, u_gradient_color_3.rgb, scaled - 1.0);
  return mix(u_gradient_color_3.rgb, u_gradient_color_4.rgb, scaled - 2.0);
}

float hash(float value) {
  return fract(sin(value * 127.1 + 311.7) * 43758.5453123);
}

void main() {
  vec2 resolution = max(u_resolution, vec2(1.0));
  vec2 uv = gl_FragCoord.xy / resolution;
  float count = clamp(floor(u_bar_count + 0.5), 4.0, 96.0);
  float cell = clamp(floor(uv.x * count), 0.0, count - 1.0);
  float position = (cell + 0.5) / count;
  float band_position = count <= 1.0 ? 0.0 : cell / (count - 1.0);
  float band = sample_band(band_position);
  float response = clamp(band * u_height_reactivity, 0.0, 2.0);
  float baseline = clamp(u_vertical_position, 0.05, 0.72);
  float available = max(0.04, 0.96 - baseline);
  float bar_height = min(available, 0.035 + available * min(response, 1.0));
  float cell_width = 1.0 / count;
  float half_width = cell_width * (1.0 - clamp(u_gap_size, 0.0, 0.82)) * 0.47;
  float horizontal_distance = abs(uv.x - position) - half_width;
  float vertical_distance = max(baseline - uv.y, uv.y - (baseline + bar_height));
  float distance_to_bar = max(horizontal_distance, vertical_distance);
  float pixel = 1.3 / min(resolution.x, resolution.y);
  float core = 1.0 - smoothstep(-pixel, pixel, distance_to_bar);
  float halo_width = pixel * 2.0 + u_glow_strength * 0.016;
  float halo = 1.0 - smoothstep(0.0, halo_width, max(distance_to_bar, 0.0));
  float stable_time = (u_time + 0.29) * u_random_speed;
  float shimmer = 0.76 + 0.24 * sin((stable_time + hash(cell + u_centroid * 17.0)) * TAU);
  vec3 bar_color = gradient_color(band_position);
  bar_color = mix(bar_color, u_gradient_color_4.rgb, clamp(response * u_peak * 0.22, 0.0, 0.4));
  vec3 color = u_background_color.rgb;
  color = mix(color, bar_color, clamp(halo * u_glow_strength * shimmer * (0.035 + u_energy * 0.04), 0.0, 0.3));
  color = mix(color, bar_color, clamp(core * shimmer * (0.58 + response * 0.22), 0.0, 0.98));
  out_color = vec4(clamp(color, vec3(0.0), vec3(1.0)), 1.0);
}
`;
