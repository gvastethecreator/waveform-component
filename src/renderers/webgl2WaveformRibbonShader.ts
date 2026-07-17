// Original GLSL ES 3.00 implementation. Local GPL shader/effect source was not inspected,
// copied, translated, or used as a structural reference.
export const WAVEFORM_RIBBON_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_band_count;
uniform float u_bands[16];
uniform float u_energy;
uniform float u_peak;
uniform float u_centroid;
uniform float u_wave_height;
uniform float u_flow_speed;
uniform float u_ribbon_thickness;
uniform float u_glow_strength;
uniform float u_reflection_strength;
uniform float u_energy_reactivity;
uniform vec4 u_background_color;
uniform vec4 u_left_color;
uniform vec4 u_right_color;
uniform vec4 u_peak_flash_color;

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
  vec2 uv = gl_FragCoord.xy / resolution;
  float band = sample_band(uv.x);
  float response = clamp(band * u_energy_reactivity, 0.0, 2.0);
  float phase = (uv.x * 1.42 + (u_time + 0.37) * u_flow_speed + u_centroid * 0.12) * TAU;
  float harmonic = sin(phase) * 0.62 + sin(phase * 2.13 - u_peak * 1.7) * 0.22;
  float energy_shape = (response - u_energy) * 0.42;
  float center = clamp(0.61 + (harmonic + energy_shape) * u_wave_height, 0.26, 0.83);
  float half_thickness = clamp(u_ribbon_thickness * (0.38 + response * 0.16), 0.006, 0.15);
  float distance_to_ribbon = abs(uv.y - center);
  float core = 1.0 - smoothstep(half_thickness * 0.76, half_thickness, distance_to_ribbon);
  float halo_width = half_thickness + 0.012 + u_glow_strength * 0.045;
  float halo = 1.0 - smoothstep(half_thickness, halo_width, distance_to_ribbon);

  float reflected_center = clamp(0.15 + (0.61 - center) * 0.34, 0.055, 0.23);
  float reflection_distance = abs(uv.y - reflected_center);
  float reflection_core = 1.0 - smoothstep(half_thickness * 0.44, half_thickness * 0.76, reflection_distance);
  float reflection_halo = 1.0 - smoothstep(half_thickness * 0.7, halo_width * 0.8, reflection_distance);
  float reflection_fade = smoothstep(0.0, 0.28, uv.y) * (1.0 - smoothstep(0.2, 0.38, uv.y));

  vec3 ribbon_color = mix(u_left_color.rgb, u_right_color.rgb, uv.x);
  float crest = pow(max(0.0, harmonic * 0.5 + 0.5), 5.0) * response;
  ribbon_color = mix(
    ribbon_color,
    u_peak_flash_color.rgb,
    clamp(crest * (0.35 + u_peak * 0.65), 0.0, 1.0)
  );

  vec3 color = u_background_color.rgb;
  float reflection_alpha = clamp(
    (reflection_core * 0.42 + reflection_halo * u_glow_strength * 0.055) *
      u_reflection_strength * reflection_fade,
    0.0,
    0.62
  );
  color = mix(color, ribbon_color, reflection_alpha);
  color = mix(color, ribbon_color, clamp(halo * u_glow_strength * (0.045 + response * 0.03), 0.0, 0.3));
  color = mix(color, ribbon_color, clamp(core * (0.62 + response * 0.18 + u_energy * 0.08), 0.0, 0.98));
  out_color = vec4(clamp(color, vec3(0.0), vec3(1.0)), 1.0);
}
`;
