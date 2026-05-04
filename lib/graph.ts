import Flatbush from 'flatbush';
import { haversineMeters } from './geo';
import { GRAPH_MAGIC } from './constants';
import type { Stop } from './types';

export class TransitGraph {
  readonly stops: Stop[];
  readonly csrOffsets: Uint32Array;
  readonly csrTargets: Uint32Array;
  readonly csrWeights: Uint32Array;
  private index: Flatbush;

  constructor(
    stops: Stop[],
    csrOffsets: Uint32Array,
    csrTargets: Uint32Array,
    csrWeights: Uint32Array,
  ) {
    this.stops = stops;
    this.csrOffsets = csrOffsets;
    this.csrTargets = csrTargets;
    this.csrWeights = csrWeights;

    this.index = new Flatbush(stops.length);
    for (const s of stops) this.index.add(s.lon, s.lat, s.lon, s.lat);
    this.index.finish();
  }

  static fromBuffer(buf: ArrayBuffer): TransitGraph {
    const view = new DataView(buf);
    let off = 0;

    const magic = view.getUint32(off, true);
    off += 4;
    if (magic !== GRAPH_MAGIC) throw new Error('Invalid graph.bin');
    off += 4; // version
    const nStops = view.getUint32(off, true);
    off += 4;
    const nEdges = view.getUint32(off, true);
    off += 4;
    off += 8; // reserved

    const stops: Stop[] = [];
    for (let i = 0; i < nStops; i++) {
      const lat = view.getFloat32(off, true);
      off += 4;
      const lon = view.getFloat32(off, true);
      off += 4;
      const id = view.getUint32(off, true);
      off += 4;
      stops.push({ index: i, lat, lon, id });
    }

    const csrOffsets = new Uint32Array(buf, off, nStops + 1);
    off += (nStops + 1) * 4;
    const csrTargets = new Uint32Array(buf, off, nEdges);
    off += nEdges * 4;
    const csrWeights = new Uint32Array(buf, off, nEdges);

    return new TransitGraph(stops, csrOffsets, csrTargets, csrWeights);
  }

  nearestStops(
    lat: number,
    lon: number,
    k: number,
    maxDistM: number,
  ): Array<{ index: number; distM: number }> {
    const deg = maxDistM / 111_000;
    const hits = this.index.search(
      lon - deg,
      lat - deg,
      lon + deg,
      lat + deg,
    );
    return hits
      .map((i) => ({
        index: i,
        distM: haversineMeters(lat, lon, this.stops[i].lat, this.stops[i].lon),
      }))
      .filter((s) => s.distM <= maxDistM)
      .sort((a, b) => a.distM - b.distM)
      .slice(0, k);
  }
}
