'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { TransitGraph } from '@/lib/graph';
import { dijkstra } from '@/lib/dijkstra';
import { buildGrid } from '@/lib/interpolate';
import { applyCartogramWarp } from '@/lib/cartogram';
import { buildMesh } from '@/lib/mesh';
import { createTransitLayer, type MeshRef } from './TransitLayer';
import ModeToggle from './ModeToggle';
import LegendBar from './LegendBar';
import LoadingOverlay from './LoadingOverlay';
import type { LatLon, MeshBuffers } from '@/lib/types';
import { MONTREAL_BOUNDS } from '@/lib/constants';

interface Props {
  initialOrigin: LatLon;
}

export default function MtlMap({ initialOrigin }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const meshRef = useRef<MeshRef>({ buffers: null, version: 0 });
  const warpBlendRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const updateOriginCallbackRef = useRef<(o: LatLon) => void>(() => {});

  const [graph, setGraph] = useState<TransitGraph | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [graphLoading, setGraphLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [mode, setMode] = useState<'heatmap' | 'cartogram'>('heatmap');
  const [origin, setOrigin] = useState<LatLon>(initialOrigin);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Keep a stable ref to the latest updateOrigin
  const updateOrigin = useCallback(
    (newOrigin: LatLon) => {
      setOrigin(newOrigin);
      markerRef.current?.setLngLat([newOrigin.lon, newOrigin.lat]);
      const qs = searchParams.toString();
      router.push(
        `/mtl/@${newOrigin.lat.toFixed(5)},${newOrigin.lon.toFixed(5)}${qs ? '?' + qs : ''}`,
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  useEffect(() => {
    updateOriginCallbackRef.current = updateOrigin;
  }, [updateOrigin]);

  // Load graph.bin
  useEffect(() => {
    fetch('/graph.bin')
      .then((r) => {
        if (!r.ok) throw new Error(`graph.bin not found (HTTP ${r.status}). Run: npm run setup`);
        return r.arrayBuffer();
      })
      .then((buf) => {
        setGraph(TransitGraph.fromBuffer(buf));
        setGraphLoading(false);
      })
      .catch((err: Error) => {
        setGraphError(err.message);
        setGraphLoading(false);
      });
  }, []);

  // Initialize Mapbox map (once)
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setGraphError('Missing NEXT_PUBLIC_MAPBOX_TOKEN — create .env.local from .env.local.example');
      setGraphLoading(false);
      return;
    }

    mapboxgl.accessToken = token;

    const { west, east, south, north } = MONTREAL_BOUNDS;

    const map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [initialOrigin.lon, initialOrigin.lat],
      zoom: 11,
      maxBounds: [[west - 0.2, south - 0.2], [east + 0.2, north + 0.2]],
    });

    mapRef.current = map;

    map.on('load', () => {
      const layer = createTransitLayer(
        () => meshRef.current,
        () => warpBlendRef.current,
      );
      // Insert below road labels so labels remain visible
      const labelLayer = map.getStyle().layers.find(
        (l) => l.type === 'symbol' && l.id.includes('label'),
      );
      map.addLayer(layer, labelLayer?.id);
    });

    map.on('click', (e) => {
      updateOriginCallbackRef.current({ lat: e.lngLat.lat, lon: e.lngLat.lng });
    });

    const marker = new mapboxgl.Marker({
      color: '#ffffff',
      draggable: true,
      scale: 0.8,
    })
      .setLngLat([initialOrigin.lon, initialOrigin.lat])
      .addTo(map);

    marker.on('dragend', () => {
      const { lat, lng } = marker.getLngLat();
      updateOriginCallbackRef.current({ lat, lon: lng });
    });

    markerRef.current = marker;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recompute travel times whenever graph or origin changes
  useEffect(() => {
    if (!graph) return;
    setComputing(true);

    // Defer to next tick so the UI can update the spinner first
    const id = setTimeout(() => {
      const times = dijkstra(graph, origin);
      const grid = buildGrid(graph, times);
      applyCartogramWarp(grid, graph, times, origin);
      const mesh: MeshBuffers = buildMesh(grid);
      meshRef.current = { buffers: mesh, version: meshRef.current.version + 1 };
      mapRef.current?.triggerRepaint();
      setComputing(false);
    }, 10);

    return () => clearTimeout(id);
  }, [graph, origin]);

  // Animate warpBlend on mode toggle
  const animateWarp = useCallback((target: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const startBlend = warpBlendRef.current;
    const startTime = performance.now();
    const DURATION = 600;

    function step(now: number) {
      const t = Math.min((now - startTime) / DURATION, 1);
      const ease = 0.5 - 0.5 * Math.cos(Math.PI * t);
      warpBlendRef.current = startBlend + (target - startBlend) * ease;
      mapRef.current?.triggerRepaint();
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
  }, []);

  const toggleMode = useCallback(() => {
    setMode((m) => {
      const next = m === 'heatmap' ? 'cartogram' : 'heatmap';
      animateWarp(next === 'cartogram' ? 1 : 0);
      return next;
    });
  }, [animateWarp]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />

      {graphLoading && <LoadingOverlay message="Loading transit graph…" />}

      {graphError && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-gray-900/80">
          <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <p className="text-lg font-semibold text-red-600">Setup needed</p>
            <p className="mt-2 text-sm text-gray-600">{graphError}</p>
          </div>
        </div>
      )}

      {!graphLoading && !graphError && (
        <>
          <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2">
            <div className="rounded-full bg-black/60 px-4 py-2 text-sm text-white shadow backdrop-blur">
              Click anywhere · drag the pin · explore transit
            </div>
          </div>

          {computing && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs text-gray-600 shadow backdrop-blur">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
              Computing…
            </div>
          )}

          <div className="absolute bottom-8 left-4">
            <LegendBar />
          </div>

          <div className="absolute bottom-8 right-4">
            <ModeToggle mode={mode} loading={computing} onToggle={toggleMode} />
          </div>
        </>
      )}
    </div>
  );
}
