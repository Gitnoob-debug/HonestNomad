'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { HotelOption } from '@/lib/liteapi/types';
import type { MatchedDestination } from '@/types/location';
import type { FeaturedHotels } from '@/lib/hotels/categorize';
import { SearchControls } from '@/components/discover/SearchControls';
import { HotelTileGrid } from '@/components/discover/HotelTileGrid';
import { HotelExpandedList } from '@/components/discover/HotelExpandedList';

// ── Discover Hotels Page ──────────────────────────────────────────
// Step 2 of the Discover flow: Photo → Destination tiles → **Hotels** → Rooms → Checkout
// Desktop: sticky left sidebar with controls, right side for hotel tiles/map
// Mobile: controls at top with collapsible filters

type ViewMode = 'list' | 'map';
type SortOption = 'distance' | 'price_asc' | 'price_desc' | 'rating' | 'stars';

interface SearchState {
  hotels: HotelOption[];
  featured: FeaturedHotels | null;
  radiusUsed: number;
  fallbackUsed: boolean;
}

// ── Filter utilities (lifted from HotelExpandedList) ──────────────

function buildPriceRanges(hotels: HotelOption[]): { min: number; max: number; label: string }[] {
  if (hotels.length === 0) return [{ min: 0, max: Infinity, label: 'All prices' }];

  const prices = hotels.map(h => h.pricePerNight).sort((a, b) => a - b);
  const minPrice = prices[0];
  const maxPrice = prices[prices.length - 1];
  const spread = maxPrice - minPrice;

  const ranges: { min: number; max: number; label: string }[] = [
    { min: 0, max: Infinity, label: 'All prices' },
  ];

  if (spread < 30) return ranges;

  const third = Math.round(spread / 3);
  const low = Math.round(minPrice + third);
  const high = Math.round(minPrice + third * 2);
  const lowRound = Math.round(low / 10) * 10;
  const highRound = Math.round(high / 10) * 10;

  ranges.push({ min: 0, max: lowRound, label: `Under $${lowRound}` });
  ranges.push({ min: lowRound, max: highRound, label: `$${lowRound} – $${highRound}` });
  ranges.push({ min: highRound, max: Infinity, label: `$${highRound}+` });

  return ranges;
}

function getStarOptions(hotels: HotelOption[]): number[] {
  const stars = new Set(hotels.map(h => h.stars));
  return Array.from(stars).sort((a, b) => a - b).filter(s => s >= 1);
}

function filterAndSortHotels(
  hotels: HotelOption[],
  starFilter: number,
  priceRange: { min: number; max: number },
  sortBy: SortOption,
): HotelOption[] {
  let filtered = hotels.filter(h => {
    if (starFilter > 0 && h.stars < starFilter) return false;
    if (h.pricePerNight < priceRange.min || h.pricePerNight >= priceRange.max) return false;
    return true;
  });

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
}

// ── Filter Controls (shared between sidebar and mobile) ──────────

function FilterControls({
  sortBy,
  onSortChange,
  priceRanges,
  priceRangeIdx,
  onPriceRangeChange,
  starOptions,
  starFilter,
  onStarFilterChange,
  viewMode,
  onViewModeChange,
  filteredCount,
  layout,
}: {
  sortBy: SortOption;
  onSortChange: (v: SortOption) => void;
  priceRanges: { min: number; max: number; label: string }[];
  priceRangeIdx: number;
  onPriceRangeChange: (idx: number) => void;
  starOptions: number[];
  starFilter: number;
  onStarFilterChange: (stars: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  filteredCount: number;
  layout: 'sidebar' | 'inline';
}) {
  const isSidebar = layout === 'sidebar';

  return (
    <div className={isSidebar ? 'space-y-4' : 'flex flex-wrap items-center gap-2'}>
      {/* Sort */}
      <div className={isSidebar ? '' : ''}>
        {isSidebar && (
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Sort by</label>
        )}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="distance">Nearest first</option>
          <option value="price_asc">Price: low &rarr; high</option>
          <option value="price_desc">Price: high &rarr; low</option>
          <option value="rating">Best rated</option>
          <option value="stars">Most stars</option>
        </select>
      </div>

      {/* Price range */}
      {priceRanges.length > 1 && (
        <div>
          {isSidebar && (
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Price range</label>
          )}
          <select
            value={priceRangeIdx}
            onChange={(e) => onPriceRangeChange(Number(e.target.value))}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
          >
            {priceRanges.map((range, idx) => (
              <option key={idx} value={idx}>{range.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Star filter */}
      <div>
        {isSidebar && (
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Stars</label>
        )}
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => onStarFilterChange(0)}
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
              onClick={() => onStarFilterChange(stars === starFilter ? 0 : stars)}
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

      {/* View toggle */}
      <div>
        {isSidebar && (
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">View</label>
        )}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => onViewModeChange('list')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            List
          </button>
          <button
            onClick={() => onViewModeChange('map')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Map
          </button>
        </div>
      </div>

      {/* Result count (sidebar only) */}
      {isSidebar && (
        <p className="text-xs text-gray-500 pt-1">
          {filteredCount} {filteredCount === 1 ? 'hotel' : 'hotels'} match
        </p>
      )}
    </div>
  );
}

// ── Page Component ─────────────────────────────────────────────────

export default function DiscoverHotelsPage() {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────
  const [destination, setDestination] = useState<MatchedDestination | null>(null);
  const [landmarkCoords, setLandmarkCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [guests, setGuests] = useState<{ adults: number; children: number[] }>({ adults: 2, children: [] });
  const [searchState, setSearchState] = useState<SearchState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExpanded, setShowExpanded] = useState(false);

  // Filter + sort state (lifted from HotelExpandedList)
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [starFilter, setStarFilter] = useState(0);
  const [priceRangeIdx, setPriceRangeIdx] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // ── Derived filter data ────────────────────────────────────────
  const allHotels = searchState?.hotels || [];
  const priceRanges = useMemo(() => buildPriceRanges(allHotels), [allHotels]);
  const priceRange = priceRanges[priceRangeIdx] || priceRanges[0];
  const starOptions = useMemo(() => getStarOptions(allHotels), [allHotels]);

  const filteredHotels = useMemo(
    () => filterAndSortHotels(allHotels, starFilter, priceRange, sortBy),
    [allHotels, starFilter, priceRange, sortBy],
  );

  // Reset filters when hotel data changes
  useEffect(() => {
    setStarFilter(0);
    setPriceRangeIdx(0);
  }, [allHotels]);

  // ── Hydrate from sessionStorage ────────────────────────────────
  useEffect(() => {
    try {
      const destStr = sessionStorage.getItem('discover_destination');
      const coordsStr = sessionStorage.getItem('discover_landmark_coords');
      const checkinStr = sessionStorage.getItem('discover_checkin');
      const checkoutStr = sessionStorage.getItem('discover_checkout');
      const guestsStr = sessionStorage.getItem('discover_guests');

      if (!destStr || !coordsStr || !checkinStr || !checkoutStr) {
        router.replace('/discover');
        return;
      }

      const dest: MatchedDestination = JSON.parse(destStr);
      const coords: { lat: number; lng: number } = JSON.parse(coordsStr);
      const guestsParsed = guestsStr ? JSON.parse(guestsStr) : { adults: 2, children: [] };

      setDestination(dest);
      setLandmarkCoords(coords);
      setCheckin(checkinStr);
      setCheckout(checkoutStr);
      setGuests(guestsParsed);
    } catch {
      router.replace('/discover');
    }
  }, [router]);

  // ── Search hotels when we have all required data ───────────────
  const searchHotels = useCallback(async (
    coords: { lat: number; lng: number },
    checkinDate: string,
    checkoutDate: string,
    guestData: { adults: number; children: number[] },
    dest: MatchedDestination
  ) => {
    setLoading(true);
    setError(null);
    setShowExpanded(false);

    try {
      const response = await fetch('/api/hotels/discover-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lng,
          checkin: checkinDate,
          checkout: checkoutDate,
          adults: guestData.adults,
          children: guestData.children,
          cityName: dest.city,
          countryCode: dest.country,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search hotels');
      }

      const data = await response.json();

      setSearchState({
        hotels: data.hotels || [],
        featured: data.featured || null,
        radiusUsed: data.searchParams?.radiusUsed || 0,
        fallbackUsed: data.searchParams?.fallbackUsed || false,
      });
    } catch (err) {
      console.error('Hotel search error:', err);
      setError('Unable to find hotels. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger search when data is ready
  useEffect(() => {
    if (landmarkCoords && checkin && checkout && destination) {
      searchHotels(landmarkCoords, checkin, checkout, guests, destination);
    }
  }, [landmarkCoords, checkin, checkout, destination, guests, searchHotels]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleSearchUpdate = useCallback((params: {
    checkin: string;
    checkout: string;
    adults: number;
    children: number[];
  }) => {
    setCheckin(params.checkin);
    setCheckout(params.checkout);
    setGuests({ adults: params.adults, children: params.children });

    sessionStorage.setItem('discover_checkin', params.checkin);
    sessionStorage.setItem('discover_checkout', params.checkout);
    sessionStorage.setItem('discover_guests', JSON.stringify({
      adults: params.adults,
      children: params.children,
    }));
  }, []);

  const handleSelectHotel = useCallback((hotel: HotelOption) => {
    sessionStorage.setItem('discover_selected_hotel', JSON.stringify(hotel));
    router.push('/discover/rooms');
  }, [router]);

  const handleBack = useCallback(() => {
    router.push('/discover');
  }, [router]);

  // ── Location label ─────────────────────────────────────────────
  const locationLabel = searchState?.fallbackUsed
    ? `Hotels in ${destination?.city || 'this area'}`
    : `Hotels near your spot in ${destination?.city || 'this area'}`;

  const hasHotels = !loading && !error && searchState && allHotels.length > 0;

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back navigation */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
        >
          <span>&larr;</span>
          <span>Back to destinations</span>
        </button>

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {destination ? `${destination.city}, ${destination.country}` : 'Finding hotels...'}
          </h1>
          {!loading && searchState && (
            <p className="text-gray-500 mt-1">{locationLabel}</p>
          )}
        </div>

        {/* Two-column layout: sidebar + main */}
        <div className="lg:flex lg:gap-6">

          {/* ── Desktop sidebar (hidden on mobile) ── */}
          {checkin && checkout && (
            <aside className="hidden lg:block lg:w-72 lg:flex-shrink-0">
              <div className="sticky top-6 space-y-4">
                <SearchControls
                  checkin={checkin}
                  checkout={checkout}
                  adults={guests.adults}
                  children={guests.children}
                  onUpdate={handleSearchUpdate}
                  isLoading={loading}
                  layout="vertical"
                />

                {hasHotels && (
                  <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                    <FilterControls
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                      priceRanges={priceRanges}
                      priceRangeIdx={priceRangeIdx}
                      onPriceRangeChange={setPriceRangeIdx}
                      starOptions={starOptions}
                      starFilter={starFilter}
                      onStarFilterChange={setStarFilter}
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                      filteredCount={filteredHotels.length}
                      layout="sidebar"
                    />
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* ── Mobile controls (hidden on desktop) ── */}
          {checkin && checkout && (
            <div className="lg:hidden mb-4 space-y-2">
              <SearchControls
                checkin={checkin}
                checkout={checkout}
                adults={guests.adults}
                children={guests.children}
                onUpdate={handleSearchUpdate}
                isLoading={loading}
              />

              {hasHotels && (
                <>
                  <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="flex items-center gap-1.5 text-sm text-gray-600 font-medium px-3 py-2 bg-white rounded-lg border border-gray-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                    </svg>
                    Filters &amp; Sort
                    <span className="text-xs text-gray-400">
                      {showMobileFilters ? '▲' : '▼'}
                    </span>
                  </button>

                  {showMobileFilters && (
                    <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                      <FilterControls
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                        priceRanges={priceRanges}
                        priceRangeIdx={priceRangeIdx}
                        onPriceRangeChange={setPriceRangeIdx}
                        starOptions={starOptions}
                        starFilter={starFilter}
                        onStarFilterChange={setStarFilter}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        filteredCount={filteredHotels.length}
                        layout="inline"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Main content area ── */}
          <main className="flex-1 min-w-0">
            {/* Loading state */}
            {loading && (
              <div className="py-20 text-center">
                <div className="inline-flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-600">Searching hotels near your spot...</span>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div className="py-20 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => landmarkCoords && destination && searchHotels(landmarkCoords, checkin, checkout, guests, destination)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Results */}
            {!loading && !error && searchState && (
              <>
                {/* No results */}
                {allHotels.length === 0 && (
                  <div className="py-20 text-center">
                    <p className="text-gray-600 text-lg mb-2">No hotels found nearby</p>
                    <p className="text-gray-500 text-sm">Try adjusting your dates or go back to explore other destinations.</p>
                  </div>
                )}

                {/* Map view — skip featured tiles, show full list + map */}
                {viewMode === 'map' && allHotels.length > 0 && (
                  <HotelExpandedList
                    hotels={filteredHotels}
                    landmarkLat={landmarkCoords?.lat || 0}
                    landmarkLng={landmarkCoords?.lng || 0}
                    viewMode="map"
                    onSelectHotel={handleSelectHotel}
                    onClose={() => {}}
                  />
                )}

                {/* List view — show featured tiles + expandable full list */}
                {viewMode === 'list' && (
                  <>
                    {/* Featured 3 tiles */}
                    {searchState.featured && (
                      <>
                        <HotelTileGrid
                          featured={searchState.featured}
                          landmarkLat={landmarkCoords?.lat || 0}
                          landmarkLng={landmarkCoords?.lng || 0}
                          onSelectHotel={handleSelectHotel}
                        />

                        {/* See more / collapse toggle */}
                        {allHotels.length > 3 && (
                          <div className="text-center mt-6">
                            <button
                              onClick={() => setShowExpanded(!showExpanded)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
                            >
                              {showExpanded ? (
                                <>
                                  Hide full list
                                  <span className="text-xs">&uarr;</span>
                                </>
                              ) : (
                                <>
                                  See all {filteredHotels.length} hotels
                                  <span className="text-xs">&darr;</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Not enough for featured tiles but have some results */}
                    {!searchState.featured && allHotels.length > 0 && (
                      <HotelExpandedList
                        hotels={filteredHotels}
                        landmarkLat={landmarkCoords?.lat || 0}
                        landmarkLng={landmarkCoords?.lng || 0}
                        viewMode="list"
                        onSelectHotel={handleSelectHotel}
                        onClose={() => {}}
                      />
                    )}

                    {/* Expanded list — appears BELOW the featured tiles */}
                    {showExpanded && searchState.featured && (
                      <HotelExpandedList
                        hotels={filteredHotels}
                        landmarkLat={landmarkCoords?.lat || 0}
                        landmarkLng={landmarkCoords?.lng || 0}
                        viewMode="list"
                        onSelectHotel={handleSelectHotel}
                        onClose={() => setShowExpanded(false)}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
