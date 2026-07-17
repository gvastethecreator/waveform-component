// Original GLSL ES 3.00 implementation. Local GPL shader/effect source was not inspected,
// copied, translated, or used as a structural reference.
export const STARFIELD_BURST_FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_band_count;
uniform float u_bands[16];
uniform float u_energy;
uniform float u_peak;
uniform float u_centroid;
uniform float u_star_count;
uniform float u_burst_speed;
uniform float u_star_size;
uniform float u_trail_length;
uniform float u_transient_reactivity;
uniform float u_high_energy;
uniform float u_transient;
uniform float u_seed;
uniform vec4 u_background_color;
uniform vec4 u_core_color;
uniform vec4 u_edge_color;
uniform vec4 u_treble_flash_color;

out vec4 out_color;

uint hash_u32(uint value) {
  value ^= value >> 16;
  value *= 0x7feb352du;
  value ^= value >> 15;
  value *= 0x846ca68bu;
  value ^= value >> 16;
  return value;
}

float hash_unit(uint value) {
  return float(hash_u32(value)) / 4294967295.0;
}

float sample_band(float position) {
  float count = max(1.0, u_band_count);
  float scaled = clamp(position, 0.0, 0.999999) * count;
  int integer_count = clamp(int(count), 1, 16);
  int lower = clamp(int(floor(scaled)), 0, integer_count - 1);
  int upper = min(lower + 1, integer_count - 1);
  return mix(u_bands[lower], u_bands[upper], fract(scaled));
}

float wrapped_angle(float angle) {
  return atan(sin(angle), cos(angle));
}

void main() {
  vec2 resolution = max(u_resolution, vec2(1.0));
  vec2 point = (2.0 * gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);
  point -= vec2((u_centroid - 0.5) * 0.055, (0.5 - u_energy) * 0.025);
  float radius = length(point);
  float angle = atan(point.y, point.x) + (u_centroid - 0.5) * 0.24;
  float normalized_angle = fract((angle + 3.14159265359) / 6.28318530718);
  float count = clamp(floor(u_star_count + 0.5), 12.0, 256.0);
  float base_sector = floor(normalized_angle * count);
  uint seed = uint(max(0.0, floor(u_seed + 0.5)));
  float pixel = 2.0 / min(resolution.x, resolution.y);
  float head_field = 0.0;
  float trail_field = 0.0;
  float flash_field = 0.0;

  for (int offset = -1; offset <= 1; offset += 1) {
    float sector = mod(base_sector + float(offset) + count, count);
    uint key = hash_u32(seed ^ (uint(sector) + 1u) * 0x9e3779b9u);
    float angle_seed = hash_unit(key ^ 0xa341316cu);
    float depth_seed = hash_unit(key ^ 0xc8013ea4u);
    float speed_seed = hash_unit(key ^ 0xad90777du);
    float brightness_seed = hash_unit(key ^ 0x7e95761eu);
    float star_angle = ((sector + mix(0.14, 0.86, angle_seed)) / count) * 6.28318530718 - 3.14159265359;
    float travel = (u_time + 0.13) * u_burst_speed * (0.055 + speed_seed * 0.055);
    float star_radius = 0.055 + 0.9 * fract(depth_seed + travel);
    float angular_distance = abs(wrapped_angle(angle - star_angle)) * max(radius, 0.08);
    float ordered_position = count <= 1.0 ? 0.5 : sector / (count - 1.0);
    float band = sample_band(ordered_position);
    float response = clamp((u_high_energy * 0.65 + band * 0.2 + u_transient * 0.55) * u_transient_reactivity, 0.0, 1.8);
    float width = pixel * u_star_size * (0.78 + brightness_seed * 0.48 + response * 0.28);
    float radial_distance = abs(radius - star_radius);
    float head_distance = length(vec2(radial_distance, angular_distance * 0.86));
    float head = 1.0 - smoothstep(width, width + pixel * 1.5, head_distance);
    float trail = max(0.0, u_trail_length * (0.42 + speed_seed * 0.58) * (0.7 + response * 0.18));
    float behind = star_radius - radius;
    float trail_axis = 1.0 - smoothstep(width * 0.42, width * 1.38 + pixel, angular_distance);
    float trail_span = step(0.0, behind) * (1.0 - smoothstep(0.0, max(trail, pixel), behind));
    float trail_value = trail_axis * trail_span * (0.25 + response * 0.42);
    head_field = max(head_field, head * (0.46 + brightness_seed * 0.24 + response * 0.36));
    trail_field = max(trail_field, trail_value);
    flash_field = max(flash_field, head * response);
  }

  float field_mask = 1.0 - smoothstep(0.9, 1.03, radius);
  head_field *= field_mask;
  trail_field *= field_mask;
  flash_field *= field_mask;
  float core = 1.0 - smoothstep(0.012, 0.052 + u_peak * 0.026, radius);
  float core_halo = 1.0 - smoothstep(0.035, 0.11 + u_energy * 0.04, radius);
  vec3 color = u_background_color.rgb;
  color = mix(color, u_edge_color.rgb, clamp(trail_field, 0.0, 0.76));
  color = mix(color, u_core_color.rgb, clamp(head_field, 0.0, 0.96));
  color = mix(color, u_treble_flash_color.rgb, clamp(flash_field * (0.32 + u_peak * 0.38), 0.0, 0.82));
  color = mix(color, u_edge_color.rgb, clamp(core_halo * (0.12 + u_high_energy * 0.18), 0.0, 0.38));
  color = mix(color, u_core_color.rgb, clamp(core * (0.55 + u_peak * 0.35), 0.0, 0.96));
  float vignette = 1.0 - smoothstep(0.72, 1.08, radius);
  color = mix(u_background_color.rgb, color, 0.5 + vignette * 0.5);
  out_color = vec4(clamp(color, vec3(0.0), vec3(1.0)), 1.0);
}
`;
