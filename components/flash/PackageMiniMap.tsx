'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { decodePolyline6 } from '@/lib/mapbox/directions';

interface Stop {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
}

interface HotelLocation {
  latitude: number;
  longitude: number;
  name: string;
}

interface PackageMiniMapProps {
  stops: Stop[];
  hotelLocation?: HotelLocation | null;
  routeGeometry?: string | null;
  /** When true, renders as the full-height basecamp hero map */
  heroMode?: boolean;
  className?: string;
  /** Currently active stop ID (synced with carousel) */
  activeStopId?: string | null;
  /** Callback when a map marker is clicked */
  onStopClick?: (stopId: string) => void;
}

const MARKER_COLORS: Record<string, string> = {
  landmark: '#ef4444',
  restaurant: '#f97316',
  activity: '#22c55e',
  museum: '#a855f7',
  park: '#22c55e',
  cafe: '#f59e0b',
  bar: '#ec4899',
  market: '#14b8a6',
  nightclub: '#f43f5e',
  viewpoint: '#0ea5e9',
  neighborhood: '#6366f1',
  accommodation: '#8b5cf6',
  transport: '#3b82f6',
};

/**
 * Interactive Mapbox "Basecamp" map for the package step.
 * Hotel is the prominent glowing hub pin. POI stops are numbered spoke markers.
 * Supports activeStopId for carousel sync + flyTo animation.
 */
export function PackageMiniMap({
  stops,
  hotelLocation,
  routeGeometry,
  heroMode = false,
  className = '',
  activeStopId = null,
  onStopClick,
}: PackageMiniMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const markerElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const hotelMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const routeAdded = useRef(false);
  const animFrameRef = useRef<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Calculate center from all points
  const allPoints = [
    ...stops.map((s) => ({ lat: s.latitude, lng: s.longitude })),
    ...(hotelLocation ? [{ lat: hotelLocation.latitude, lng: hotelLocation.longitude }] : []),
  ];

  const hasValidPoints = allPoints.length > 0 && allPoints.some((p) => p.lat !== 0 || p.lng !== 0);

  // Initialize map
  useEffect(() => {
    if (!hasValidPoints) return;
    if (!mapContainer.current) return;
    if (map.current) return;

    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      setMapError('Mapbox access token not configured');
      return;
    }

    mapboxgl.accessToken = accessToken;

    try {
      const centerLat = allPoints.reduce((s, p) => s + p.lat, 0) / allPoints.length;
      const centerLng = allPoints.reduce((s, p) => s + p.lng, 0) / allPoints.length;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [centerLng, centerLat],
        zoom: 12,
        pitch: 0,
        bearing: 0,
        antialias: true,
        scrollZoom: false,
        attributionControl: false,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ showCompass: false }),
        'top-right'
      );

      map.current.on('load', () => {
        setMapLoaded(true);
      });

      map.current.on('error', () => {
        // Silently handle tile loading errors
      });
    } catch (error) {
      console.error('PackageMiniMap init error:', error);
      setMapError('Failed to initialize map');
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      markersRef.current.forEach((m) => m.remove());
      hotelMarkerRef.current?.remove();
      map.current?.remove();
      map.current = null;
      routeAdded.current = false;
      setMapLoaded(false);
    };
  }, [hasValidPoints]);

  // ResizeObserver to handle container size changes
  useEffect(() => {
    if (!mapContainer.current || !map.current) return;

    const observer = new ResizeObserver(() => {
      map.current?.resize();
    });
    observer.observe(mapContainer.current);

    return () => observer.disconnect();
  }, [mapLoaded]);

  // Add markers + fit bounds
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    markerElementsRef.current.clear();
    hotelMarkerRef.current?.remove();
    hotelMarkerRef.current = null;

    const bounds = new mapboxgl.LngLatBounds();

    // Add POI stop markers with numbers (spoke pins)
    stops.forEach((stop, index) => {
      const color = MARKER_COLORS[stop.type] || '#6366f1';
      const isActive = activeStopId === stop.id;

      const el = document.createElement('div');
      el.style.cssText = `
        width: 30px; height: 30px; border-radius: 50%;
        background: ${color}; color: white;
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; font-weight: 700;
        box-shadow: ${isActive ? '0 0 0 4px rgba(255,255,255,0.6), 0 4px 12px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.4)'};
        border: 2px solid rgba(255,255,255,0.9);
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        transform: ${isActive ? 'scale(1.25)' : 'scale(1)'};
        opacity: ${activeStopId && !isActive ? '0.7' : '1'};
        z-index: ${isActive ? '10' : '1'};
      `;
      el.textContent = String(index + 1);

      if (onStopClick) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onStopClick(stop.id);
        });
      }

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([stop.longitude, stop.latitude])
        .addTo(map.current!);

      markersRef.current.push(marker);
      markerElementsRef.current.set(stop.id, el);
      bounds.extend([stop.longitude, stop.latitude]);
    });

    // Add hotel "hub" marker — largest, glowing, pulsing
    if (hotelLocation) {
      const el = document.createElement('div');
      el.className = 'animate-hotel-pulse';
      el.style.cssText = `
        width: 48px; height: 48px; border-radius: 50%;
        background: linear-gradient(135deg, #8b5cf6, #a78bfa);
        color: white;
        display: flex; align-items: center; justify-content: center;
        font-size: 22px;
        box-shadow: 0 0 0 6px rgba(139, 92, 246, 0.3), 0 0 20px rgba(139, 92, 246, 0.2), 0 4px 12px rgba(0,0,0,0.4);
        border: 3px solid rgba(255,255,255,0.95);
        cursor: default;
        z-index: 20;
      `;
      el.textContent = '\uD83C\uDFE8'; // 🏨

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([hotelLocation.longitude, hotelLocation.latitude])
        .addTo(map.current!);

      hotelMarkerRef.current = marker;
      bounds.extend([hotelLocation.longitude, hotelLocation.latitude]);
    }

    // Fit bounds — extra bottom padding for carousel overlay
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: heroMode
          ? { top: 60, bottom: 130, left: 40, right: 40 }
          : { top: 40, bottom: 40, left: 40, right: 40 },
        maxZoom: 14,
        duration: 0,
      });
    }
  }, [stops, hotelLocation, mapLoaded, activeStopId, onStopClick, heroMode]);

  // FlyTo when activeStopId changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !activeStopId) return;

    const stop = stops.find((s) => s.id === activeStopId);
    if (!stop) return;

    const prefersReducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    map.current.flyTo({
      center: [stop.longitude, stop.latitude],
      zoom: Math.max(map.current.getZoom(), 14),
      speed: prefersReducedMotion ? Infinity : 0.8,
      curve: 1.2,
    });
  }, [activeStopId, mapLoaded, stops]);

  // Add route polyline with draw animation
  useEffect(() => {
    if (!map.current || !mapLoaded || !routeGeometry) return;

    const m = map.current;

    try {
      const decoded = decodePolyline6(routeGeometry);
      // Convert [lat, lng] to [lng, lat] for GeoJSON
      const coordinates = decoded.map(([lat, lng]) => [lng, lat]);

      const routeData: GeoJSON.Feature = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates,
        },
      };

      if (routeAdded.current) {
        const src = m.getSource('package-route') as mapboxgl.GeoJSONSource;
        if (src) src.setData(routeData as any);
      } else {
        m.addSource('package-route', { type: 'geojson', data: routeData as any });

        // Check reduced motion preference
        const prefersReducedMotion = typeof window !== 'undefined'
          && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Background line (wider, for contrast)
        m.addLayer({
          id: 'package-route-bg',
          type: 'line',
          source: 'package-route',
          paint: {
            'line-color': '#1e3a5f',
            'line-width': 5,
            'line-opacity': prefersReducedMotion ? 0.3 : 0,
          },
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
        });

        // Main route line
        m.addLayer({
          id: 'package-route-line',
          type: 'line',
          source: 'package-route',
          paint: {
            'line-color': '#3b82f6',
            'line-width': 3,
            'line-opacity': 0.8,
            'line-dasharray': prefersReducedMotion ? [2, 2] : [0, 10000],
          },
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
        });

        routeAdded.current = true;

        // Animate route draw (skip if reduced motion)
        if (!prefersReducedMotion) {
          const totalSteps = 120; // ~2 seconds at 60fps
          let step = 0;
          const lineLength = 10000;

          const animateRoute = () => {
            step++;
            const progress = step / totalSteps;
            const dashLength = progress * lineLength;
            const gapLength = (1 - progress) * lineLength;

            if (m.getLayer('package-route-line')) {
              m.setPaintProperty('package-route-line', 'line-dasharray', [dashLength, gapLength]);
            }
            if (m.getLayer('package-route-bg')) {
              m.setPaintProperty('package-route-bg', 'line-opacity', progress * 0.3);
            }

            if (step >= totalSteps) {
              // Reset to final dashed style
              if (m.getLayer('package-route-line')) {
                m.setPaintProperty('package-route-line', 'line-dasharray', [2, 2]);
              }
              animFrameRef.current = null;
              return;
            }

            animFrameRef.current = requestAnimationFrame(animateRoute);
          };

          animFrameRef.current = requestAnimationFrame(animateRoute);
        }
      }
    } catch (error) {
      console.error('Failed to add route polyline:', error);
    }
  }, [routeGeometry, mapLoaded]);

  if (mapError || !hasValidPoints) {
    return null; // Silently hide map if it can't render
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        ref={mapContainer}
        className={heroMode ? 'w-full h-[55vh] lg:h-[60vh]' : 'w-full h-[280px]'}
      />
    </div>
  );
}
