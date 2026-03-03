'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { HotelOption } from '@/lib/liteapi/types';
import type { RoomRatesResponse, RoomOption, RateOption } from '@/app/api/hotels/room-rates/route';
import { RoomCard } from '@/components/discover/RoomCard';

// ── Room Selection Page ─────────────────────────────────────────────
// Step 3 of the Discover flow: Photo → Destinations → Hotels → **Rooms** → Checkout
// Shows all room types + rate options for the selected hotel.

export default function RoomsPage() {
  const router = useRouter();
  const [hotel, setHotel] = useState<HotelOption | null>(null);
  const [roomData, setRoomData] = useState<RoomRatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Hydrate from sessionStorage ─────────────────────────────────
  useEffect(() => {
    const hotelStr = sessionStorage.getItem('discover_selected_hotel');
    const checkin = sessionStorage.getItem('discover_checkin');
    const checkout = sessionStorage.getItem('discover_checkout');
    const guestsStr = sessionStorage.getItem('discover_guests');

    if (!hotelStr || !checkin || !checkout) {
      router.push('/discover/hotels');
      return;
    }

    const hotelData: HotelOption = JSON.parse(hotelStr);
    const guests = guestsStr ? JSON.parse(guestsStr) : { adults: 2, children: [] };
    setHotel(hotelData);

    // Fetch room rates
    fetchRoomRates(hotelData, checkin, checkout, guests);
  }, [router]);

  const fetchRoomRates = async (
    hotelData: HotelOption,
    checkin: string,
    checkout: string,
    guests: { adults: number; children: number[] }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/hotels/room-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: hotelData.id,
          hotelName: hotelData.name,
          checkin,
          checkout,
          adults: guests.adults,
          children: guests.children || [],
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch room rates: ${res.status}`);
      }

      const data: RoomRatesResponse = await res.json();
      setRoomData(data);
    } catch (err) {
      console.error('Room rates fetch error:', err);
      setError('Unable to load room options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Handle rate selection → checkout ────────────────────────────
  const handleSelectRate = useCallback(
    (room: RoomOption, rate: RateOption) => {
      if (!hotel) return;

      // Store the selected room + rate in sessionStorage alongside hotel
      const enrichedHotel: HotelOption = {
        ...hotel,
        // Override with selected room/rate details
        offerId: room.offerId,
        rateId: rate.rateId,
        roomName: room.roomName,
        roomDescription: room.roomDescription,
        totalPrice: rate.totalPrice,
        pricePerNight: rate.pricePerNight,
        currency: rate.currency,
        refundable: rate.refundableTag === 'RFN',
        boardType: rate.boardType,
        boardName: rate.boardName,
        cancelDeadline:
          rate.refundableTag === 'RFN' ? rate.cancelDeadline || 'Free cancellation' : undefined,
        roomDetails: {
          roomSizeSquare: room.roomSizeSquare,
          roomSizeUnit: room.roomSizeUnit,
          maxOccupancy: room.maxOccupancy,
          maxAdults: room.maxAdults,
          maxChildren: room.maxChildren,
          bedTypes: room.bedTypes,
          views: room.views,
        },
      };

      // Also store the rate expiry
      sessionStorage.setItem('discover_selected_hotel', JSON.stringify(enrichedHotel));
      sessionStorage.setItem(
        'discover_rate_expiry',
        String(roomData?.expiresAt || Date.now() + 30 * 60 * 1000)
      );

      router.push('/discover/checkout');
    },
    [hotel, roomData, router]
  );

  const handleBack = useCallback(() => {
    router.push('/discover/hotels');
  }, [router]);

  // ── Rate expiry countdown ───────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!roomData?.expiresAt) return;

    const updateTimer = () => {
      const remaining = roomData.expiresAt - Date.now();
      if (remaining <= 0) {
        setTimeLeft('Expired — refresh for new rates');
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [roomData?.expiresAt]);

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {hotel?.name || 'Choose your room'}
              </h1>
              {hotel && (
                <p className="text-sm text-gray-500">
                  {'★'.repeat(hotel.stars)} · {roomData?.checkin} → {roomData?.checkout} · {roomData?.nights || '—'}{' '}
                  {(roomData?.nights || 0) === 1 ? 'night' : 'nights'}
                </p>
              )}
            </div>
          </div>

          {/* Rate timer */}
          {timeLeft && (
            <div
              className={`text-xs font-mono px-3 py-1 rounded-full ${
                timeLeft.startsWith('Expired')
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              ⏱ Rates valid for {timeLeft}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Loading state */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-64 h-48 bg-gray-200" />
                  <div className="flex-1 p-4 space-y-3">
                    <div className="h-5 w-48 bg-gray-200 rounded" />
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="flex gap-2">
                      <div className="h-6 w-20 bg-gray-200 rounded-full" />
                      <div className="h-6 w-24 bg-gray-200 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-40 bg-gray-200 rounded-full" />
                    <div className="h-10 w-28 bg-gray-200 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">😞</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
            >
              Back to hotels
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && roomData && roomData.rooms.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏨</p>
            <p className="text-gray-600 mb-2">No room options available for these dates.</p>
            <p className="text-sm text-gray-400 mb-4">
              Try different dates or go back to pick another hotel.
            </p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
            >
              Back to hotels
            </button>
          </div>
        )}

        {/* Room cards */}
        {!loading && !error && roomData && roomData.rooms.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {roomData.rooms.length} room {roomData.rooms.length === 1 ? 'type' : 'types'} ·{' '}
                {roomData.rooms.reduce((sum, r) => sum + r.rates.length, 0)} rate options
              </p>
            </div>

            {roomData.rooms.map((room, idx) => (
              <RoomCard
                key={room.roomTypeId}
                room={room}
                nights={roomData.nights}
                isFirst={idx === 0}
                onSelectRate={handleSelectRate}
              />
            ))}

            {/* Hotel important info */}
            {hotel?.hotelImportantInformation && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6">
                <h3 className="text-sm font-semibold text-amber-800 mb-1">
                  ⚠️ Important information
                </h3>
                <p className="text-sm text-amber-700">{hotel.hotelImportantInformation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
