// Original GLSL ES 3.00 implementation. Local GPL shader/effect source was not inspected,
// copied, translated, or used as a structural reference.
export const EQUALIZER_GRID_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_band_count;
uniform float u_bands[16];
uniform float u_energy;
uniform float u_peak;
uniform float u_centroid;
uniform float u_grid_columns;
uniform float u_grid_rows;
uniform float u_cell_gap;
uniform float u_cell_reactivity;
uniform float u_random_speed;
uniform vec4 u_background_color;
uniform vec4 u_gradient_color_1;
uniform vec4 u_gradient_color_2;
uniform vec4 u_gradient_color_3;
uniform vec4 u_gradient_color_4;

out vec4 out_color;

float sample_band(float position) {
  float count = max(1.0, u_band_count);
  float scaled = clamp(position, 0.0, 0.999999) * count;
  int integer_count = clamp(int(count), 1, 16);
  int lower = clamp(int(floor(scaled)), 0, integer_count - 1);
  int upper = min(lower + 1, integer_count - 1);
  return mix(u_bands[lower], u_bands[upper], fract(scaled));
}

float hash21(vec2 value) {
  vec3 phase = fract(vec3(value.xyx) * vec3(0.1031, 0.1030, 0.0973));
  phase += dot(phase, phase.yzx + 33.33);
  return fract((phase.x + phase.y) * phase.z);
}

vec3 gradient4(float position) {
  float value = clamp(position, 0.0, 1.0) * 3.0;
  if (value < 1.0) return mix(u_gradient_color_1.rgb, u_gradient_color_2.rgb, value);
  if (value < 2.0) return mix(u_gradient_color_2.rgb, u_gradient_color_3.rgb, value - 1.0);
  return mix(u_gradient_color_3.rgb, u_gradient_color_4.rgb, value - 2.0);
}

void main() {
  vec2 resolution = max(u_resolution, vec2(1.0));
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 grid_size = vec2(
    clamp(floor(u_grid_columns + 0.5), 4.0, 48.0),
    clamp(floor(u_grid_rows + 0.5), 2.0, 24.0)
  );
  vec2 grid_position = uv * grid_size;
  vec2 cell_index = floor(grid_position);
  vec2 local = fract(grid_position);
  float column_position = (cell_index.x + 0.5) / grid_size.x;
  float row_level = (cell_index.y + 0.5) / grid_size.y;
  float band = sample_band(column_position);
  float response = clamp(band * u_cell_reactivity, 0.0, 1.5);
  float fill = 1.0 - smoothstep(response, response + 1.0 / grid_size.y, row_level);

  vec2 edge_distance = min(local, 1.0 - local);
  vec2 antialias_width = max(fwidth(local), vec2(0.0005));
  vec2 inside = smoothstep(vec2(u_cell_gap), vec2(u_cell_gap) + antialias_width, edge_distance);
  float cell_mask = inside.x * inside.y;

  float seed = hash21(cell_index + vec2(floor(u_centroid * 19.0), 7.0));
  float shimmer_phase = (u_time + 0.37) * u_random_speed * 6.283185307179586;
  float shimmer = 0.5 + 0.5 * sin(shimmer_phase + seed * 6.283185307179586);
  float color_position = clamp(column_position * 0.62 + row_level * 0.26 + response * 0.12, 0.0, 1.0);
  vec3 active_color = gradient4(color_position);
  active_color = mix(active_color, u_gradient_color_4.rgb, clamp(u_peak * fill * 0.28, 0.0, 0.28));
  float inactive_alpha = cell_mask * (0.055 + shimmer * 0.035 + u_energy * 0.025);
  float active_alpha = cell_mask * fill * clamp(0.34 + response * 0.5 + shimmer * 0.08, 0.0, 0.94);
  vec3 color = mix(u_background_color.rgb, gradient4(column_position) * 0.45, inactive_alpha);
  color = mix(color, active_color, active_alpha);
  out_color = vec4(clamp(color, vec3(0.0), vec3(1.0)), 1.0);
}
`;
