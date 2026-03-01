'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { HotelOption } from '@/lib/liteapi/types';
import type { MatchedDestination } from '@/types/location';
import { BookingSummary } from '@/components/discover/BookingSummary';

// ── Discover Checkout Page ────────────────────────────────────────
// Step 3 of the Discover flow: Photo → Destinations → Hotels → **Checkout**
// Shows booking summary with hotel details, dates, pricing.
// "Checkout" button is a NUITEE_PAY placeholder for now.

export default function DiscoverCheckoutPage() {
  const router = useRouter();

  const [hotel, setHotel] = useState<HotelOption | null>(null);
  const [destination, setDestination] = useState<MatchedDestination | null>(null);
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [guests, setGuests] = useState<{ adults: number; children: number[] }>({ adults: 2, children: [] });
  const [showModal, setShowModal] = useState(false);

  // Hydrate from sessionStorage
  useEffect(() => {
    try {
      const hotelStr = sessionStorage.getItem('discover_selected_hotel');
      const destStr = sessionStorage.getItem('discover_destination');
      const checkinStr = sessionStorage.getItem('discover_checkin');
      const checkoutStr = sessionStorage.getItem('discover_checkout');
      const guestsStr = sessionStorage.getItem('discover_guests');

      if (!hotelStr || !destStr || !checkinStr || !checkoutStr) {
        router.replace('/discover/hotels');
        return;
      }

      setHotel(JSON.parse(hotelStr));
      setDestination(JSON.parse(destStr));
      setCheckin(checkinStr);
      setCheckout(checkoutStr);
      if (guestsStr) setGuests(JSON.parse(guestsStr));
    } catch {
      router.replace('/discover/hotels');
    }
  }, [router]);

  const handleCheckout = () => {
    setShowModal(true);
  };

  const handleBack = () => {
    router.push('/discover/hotels');
  };

  if (!hotel || !destination) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Back navigation */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
        >
          <span>&larr;</span>
          <span>Back to hotels</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Confirm your stay
          </h1>
          <p className="text-gray-500 mt-1">
            Review your booking details before checkout
          </p>
        </div>

        {/* Booking summary */}
        <BookingSummary
          hotel={hotel}
          destination={destination}
          checkin={checkin}
          checkout={checkout}
          guests={guests}
          onCheckout={handleCheckout}
          onBack={handleBack}
        />
      </div>

      {/* Checkout placeholder modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl text-center">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Booking Coming Soon!
            </h2>
            <p className="text-gray-600 mb-4">
              We&apos;re integrating secure payment processing with our hotel partners.
              Real bookings will be available shortly.
            </p>
            <div className="bg-primary-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-primary-700 font-medium">
                Your selection: {hotel.name}
              </p>
              <p className="text-xs text-primary-600 mt-1">
                {destination.city}, {destination.country} &middot; ${hotel.totalPrice} total
              </p>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
