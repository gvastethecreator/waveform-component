// Original GLSL ES 3.00 implementation. Local GPL shader/effect source was not inspected,
// copied, translated, or used as a structural reference.
export const ROUNDED_WOBBLE_BARS_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_band_count;
uniform float u_bands[16];
uniform float u_energy;
uniform float u_peak;
uniform float u_centroid;
uniform float u_bar_count;
uniform float u_wobble_intensity;
uniform float u_mirror_vertically;
uniform float u_bar_gap;
uniform float u_glow_intensity;
uniform float u_energy_reactivity;
uniform vec4 u_background_color;
uniform vec4 u_left_color;
uniform vec4 u_right_color;
uniform vec4 u_burst_flash_color;

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

float rounded_box(vec2 point, vec2 half_size, float radius) {
  vec2 delta = abs(point) - half_size + radius;
  return length(max(delta, 0.0)) + min(max(delta.x, delta.y), 0.0) - radius;
}

void main() {
  vec2 resolution = max(u_resolution, vec2(1.0));
  vec2 uv = gl_FragCoord.xy / resolution;
  float count = clamp(floor(u_bar_count + 0.5), 4.0, 64.0);
  float cell = clamp(floor(uv.x * count), 0.0, count - 1.0);
  float position = (cell + 0.5) / count;
  float band_position = count <= 1.0 ? 0.0 : cell / (count - 1.0);
  float band = sample_band(band_position);
  float response = clamp(band * u_energy_reactivity, 0.0, 2.0);
  float cell_width = 1.0 / count;
  float half_width = cell_width * (1.0 - clamp(u_bar_gap, 0.0, 0.78)) * 0.46;
  float phase = (band_position * 2.7 + (u_time + 0.41) * 0.34 + u_centroid * 0.2) * TAU;
  float wobble = sin(phase) * u_wobble_intensity * cell_width * (0.25 + response * 0.2);
  bool mirrored = u_mirror_vertically > 0.5;
  float full_height = mirrored
    ? clamp(0.1 + response * 0.72, 0.1, 0.88)
    : clamp(0.08 + response * 0.76, 0.08, 0.86);
  float half_height = full_height * 0.5;
  float baseline = mirrored ? 0.5 : 0.08;
  float center_y = mirrored ? baseline : baseline + half_height;
  float vertical_progress = mirrored
    ? abs(uv.y - baseline) / max(half_height, 0.001)
    : max(0.0, uv.y - baseline) / max(full_height, 0.001);
  float center_x = position + wobble * smoothstep(0.0, 1.0, vertical_progress);
  float radius = min(half_width, min(half_height, 0.025));
  float distance_to_bar = rounded_box(uv - vec2(center_x, center_y), vec2(half_width, half_height), radius);
  float pixel = 1.4 / min(resolution.x, resolution.y);
  float core = 1.0 - smoothstep(-pixel, pixel, distance_to_bar);
  float halo_width = pixel * 2.0 + u_glow_intensity * 0.018;
  float halo = 1.0 - smoothstep(0.0, halo_width, max(distance_to_bar, 0.0));
  vec3 bar_color = mix(u_left_color.rgb, u_right_color.rgb, band_position);
  float tip = smoothstep(0.55, 1.0, vertical_progress) * response;
  bar_color = mix(
    bar_color,
    u_burst_flash_color.rgb,
    clamp(tip * (0.2 + u_peak * 0.65), 0.0, 1.0)
  );
  vec3 color = u_background_color.rgb;
  color = mix(color, bar_color, clamp(halo * u_glow_intensity * (0.04 + response * 0.035), 0.0, 0.32));
  color = mix(color, bar_color, clamp(core * (0.58 + response * 0.2 + u_energy * 0.08), 0.0, 0.98));
  out_color = vec4(clamp(color, vec3(0.0), vec3(1.0)), 1.0);
}
`;
