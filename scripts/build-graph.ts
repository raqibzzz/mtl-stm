import { mkdirSync } from 'fs';
import { join } from 'path';
import { getWeekdayServiceIds, getValidTripIds } from './lib/service-filter';
import { buildGraph } from './lib/graph-builder';
import { serializeGraph } from './lib/graph-serializer';

const PUBLIC_DIR = join(process.cwd(), 'public');

async function main() {
  const t0 = Date.now();
  mkdirSync(PUBLIC_DIR, { recursive: true });

  console.log('--- STM GTFS Graph Builder ---');

  console.log('Resolving weekday service IDs…');
  const serviceIds = await getWeekdayServiceIds();
  console.log(`  ${serviceIds.size} service IDs`);

  console.log('Resolving valid trip IDs…');
  const tripIds = await getValidTripIds(serviceIds);
  console.log(`  ${tripIds.size} trips`);

  const { stops, edges } = await buildGraph(tripIds);

  await serializeGraph(stops, edges, PUBLIC_DIR);

  console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
