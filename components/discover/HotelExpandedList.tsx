'use client';

import { useState, useMemo, useCallback } from 'react';
import type { HotelOption } from '@/lib/liteapi/types';
import { HotelMapView } from './HotelMapView';

interface HotelExpandedListProps {
  hotels: HotelOption[];
  landmarkLat: number;
  landmarkLng: number;
  onSelectHotel: (hotel: HotelOption) => void;
  onClose: () => void;
}

type ViewMode = 'list' | 'map';
type StarFilter = 0 | 3 | 4 | 5; // 0 = all

interface PriceRange {
  min: number;
  max: number;
  label: string;
}

const PRICE_RANGES: PriceRange[] = [
  { min: 0, max: Infinity, label: 'All prices' },
  { min: 0, max: 100, label: 'Under $100' },
  { min: 100, max: 200, label: '$100 - $200' },
  { min: 200, max: 350, label: '$200 - $350' },
  { min: 350, max: Infinity, label: '$350+' },
];

function formatDistance(meters: number | undefined): string {
  if (!meters) return '';
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function HotelExpandedList({
  hotels,
  landmarkLat,
  landmarkLng,
  onSelectHotel,
  onClose,
}: HotelExpandedListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [starFilter, setStarFilter] = useState<StarFilter>(0);
  const [priceRangeIdx, setPriceRangeIdx] = useState(0);
  const [selectedMapHotelId, setSelectedMapHotelId] = useState<string | undefined>();

  const priceRange = PRICE_RANGES[priceRangeIdx];

  // Filter hotels
  const filteredHotels = useMemo(() => {
    return hotels.filter(h => {
      if (starFilter > 0 && h.stars < starFilter) return false;
      if (h.pricePerNight < priceRange.min || h.pricePerNight >= priceRange.max) return false;
      return true;
    });
  }, [hotels, starFilter, priceRange]);

  const handleMapHotelClick = useCallback((hotelId: string) => {
    setSelectedMapHotelId(hotelId);
    // Scroll the list card into view if in split view
    const el = document.getElementById(`hotel-card-${hotelId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <div className="mt-4">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {filteredHotels.length} hotels available
          </h3>
          <button
            onClick={() => {
              // Scroll back up to the featured tiles
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            ↑ Top picks
          </button>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Map
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Price range */}
        <select
          value={priceRangeIdx}
          onChange={(e) => setPriceRangeIdx(Number(e.target.value))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
        >
          {PRICE_RANGES.map((range, idx) => (
            <option key={idx} value={idx}>{range.label}</option>
          ))}
        </select>

        {/* Star rating filter */}
        <div className="flex items-center gap-1">
          {([0, 3, 4, 5] as StarFilter[]).map(stars => (
            <button
              key={stars}
              onClick={() => setStarFilter(stars)}
              className={`px-2.5 py-1.5 text-sm rounded-lg border transition-colors ${
                starFilter === stars
                  ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {stars === 0 ? 'All stars' : `${stars}★+`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'map' ? (
        /* Map view with hotel list sidebar */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 max-h-[600px] overflow-y-auto space-y-2">
            {filteredHotels.map((hotel, idx) => (
              <HotelListCard
                key={hotel.id}
                hotel={hotel}
                index={idx + 1}
                isSelected={hotel.id === selectedMapHotelId}
                onSelect={() => onSelectHotel(hotel)}
                onClick={() => setSelectedMapHotelId(hotel.id)}
              />
            ))}
            {filteredHotels.length === 0 && (
              <p className="text-gray-500 text-sm py-8 text-center">No hotels match your filters</p>
            )}
          </div>
          <div className="lg:col-span-3">
            <HotelMapView
              hotels={filteredHotels}
              landmarkLat={landmarkLat}
              landmarkLng={landmarkLng}
              selectedHotelId={selectedMapHotelId}
              onHotelClick={handleMapHotelClick}
              className="h-[600px]"
            />
          </div>
        </div>
      ) : (
        /* List view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredHotels.map((hotel, idx) => (
            <HotelListCard
              key={hotel.id}
              hotel={hotel}
              index={idx + 1}
              onSelect={() => onSelectHotel(hotel)}
            />
          ))}
          {filteredHotels.length === 0 && (
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

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">
            {formatDistance(hotel.distanceFromZoneCenter)} from spot
          </span>
          <span className="text-xs text-primary-600 font-medium">
            Book &rarr;
          </span>
        </div>
      </div>
    </div>
  );
}
