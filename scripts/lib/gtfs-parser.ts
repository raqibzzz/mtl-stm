import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { join } from 'path';

const GTFS_DIR = join(process.cwd(), 'data', 'gtfs');

function streamFile<T>(
  file: string,
  transform: (row: Record<string, string>) => T | null,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    createReadStream(join(GTFS_DIR, file))
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
      .on('data', (row: Record<string, string>) => {
        const v = transform(row);
        if (v !== null) results.push(v);
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

export interface RawStop {
  stop_id: string;
  stop_lat: number;
  stop_lon: number;
}

export interface RawStopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
}

export interface RawTransfer {
  from_stop_id: string;
  to_stop_id: string;
  transfer_type: number;
  min_transfer_time: number;
}

export interface RawCalendar {
  service_id: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  start_date: string;
  end_date: string;
}

export interface RawCalendarDate {
  service_id: string;
  date: string;
  exception_type: number;
}

export interface RawTrip {
  route_id: string;
  service_id: string;
  trip_id: string;
}

export function parseTime(t: string): number {
  const [h, m, s] = t.split(':').map(Number);
  return h * 3600 + m * 60 + (s || 0);
}

export const loadStops = () =>
  streamFile<RawStop>('stops.txt', (r) => ({
    stop_id: r.stop_id,
    stop_lat: parseFloat(r.stop_lat),
    stop_lon: parseFloat(r.stop_lon),
  }));

export const loadTrips = () =>
  streamFile<RawTrip>('trips.txt', (r) => ({
    route_id: r.route_id,
    service_id: r.service_id,
    trip_id: r.trip_id,
  }));

export const loadStopTimes = (validTripIds: Set<string>) =>
  streamFile<RawStopTime>('stop_times.txt', (r) => {
    if (!validTripIds.has(r.trip_id)) return null;
    return {
      trip_id: r.trip_id,
      arrival_time: r.arrival_time,
      departure_time: r.departure_time,
      stop_id: r.stop_id,
      stop_sequence: parseInt(r.stop_sequence, 10),
    };
  });

export const loadTransfers = () =>
  streamFile<RawTransfer>('transfers.txt', (r) => ({
    from_stop_id: r.from_stop_id,
    to_stop_id: r.to_stop_id,
    transfer_type: parseInt(r.transfer_type, 10),
    min_transfer_time: parseInt(r.min_transfer_time || '0', 10),
  }));

export const loadCalendar = () =>
  streamFile<RawCalendar>('calendar.txt', (r) => ({
    service_id: r.service_id,
    monday: parseInt(r.monday, 10),
    tuesday: parseInt(r.tuesday, 10),
    wednesday: parseInt(r.wednesday, 10),
    thursday: parseInt(r.thursday, 10),
    friday: parseInt(r.friday, 10),
    start_date: r.start_date,
    end_date: r.end_date,
  }));

export const loadCalendarDates = () =>
  streamFile<RawCalendarDate>('calendar_dates.txt', (r) => ({
    service_id: r.service_id,
    date: r.date,
    exception_type: parseInt(r.exception_type, 10),
  }));
