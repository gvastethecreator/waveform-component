// Original GLSL ES 3.00 implementation. Local GPL shader/effect source was not inspected,
// copied, translated, or used as a structural reference.
export const TUNNEL_WAVES_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_band_count;
uniform float u_bands[16];
uniform float u_energy;
uniform float u_peak;
uniform float u_centroid;
uniform float u_ring_density;
uniform float u_tunnel_speed;
uniform float u_tunnel_depth;
uniform float u_energy_reactivity;
uniform float u_glow_strength;
uniform vec4 u_background_color;
uniform vec4 u_center_color;
uniform vec4 u_mid_color;
uniform vec4 u_outer_color;

out vec4 out_color;

float sample_band(float position) {
  float count = max(1.0, u_band_count);
  float scaled = clamp(position, 0.0, 0.999999) * count;
  int integer_count = clamp(int(count), 1, 16);
  int lower = clamp(int(floor(scaled)), 0, integer_count - 1);
  int upper = min(lower + 1, integer_count - 1);
  return mix(u_bands[lower], u_bands[upper], fract(scaled));
}

vec3 tunnel_color(float position) {
  float scaled = clamp(position, 0.0, 1.0) * 2.0;
  if (scaled < 1.0) return mix(u_center_color.rgb, u_mid_color.rgb, scaled);
  return mix(u_mid_color.rgb, u_outer_color.rgb, scaled - 1.0);
}

void main() {
  vec2 resolution = max(u_resolution, vec2(1.0));
  vec2 point = (2.0 * gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);
  vec2 vanishing_point = vec2((u_centroid - 0.5) * 0.1, (0.5 - u_energy) * 0.035);
  float radius = length(point - vanishing_point);
  float radial = clamp(radius / 0.96, 0.0, 1.12);
  float depth_exponent = mix(2.35, 0.58, clamp(u_tunnel_depth, 0.1, 1.0));
  float depth = pow(clamp(radial, 0.0, 1.0), depth_exponent);
  float density = clamp(floor(u_ring_density + 0.5), 3.0, 48.0);
  float phase = depth * density - (u_time + 0.17) * u_tunnel_speed;
  float distance_to_wave = abs(fract(phase) - 0.5);
  float band = sample_band(depth);
  float response = clamp(band * u_energy_reactivity, 0.0, 2.0);
  float signal = clamp(response * 1.35 + u_energy * 0.35, 0.0, 1.5);
  float pixel_phase = density * 2.0 / min(resolution.x, resolution.y);
  float wave_width = 0.014 + min(signal, 1.0) * 0.095;
  float core = 1.0 - smoothstep(wave_width, wave_width + pixel_phase, distance_to_wave);
  float halo = 1.0 - smoothstep(
    wave_width + pixel_phase,
    wave_width + pixel_phase + 0.02 + u_glow_strength * 0.075,
    distance_to_wave
  );
  float field_mask = 1.0 - smoothstep(0.91, 1.04, radial);
  float portal = 1.0 - smoothstep(0.018, 0.052 + u_peak * 0.025, radius);
  float portal_halo = 1.0 - smoothstep(0.045, 0.095 + u_glow_strength * 0.025, radius);
  vec3 wave_color = tunnel_color(depth);
  float perspective_light = mix(1.08, 0.72, depth);
  vec3 color = u_background_color.rgb;
  color = mix(color, wave_color, clamp(halo * field_mask * u_glow_strength * signal * 0.11, 0.0, 0.42));
  color = mix(color, wave_color, clamp(core * field_mask * perspective_light * (0.15 + signal * 0.7), 0.0, 0.98));
  color = mix(color, u_center_color.rgb, clamp(portal_halo * u_glow_strength * (0.025 + u_peak * 0.16), 0.0, 0.36));
  color = mix(color, u_center_color.rgb, clamp(portal * (0.28 + u_peak * 0.62), 0.0, 0.98));
  float vignette = 1.0 - smoothstep(0.78, 1.12, radial);
  color = mix(u_background_color.rgb, color, 0.42 + vignette * 0.58);
  out_color = vec4(clamp(color, vec3(0.0), vec3(1.0)), 1.0);
}
`;
