export const VERT_SRC = /* glsl */ `
  attribute vec2 a_pos;
  attribute vec2 a_warped_pos;
  attribute float a_travel_time;

  uniform mat4 u_matrix;
  uniform float u_warp_blend;

  varying float v_travel_time;

  void main() {
    vec2 pos = mix(a_pos, a_warped_pos, u_warp_blend);
    gl_Position = u_matrix * vec4(pos, 0.0, 1.0);
    v_travel_time = a_travel_time;
  }
`;

export const FRAG_SRC = /* glsl */ `
  precision mediump float;

  varying float v_travel_time;

  uniform float u_opacity;

  vec3 timeColor(float t) {
    float n = clamp(t / 3600.0, 0.0, 1.0);
    vec3 c;
    if (n < 0.0833) {
      c = mix(vec3(0.0, 0.78, 0.31), vec3(0.39, 0.78, 0.20), n / 0.0833);
    } else if (n < 0.25) {
      c = mix(vec3(0.39, 0.78, 0.20), vec3(0.86, 0.86, 0.0), (n - 0.0833) / 0.1667);
    } else if (n < 0.5) {
      c = mix(vec3(0.86, 0.86, 0.0), vec3(0.94, 0.55, 0.0), (n - 0.25) / 0.25);
    } else if (n < 0.75) {
      c = mix(vec3(0.94, 0.55, 0.0), vec3(0.86, 0.20, 0.0), (n - 0.5) / 0.25);
    } else {
      c = mix(vec3(0.86, 0.20, 0.0), vec3(0.71, 0.0, 0.20), (n - 0.75) / 0.25);
    }
    return c;
  }

  void main() {
    if (v_travel_time < 0.0) {
      gl_FragColor = vec4(0.2, 0.2, 0.2, 0.15);
      return;
    }
    vec3 c = timeColor(v_travel_time);
    gl_FragColor = vec4(c * u_opacity, u_opacity * 0.85);
  }
`;
