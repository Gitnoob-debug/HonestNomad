'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { calculateHotelZone, getMainClusterBounds } from '@/lib/flash/hotelZoneClustering';

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

interface ClusterZone {
  id: number;
  center: { latitude: number; longitude: number };
  radiusMeters: number;
  color: string;
  label: string;
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
  /** Hotel nexus location (zone center or actual hotel) — shows glowing hub marker */
  hotelLocation?: { latitude: number; longitude: number; name: string } | null;
  /** Geographic clusters for smart planner overlay */
  clusterZones?: ClusterZone[];
}

// Day colors reserved for future itinerary route lines (post hotel-booking)
// const DAY_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#06b6d4', '#f97316'];

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
  hotelLocation,
  clusterZones,
}: ItineraryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const hotelMarkerRef = useRef<mapboxgl.Marker | null>(null);
  // routeSourceAdded removed — route lines disabled during explore stage
  const hotelZoneAdded = useRef(false);
  const clusterZonesAdded = useRef(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [offScreenCount, setOffScreenCount] = useState(0);
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
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [latestCoordsRef.current.lng, latestCoordsRef.current.lat],
        zoom: 11,
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
      hotelMarkerRef.current?.remove();
      map.current?.remove();
      map.current = null;
      initialCenterSet.current = false;
      hotelZoneAdded.current = false;
      clusterZonesAdded.current = false;
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

    // Fit bounds to the MAIN CLUSTER of stops (filters outliers for island/scattered destinations)
    if (stops.length > 1) {
      const { inliers, outlierCount } = getMainClusterBounds(
        stops.map(s => ({ latitude: s.latitude, longitude: s.longitude }))
      );
      setOffScreenCount(outlierCount);

      const bounds = new mapboxgl.LngLatBounds();
      inliers.forEach(p => {
        bounds.extend([p.longitude, p.latitude]);
      });

      // Ensure minimum bounds span so small islands / tight clusters show
      // enough surrounding land/coastline for geographic context.
      // Without this, a tight POI cluster on Barbados (0.2° span) could
      // zoom in so far that only ocean is visible around the markers.
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latSpan = ne.lat - sw.lat;
      const lngSpan = ne.lng - sw.lng;
      const MIN_SPAN = 0.08; // ~8-9km — ensures visible land context

      if (latSpan < MIN_SPAN) {
        const centerLat = (ne.lat + sw.lat) / 2;
        bounds.extend([sw.lng, centerLat - MIN_SPAN / 2]);
        bounds.extend([ne.lng, centerLat + MIN_SPAN / 2]);
      }
      if (lngSpan < MIN_SPAN) {
        const centerLng = (ne.lng + sw.lng) / 2;
        bounds.extend([centerLng - MIN_SPAN / 2, sw.lat]);
        bounds.extend([centerLng + MIN_SPAN / 2, ne.lat]);
      }

      map.current.fitBounds(bounds, {
        padding: { top: 60, bottom: 100, left: 340, right: 60 },
        maxZoom: 12,
        duration: 1000,
      });
    } else if (stops.length === 1) {
      map.current.flyTo({
        center: [centerLongitude, centerLatitude],
        zoom: 13,
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

  // Route lines are disabled during explore stage — POIs have no meaningful
  // order yet. Lines will be drawn later when the user has a finalized itinerary.

  // Draw ideal hotel zone — uses IQR clustering to exclude outliers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const m = map.current;

    // Calculate hotel zone with clustering (handles outlier filtering)
    const zone = calculateHotelZone(favoriteStops);

    if (!zone) {
      // Not enough favorites — remove zone if it exists
      if (hotelZoneAdded.current) {
        try {
          if (m.getLayer('hotel-zone-glow')) m.removeLayer('hotel-zone-glow');
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

    const { centerLat, centerLng, radiusMeters } = zone;

    // Generate circle polygon (64 points)
    const numPoints = 64;
    const coords: [number, number][] = [];
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const dx = radiusMeters * Math.cos(angle);
      const dy = radiusMeters * Math.sin(angle);
      const lng = centerLng + (dx / (111320 * Math.cos(centerLat * Math.PI / 180)));
      const lat = centerLat + (dy / 111320);
      coords.push([lng, lat]);
    }

    // Outer glow ring (slightly larger)
    const glowRadius = radiusMeters * 1.15;
    const glowCoords: [number, number][] = [];
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const dx = glowRadius * Math.cos(angle);
      const dy = glowRadius * Math.sin(angle);
      const lng = centerLng + (dx / (111320 * Math.cos(centerLat * Math.PI / 180)));
      const lat = centerLat + (dy / 111320);
      glowCoords.push([lng, lat]);
    }

    const circleData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { ring: 'main' },
          geometry: { type: 'Polygon', coordinates: [coords] },
        },
        {
          type: 'Feature',
          properties: { ring: 'glow' },
          geometry: { type: 'Polygon', coordinates: [glowCoords] },
        },
      ],
    };

    const outlierNote = zone.clusteringApplied
      ? `🏨 Hotel zone · ${zone.outlierPoints.length} outlier${zone.outlierPoints.length > 1 ? 's' : ''} excluded`
      : '🏨 Ideal hotel zone';

    const labelData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { label: outlierNote },
        geometry: { type: 'Point', coordinates: [centerLng, centerLat] },
      }],
    };

    try {
      if (hotelZoneAdded.current) {
        const src = m.getSource('hotel-zone') as mapboxgl.GeoJSONSource;
        const labelSrc = m.getSource('hotel-zone-label') as mapboxgl.GeoJSONSource;
        if (src) src.setData(circleData);
        if (labelSrc) labelSrc.setData(labelData);
      } else {
        // Add source with both main circle and glow ring
        m.addSource('hotel-zone', { type: 'geojson', data: circleData });
        m.addSource('hotel-zone-label', { type: 'geojson', data: labelData });

        // Outer glow (subtle)
        m.addLayer({
          id: 'hotel-zone-glow',
          type: 'fill',
          source: 'hotel-zone',
          filter: ['==', ['get', 'ring'], 'glow'],
          paint: {
            'fill-color': '#a78bfa',
            'fill-opacity': 0.06,
          },
        });

        // Main fill — more visible
        m.addLayer({
          id: 'hotel-zone-fill',
          type: 'fill',
          source: 'hotel-zone',
          filter: ['==', ['get', 'ring'], 'main'],
          paint: {
            'fill-color': '#a78bfa',
            'fill-opacity': 0.15,
          },
        });

        // Dashed border — bolder
        m.addLayer({
          id: 'hotel-zone-border',
          type: 'line',
          source: 'hotel-zone',
          filter: ['==', ['get', 'ring'], 'main'],
          paint: {
            'line-color': '#a78bfa',
            'line-width': 2.5,
            'line-opacity': 0.65,
            'line-dasharray': [4, 3],
          },
        });

        // Label
        m.addLayer({
          id: 'hotel-zone-label',
          type: 'symbol',
          source: 'hotel-zone-label',
          layout: {
            'text-field': ['get', 'label'],
            'text-size': 12,
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
            'text-offset': [0, 0],
            'text-anchor': 'center',
            'text-allow-overlap': true,
          },
          paint: {
            'text-color': '#c4b5fd',
            'text-opacity': 0.9,
            'text-halo-color': '#1e1b4b',
            'text-halo-width': 1.5,
          },
        });

        hotelZoneAdded.current = true;
      }
    } catch (error) {
      console.error('Failed to add hotel zone:', error);
    }
  }, [favoriteStops, mapLoaded]);

  // Hotel nexus marker — glowing purple hub pin
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing hotel marker
    hotelMarkerRef.current?.remove();
    hotelMarkerRef.current = null;

    if (!hotelLocation) return;

    const el = document.createElement('div');
    el.className = 'animate-hotel-pulse';
    el.style.cssText = `
      width: 44px; height: 44px; border-radius: 50%;
      background: linear-gradient(135deg, #8b5cf6, #a78bfa);
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
      box-shadow: 0 0 0 6px rgba(139, 92, 246, 0.3), 0 0 20px rgba(139, 92, 246, 0.2), 0 4px 12px rgba(0,0,0,0.4);
      border: 3px solid rgba(255,255,255,0.95);
      cursor: default;
      z-index: 30;
    `;
    el.textContent = '\uD83C\uDFE8'; // 🏨

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([hotelLocation.longitude, hotelLocation.latitude])
      .addTo(map.current!);

    hotelMarkerRef.current = marker;
  }, [hotelLocation, mapLoaded]);

  // Cluster zone overlays — color-coded circles for smart planner
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const m = map.current;

    if (!clusterZones || clusterZones.length === 0) {
      // Remove cluster layers if they exist
      if (clusterZonesAdded.current) {
        try {
          if (m.getLayer('poi-clusters-label')) m.removeLayer('poi-clusters-label');
          if (m.getLayer('poi-clusters-border')) m.removeLayer('poi-clusters-border');
          if (m.getLayer('poi-clusters-fill')) m.removeLayer('poi-clusters-fill');
          if (m.getSource('poi-clusters')) m.removeSource('poi-clusters');
          clusterZonesAdded.current = false;
        } catch {
          // Ignore cleanup errors
        }
      }
      return;
    }

    // Generate circle polygons for each cluster
    const features: GeoJSON.Feature[] = clusterZones.map(zone => {
      const numPts = 48;
      const coords: [number, number][] = [];
      for (let i = 0; i <= numPts; i++) {
        const angle = (i / numPts) * 2 * Math.PI;
        const dx = zone.radiusMeters * Math.cos(angle);
        const dy = zone.radiusMeters * Math.sin(angle);
        const lng = zone.center.longitude + (dx / (111320 * Math.cos(zone.center.latitude * Math.PI / 180)));
        const lat = zone.center.latitude + (dy / 111320);
        coords.push([lng, lat]);
      }
      return {
        type: 'Feature' as const,
        properties: {
          color: zone.color,
          label: zone.label,
          clusterId: zone.id,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [coords],
        },
      };
    });

    // Label points at each cluster center
    const labelFeatures: GeoJSON.Feature[] = clusterZones.map(zone => ({
      type: 'Feature' as const,
      properties: {
        color: zone.color,
        label: zone.label,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [zone.center.longitude, zone.center.latitude],
      },
    }));

    const clusterData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [...features, ...labelFeatures],
    };

    try {
      if (clusterZonesAdded.current) {
        const src = m.getSource('poi-clusters') as mapboxgl.GeoJSONSource;
        if (src) src.setData(clusterData);
      } else {
        m.addSource('poi-clusters', { type: 'geojson', data: clusterData });

        // Fill — subtle transparent color
        m.addLayer({
          id: 'poi-clusters-fill',
          type: 'fill',
          source: 'poi-clusters',
          filter: ['==', ['geometry-type'], 'Polygon'],
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.08,
          },
        });

        // Border — dashed line
        m.addLayer({
          id: 'poi-clusters-border',
          type: 'line',
          source: 'poi-clusters',
          filter: ['==', ['geometry-type'], 'Polygon'],
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 2,
            'line-opacity': 0.4,
            'line-dasharray': [3, 2],
          },
        });

        // Labels at cluster centers
        m.addLayer({
          id: 'poi-clusters-label',
          type: 'symbol',
          source: 'poi-clusters',
          filter: ['==', ['geometry-type'], 'Point'],
          layout: {
            'text-field': ['get', 'label'],
            'text-size': 11,
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
            'text-anchor': 'center',
            'text-allow-overlap': true,
          },
          paint: {
            'text-color': ['get', 'color'],
            'text-opacity': 0.7,
            'text-halo-color': '#1a1a2e',
            'text-halo-width': 1.5,
          },
        });

        clusterZonesAdded.current = true;
      }
    } catch (error) {
      console.error('Failed to add cluster zones:', error);
    }
  }, [clusterZones, mapLoaded]);

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
    <div className="relative" style={{ width: '100%', height: '100%' }}>
      <div ref={mapContainer} className={`${className}`} style={{ width: '100%', height: '100%' }} />
      {offScreenCount > 0 && (
        <div className="absolute top-28 right-3 z-10 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-white/80 text-xs font-medium flex items-center gap-1.5 shadow-lg">
          <span className="text-amber-400">+{offScreenCount}</span> more off-screen
          <span className="text-white/40">↗</span>
        </div>
      )}
    </div>
  );
}
