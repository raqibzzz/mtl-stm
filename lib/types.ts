export interface Stop {
  index: number;
  lat: number;
  lon: number;
  id: number;
}

export interface LatLon {
  lat: number;
  lon: number;
}

export interface GridVertex {
  lat: number;
  lon: number;
  mercX: number;
  mercY: number;
  travelTime: number; // seconds; Infinity = unreachable
  warpedMercX: number;
  warpedMercY: number;
}

export interface MeshBuffers {
  // Per vertex: [mercX, mercY, warpedMercX, warpedMercY, travelTime]
  vertices: Float32Array;
  indices: Uint32Array;
  gridW: number; // vertex columns
  gridH: number; // vertex rows
}
