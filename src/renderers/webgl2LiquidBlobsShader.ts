// Original GLSL ES 3.00 implementation. Local GPL shader/effect source was not inspected,
// copied, translated, or used as a structural reference.
export const LIQUID_BLOBS_FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_band_count;
uniform float u_bands[16];
uniform float u_energy;
uniform float u_peak;
uniform float u_centroid;
uniform float u_blob_count;
uniform float u_blob_size;
uniform float u_drift_speed;
uniform float u_glow_strength;
uniform float u_threshold;
uniform float u_low_energy;
uniform float u_low_frequency_reactivity;
uniform float u_seed;
uniform vec4 u_background_color;
uniform vec4 u_base_color;
uniform vec4 u_blob_color;
uniform vec4 u_peak_flash_color;

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

void main() {
  vec2 resolution = max(u_resolution, vec2(1.0));
  vec2 point = (2.0 * gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);
  point.x -= (u_centroid - 0.5) * 0.12;
  int count = clamp(int(floor(u_blob_count + 0.5)), 2, 24);
  uint seed = uint(max(0.0, floor(u_seed + 0.5)));
  float field = 0.0;
  float local_energy = 0.0;
  float nearest_ratio = 10.0;

  for (int index = 0; index < 24; index += 1) {
    if (index >= count) break;
    uint key = hash_u32(seed ^ (uint(index) + 1u) * 0x9e3779b9u);
    float hx = hash_unit(key ^ 0xa341316cu);
    float hy = hash_unit(key ^ 0xc8013ea4u);
    float orbit_seed = hash_unit(key ^ 0xad90777du);
    float size_seed = hash_unit(key ^ 0x7e95761eu);
    vec2 anchor = (vec2(hx, hy) - 0.5) * vec2(1.18, 0.82);
    float direction = (hash_unit(key ^ 0x4cf5ad43u) < 0.5) ? -1.0 : 1.0;
    float phase = orbit_seed * 6.28318530718 + u_drift_speed * 0.37 + u_time * u_drift_speed * direction * (0.34 + size_seed * 0.32);
    vec2 orbit = vec2(cos(phase), sin(phase * (0.83 + hx * 0.31))) * (0.055 + orbit_seed * 0.11);
    vec2 center = anchor + orbit;
    float ordered_position = count <= 1 ? 0.5 : float(index) / float(count - 1);
    float band = sample_band(ordered_position);
    float response = clamp((u_low_energy * 0.72 + band * 0.28) * u_low_frequency_reactivity, 0.0, 1.6);
    float radius = u_blob_size * (0.62 + size_seed * 0.48 + response * 0.3);
    float distance_to_center = length(point - center);
    field += radius * radius / (distance_to_center * distance_to_center + 0.0045);
    nearest_ratio = min(nearest_ratio, distance_to_center / max(radius, 0.001));
    local_energy = max(local_energy, band * (1.0 - smoothstep(radius * 0.15, radius * 1.2, distance_to_center)));
  }

  field /= 1.0 + float(count) * 0.11;
  float cutoff = mix(1.5, 0.46, clamp(u_threshold, 0.2, 0.9));
  float antialias = max(fwidth(field) * 1.4, 0.006);
  float body = smoothstep(cutoff - antialias, cutoff + antialias, field);
  float halo_width = 0.08 + u_glow_strength * 0.15;
  float halo = smoothstep(cutoff - halo_width, cutoff - antialias, field) * (1.0 - body * 0.32);
  float inner = smoothstep(1.08, 0.12, nearest_ratio);
  float flash = clamp((u_peak * 0.55 + local_energy * 0.45) * (0.18 + u_glow_strength * 0.18), 0.0, 0.78);
  float field_mask = 1.0 - smoothstep(0.84, 1.08, length(point));
  body *= field_mask;
  halo *= field_mask;

  vec3 color = u_background_color.rgb;
  color = mix(color, u_base_color.rgb, clamp(halo * (0.22 + u_glow_strength * 0.16), 0.0, 0.72));
  color = mix(color, u_blob_color.rgb, clamp(body * (0.62 + u_energy * 0.2), 0.0, 0.94));
  color = mix(color, u_peak_flash_color.rgb, clamp(body * inner * flash, 0.0, 0.76));
  float vignette = 1.0 - smoothstep(0.64, 1.1, length(point));
  color = mix(u_background_color.rgb, color, 0.48 + vignette * 0.52);
  out_color = vec4(clamp(color, vec3(0.0), vec3(1.0)), 1.0);
}
`;
