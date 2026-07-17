// Original GLSL ES 3.00 implementation. Local GPL shader/effect source was not inspected,
// copied, translated, or used as a structural reference.
export const VORTEX_RINGS_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_band_count;
uniform float u_bands[16];
uniform float u_energy;
uniform float u_peak;
uniform float u_centroid;
uniform float u_twist_amount;
uniform float u_spin_speed;
uniform float u_ring_density;
uniform float u_vortex_radius;
uniform float u_energy_reactivity;
uniform float u_glow_strength;
uniform vec4 u_background_color;
uniform vec4 u_primary_color;
uniform vec4 u_secondary_color;
uniform vec4 u_accent_color;

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

void main() {
  vec2 resolution = max(u_resolution, vec2(1.0));
  vec2 point = (2.0 * gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);
  float radius_limit = clamp(u_vortex_radius, 0.25, 0.95);
  float radius = length(point);
  float radial = radius / radius_limit;
  float angle = atan(point.y, point.x);
  float twist = clamp(u_twist_amount, -4.0, 4.0);
  float density = clamp(floor(u_ring_density + 0.5), 3.0, 48.0);
  float flow = angle * 3.0 + radial * twist * TAU - (u_time + 0.23) * u_spin_speed * TAU;
  float warped_radius = radial + sin(flow) * 0.055 * (abs(twist) / 4.0);
  float phase = warped_radius * density - (u_time + 0.11) * u_spin_speed * 0.32;
  float distance_to_ring = abs(fract(phase) - 0.5);
  float band_position = clamp(radial, 0.0, 0.999999);
  float band = sample_band(band_position);
  float response = clamp(band * u_energy_reactivity, 0.0, 2.0);
  float pixel_phase = density * 2.0 / min(resolution.x, resolution.y);
  float ring_width = 0.026 + min(response, 1.0) * 0.07;
  float core = 1.0 - smoothstep(ring_width, ring_width + pixel_phase, distance_to_ring);
  float halo = 1.0 - smoothstep(
    ring_width + pixel_phase,
    ring_width + pixel_phase + 0.02 + u_glow_strength * 0.075,
    distance_to_ring
  );
  float field_mask = 1.0 - smoothstep(0.96, 1.01, radial);
  float radial_color = 0.5 + 0.5 * sin((floor(radial * density) + u_centroid) * 3.14159265);
  vec3 ring_color = mix(u_primary_color.rgb, u_secondary_color.rgb, radial_color);
  float swirl_highlight = 0.5 + 0.5 * sin(flow);
  ring_color = mix(
    ring_color,
    u_accent_color.rgb,
    clamp(response * u_peak * (0.12 + swirl_highlight * 0.22), 0.0, 0.42)
  );
  float eye_distance = abs(radius - radius_limit * 0.09);
  float eye = 1.0 - smoothstep(0.006, 0.018, eye_distance);
  float eye_halo = 1.0 - smoothstep(0.018, 0.055 + u_glow_strength * 0.012, eye_distance);
  vec3 color = u_background_color.rgb;
  color = mix(color, ring_color, clamp(halo * field_mask * u_glow_strength * (0.045 + response * 0.035), 0.0, 0.34));
  color = mix(color, ring_color, clamp(core * field_mask * (0.56 + response * 0.24 + u_energy * 0.08), 0.0, 0.98));
  color = mix(color, u_accent_color.rgb, clamp(eye_halo * u_glow_strength * 0.1, 0.0, 0.28));
  color = mix(color, u_accent_color.rgb, clamp(eye * (0.68 + u_peak * 0.22), 0.0, 0.98));
  float outer_fade = 1.0 - smoothstep(0.86, 1.02, radial);
  color = mix(u_background_color.rgb, color, 0.5 + outer_fade * 0.5);
  out_color = vec4(clamp(color, vec3(0.0), vec3(1.0)), 1.0);
}
`;
