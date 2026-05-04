import type mapboxgl from 'mapbox-gl';
import { VERT_SRC, FRAG_SRC } from '@/lib/shaders';
import type { MeshBuffers } from '@/lib/types';

export interface MeshRef {
  buffers: MeshBuffers | null;
  version: number;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  src: string,
): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) ?? 'Shader compile error');
  }
  return s;
}

function createProgram(
  gl: WebGLRenderingContext,
  vert: string,
  frag: string,
): WebGLProgram {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog) ?? 'Program link error');
  }
  return prog;
}

export function createTransitLayer(
  getMeshRef: () => MeshRef,
  getWarpBlend: () => number,
): mapboxgl.CustomLayerInterface {
  let program: WebGLProgram | null = null;
  let vbo: WebGLBuffer | null = null;
  let ibo: WebGLBuffer | null = null;
  let gl: WebGLRenderingContext | null = null;
  let indexCount = 0;
  let uploadedVersion = -1;

  return {
    id: 'transit-heatmap',
    type: 'custom',
    renderingMode: '2d',

    onAdd(_map: mapboxgl.Map, _gl: WebGLRenderingContext) {
      gl = _gl;
      // Enable uint32 indices in WebGL1 contexts (no-op in WebGL2)
      gl.getExtension('OES_element_index_uint');
      program = createProgram(gl, VERT_SRC, FRAG_SRC);
      vbo = gl.createBuffer();
      ibo = gl.createBuffer();
    },

    render(_gl: WebGLRenderingContext, matrix: number[]) {
      if (!program || !vbo || !ibo || !gl) return;
      const meshRef = getMeshRef();
      if (!meshRef.buffers) return;

      if (meshRef.version !== uploadedVersion) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, meshRef.buffers.vertices, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(
          gl.ELEMENT_ARRAY_BUFFER,
          meshRef.buffers.indices,
          gl.DYNAMIC_DRAW,
        );
        indexCount = meshRef.buffers.indices.length;
        uploadedVersion = meshRef.version;
      }

      gl.useProgram(program);
      gl.uniformMatrix4fv(
        gl.getUniformLocation(program, 'u_matrix'),
        false,
        matrix as unknown as Float32List,
      );
      gl.uniform1f(gl.getUniformLocation(program, 'u_warp_blend'), getWarpBlend());
      gl.uniform1f(gl.getUniformLocation(program, 'u_opacity'), 1.0);

      const STRIDE = 20; // 5 floats × 4 bytes
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

      const aPos = gl.getAttribLocation(program, 'a_pos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, STRIDE, 0);

      const aWarped = gl.getAttribLocation(program, 'a_warped_pos');
      gl.enableVertexAttribArray(aWarped);
      gl.vertexAttribPointer(aWarped, 2, gl.FLOAT, false, STRIDE, 8);

      const aTime = gl.getAttribLocation(program, 'a_travel_time');
      gl.enableVertexAttribArray(aTime);
      gl.vertexAttribPointer(aTime, 1, gl.FLOAT, false, STRIDE, 16);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_INT, 0);

      gl.disableVertexAttribArray(aPos);
      gl.disableVertexAttribArray(aWarped);
      gl.disableVertexAttribArray(aTime);
    },

    onRemove() {
      if (gl) {
        if (vbo) gl.deleteBuffer(vbo);
        if (ibo) gl.deleteBuffer(ibo);
        if (program) gl.deleteProgram(program);
      }
    },
  };
}
