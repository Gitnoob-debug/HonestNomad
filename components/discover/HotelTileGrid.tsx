'use client';

import type { HotelOption } from '@/lib/liteapi/types';
import { HotelTile } from './HotelTile';
import type { FeaturedHotels } from '@/lib/hotels/categorize';

interface HotelTileGridProps {
  featured: FeaturedHotels;
  landmarkLat: number;
  landmarkLng: number;
  onSelectHotel: (hotel: HotelOption) => void;
}

export function HotelTileGrid({ featured, landmarkLat, landmarkLng, onSelectHotel }: HotelTileGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <HotelTile
        hotel={featured.closest}
        role="closest"
        label="Closest to Spot"
        landmarkLat={landmarkLat}
        landmarkLng={landmarkLng}
        onSelect={onSelectHotel}
      />
      <HotelTile
        hotel={featured.budget}
        role="budget"
        label="Best Value"
        landmarkLat={landmarkLat}
        landmarkLng={landmarkLng}
        onSelect={onSelectHotel}
      />
      <HotelTile
        hotel={featured.highEnd}
        role="high_end"
        label="Premium Pick"
        landmarkLat={landmarkLat}
        landmarkLng={landmarkLng}
        onSelect={onSelectHotel}
      />
    </div>
  );
}
