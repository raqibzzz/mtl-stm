import { writeFile } from 'fs/promises';
import { join } from 'path';
import { GRAPH_MAGIC, GRAPH_VERSION } from '../../lib/constants';
import type { Edge } from './graph-builder';
import type { RawStop } from './gtfs-parser';

export async function serializeGraph(
  stops: RawStop[],
  edges: Edge[],
  outDir: string,
): Promise<void> {
  const nStops = stops.length;
  const nEdges = edges.length;

  // Build CSR from edge list
  const degree = new Uint32Array(nStops);
  for (const e of edges) degree[e.from]++;

  const csrOffsets = new Uint32Array(nStops + 1);
  for (let i = 0; i < nStops; i++) csrOffsets[i + 1] = csrOffsets[i] + degree[i];

  const csrTargets = new Uint32Array(nEdges);
  const csrWeights = new Uint32Array(nEdges);
  const cursor = new Uint32Array(nStops);

  for (const e of edges) {
    const pos = csrOffsets[e.from] + cursor[e.from];
    csrTargets[pos] = e.to;
    csrWeights[pos] = Math.min(e.weight, 65535);
    cursor[e.from]++;
  }

  // Binary layout (all Uint32-aligned):
  // Header: 6 × uint32 = 24 bytes
  // Stops:  nStops × 3 × 4 = nStops × 12 bytes
  // CSR offsets: (nStops+1) × 4 bytes
  // CSR targets: nEdges × 4 bytes
  // CSR weights: nEdges × 4 bytes
  const totalBytes =
    24 +
    nStops * 12 +
    (nStops + 1) * 4 +
    nEdges * 4 +
    nEdges * 4;

  const buf = new ArrayBuffer(totalBytes);
  const view = new DataView(buf);
  let off = 0;

  view.setUint32(off, GRAPH_MAGIC, true); off += 4;
  view.setUint32(off, GRAPH_VERSION, true); off += 4;
  view.setUint32(off, nStops, true); off += 4;
  view.setUint32(off, nEdges, true); off += 4;
  view.setUint32(off, 0, true); off += 4; // reserved
  view.setUint32(off, 0, true); off += 4; // reserved

  // Stops
  for (const s of stops) {
    view.setFloat32(off, s.stop_lat, true); off += 4;
    view.setFloat32(off, s.stop_lon, true); off += 4;
    // Hash stop_id to a uint32
    let h = 0;
    for (let i = 0; i < s.stop_id.length; i++) {
      h = (Math.imul(31, h) + s.stop_id.charCodeAt(i)) >>> 0;
    }
    view.setUint32(off, h, true); off += 4;
  }

  // CSR data — write directly via DataView
  for (let i = 0; i <= nStops; i++) {
    view.setUint32(off, csrOffsets[i], true); off += 4;
  }
  for (let i = 0; i < nEdges; i++) {
    view.setUint32(off, csrTargets[i], true); off += 4;
  }
  for (let i = 0; i < nEdges; i++) {
    view.setUint32(off, csrWeights[i], true); off += 4;
  }

  const outPath = join(outDir, 'graph.bin');
  await writeFile(outPath, Buffer.from(buf));
  console.log(
    `Wrote ${outPath} (${(totalBytes / 1024).toFixed(1)} KB, ${nStops} stops, ${nEdges} edges)`,
  );

  // Write stop name index for UI
  const meta = {
    nStops,
    nEdges,
    stops: stops.map((s) => ({
      id: s.stop_id,
      lat: s.stop_lat,
      lon: s.stop_lon,
    })),
  };
  await writeFile(
    join(outDir, 'graph-meta.json'),
    JSON.stringify(meta),
  );
  console.log(`Wrote graph-meta.json`);
}
