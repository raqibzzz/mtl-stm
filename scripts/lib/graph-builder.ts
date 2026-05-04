import Flatbush from 'flatbush';
import { haversineMeters } from '../../lib/geo';
import { WALK_SPEED_MS } from '../../lib/constants';
import {
  loadStops,
  loadStopTimes,
  loadTransfers,
  parseTime,
  type RawStop,
} from './gtfs-parser';

export interface Edge {
  from: number; // stop index
  to: number;
  weight: number; // seconds
}

export async function buildGraph(validTripIds: Set<string>): Promise<{
  stops: RawStop[];
  stopIndex: Map<string, number>;
  edges: Edge[];
}> {
  console.log('Loading stops…');
  const rawStops = await loadStops();
  const stopIndex = new Map<string, number>();
  rawStops.forEach((s, i) => stopIndex.set(s.stop_id, i));

  console.log(`  ${rawStops.length} stops`);

  console.log('Loading stop_times…');
  const stopTimes = await loadStopTimes(validTripIds);
  console.log(`  ${stopTimes.length} stop_time rows`);

  // Group by trip
  const byTrip = new Map<string, typeof stopTimes>();
  for (const st of stopTimes) {
    if (!byTrip.has(st.trip_id)) byTrip.set(st.trip_id, []);
    byTrip.get(st.trip_id)!.push(st);
  }

  // Build in-vehicle edges: accumulate min times per (from, to) pair
  const edgeMap = new Map<string, number>(); // "from,to" -> min_seconds

  for (const [, sts] of byTrip) {
    sts.sort((a, b) => a.stop_sequence - b.stop_sequence);
    for (let i = 0; i < sts.length - 1; i++) {
      const a = sts[i];
      const b = sts[i + 1];
      const fromIdx = stopIndex.get(a.stop_id);
      const toIdx = stopIndex.get(b.stop_id);
      if (fromIdx === undefined || toIdx === undefined) continue;
      const dt = parseTime(b.departure_time) - parseTime(a.departure_time);
      if (dt <= 0 || dt > 7200) continue; // sanity check
      const key = `${fromIdx},${toIdx}`;
      const prev = edgeMap.get(key);
      if (prev === undefined || dt < prev) edgeMap.set(key, dt);
    }
  }

  console.log(`  ${edgeMap.size} in-vehicle edges`);

  // Walking edges via Flatbush spatial index
  console.log('Building walk edges…');
  const MAX_WALK_M = 400;
  const fb = new Flatbush(rawStops.length);
  for (const s of rawStops) fb.add(s.stop_lon, s.stop_lat, s.stop_lon, s.stop_lat);
  fb.finish();

  let walkEdges = 0;
  for (let i = 0; i < rawStops.length; i++) {
    const s = rawStops[i];
    const deg = MAX_WALK_M / 111_000;
    const candidates = fb.search(
      s.stop_lon - deg,
      s.stop_lat - deg,
      s.stop_lon + deg,
      s.stop_lat + deg,
    );
    for (const j of candidates) {
      if (j <= i) continue;
      const distM = haversineMeters(s.stop_lat, s.stop_lon, rawStops[j].stop_lat, rawStops[j].stop_lon);
      if (distM > MAX_WALK_M) continue;
      const walkSec = Math.round(distM / WALK_SPEED_MS);
      const k1 = `${i},${j}`;
      const k2 = `${j},${i}`;
      // Only add walk edge if no faster transit edge exists
      const ex1 = edgeMap.get(k1);
      const ex2 = edgeMap.get(k2);
      if (ex1 === undefined || walkSec < ex1) edgeMap.set(k1, walkSec);
      if (ex2 === undefined || walkSec < ex2) edgeMap.set(k2, walkSec);
      walkEdges++;
    }
  }
  console.log(`  ${walkEdges} walk pairs`);

  // Transfer edges
  console.log('Loading transfers…');
  try {
    const transfers = await loadTransfers();
    for (const t of transfers) {
      const fromIdx = stopIndex.get(t.from_stop_id);
      const toIdx = stopIndex.get(t.to_stop_id);
      if (fromIdx === undefined || toIdx === undefined) continue;
      const sec = t.transfer_type === 2 ? Math.max(t.min_transfer_time, 60) : 120;
      const key = `${fromIdx},${toIdx}`;
      const prev = edgeMap.get(key);
      if (prev === undefined || sec < prev) edgeMap.set(key, sec);
    }
    console.log(`  ${transfers.length} transfer records`);
  } catch {
    console.log('  (no transfers.txt)');
  }

  // Convert edgeMap to Edge array
  const edges: Edge[] = [];
  for (const [key, weight] of edgeMap) {
    const [from, to] = key.split(',').map(Number);
    edges.push({ from, to, weight });
  }

  console.log(`Total edges: ${edges.length}`);
  return { stops: rawStops, stopIndex, edges };
}
