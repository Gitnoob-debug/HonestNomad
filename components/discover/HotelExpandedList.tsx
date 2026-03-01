'use client';

import { useState, useCallback } from 'react';
import type { HotelOption } from '@/lib/liteapi/types';
import { HotelMapView } from './HotelMapView';

interface HotelExpandedListProps {
  hotels: HotelOption[];
  landmarkLat: number;
  landmarkLng: number;
  viewMode: 'list' | 'map';
  onSelectHotel: (hotel: HotelOption) => void;
  onClose: () => void;
}

function formatDistance(meters: number | undefined): string {
  if (!meters) return '';
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function HotelExpandedList({
  hotels,
  landmarkLat,
  landmarkLng,
  viewMode,
  onSelectHotel,
  onClose,
}: HotelExpandedListProps) {
  const [selectedMapHotelId, setSelectedMapHotelId] = useState<string | undefined>();

  const handleMapHotelClick = useCallback((hotelId: string) => {
    setSelectedMapHotelId(hotelId);
    const el = document.getElementById(`hotel-card-${hotelId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <div className="mt-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {hotels.length} hotels available
        </h3>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          &uarr; Top picks
        </button>
      </div>

      {/* Content */}
      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 max-h-[600px] overflow-y-auto space-y-2">
            {hotels.map((hotel, idx) => (
              <HotelListCard
                key={hotel.id}
                hotel={hotel}
                index={idx + 1}
                isSelected={hotel.id === selectedMapHotelId}
                onSelect={() => onSelectHotel(hotel)}
                onClick={() => setSelectedMapHotelId(hotel.id)}
              />
            ))}
            {hotels.length === 0 && (
              <p className="text-gray-500 text-sm py-8 text-center">No hotels match your filters</p>
            )}
          </div>
          <div className="lg:col-span-3">
            <HotelMapView
              hotels={hotels}
              landmarkLat={landmarkLat}
              landmarkLng={landmarkLng}
              selectedHotelId={selectedMapHotelId}
              onHotelClick={handleMapHotelClick}
              className="h-[600px]"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {hotels.map((hotel, idx) => (
            <HotelListCard
              key={hotel.id}
              hotel={hotel}
              index={idx + 1}
              onSelect={() => onSelectHotel(hotel)}
            />
          ))}
          {hotels.length === 0 && (
            <p className="text-gray-500 text-sm py-8 text-center col-span-full">No hotels match your filters</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Compact hotel card for list/map views ─────────────────────────

interface HotelListCardProps {
  hotel: HotelOption;
  index: number;
  isSelected?: boolean;
  onSelect: () => void;
  onClick?: () => void;
}

function HotelListCard({ hotel, index, isSelected = false, onSelect, onClick }: HotelListCardProps) {
  return (
    <div
      id={`hotel-card-${hotel.id}`}
      onClick={() => {
        if (onClick) onClick();
        onSelect();
      }}
      className={`bg-white rounded-xl border overflow-hidden cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-primary-400 ring-2 ring-primary-100 shadow-md' : 'border-gray-200'
      }`}
    >
      {/* Image */}
      <div className="relative h-36">
        {(hotel.mainPhoto || (hotel.photos && hotel.photos[0])) ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={hotel.mainPhoto || hotel.photos[0]}
            alt={hotel.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 flex items-center justify-center">
            <span className="text-3xl">🏨</span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            #{index}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <span className="bg-black/60 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            ${hotel.pricePerNight}/night
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-yellow-500 text-xs">{'★'.repeat(hotel.stars)}</span>
          {hotel.rating > 0 && (
            <span className="text-xs text-gray-500 ml-1">
              {hotel.rating.toFixed(1)} ({hotel.reviewCount})
            </span>
          )}
        </div>

        <h4 className="text-sm font-semibold text-gray-900 truncate">{hotel.name}</h4>

        {/* Chain name */}
        {hotel.chain && (
          <p className="text-[11px] text-gray-400 truncate">{hotel.chain}</p>
        )}

        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatDistance(hotel.distanceFromZoneCenter)} from spot
            </span>
            {/* Cancel badge */}
            {hotel.cancelDeadline ? (
              <span className="text-[10px] text-green-600 font-medium truncate">
                ✓ Free cancel
              </span>
            ) : hotel.refundable === false ? (
              <span className="text-[10px] text-red-500 font-medium flex-shrink-0">
                Non-refundable
              </span>
            ) : null}
          </div>
          <span className="text-xs text-primary-600 font-medium flex-shrink-0">
            Book &rarr;
          </span>
        </div>
      </div>
    </div>
  );
}
