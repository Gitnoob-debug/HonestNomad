'use client';

import dynamic from 'next/dynamic';

// Leaflet doesn't work with SSR, so use dynamic import
export const HotelMap = dynamic(
  () => import('./HotelMap').then((mod) => mod.HotelMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-gray-400">Loading map...</span>
      </div>
    ),
  }
);
