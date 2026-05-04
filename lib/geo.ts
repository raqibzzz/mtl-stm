const R = 6_371_000; // Earth radius in meters
const TO_RAD = Math.PI / 180;

export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = (lat2 - lat1) * TO_RAD;
  const dLon = (lon2 - lon1) * TO_RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * TO_RAD) * Math.cos(lat2 * TO_RAD) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function bearingRad(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
): number {
  const dLon = (toLon - fromLon) * TO_RAD;
  const lat1 = fromLat * TO_RAD;
  const lat2 = toLat * TO_RAD;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return Math.atan2(y, x);
}

export function destination(
  lat: number,
  lon: number,
  distanceM: number,
  bearingRadians: number,
): { lat: number; lon: number } {
  const angDist = distanceM / R;
  const lat1 = lat * TO_RAD;
  const lon1 = lon * TO_RAD;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angDist) +
      Math.cos(lat1) * Math.sin(angDist) * Math.cos(bearingRadians),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearingRadians) * Math.sin(angDist) * Math.cos(lat1),
      Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lat: lat2 / TO_RAD, lon: lon2 / TO_RAD };
}

export function mercatorX(lon: number): number {
  return (lon + 180) / 360;
}

export function mercatorY(lat: number): number {
  const sinLat = Math.sin(lat * TO_RAD);
  return (1 - Math.log((1 + sinLat) / (1 - sinLat)) / (2 * Math.PI)) / 2;
}
