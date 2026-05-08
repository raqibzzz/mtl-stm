import { redirect } from 'next/navigation';
import { DEFAULT_ORIGIN } from '@/lib/constants';
import type { LatLon } from '@/lib/types';
import DynamicMap from '@/components/DynamicMap';

function parseCoords(coords: string): LatLon | null {
  // Strip leading '@' in case the proxy rewrite didn't run (e.g. URL-encoded as %40)
  const s = coords.startsWith('@') ? coords.slice(1) : coords;
  const parts = s.split(',');
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

interface Props {
  params: Promise<{ coords: string }>;
}

export default async function MtlPage({ params }: Props) {
  const { coords } = await params;
  const origin = parseCoords(coords);

  if (!origin) {
    redirect(`/mtl/${DEFAULT_ORIGIN.lat},${DEFAULT_ORIGIN.lon}`);
  }

  return (
    <main className="h-dvh w-full">
      <DynamicMap initialOrigin={origin} />
    </main>
  );
}

export function generateMetadata() {
  return {
    title: 'Montreal in an Hour — MTL Transit Map',
    description:
      'See everywhere reachable in under one hour on the STM metro and bus network.',
  };
}
