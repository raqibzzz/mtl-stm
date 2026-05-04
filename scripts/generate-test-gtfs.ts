/**
 * Generates a minimal synthetic GTFS dataset representing the Montreal metro,
 * for use when the real STM GTFS cannot be downloaded.
 * Replace with the real GTFS by running: npm run setup
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const OUT = join(process.cwd(), 'data', 'gtfs');
mkdirSync(OUT, { recursive: true });

function csv(header: string, rows: string[][]): string {
  return [header, ...rows.map((r) => r.join(','))].join('\n') + '\n';
}

// ------------------------------------------------------------------
// Station definitions: [stop_id, name, lat, lon, line_code]
// Approximate real coordinates of Montreal metro stations
// ------------------------------------------------------------------
type Station = [string, string, number, number];

const GREEN: Station[] = [
  ['G01', 'Angrignon',           45.4483, -73.6039],
  ['G02', 'Monk',                45.4554, -73.5877],
  ['G03', 'Jolicoeur',           45.4617, -73.5742],
  ['G04', 'Verdun',              45.4614, -73.5648],
  ['G05', "De-l-Eglise",        45.4623, -73.5591],
  ['G06', 'Charlevoix',          45.4665, -73.5721],
  ['G07', 'Lionel-Groulx',       45.4734, -73.5817], // interchange Orange
  ['G08', 'Atwater',             45.4942, -73.5793],
  ['G09', 'Guy-Concordia',       45.4960, -73.5778],
  ['G10', 'Peel',                45.4975, -73.5697],
  ['G11', 'McGill',              45.5046, -73.5690],
  ['G12', 'Place-des-Arts',      45.5083, -73.5619],
  ['G13', 'Saint-Laurent',       45.5108, -73.5590],
  ['G14', 'Berri-UQAM',          45.5178, -73.5609], // interchange Orange+Yellow
  ['G15', 'Beaudry',             45.5180, -73.5540],
  ['G16', 'Papineau',            45.5256, -73.5474],
  ['G17', 'Frontenac',           45.5316, -73.5434],
  ['G18', 'Prefontaine',         45.5394, -73.5435],
  ['G19', 'Joliette',            45.5476, -73.5496],
  ['G20', 'Pie-IX',              45.5562, -73.5484],
  ['G21', 'Viau',                45.5595, -73.5408],
  ['G22', 'Assomption',          45.5598, -73.5319],
  ['G23', 'Cadillac',            45.5597, -73.5236],
  ['G24', 'Langelier',           45.5597, -73.5162],
  ['G25', 'Radisson',            45.5596, -73.5087],
  ['G26', 'Honore-Beaugrand',    45.5594, -73.4987],
];

// Orange line NW branch (Côte-Vertu → Lionel-Groulx, going SE)
const ORANGE_NW: Station[] = [
  ['O01', 'Cote-Vertu',          45.5091, -73.7202],
  ['O02', 'Du-College',          45.5043, -73.6968],
  ['O03', 'De-la-Savane',        45.4994, -73.6866],
  ['O04', 'Namur',               45.4932, -73.6668],
  ['O05', 'Plamondon',           45.4890, -73.6527],
  ['O06', 'Cote-Sainte-Catherine', 45.4874, -73.6404],
  ['O07', 'Snowdon',             45.4944, -73.6522],
  ['O08', 'Villa-Maria',         45.4889, -73.6197],
  ['O09', 'Vendome',             45.4843, -73.5917],
  ['O10', 'Place-Saint-Henri',   45.4802, -73.5853],
  ['G07', 'Lionel-Groulx',       45.4734, -73.5817], // shared with Green
];

// Orange line South branch (Lionel-Groulx → Berri-UQAM)
const ORANGE_S: Station[] = [
  ['G07', 'Lionel-Groulx',       45.4734, -73.5817],
  ['O11', 'Bonaventure',         45.4979, -73.5679],
  ['O12', 'Square-Victoria',     45.5033, -73.5601],
  ['O13', 'Place-d-Armes',       45.5076, -73.5595],
  ['G14', 'Berri-UQAM',          45.5178, -73.5609], // shared with Green+Yellow
];

// Orange line NE branch (Berri-UQAM → Henri-Bourassa → Montmorency)
const ORANGE_NE: Station[] = [
  ['G14', 'Berri-UQAM',          45.5178, -73.5609],
  ['O14', 'Champ-de-Mars',       45.5110, -73.5565],
  ['O15', 'Place-des-Arts',      45.5083, -73.5619], // different from green?
  ['O16', 'Mont-Royal',          45.5257, -73.5753],
  ['O17', 'Laurier',             45.5349, -73.5840],
  ['O18', 'Rosemont',            45.5431, -73.5914],
  ['O19', 'Beaubien',            45.5487, -73.5978],
  ['O20', 'Jean-Talon',          45.5271, -73.6234], // interchange Blue
  ['O21', 'Fabre',               45.5322, -73.6084],
  ['O22', 'De-Castelnau',        45.5374, -73.6020],
  ['O23', 'Jarry',               45.5434, -73.5965],
  ['O24', 'Cremazie',            45.5439, -73.5882],
  ['O25', 'Sauve',               45.5533, -73.5838],
  ['O26', 'Henri-Bourassa',      45.5610, -73.5795],
  ['O27', 'Cartier',             45.5631, -73.5436],
  ['O28', 'De-la-Concorde',      45.5671, -73.5224],
  ['O29', 'Montmorency',         45.5566, -73.4913],
];

// Blue Line (Snowdon → Saint-Michel, west to east)
const BLUE: Station[] = [
  ['O07', 'Snowdon',              45.4944, -73.6522], // shared with Orange
  ['B01', 'Cote-des-Neiges',      45.5007, -73.6431],
  ['B02', 'Universite-de-Montreal', 45.5020, -73.6222],
  ['B03', 'Edouard-Montpetit',    45.5043, -73.6149],
  ['B04', 'Outremont',            45.5096, -73.5989],
  ['B05', 'Acadie',               45.5148, -73.5860],
  ['B06', 'Parc',                 45.5154, -73.5766],
  ['O20', 'Jean-Talon',           45.5271, -73.6234], // shared with Orange
  ['B07', 'D-Iberville',          45.5368, -73.5942],
  ['B08', 'Saint-Michel',         45.5525, -73.5985],
];

// Yellow Line (Berri-UQAM → Longueuil, south across river)
const YELLOW: Station[] = [
  ['G14', 'Berri-UQAM',           45.5178, -73.5609],
  ['Y01', 'Jean-Drapeau',         45.5093, -73.5330],
  ['Y02', 'Longueuil',            45.5226, -73.5201],
];

// ------------------------------------------------------------------
// Deduplicate all stops
// ------------------------------------------------------------------
const stopMap = new Map<string, Station>();
for (const arr of [GREEN, ORANGE_NW, ORANGE_S, ORANGE_NE, BLUE, YELLOW]) {
  for (const s of arr) {
    if (!stopMap.has(s[0])) stopMap.set(s[0], s);
  }
}
const allStops = [...stopMap.values()];

// stops.txt
writeFileSync(
  join(OUT, 'stops.txt'),
  csv('stop_id,stop_name,stop_lat,stop_lon', allStops.map(([id, name, lat, lon]) => [id, `"${name}"`, String(lat), String(lon)])),
);

// routes.txt
const routes = [
  ['R_G', '1', 'Green', '1'],
  ['R_O', '2', 'Orange', '1'],
  ['R_B', '5', 'Blue', '1'],
  ['R_Y', '4', 'Yellow', '1'],
];
writeFileSync(
  join(OUT, 'routes.txt'),
  csv('route_id,route_short_name,route_long_name,route_type', routes),
);

// calendar.txt (Mon–Fri service)
writeFileSync(
  join(OUT, 'calendar.txt'),
  csv('service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date', [
    ['WD', '1', '1', '1', '1', '1', '0', '0', '20260101', '20261231'],
  ]),
);

// calendar_dates.txt (empty but required)
writeFileSync(join(OUT, 'calendar_dates.txt'), 'service_id,date,exception_type\n');

// ------------------------------------------------------------------
// Generate trips and stop_times
// ------------------------------------------------------------------
let tripCounter = 1;
const tripRows: string[][] = [];
const stopTimeRows: string[][] = [];

function addTrip(
  routeId: string,
  stations: Station[],
  direction: 0 | 1,
  departureHours: number[],
  travelSecsPerStop: number,
  dwellSecs: number,
): void {
  const ordered = direction === 0 ? stations : [...stations].reverse();

  for (const depHour of departureHours) {
    const tripId = `T${tripCounter++}`;
    tripRows.push([routeId, 'WD', tripId, String(direction)]);

    let t = depHour * 3600;
    for (let i = 0; i < ordered.length; i++) {
      const hh = String(Math.floor(t / 3600)).padStart(2, '0');
      const mm = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
      const ss = String(t % 60).padStart(2, '0');
      const timeStr = `${hh}:${mm}:${ss}`;
      stopTimeRows.push([tripId, timeStr, timeStr, ordered[i][0], String(i + 1)]);
      t += travelSecsPerStop + dwellSecs;
    }
  }
}

// Departures every 4 minutes during 6am–11pm → ~255 trips per direction
const DEPARTURES = Array.from({ length: 255 }, (_, i) => 6 * 3600 + i * 4 * 60);
const DEPARTURE_HOURS = DEPARTURES.map((s) => s / 3600);

// Green Line: ~2 min between stops, 30s dwell
addTrip('R_G', GREEN, 0, DEPARTURE_HOURS, 90, 30);
addTrip('R_G', GREEN, 1, DEPARTURE_HOURS, 90, 30);

// Orange NW branch
addTrip('R_O', [...ORANGE_NW, ...ORANGE_S.slice(1)], 0, DEPARTURE_HOURS, 100, 30);
addTrip('R_O', [...ORANGE_S, ...ORANGE_NW.slice(0, -1).reverse()], 0, DEPARTURE_HOURS, 100, 30);

// Orange NE branch
addTrip('R_O', [...ORANGE_S.slice(0, -1).reverse(), ...ORANGE_NE.slice(1)], 0, DEPARTURE_HOURS, 90, 30);
addTrip('R_O', [...ORANGE_NE.slice(0, -1).reverse(), ...ORANGE_S.slice(1)], 0, DEPARTURE_HOURS, 90, 30);

// Blue Line
addTrip('R_B', BLUE, 0, DEPARTURE_HOURS, 100, 30);
addTrip('R_B', BLUE, 1, DEPARTURE_HOURS, 100, 30);

// Yellow Line
addTrip('R_Y', YELLOW, 0, DEPARTURE_HOURS, 120, 30);
addTrip('R_Y', YELLOW, 1, DEPARTURE_HOURS, 120, 30);

writeFileSync(
  join(OUT, 'trips.txt'),
  csv('route_id,service_id,trip_id,direction_id', tripRows),
);
writeFileSync(
  join(OUT, 'stop_times.txt'),
  csv('trip_id,arrival_time,departure_time,stop_id,stop_sequence', stopTimeRows),
);

// transfers.txt — interchange stations
const INTERCHANGES = [
  ['G07', 'O10'], // Lionel-Groulx Green↔Orange
  ['G14', 'O13'], // Berri-UQAM Green/Yellow↔Orange (simplified: same stop id)
  ['G14', 'Y02'], // Berri-UQAM ↔ Yellow
  ['O07', 'B01'], // Snowdon Orange↔Blue (simplified)
  ['O20', 'B07'], // Jean-Talon Orange↔Blue
];
const transferRows: string[][] = [];
for (const [a, b] of INTERCHANGES) {
  transferRows.push([a, b, '2', '120']);
  transferRows.push([b, a, '2', '120']);
}
writeFileSync(
  join(OUT, 'transfers.txt'),
  csv('from_stop_id,to_stop_id,transfer_type,min_transfer_time', transferRows),
);

console.log(`Generated synthetic Montreal Metro GTFS in ${OUT}`);
console.log(`  ${allStops.length} stops, ${tripRows.length} trips, ${stopTimeRows.length} stop_times`);
console.log('Replace with real STM GTFS by running: npm run setup');
