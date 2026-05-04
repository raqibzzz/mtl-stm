import {
  loadCalendar,
  loadCalendarDates,
  loadTrips,
} from './gtfs-parser';

export async function getWeekdayServiceIds(): Promise<Set<string>> {
  const [calendar, calDates] = await Promise.all([
    loadCalendar(),
    loadCalendarDates(),
  ]);

  const ids = new Set<string>();

  for (const c of calendar) {
    // Keep services active on at least one weekday
    if (c.monday || c.tuesday || c.wednesday || c.thursday || c.friday) {
      ids.add(c.service_id);
    }
  }

  // Honor exception type 1 (added) and type 2 (removed)
  for (const d of calDates) {
    if (d.exception_type === 1) ids.add(d.service_id);
  }

  return ids;
}

export async function getValidTripIds(
  serviceIds: Set<string>,
): Promise<Set<string>> {
  const trips = await loadTrips();
  const ids = new Set<string>();
  for (const t of trips) {
    if (serviceIds.has(t.service_id)) ids.add(t.trip_id);
  }
  return ids;
}
