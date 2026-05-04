import { mercatorX, mercatorY, haversineMeters } from './geo';
import { WALK_SPEED_MS, MONTREAL_BOUNDS, GRID_W, GRID_H } from './constants';
import type { TransitGraph } from './graph';
import type { GridVertex } from './types';

export function buildGrid(
  graph: TransitGraph,
  travelTimes: Float32Array,
): GridVertex[] {
  const { west, east, south, north } = MONTREAL_BOUNDS;
  const cols = GRID_W + 1;
  const rows = GRID_H + 1;
  const dLon = (east - west) / GRID_W;
  const dLat = (north - south) / GRID_H;

  const vertices: GridVertex[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const lat = south + row * dLat;
      const lon = west + col * dLon;
      const mx = mercatorX(lon);
      const my = mercatorY(lat);

      // Find k nearest stops within 1200m and pick the best accessible time
      const maxM = 1200;
      const near = graph.nearestStops(lat, lon, 8, maxM);

      let bestTime = Infinity;
      for (const { index, distM } of near) {
        const t = travelTimes[index];
        if (!isFinite(t)) continue;
        const walkExtra = distM / WALK_SPEED_MS;
        const total = t + walkExtra;
        if (total < bestTime) bestTime = total;
      }

      vertices.push({
        lat,
        lon,
        mercX: mx,
        mercY: my,
        travelTime: bestTime,
        warpedMercX: mx,
        warpedMercY: my,
      });
    }
  }

  return vertices;
}
