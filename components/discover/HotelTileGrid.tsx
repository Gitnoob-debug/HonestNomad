'use client';

import type { HotelOption } from '@/lib/liteapi/types';
import { HotelTile } from './HotelTile';
import type { FeaturedHotels } from '@/lib/hotels/categorize';

// ── HotelTileGrid ─────────────────────────────────────────────────
// Featured layout: Recommended (Closest) takes 2/3 of the width on
// desktop with a tall image, while Budget and High-End stack in the
// remaining column. Mobile: recommended full-width on top, alternatives below.
//
// Desktop layout:
// ┌──────────────────┬──────────┐
// │                  │  Budget  │
// │  Recommended     │  (Best   │
// │  (Closest)       │  Value)  │
// │                  ├──────────┤
// │  col-span-2      │ High-End │
// │  row-span-2      │ (Premium │
// │                  │  Pick)   │
// └──────────────────┴──────────┘

interface HotelTileGridProps {
  featured: FeaturedHotels;
  landmarkLat: number;
  landmarkLng: number;
  onSelectHotel: (hotel: HotelOption) => void;
}

export function HotelTileGrid({ featured, landmarkLat, landmarkLng, onSelectHotel }: HotelTileGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Recommended tile — full width on mobile, col-span-2 on desktop */}
      <div className="sm:col-span-2 sm:row-span-2">
        <HotelTile
          hotel={featured.closest}
          role="closest"
          label="Closest to Spot"
          landmarkLat={landmarkLat}
          landmarkLng={landmarkLng}
          onSelect={onSelectHotel}
          isRecommended
        />
      </div>

      {/* Alternative: Budget */}
      <div>
        <HotelTile
          hotel={featured.budget}
          role="budget"
          label="Best Value"
          landmarkLat={landmarkLat}
          landmarkLng={landmarkLng}
          onSelect={onSelectHotel}
        />
      </div>

      {/* Alternative: High-End */}
      <div>
        <HotelTile
          hotel={featured.highEnd}
          role="high_end"
          label="Premium Pick"
          landmarkLat={landmarkLat}
          landmarkLng={landmarkLng}
          onSelect={onSelectHotel}
        />
      </div>
    </div>
  );
}
