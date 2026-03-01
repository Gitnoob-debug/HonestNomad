'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { HotelOption } from '@/lib/liteapi/types';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface HotelMapViewProps {
  hotels: HotelOption[];
  landmarkLat: number;
  landmarkLng: number;
  selectedHotelId?: string;
  onHotelClick: (hotelId: string) => void;
  className?: string;
}

export function HotelMapView({
  hotels,
  landmarkLat,
  landmarkLng,
  selectedHotelId,
  onHotelClick,
  className = '',
}: HotelMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [landmarkLng, landmarkLat],
      zoom: 13,
      attributionControl: false,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'top-right'
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [landmarkLat, landmarkLng]);

  // Update markers when hotels change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Wait for map to be ready
    const addMarkers = () => {
      // Clear existing markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // Add landmark marker (red pin)
      const landmarkEl = document.createElement('div');
      landmarkEl.style.cssText = `
        width: 36px; height: 36px; border-radius: 50%;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 4px rgba(239, 68, 68, 0.2);
        display: flex; align-items: center; justify-content: center;
        font-size: 16px; cursor: default;
      `;
      landmarkEl.textContent = '📍';
      landmarkEl.title = 'Photo location';

      const landmarkMarker = new mapboxgl.Marker({ element: landmarkEl })
        .setLngLat([landmarkLng, landmarkLat])
        .addTo(map);
      markersRef.current.push(landmarkMarker);

      // Add hotel markers (blue numbered pins)
      hotels.forEach((hotel, index) => {
        const isSelected = hotel.id === selectedHotelId;

        const el = document.createElement('div');
        const size = isSelected ? 40 : 32;
        el.style.cssText = `
          width: ${size}px; height: ${size}px; border-radius: 50%;
          background: ${isSelected
            ? 'linear-gradient(135deg, #2563eb, #3b82f6)'
            : 'linear-gradient(135deg, #3b82f6, #60a5fa)'};
          border: ${isSelected ? '3px' : '2px'} solid white;
          box-shadow: ${isSelected
            ? '0 0 0 4px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.3)'
            : '0 2px 6px rgba(0,0,0,0.25)'};
          display: flex; align-items: center; justify-content: center;
          font-size: ${isSelected ? '14px' : '12px'}; font-weight: 700;
          color: white; cursor: pointer;
          transition: all 0.2s ease;
          z-index: ${isSelected ? 10 : 1};
        `;
        el.textContent = String(index + 1);
        el.title = hotel.name;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onHotelClick(hotel.id);
        });

        // Hover effect
        el.addEventListener('mouseenter', () => {
          if (!isSelected) {
            el.style.transform = 'scale(1.15)';
            el.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(0,0,0,0.3)';
          }
        });
        el.addEventListener('mouseleave', () => {
          if (!isSelected) {
            el.style.transform = 'scale(1)';
            el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)';
          }
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([hotel.longitude, hotel.latitude])
          .addTo(map);
        markersRef.current.push(marker);
      });

      // Fit bounds to show all markers
      if (hotels.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([landmarkLng, landmarkLat]);
        hotels.forEach(h => bounds.extend([h.longitude, h.latitude]));

        map.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 15,
        });
      }
    };

    if (map.loaded()) {
      addMarkers();
    } else {
      map.on('load', addMarkers);
    }
  }, [hotels, selectedHotelId, landmarkLat, landmarkLng, onHotelClick]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full rounded-xl overflow-hidden ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
}
