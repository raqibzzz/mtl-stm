'use client';

import dynamic from 'next/dynamic';
import type { LatLon } from '@/lib/types';

const MtlMap = dynamic(() => import('./MtlMap'), { ssr: false });

export default function DynamicMap({ initialOrigin }: { initialOrigin: LatLon }) {
  return <MtlMap initialOrigin={initialOrigin} />;
}
