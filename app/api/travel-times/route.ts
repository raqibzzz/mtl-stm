import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { TransitGraph } from '@/lib/graph';
import { dijkstra } from '@/lib/dijkstra';
import { MONTREAL_BOUNDS } from '@/lib/constants';

let graphCache: TransitGraph | null = null;

async function getGraph(): Promise<TransitGraph> {
  if (graphCache) return graphCache;
  const filePath = join(process.cwd(), 'public', 'graph.bin');
  const buf = await readFile(filePath);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  graphCache = TransitGraph.fromBuffer(ab);
  return graphCache;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lon = parseFloat(searchParams.get('lon') ?? '');

  if (
    isNaN(lat) ||
    isNaN(lon) ||
    lat < MONTREAL_BOUNDS.south ||
    lat > MONTREAL_BOUNDS.north ||
    lon < MONTREAL_BOUNDS.west ||
    lon > MONTREAL_BOUNDS.east
  ) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  try {
    const graph = await getGraph();
    const times = dijkstra(graph, { lat, lon });
    return new NextResponse(times.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
