// Travel time (seconds) → normalized RGBA [0,1] for shader use
const STOPS: Array<[number, [number, number, number]]> = [
  [0,    [0.0,  0.78, 0.31]], // green
  [300,  [0.39, 0.78, 0.20]], // yellow-green
  [900,  [0.86, 0.86, 0.0 ]], // yellow
  [1800, [0.94, 0.55, 0.0 ]], // orange
  [2700, [0.86, 0.20, 0.0 ]], // red-orange
  [3600, [0.71, 0.0,  0.20]], // red
];

export function travelTimeToRgbNorm(
  seconds: number,
): [number, number, number, number] {
  if (!isFinite(seconds) || seconds < 0) return [0.31, 0.31, 0.31, 0.3];

  for (let i = 1; i < STOPS.length; i++) {
    const [t0, c0] = STOPS[i - 1];
    const [t1, c1] = STOPS[i];
    if (seconds <= t1) {
      const f = (seconds - t0) / (t1 - t0);
      return [
        c0[0] + f * (c1[0] - c0[0]),
        c0[1] + f * (c1[1] - c0[1]),
        c0[2] + f * (c1[2] - c0[2]),
        0.82,
      ];
    }
  }
  return STOPS[STOPS.length - 1][1].concat(0.82) as [number, number, number, number];
}

// CSS color string for the legend
export function travelTimeToCss(seconds: number): string {
  const [r, g, b] = travelTimeToRgbNorm(seconds);
  return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
}
