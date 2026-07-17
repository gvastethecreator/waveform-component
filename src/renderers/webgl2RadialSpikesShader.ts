// Original GLSL ES 3.00 implementation. Local GPL shader/effect source was not inspected,
// copied, translated, or used as a structural reference.
export const RADIAL_SPIKES_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_band_count;
uniform float u_bands[16];
uniform float u_energy;
uniform float u_peak;
uniform float u_centroid;
uniform float u_spike_count;
uniform float u_base_radius;
uniform float u_spike_height;
uniform float u_spike_width;
uniform float u_arc_degrees;
uniform float u_rotation_degrees;
uniform float u_energy_reactivity;
uniform float u_glow_strength;
uniform vec4 u_background_color;
uniform vec4 u_base_color;
uniform vec4 u_tip_color;

out vec4 out_color;

const float PI = 3.141592653589793;
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
  float radius = length(point);
  float angle = atan(point.y, point.x);
  float rotation = radians(clamp(u_rotation_degrees, -180.0, 180.0));
  float relative = mod(angle - rotation + PI, TAU) - PI;
  float arc = radians(clamp(u_arc_degrees, 30.0, 360.0));
  float pixel = 2.0 / min(resolution.x, resolution.y);
  float arc_mask = arc > TAU - 0.01
    ? 1.0
    : 1.0 - smoothstep(max(0.0, arc * 0.5 - pixel * 2.0), arc * 0.5, abs(relative));
  float arc_position = clamp(relative / arc + 0.5, 0.0, 0.999999);
  float count = clamp(floor(u_spike_count + 0.5), 4.0, 128.0);
  float cell = clamp(floor(arc_position * count), 0.0, count - 1.0);
  float band_position = count <= 1.0 ? 0.0 : cell / (count - 1.0);
  float cell_angle = arc / count;
  float center_angle = -arc * 0.5 + (cell + 0.5) * cell_angle;
  float angular_distance = abs(relative - center_angle);
  float half_width = cell_angle * clamp(u_spike_width, 0.08, 0.92) * 0.5;
  float angular_pixel = pixel / max(radius, 0.06);
  float angular_core = 1.0 - smoothstep(half_width, half_width + angular_pixel, angular_distance);
  float angular_halo = 1.0 - smoothstep(
    half_width + angular_pixel,
    half_width + angular_pixel + 0.006 + u_glow_strength * 0.012,
    angular_distance
  );

  float band = sample_band(band_position);
  float response = clamp(band * u_energy_reactivity, 0.0, 2.0);
  float breath = 0.96 + 0.04 * sin((u_time * 0.35 + band_position * 1.7 + u_centroid * 0.2 + 0.19) * TAU);
  float base_radius = clamp(u_base_radius, 0.12, 0.62);
  float available_height = min(clamp(u_spike_height, 0.02, 0.6), 0.92 - base_radius);
  float height = available_height * (0.12 + 0.88 * min(response, 1.0)) * breath;
  float outer_radius = base_radius + height;
  float radial_core = smoothstep(base_radius - pixel, base_radius + pixel, radius) *
    (1.0 - smoothstep(outer_radius - pixel, outer_radius + pixel, radius));
  float radial_halo = smoothstep(base_radius - pixel * 3.0, base_radius, radius) *
    (1.0 - smoothstep(
      outer_radius,
      outer_radius + pixel * 2.0 + u_glow_strength * 0.018,
      radius
    ));
  float spike_core = angular_core * radial_core * arc_mask;
  float spike_halo = max(angular_halo * radial_halo, angular_core * radial_halo) * arc_mask;
  float progress = clamp((radius - base_radius) / max(height, 0.001), 0.0, 1.0);
  vec3 spike_color = mix(u_base_color.rgb, u_tip_color.rgb, smoothstep(0.18, 1.0, progress));
  spike_color = mix(spike_color, u_tip_color.rgb, clamp(response * u_peak * progress * 0.25, 0.0, 0.35));

  float ring_distance = abs(radius - base_radius);
  float base_ring = (1.0 - smoothstep(pixel, pixel * 2.5 + 0.004, ring_distance)) * arc_mask;
  float ring_halo = (1.0 - smoothstep(pixel * 2.0, pixel * 3.0 + u_glow_strength * 0.014, ring_distance)) * arc_mask;
  vec3 color = u_background_color.rgb;
  color = mix(color, u_base_color.rgb, clamp(ring_halo * u_glow_strength * 0.08, 0.0, 0.28));
  color = mix(color, spike_color, clamp(spike_halo * u_glow_strength * (0.04 + response * 0.035), 0.0, 0.32));
  color = mix(color, u_base_color.rgb, clamp(base_ring * (0.62 + u_energy * 0.12), 0.0, 0.94));
  color = mix(color, spike_color, clamp(spike_core * (0.62 + response * 0.22), 0.0, 0.98));
  out_color = vec4(clamp(color, vec3(0.0), vec3(1.0)), 1.0);
}
`;
