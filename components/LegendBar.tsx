'use client';

import { travelTimeToCss } from '@/lib/color';

const TICKS = [0, 15, 30, 45, 60];

export default function LegendBar() {
  const gradient = [0, 300, 900, 1800, 2700, 3600]
    .map((t) => travelTimeToCss(t))
    .join(', ');

  return (
    <div className="rounded-xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
      <div
        className="h-3 w-48 rounded-full"
        style={{ background: `linear-gradient(to right, ${gradient})` }}
      />
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        {TICKS.map((m) => (
          <span key={m}>{m}min</span>
        ))}
      </div>
    </div>
  );
}
