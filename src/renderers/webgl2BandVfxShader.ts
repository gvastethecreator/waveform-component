// Original clean-room fullscreen primitive. Local GPL shader/effect source was not inspected,
// copied, translated, or used as a structural reference.
export const WEBGL2_FULLSCREEN_VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;
