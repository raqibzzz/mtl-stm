import { GRID_W, GRID_H } from './constants';
import type { GridVertex, MeshBuffers } from './types';

export function buildMesh(vertices: GridVertex[]): MeshBuffers {
  const cols = GRID_W + 1;
  const rows = GRID_H + 1;
  const nVerts = cols * rows;

  // 5 floats per vertex: mercX, mercY, warpedMercX, warpedMercY, travelTime
  const vBuf = new Float32Array(nVerts * 5);
  for (let i = 0; i < nVerts; i++) {
    const v = vertices[i];
    vBuf[i * 5 + 0] = v.mercX;
    vBuf[i * 5 + 1] = v.mercY;
    vBuf[i * 5 + 2] = v.warpedMercX;
    vBuf[i * 5 + 3] = v.warpedMercY;
    vBuf[i * 5 + 4] = isFinite(v.travelTime) ? v.travelTime : -1;
  }

  // 2 triangles per grid cell = 6 indices per cell
  const nCells = GRID_W * GRID_H;
  const iBuf = new Uint32Array(nCells * 6);
  let ii = 0;
  for (let row = 0; row < GRID_H; row++) {
    for (let col = 0; col < GRID_W; col++) {
      const tl = row * cols + col;
      const tr = tl + 1;
      const bl = tl + cols;
      const br = bl + 1;
      iBuf[ii++] = tl;
      iBuf[ii++] = bl;
      iBuf[ii++] = tr;
      iBuf[ii++] = tr;
      iBuf[ii++] = bl;
      iBuf[ii++] = br;
    }
  }

  return { vertices: vBuf, indices: iBuf, gridW: cols, gridH: rows };
}
