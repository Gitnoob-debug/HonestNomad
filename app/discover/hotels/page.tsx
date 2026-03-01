'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { HotelOption } from '@/lib/liteapi/types';
import type { MatchedDestination } from '@/types/location';
import type { FeaturedHotels } from '@/lib/hotels/categorize';
import { SearchControls } from '@/components/discover/SearchControls';
import { HotelTileGrid } from '@/components/discover/HotelTileGrid';
import { HotelExpandedList } from '@/components/discover/HotelExpandedList';

// ── Discover Hotels Page ──────────────────────────────────────────
// Step 2 of the Discover flow: Photo → Destination tiles → **Hotels** → Checkout
// Shows 3 featured hotel tiles (Closest, Budget, High-End) near the landmark
// with "See more" expansion for browsing all available hotels.

interface SearchState {
  hotels: HotelOption[];
  featured: FeaturedHotels | null;
  radiusUsed: number;
  fallbackUsed: boolean;
}

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

  // ── Hydrate from sessionStorage ────────────────────────────────
  useEffect(() => {
    try {
      const destStr = sessionStorage.getItem('discover_destination');
      const coordsStr = sessionStorage.getItem('discover_landmark_coords');
      const checkinStr = sessionStorage.getItem('discover_checkin');
      const checkoutStr = sessionStorage.getItem('discover_checkout');
      const guestsStr = sessionStorage.getItem('discover_guests');

      if (!destStr || !coordsStr || !checkinStr || !checkoutStr) {
        // Missing required data — redirect back to discover
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
    // Update state + sessionStorage
    setCheckin(params.checkin);
    setCheckout(params.checkout);
    setGuests({ adults: params.adults, children: params.children });

    sessionStorage.setItem('discover_checkin', params.checkin);
    sessionStorage.setItem('discover_checkout', params.checkout);
    sessionStorage.setItem('discover_guests', JSON.stringify({
      adults: params.adults,
      children: params.children,
    }));

    // Search will re-trigger via useEffect
  }, []);

  const handleSelectHotel = useCallback((hotel: HotelOption) => {
    sessionStorage.setItem('discover_selected_hotel', JSON.stringify(hotel));
    router.push('/discover/checkout');
  }, [router]);

  const handleBack = useCallback(() => {
    router.push('/discover');
  }, [router]);

  // ── Location label ─────────────────────────────────────────────
  const locationLabel = searchState?.fallbackUsed
    ? `Hotels in ${destination?.city || 'this area'}`
    : `Hotels near your spot in ${destination?.city || 'this area'}`;

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
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

        {/* Search controls — editable dates + guests */}
        {checkin && checkout && (
          <div className="mb-6">
            <SearchControls
              checkin={checkin}
              checkout={checkout}
              adults={guests.adults}
              children={guests.children}
              onUpdate={handleSearchUpdate}
              isLoading={loading}
            />
          </div>
        )}

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
            {searchState.hotels.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-gray-600 text-lg mb-2">No hotels found nearby</p>
                <p className="text-gray-500 text-sm">Try adjusting your dates or go back to explore other destinations.</p>
              </div>
            )}

            {/* Featured 3 tiles */}
            {searchState.featured && !showExpanded && (
              <>
                <HotelTileGrid
                  featured={searchState.featured}
                  landmarkLat={landmarkCoords?.lat || 0}
                  landmarkLng={landmarkCoords?.lng || 0}
                  onSelectHotel={handleSelectHotel}
                />

                {/* See more button */}
                {searchState.hotels.length > 3 && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => setShowExpanded(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
                    >
                      See all {searchState.hotels.length} hotels
                      <span className="text-xs">&darr;</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Not enough for featured tiles but have some results */}
            {!searchState.featured && searchState.hotels.length > 0 && (
              <HotelExpandedList
                hotels={searchState.hotels}
                landmarkLat={landmarkCoords?.lat || 0}
                landmarkLng={landmarkCoords?.lng || 0}
                onSelectHotel={handleSelectHotel}
                onClose={() => {}}
              />
            )}

            {/* Expanded view */}
            {showExpanded && (
              <HotelExpandedList
                hotels={searchState.hotels}
                landmarkLat={landmarkCoords?.lat || 0}
                landmarkLng={landmarkCoords?.lng || 0}
                onSelectHotel={handleSelectHotel}
                onClose={() => setShowExpanded(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
