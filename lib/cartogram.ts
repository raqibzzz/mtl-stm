import { mercatorX, mercatorY, bearingRad, destination } from './geo';
import { WALK_SPEED_MS, IDW_NEIGHBORS, IDW_POWER } from './constants';
import type { TransitGraph } from './graph';
import type { GridVertex, LatLon } from './types';

export function applyCartogramWarp(
  vertices: GridVertex[],
  graph: TransitGraph,
  travelTimes: Float32Array,
  origin: LatLon,
): void {
  const stops = graph.stops;

  // Pre-compute displacement for each reachable stop
  const dispX = new Float32Array(stops.length);
  const dispY = new Float32Array(stops.length);
  const hasDisp = new Uint8Array(stops.length);

  for (let i = 0; i < stops.length; i++) {
    const t = travelTimes[i];
    if (!isFinite(t) || t <= 0) continue;

    const s = stops[i];
    const bearing = bearingRad(origin.lat, origin.lon, s.lat, s.lon);
    const desiredDist = t * WALK_SPEED_MS;
    const des = destination(origin.lat, origin.lon, desiredDist, bearing);

    const realMX = mercatorX(s.lon);
    const realMY = mercatorY(s.lat);
    const desMX = mercatorX(des.lon);
    const desMY = mercatorY(des.lat);

    dispX[i] = desMX - realMX;
    dispY[i] = desMY - realMY;
    hasDisp[i] = 1;
  }

  // Apply IDW interpolation to each grid vertex
  for (const v of vertices) {
    // Use Flatbush to find nearest stops
    const near = graph.nearestStops(v.lat, v.lon, IDW_NEIGHBORS, 3000);

    let totalW = 0;
    let wDX = 0;
    let wDY = 0;

    for (const { index, distM } of near) {
      if (!hasDisp[index]) continue;
      const d = Math.max(distM, 1);
      const w = 1 / d ** IDW_POWER;
      totalW += w;
      wDX += w * dispX[index];
      wDY += w * dispY[index];
    }

    if (totalW > 0) {
      v.warpedMercX = v.mercX + wDX / totalW;
      v.warpedMercY = v.mercY + wDY / totalW;
    }
  }
}
