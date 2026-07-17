// Original GLSL ES 3.00 implementation. Local GPL shader/effect source was not inspected,
// copied, translated, or used as a structural reference.
export const PULSE_RING_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_band_count;
uniform float u_bands[16];
uniform float u_energy;
uniform float u_peak;
uniform float u_centroid;
uniform float u_thickness;
uniform float u_glow_strength;
uniform float u_rotation_speed;
uniform float u_band_reactivity;
uniform vec4 u_background_color;
uniform vec4 u_primary_color;
uniform vec4 u_secondary_color;
uniform vec4 u_tertiary_color;
uniform vec4 u_sweep_color;

out vec4 out_color;

const float TAU = 6.283185307179586;

float sample_band(float position) {
  float count = max(1.0, u_band_count);
  float scaled = clamp(position, 0.0, 0.999999) * count;
  int integer_count = clamp(int(count), 1, 16);
  int lower = clamp(int(floor(scaled)), 0, integer_count - 1);
  int upper = (lower + 1) % integer_count;
  return mix(u_bands[lower], u_bands[upper], fract(scaled));
}

void main() {
  vec2 resolution = max(u_resolution, vec2(1.0));
  vec2 position = (2.0 * gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);
  float radius = length(position);
  float angle = atan(position.y, position.x);
  // The stable quarter-turn phase keeps speed direction observable in reduced-motion frames.
  float rotation_phase = (u_time + 0.25) * u_rotation_speed;
  float angular_position = fract(angle / TAU + 0.5 + rotation_phase);
  float band = sample_band(angular_position);
  float response = clamp(band * u_band_reactivity, 0.0, 2.0);
  float detail = 0.075 + 0.025 * sin(angle * 3.0 + u_centroid * TAU);
  float ring_radius = 0.52 + response * detail;
  float distance_to_ring = abs(radius - ring_radius);
  float core = 1.0 - smoothstep(u_thickness * 0.32, u_thickness, distance_to_ring);
  float glow_width = max(u_thickness + 0.002, u_thickness * (2.8 + u_glow_strength * 2.2));
  float halo = (1.0 - smoothstep(u_thickness, glow_width, distance_to_ring));
  halo *= u_glow_strength * (0.18 + 0.82 * band);

  float sweep_angle = (rotation_phase + u_centroid) * TAU;
  float sweep_distance = abs(atan(sin(angle - sweep_angle), cos(angle - sweep_angle)));
  float sweep = pow(max(0.0, 1.0 - sweep_distance / 0.52), 7.0) * u_peak;

  vec3 core_color = mix(u_primary_color.rgb, u_secondary_color.rgb, clamp(response, 0.0, 1.0));
  vec3 color = u_background_color.rgb;
  float halo_alpha = clamp(halo * 0.68, 0.0, 0.88);
  float core_alpha = clamp(core * (0.82 + 0.18 * u_energy), 0.0, 1.0);
  float sweep_alpha = clamp(sweep * (core + halo * 0.7), 0.0, 1.0);
  color = mix(color, u_tertiary_color.rgb, halo_alpha);
  color = mix(color, core_color, core_alpha);
  color = mix(color, u_sweep_color.rgb, sweep_alpha);
  out_color = vec4(clamp(color, vec3(0.0), vec3(1.0)), 1.0);
}
`;
