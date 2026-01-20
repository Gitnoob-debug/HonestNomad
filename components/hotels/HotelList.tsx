'use client';

import { HotelCard } from './HotelCard';
import type { NormalizedHotel } from '@/types/hotel';

interface HotelListProps {
  hotels: NormalizedHotel[];
  onSelect: (id: string) => void;
}

export function HotelList({ hotels, onSelect }: HotelListProps) {
  if (hotels.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hotels found matching your criteria.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {hotels.map((hotel, index) => (
        <HotelCard
          key={hotel.id}
          hotel={hotel}
          index={index}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
