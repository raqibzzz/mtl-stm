export const MONTREAL_BOUNDS = {
  west: -74.05,
  south: 45.40,
  east: -73.45,
  north: 45.70,
};

export const DEFAULT_ORIGIN = { lat: 45.5175, lon: -73.5609 }; // Berri-UQAM

export const WALK_SPEED_MS = 1.2; // m/s
export const MAX_WALK_M = 800;
export const MAX_TRANSIT_S = 3600;

export const GRID_W = 80;
export const GRID_H = 80;

export const IDW_NEIGHBORS = 12;
export const IDW_POWER = 2;

export const GTFS_URL =
  'https://www.stm.info/sites/default/files/gtfs/gtfs_stm.zip';

export const GRAPH_MAGIC = 0x4d544c47; // "MTLG"
export const GRAPH_VERSION = 1;
