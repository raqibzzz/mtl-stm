import { haversineMeters } from './geo';
import { WALK_SPEED_MS, MAX_WALK_M, MAX_TRANSIT_S } from './constants';
import type { TransitGraph } from './graph';
import type { LatLon } from './types';

class MinHeap {
  private data: Float64Array;
  private size = 0;

  constructor(cap: number) {
    this.data = new Float64Array(cap * 2);
  }

  push(cost: number, node: number): void {
    let i = this.size++;
    this.data[i * 2] = cost;
    this.data[i * 2 + 1] = node;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.data[p * 2] <= this.data[i * 2]) break;
      this.swap(p, i);
      i = p;
    }
  }

  pop(): [number, number] {
    const cost = this.data[0];
    const node = this.data[1];
    const last = --this.size;
    if (last > 0) {
      this.data[0] = this.data[last * 2];
      this.data[1] = this.data[last * 2 + 1];
      let i = 0;
      while (true) {
        let s = i;
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        if (l < last && this.data[l * 2] < this.data[s * 2]) s = l;
        if (r < last && this.data[r * 2] < this.data[s * 2]) s = r;
        if (s === i) break;
        this.swap(s, i);
        i = s;
      }
    }
    return [cost, node];
  }

  get length(): number {
    return this.size;
  }

  private swap(a: number, b: number): void {
    const ac = this.data[a * 2];
    const an = this.data[a * 2 + 1];
    this.data[a * 2] = this.data[b * 2];
    this.data[a * 2 + 1] = this.data[b * 2 + 1];
    this.data[b * 2] = ac;
    this.data[b * 2 + 1] = an;
  }
}

export function dijkstra(
  graph: TransitGraph,
  origin: LatLon,
): Float32Array {
  const n = graph.stops.length;
  const dist = new Float32Array(n).fill(Infinity);
  const visited = new Uint8Array(n);
  // Heap capacity: n + initial seeds. Over-allocate safely.
  const heap = new MinHeap(n * 4);

  // Seed: walk to nearby stops
  const seeds = graph.nearestStops(origin.lat, origin.lon, 20, MAX_WALK_M);
  for (const { index, distM } of seeds) {
    const walkTime = distM / WALK_SPEED_MS;
    if (walkTime < dist[index]) {
      dist[index] = walkTime;
      heap.push(walkTime, index);
    }
  }

  while (heap.length > 0) {
    const [cost, u] = heap.pop();
    if (visited[u]) continue;
    visited[u] = 1;
    if (cost > MAX_TRANSIT_S) break;

    const start = graph.csrOffsets[u];
    const end = graph.csrOffsets[u + 1];
    for (let e = start; e < end; e++) {
      const v = graph.csrTargets[e];
      const w = graph.csrWeights[e];
      const newDist = cost + w;
      if (newDist < dist[v]) {
        dist[v] = newDist;
        heap.push(newDist, v);
      }
    }
  }

  return dist;
}
