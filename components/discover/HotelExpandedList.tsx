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
type SortOption = 'distance' | 'price_asc' | 'price_desc' | 'rating' | 'stars';

function formatDistance(meters: number | undefined): string {
  if (!meters) return '';
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

/** Build dynamic price buckets from actual hotel data */
function buildPriceRanges(hotels: HotelOption[]): { min: number; max: number; label: string }[] {
  if (hotels.length === 0) return [{ min: 0, max: Infinity, label: 'All prices' }];

  const prices = hotels.map(h => h.pricePerNight).sort((a, b) => a - b);
  const minPrice = prices[0];
  const maxPrice = prices[prices.length - 1];
  const spread = maxPrice - minPrice;

  // Always include "All prices"
  const ranges: { min: number; max: number; label: string }[] = [
    { min: 0, max: Infinity, label: 'All prices' },
  ];

  if (spread < 30) return ranges; // prices too similar, just show "All"

  // Create 3 buckets: lower third, middle third, upper third
  const third = Math.round(spread / 3);
  const low = Math.round(minPrice + third);
  const high = Math.round(minPrice + third * 2);

  // Round to nearest $10 for cleaner labels
  const lowRound = Math.round(low / 10) * 10;
  const highRound = Math.round(high / 10) * 10;

  ranges.push({ min: 0, max: lowRound, label: `Under $${lowRound}` });
  ranges.push({ min: lowRound, max: highRound, label: `$${lowRound} – $${highRound}` });
  ranges.push({ min: highRound, max: Infinity, label: `$${highRound}+` });

  return ranges;
}

/** Get unique star levels present in hotels */
function getStarOptions(hotels: HotelOption[]): number[] {
  const stars = new Set(hotels.map(h => h.stars));
  const sorted = Array.from(stars).sort((a, b) => a - b);
  // Return unique levels >= 1 that make sense as "X+"
  return sorted.filter(s => s >= 1);
}

export function HotelExpandedList({
  hotels,
  landmarkLat,
  landmarkLng,
  onSelectHotel,
  onClose,
}: HotelExpandedListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [starFilter, setStarFilter] = useState(0);
  const [priceRangeIdx, setPriceRangeIdx] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [selectedMapHotelId, setSelectedMapHotelId] = useState<string | undefined>();

  // Dynamic price ranges based on actual hotel data
  const priceRanges = useMemo(() => buildPriceRanges(hotels), [hotels]);
  const priceRange = priceRanges[priceRangeIdx] || priceRanges[0];

  // Star options present in the data
  const starOptions = useMemo(() => getStarOptions(hotels), [hotels]);

  // Filter + sort hotels
  const filteredHotels = useMemo(() => {
    let filtered = hotels.filter(h => {
      if (starFilter > 0 && h.stars < starFilter) return false;
      if (h.pricePerNight < priceRange.min || h.pricePerNight >= priceRange.max) return false;
      return true;
    });

    // Sort
    filtered = [...filtered];
    switch (sortBy) {
      case 'distance':
        filtered.sort((a, b) => (a.distanceFromZoneCenter ?? Infinity) - (b.distanceFromZoneCenter ?? Infinity));
        break;
      case 'price_asc':
        filtered.sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.pricePerNight - a.pricePerNight);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'stars':
        filtered.sort((a, b) => b.stars - a.stars || (b.rating || 0) - (a.rating || 0));
        break;
    }

    return filtered;
  }, [hotels, starFilter, priceRange, sortBy]);

  const handleMapHotelClick = useCallback((hotelId: string) => {
    setSelectedMapHotelId(hotelId);
    const el = document.getElementById(`hotel-card-${hotelId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <div className="mt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {filteredHotels.length} hotels available
          </h3>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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

      {/* Filter + sort bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="distance">Nearest first</option>
          <option value="price_asc">Price: low → high</option>
          <option value="price_desc">Price: high → low</option>
          <option value="rating">Best rated</option>
          <option value="stars">Most stars</option>
        </select>

        {/* Price range (dynamic) */}
        {priceRanges.length > 1 && (
          <select
            value={priceRangeIdx}
            onChange={(e) => setPriceRangeIdx(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
          >
            {priceRanges.map((range, idx) => (
              <option key={idx} value={idx}>{range.label}</option>
            ))}
          </select>
        )}

        {/* Star filter — show only stars that exist in the data */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setStarFilter(0)}
            className={`px-2.5 py-1.5 text-sm rounded-lg border transition-colors ${
              starFilter === 0
                ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {starOptions.map(stars => (
            <button
              key={stars}
              onClick={() => setStarFilter(stars === starFilter ? 0 : stars)}
              className={`px-2.5 py-1.5 text-sm rounded-lg border transition-colors ${
                starFilter === stars
                  ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {stars}★+
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'map' ? (
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
