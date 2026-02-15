'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface ItineraryStop {
  id: string;
  name: string;
  description: string;
  type: 'landmark' | 'restaurant' | 'activity' | 'accommodation' | 'transport' | 'museum' | 'park' | 'cafe' | 'bar' | 'market' | 'nightclub' | 'viewpoint' | 'neighborhood';
  latitude: number;
  longitude: number;
  duration?: string;
  imageUrl?: string;
  day: number;
  suggestedDuration?: string;
  googleRating?: number;
  googleReviewCount?: number;
}

interface FavoriteStop {
  latitude: number;
  longitude: number;
}

interface ItineraryMapProps {
  stops: ItineraryStop[];
  centerLatitude: number;
  centerLongitude: number;
  activeStopId?: string;
  activeDay?: number;
  favoriteStops?: FavoriteStop[];
  onStopClick?: (stop: ItineraryStop) => void;
  className?: string;
}

// Day colors for route lines
const DAY_COLORS = [
  '#3b82f6', // blue - Day 1
  '#8b5cf6', // purple - Day 2
  '#f59e0b', // amber - Day 3
  '#10b981', // emerald - Day 4
  '#f43f5e', // rose - Day 5
  '#06b6d4', // cyan - Day 6
  '#f97316', // orange - Day 7
];

const MARKER_COLORS: Record<ItineraryStop['type'], string> = {
  landmark: '#ef4444',    // red
  restaurant: '#f97316',  // orange
  activity: '#22c55e',    // green
  accommodation: '#8b5cf6', // purple
  transport: '#3b82f6',   // blue
  museum: '#a855f7',      // purple
  park: '#22c55e',        // green
  cafe: '#f59e0b',        // amber
  bar: '#ec4899',         // pink
  market: '#14b8a6',      // teal
  nightclub: '#f43f5e',   // rose
  viewpoint: '#0ea5e9',   // sky
  neighborhood: '#6366f1', // indigo
};

const MARKER_ICONS: Record<ItineraryStop['type'], string> = {
  landmark: '🏛️',
  restaurant: '🍽️',
  activity: '🎯',
  accommodation: '🏨',
  transport: '✈️',
  museum: '🎨',
  park: '🌳',
  cafe: '☕',
  bar: '🍸',
  market: '🛒',
  nightclub: '🎉',
  viewpoint: '🌄',
  neighborhood: '🏘️',
};

export function ItineraryMap({
  stops,
  centerLatitude,
  centerLongitude,
  activeStopId,
  activeDay,
  favoriteStops = [],
  onStopClick,
  className = '',
}: ItineraryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const routeSourceAdded = useRef(false);
  const hotelZoneAdded = useRef(false);
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
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [latestCoordsRef.current.lng, latestCoordsRef.current.lat],
        zoom: 13,
        pitch: 0,
        bearing: 0,
        antialias: true,
      });
      initialCenterSet.current = true;

      map.current.on('load', () => {
        setMapLoaded(true);

        // Try to add 3D buildings for visual depth (non-critical)
        try {
          const layers = map.current?.getStyle()?.layers;
          if (layers) {
            const labelLayerId = layers.find(
              (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
            )?.id;

            if (labelLayerId && map.current?.getSource('composite')) {
              map.current?.addLayer(
                {
                  id: '3d-buildings',
                  source: 'composite',
                  'source-layer': 'building',
                  filter: ['==', 'extrude', 'true'],
                  type: 'fill-extrusion',
                  minzoom: 14,
                  paint: {
                    'fill-extrusion-color': '#ddd',
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': ['get', 'min_height'],
                    'fill-extrusion-opacity': 0.4,
                  },
                },
                labelLayerId
              );
            }
          }
        } catch {
          // 3D buildings are optional — don't break the map
        }
      });

      map.current.on('error', () => {
        // Silently handle tile loading errors
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Failed to initialize map');
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      map.current?.remove();
      map.current = null;
      initialCenterSet.current = false;
      routeSourceAdded.current = false;
      hotelZoneAdded.current = false;
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
      const isActive = stop.id === activeStopId;
      const size = isActive ? 44 : 36;
      const borderWidth = isActive ? 3 : 2;

      // Use image if available, otherwise fall back to emoji
      const markerColor = MARKER_COLORS[stop.type];

      // Always use emoji markers since images are disabled to avoid API costs
      const markerContent = `<span style="font-size: ${isActive ? 22 : 18}px;">${MARKER_ICONS[stop.type]}</span>`;

      el.innerHTML = `
        <div class="marker-content" style="
          background: ${markerColor};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: ${isActive
            ? `0 0 20px ${markerColor}, 0 4px 12px rgba(0,0,0,0.4)`
            : '0 4px 12px rgba(0,0,0,0.4)'};
          border: ${borderWidth}px solid ${markerColor};
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          ${isActive ? 'transform: scale(1.1);' : ''}
        ">
          ${markerContent}
        </div>
        <div class="marker-label" style="
          position: absolute;
          top: -8px;
          left: -8px;
          background: ${MARKER_COLORS[stop.type]};
          color: white;
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

      el.addEventListener('click', () => {
        onStopClick?.(stop);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([stop.longitude, stop.latitude])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

  }, [stops, mapLoaded, activeStopId, onStopClick]);

  // Draw route lines connecting stops per day
  useEffect(() => {
    if (!map.current || !mapLoaded || stops.length < 2) return;

    const m = map.current;

    // Group stops by day
    const stopsByDay = new Map<number, ItineraryStop[]>();
    stops.forEach(stop => {
      const dayStops = stopsByDay.get(stop.day) || [];
      dayStops.push(stop);
      stopsByDay.set(stop.day, dayStops);
    });

    // Build GeoJSON features — one LineString per day
    const features: GeoJSON.Feature[] = [];
    stopsByDay.forEach((dayStops, day) => {
      if (dayStops.length < 2) return;
      const coordinates = dayStops.map(s => [s.longitude, s.latitude]);
      features.push({
        type: 'Feature',
        properties: { day, isActive: day === activeDay },
        geometry: { type: 'LineString', coordinates },
      });
    });

    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    try {
      if (routeSourceAdded.current) {
        // Update existing source
        const source = m.getSource('route-lines') as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData(geojsonData);
        }
      } else {
        // Add source + layers
        m.addSource('route-lines', {
          type: 'geojson',
          data: geojsonData,
        });

        // Inactive day lines (faded)
        m.addLayer({
          id: 'route-lines-inactive',
          type: 'line',
          source: 'route-lines',
          filter: ['==', ['get', 'isActive'], false],
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#ffffff',
            'line-width': 2,
            'line-opacity': 0.15,
            'line-dasharray': [4, 4],
          },
        });

        // Active day line (prominent)
        m.addLayer({
          id: 'route-lines-active',
          type: 'line',
          source: 'route-lines',
          filter: ['==', ['get', 'isActive'], true],
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': ['match', ['get', 'day'],
              1, DAY_COLORS[0],
              2, DAY_COLORS[1],
              3, DAY_COLORS[2],
              4, DAY_COLORS[3],
              5, DAY_COLORS[4],
              6, DAY_COLORS[5],
              7, DAY_COLORS[6],
              '#3b82f6',
            ],
            'line-width': 3.5,
            'line-opacity': 0.7,
          },
        });

        routeSourceAdded.current = true;
      }
    } catch (error) {
      // Route lines are non-critical — don't break the map
      console.error('Failed to add route lines:', error);
    }
  }, [stops, mapLoaded, activeDay]);

  // Draw ideal hotel zone — circle around centroid of favorited stops
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const m = map.current;

    // Need 2+ favorites to show the zone
    if (favoriteStops.length < 2) {
      // Remove zone if it exists
      if (hotelZoneAdded.current) {
        try {
          if (m.getLayer('hotel-zone-fill')) m.removeLayer('hotel-zone-fill');
          if (m.getLayer('hotel-zone-border')) m.removeLayer('hotel-zone-border');
          if (m.getLayer('hotel-zone-label')) m.removeLayer('hotel-zone-label');
          if (m.getSource('hotel-zone')) m.removeSource('hotel-zone');
          if (m.getSource('hotel-zone-label')) m.removeSource('hotel-zone-label');
          hotelZoneAdded.current = false;
        } catch {
          // Ignore cleanup errors
        }
      }
      return;
    }

    // Calculate centroid
    const centLat = favoriteStops.reduce((s, f) => s + f.latitude, 0) / favoriteStops.length;
    const centLng = favoriteStops.reduce((s, f) => s + f.longitude, 0) / favoriteStops.length;

    // Calculate radius — max distance from centroid to any favorite, plus padding
    let maxDist = 0;
    favoriteStops.forEach(f => {
      const dLat = (f.latitude - centLat) * 111320; // meters per degree lat
      const dLng = (f.longitude - centLng) * 111320 * Math.cos(centLat * Math.PI / 180);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist > maxDist) maxDist = dist;
    });
    // Minimum 400m radius, max distance + 30% padding
    const radiusMeters = Math.max(400, maxDist * 1.3);

    // Generate circle polygon (64 points)
    const points = 64;
    const coords: [number, number][] = [];
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = radiusMeters * Math.cos(angle);
      const dy = radiusMeters * Math.sin(angle);
      const lng = centLng + (dx / (111320 * Math.cos(centLat * Math.PI / 180)));
      const lat = centLat + (dy / 111320);
      coords.push([lng, lat]);
    }

    const circleData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [coords] },
      }],
    };

    const labelData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { label: 'Ideal hotel zone' },
        geometry: { type: 'Point', coordinates: [centLng, centLat] },
      }],
    };

    try {
      if (hotelZoneAdded.current) {
        const src = m.getSource('hotel-zone') as mapboxgl.GeoJSONSource;
        const labelSrc = m.getSource('hotel-zone-label') as mapboxgl.GeoJSONSource;
        if (src) src.setData(circleData);
        if (labelSrc) labelSrc.setData(labelData);
      } else {
        // Add circle fill + dashed border
        m.addSource('hotel-zone', { type: 'geojson', data: circleData });
        m.addSource('hotel-zone-label', { type: 'geojson', data: labelData });

        m.addLayer({
          id: 'hotel-zone-fill',
          type: 'fill',
          source: 'hotel-zone',
          paint: {
            'fill-color': '#8b5cf6',
            'fill-opacity': 0.08,
          },
        }, 'route-lines-inactive'); // Insert below route lines

        m.addLayer({
          id: 'hotel-zone-border',
          type: 'line',
          source: 'hotel-zone',
          paint: {
            'line-color': '#8b5cf6',
            'line-width': 2,
            'line-opacity': 0.4,
            'line-dasharray': [3, 3],
          },
        });

        m.addLayer({
          id: 'hotel-zone-label',
          type: 'symbol',
          source: 'hotel-zone-label',
          layout: {
            'text-field': ['get', 'label'],
            'text-size': 11,
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
            'text-offset': [0, 0],
            'text-anchor': 'center',
          },
          paint: {
            'text-color': '#8b5cf6',
            'text-opacity': 0.7,
            'text-halo-color': '#000000',
            'text-halo-width': 1,
          },
        });

        hotelZoneAdded.current = true;
      }
    } catch (error) {
      console.error('Failed to add hotel zone:', error);
    }
  }, [favoriteStops, mapLoaded]);

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
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <p className="text-gray-500 mb-2">Map unavailable</p>
          <p className="text-gray-400 text-sm">{mapError}</p>
        </div>
      </div>
    );
  }

  // Show loading state while waiting for valid coordinates
  if (!hasValidCoords) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapContainer} className={`${className}`} style={{ width: '100%', height: '100%' }} />
  );
}
