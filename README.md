# Montreal in an Hour — MTL Transit Map

See everywhere reachable in under one hour on the STM metro and bus network. Interactive heatmap + cartogram visualization.

## What it does

- **Heatmap**: Color-coded by travel time (green → yellow → orange → red)
- **Cartogram**: Space warps so transit-adjacent areas appear visually closer
- Click anywhere to move the origin pin; URL encodes the position as `/mtl/@lat,lon`

## Deploy to Vercel (2 minutes)

1. **Import the repo** at [vercel.com/new](https://vercel.com/new) → "Import Git Repository" → `raqibzzz/mtl-stm`
2. **Add env variable**: `NEXT_PUBLIC_MAPBOX_TOKEN` = your [Mapbox public token](https://account.mapbox.com/access-tokens/) (free account)
3. Click **Deploy** — the build auto-generates transit graph data, no extra setup needed

## Local development

```bash
# 1. Create env file and add your Mapbox token
echo 'NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here' > .env.local

# 2. Install deps
npm install

# 3. Start dev server (auto-generates synthetic metro data on first run)
npm run dev
```

Visit `http://localhost:3000`.

To use real STM bus + metro data (requires network):

```bash
npm run setup   # downloads STM GTFS zip (~60MB) and builds graph.bin
npm run dev
```

## How it works

**Data pipeline (build time):**
1. `scripts/generate-test-gtfs.ts` creates synthetic Montreal metro GTFS (65 stations)
2. `scripts/build-graph.ts` parses GTFS → Compressed Sparse Row binary (`public/graph.bin`, ~2KB synthetic / ~400KB real)

**Runtime:**
1. Browser fetches `graph.bin`, parses into `TransitGraph` with Flatbush spatial index
2. Click → Dijkstra shortest-path from origin across transit network
3. IDW interpolation over 80×80 grid → travel-time field
4. WebGL custom layer renders colored mesh; GLSL fragment shader applies color ramp
5. Cartogram mode: IDW warp field displaces grid vertices proportional to travel-time

## Tech stack

- **Next.js 16** (App Router, Turbopack)
- **Mapbox GL JS v3** — custom `CustomLayerInterface` WebGL layers
- **Flatbush** — R-tree for O(log n) nearest-stop queries
- **Tailwind CSS v4**
- STM GTFS static feed (offline schedule data, no transit API key needed)
