// Original GLSL ES 3.00 implementation. Local GPL shader/effect source was not inspected,
// copied, translated, or used as a structural reference.
export const NEON_LINES_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_band_count;
uniform float u_bands[16];
uniform float u_energy;
uniform float u_peak;
uniform float u_centroid;
uniform float u_line_count;
uniform float u_wave_height;
uniform float u_flow_speed;
uniform float u_line_thickness;
uniform float u_glow_size;
uniform float u_energy_reactivity;
uniform vec4 u_background_color;
uniform vec4 u_left_color;
uniform vec4 u_right_color;
uniform vec4 u_burst_color;

out vec4 out_color;

const float TAU = 6.283185307179586;
const int MAX_LINES = 12;

float sample_band(float position) {
  float count = max(1.0, u_band_count);
  float scaled = clamp(position, 0.0, 0.999999) * count;
  int integer_count = clamp(int(count), 1, 16);
  int lower = clamp(int(floor(scaled)), 0, integer_count - 1);
  int upper = min(lower + 1, integer_count - 1);
  return mix(u_bands[lower], u_bands[upper], fract(scaled));
}

void main() {
  vec2 resolution = max(u_resolution, vec2(1.0));
  vec2 uv = gl_FragCoord.xy / resolution;
  float line_count = clamp(floor(u_line_count + 0.5), 2.0, float(MAX_LINES));
  vec3 color = u_background_color.rgb;

  for (int index = 0; index < MAX_LINES; index += 1) {
    if (float(index) >= line_count) break;
    float line_position = (float(index) + 0.5) / line_count;
    float band_position = line_count <= 1.0 ? 0.0 : float(index) / (line_count - 1.0);
    float band = sample_band(band_position);
    float response = clamp(band * u_energy_reactivity, 0.0, 2.0);
    float stable_phase = (u_time + 0.33) * u_flow_speed;
    float phase = (uv.x * (1.15 + 0.25 * band_position) + stable_phase + band_position * 0.31) * TAU;
    float wave = sin(phase + u_centroid * 1.4);
    wave += 0.32 * sin(phase * 2.17 - band_position * TAU + u_peak);
    wave /= 1.32;
    float requested_displacement = u_wave_height * (0.14 + 0.86 * min(response, 1.0));
    float edge_bound = min(line_position, 1.0 - line_position) * 0.82;
    float displacement = min(requested_displacement, edge_bound) * wave;
    float center = line_position + displacement;
    float distance_to_line = abs(uv.y - center);
    float thickness = max(u_line_thickness, 0.0005);
    float core = 1.0 - smoothstep(thickness * 0.28, thickness, distance_to_line);
    float halo_width = thickness * (1.8 + 3.2 * u_glow_size);
    float halo = 1.0 - smoothstep(thickness, max(thickness + 0.0005, halo_width), distance_to_line);
    float crest = pow(max(0.0, 0.5 + 0.5 * wave), 5.0) * response;
    vec3 trace_color = mix(u_left_color.rgb, u_right_color.rgb, uv.x);
    trace_color = mix(trace_color, u_burst_color.rgb, clamp(crest * (0.35 + 0.65 * u_peak), 0.0, 1.0));
    float halo_alpha = clamp(halo * u_glow_size * (0.025 + 0.10 * response), 0.0, 0.32);
    float core_alpha = clamp(core * (0.38 + 0.54 * response + 0.08 * u_energy), 0.0, 0.98);
    color = mix(color, trace_color, halo_alpha);
    color = mix(color, trace_color, core_alpha);
  }

  out_color = vec4(clamp(color, vec3(0.0), vec3(1.0)), 1.0);
}
`;
