'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface ItineraryStop {
  id: string;
  name: string;
  description: string;
  type: 'landmark' | 'restaurant' | 'activity' | 'accommodation' | 'transport';
  latitude: number;
  longitude: number;
  duration?: string;
  imageUrl?: string;
  day: number;
}

interface ItineraryMapProps {
  stops: ItineraryStop[];
  centerLatitude: number;
  centerLongitude: number;
  activeStopId?: string;
  onStopClick?: (stop: ItineraryStop) => void;
  className?: string;
}

const MARKER_COLORS: Record<ItineraryStop['type'], string> = {
  landmark: '#ef4444',    // red
  restaurant: '#f97316',  // orange
  activity: '#22c55e',    // green
  accommodation: '#8b5cf6', // purple
  transport: '#3b82f6',   // blue
};

const MARKER_ICONS: Record<ItineraryStop['type'], string> = {
  landmark: '🏛️',
  restaurant: '🍽️',
  activity: '🎯',
  accommodation: '🏨',
  transport: '✈️',
};

export function ItineraryMap({
  stops,
  centerLatitude,
  centerLongitude,
  activeStopId,
  onStopClick,
  className = '',
}: ItineraryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const initialCenterSet = useRef(false);

  // Check if we have valid coordinates
  const hasValidCoords = centerLatitude !== 0 || centerLongitude !== 0;

  // Store the latest valid coordinates
  const latestCoordsRef = useRef({ lat: centerLatitude, lng: centerLongitude });
  if (hasValidCoords) {
    latestCoordsRef.current = { lat: centerLatitude, lng: centerLongitude };
  }

  // Initialize map once when valid coordinates are available
  useEffect(() => {
    // Don't initialize until we have valid coordinates
    if (!hasValidCoords) return;
    if (!mapContainer.current) return;
    // Already initialized
    if (map.current) return;

    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('Mapbox access token not configured');
      setMapError('Mapbox access token not configured');
      return;
    }

    mapboxgl.accessToken = accessToken;

    try {
      console.log('Initializing Mapbox map with center:', latestCoordsRef.current);
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [latestCoordsRef.current.lng, latestCoordsRef.current.lat],
        zoom: 12,
        pitch: 0,
        bearing: 0,
        antialias: true,
      });
      initialCenterSet.current = true;

      map.current.on('load', () => {
        console.log('Mapbox map loaded successfully');
        setMapLoaded(true);

        // Add 3D building layer for immersion
        const layers = map.current?.getStyle()?.layers;
        if (layers) {
          const labelLayerId = layers.find(
            (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
          )?.id;

          if (labelLayerId) {
            map.current?.addLayer(
              {
                id: '3d-buildings',
                source: 'composite',
                'source-layer': 'building',
                filter: ['==', 'extrude', 'true'],
                type: 'fill-extrusion',
                minzoom: 12,
                paint: {
                  'fill-extrusion-color': '#1a1a2e',
                  'fill-extrusion-height': ['get', 'height'],
                  'fill-extrusion-base': ['get', 'min_height'],
                  'fill-extrusion-opacity': 0.6,
                },
              },
              labelLayerId
            );
          }
        }
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Failed to initialize map');
    }

    return () => {
      console.log('Cleaning up Mapbox map');
      markersRef.current.forEach((marker) => marker.remove());
      map.current?.remove();
      map.current = null;
      initialCenterSet.current = false;
      setMapLoaded(false);
    };
  }, [hasValidCoords]); // Only re-run when hasValidCoords changes (false -> true)

  // Fly to center when coordinates change (after initial load)
  useEffect(() => {
    if (!map.current || !mapLoaded || !hasValidCoords) return;
    // Skip if this is the initial center (already set during map creation)
    if (!initialCenterSet.current) {
      initialCenterSet.current = true;
      return;
    }

    // Fit bounds to show all stops if we have multiple
    if (stops.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      stops.forEach(stop => {
        bounds.extend([stop.longitude, stop.latitude]);
      });
      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 200, left: 50, right: 50 },
        maxZoom: 14,
        duration: 1000,
      });
    } else if (stops.length === 1) {
      map.current.flyTo({
        center: [centerLongitude, centerLatitude],
        zoom: 14,
        duration: 1000,
      });
    }
  }, [centerLatitude, centerLongitude, stops.length, mapLoaded, hasValidCoords]);

  // Add markers when map is loaded
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    stops.forEach((stop, index) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'itinerary-marker';
      el.innerHTML = `
        <div class="marker-content" style="
          background: ${MARKER_COLORS[stop.type]};
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          border: 2px solid white;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        ">
          ${MARKER_ICONS[stop.type]}
        </div>
        <div class="marker-label" style="
          position: absolute;
          top: -8px;
          left: -8px;
          background: white;
          color: ${MARKER_COLORS[stop.type]};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          ${index + 1}
        </div>
      `;

      // Highlight active marker
      if (stop.id === activeStopId) {
        el.querySelector('.marker-content')?.setAttribute('style', `
          background: ${MARKER_COLORS[stop.type]};
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          box-shadow: 0 0 20px ${MARKER_COLORS[stop.type]}, 0 4px 12px rgba(0,0,0,0.4);
          border: 3px solid white;
          cursor: pointer;
          transform: scale(1.1);
        `);
      }

      el.addEventListener('click', () => {
        onStopClick?.(stop);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([stop.longitude, stop.latitude])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

  }, [stops, mapLoaded, activeStopId, onStopClick]);

  // Fly to active stop
  useEffect(() => {
    if (!map.current || !mapLoaded || !activeStopId) return;

    const activeStop = stops.find((s) => s.id === activeStopId);
    if (activeStop) {
      map.current.flyTo({
        center: [activeStop.longitude, activeStop.latitude],
        zoom: 15,
        pitch: 0, // Keep top-down view
        duration: 1500,
      });
    }
  }, [activeStopId, stops, mapLoaded]);

  if (mapError) {
    return (
      <div className={`bg-gray-900 flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <p className="text-white/60 mb-2">Map unavailable</p>
          <p className="text-white/40 text-sm">{mapError}</p>
        </div>
      </div>
    );
  }

  // Show loading state while waiting for valid coordinates
  if (!hasValidCoords) {
    return (
      <div className={`bg-gray-900 flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/60 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapContainer} className={`${className}`} style={{ width: '100%', height: '100%' }} />
  );
}
