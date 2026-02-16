'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import type { FlashTripPackage, DestinationVibe } from '@/types/flash';
import type { HotelOption } from '@/lib/liteapi/types';
import type { ItineraryStop, ItineraryDay } from '@/lib/flash/itinerary-generator';
import { useRevealedPreferences } from '@/hooks/useRevealedPreferences';
import { MagicPackage } from '@/components/flash/MagicPackage';

interface BookingData {
  trip: FlashTripPackage;
  itineraryType: string;
  itinerary: ItineraryDay[];
  skipHotels: boolean;
  selectedHotel: HotelOption | null;
  favoriteStops: ItineraryStop[];
}

export default function FlashConfirmPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [tripDates, setTripDates] = useState<{ departure: string; return: string }>({ departure: '', return: '' });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { trackBooking } = useRevealedPreferences();
  const hasTrackedBooking = useRef(false);

  useEffect(() => {
    // Try to load from flash_booking_data first (new flow)
    const bookingStored = sessionStorage.getItem('flash_booking_data');
    if (bookingStored) {
      try {
        setBookingData(JSON.parse(bookingStored));
        return;
      } catch (e) {
        console.error('Failed to parse booking data:', e);
      }
    }

    // Fallback to flash_selected_trip (old flow)
    const tripStored = sessionStorage.getItem('flash_selected_trip');
    if (tripStored) {
      try {
        const trip = JSON.parse(tripStored);
        setBookingData({
          trip,
          itineraryType: 'classic',
          itinerary: [],
          skipHotels: !trip.hotel,
          selectedHotel: null,
          favoriteStops: [],
        });
        return;
      } catch (e) {
        console.error('Failed to parse trip:', e);
      }
    }

    router.push('/flash');
  }, [router]);

  // Load trip dates from session storage
  useEffect(() => {
    try {
      const params = sessionStorage.getItem('flash_generate_params');
      if (params) {
        const parsed = JSON.parse(params);
        setTripDates({ departure: parsed.departureDate || '', return: parsed.returnDate || '' });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?redirect=/flash');
    }
  }, [user, authLoading, router]);

  if (authLoading || !bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { trip, skipHotels, selectedHotel, favoriteStops, itineraryType } = bookingData;

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals - hotel only (no flights)
  const grandTotal = skipHotels ? 0 : (selectedHotel?.totalPrice || trip.hotel?.totalPrice || 0);

  const handleProceedToBooking = () => {
    // Track booking for preference learning (strongest signal - 3x weight)
    if (!hasTrackedBooking.current) {
      trackBooking({
        destinationId: trip.destination.city.toLowerCase().replace(/\s+/g, '-'),
        vibes: (trip.destination.vibes || []) as DestinationVibe[],
        region: trip.destination.region || 'unknown',
        tripCost: grandTotal,
        tripLengthDays: trip.itinerary?.days || 3,
      });
      hasTrackedBooking.current = true;
    }

    // TODO: Wire up LiteAPI Payment SDK (prebook → payment widget → book)
    // See TODO.md P2 for full implementation plan
    setShowBookingModal(true);
  };

  // Use trip itinerary dates if available, otherwise fall back to pricing dates
  const tripDays = trip.itinerary?.days || 3;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600">
            Your {trip.destination.city}, {trip.destination.country} adventure is locked in
          </p>
          {/* Quick summary */}
          <div className="inline-flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2 mt-4 text-sm text-gray-700">
            <span>{tripDays} days</span>
            <span className="text-gray-300">|</span>
            {!skipHotels && selectedHotel && (
              <>
                <span>{selectedHotel.name}</span>
                <span className="text-gray-300">|</span>
              </>
            )}
            <span>
              {itineraryType && itineraryType.charAt(0).toUpperCase() + itineraryType.slice(1)} itinerary
            </span>
          </div>
        </div>

        {/* Magic Package — the post-booking reward */}
        <div className="mb-8">
          <div className="text-center mb-4">
            <p className="text-gray-500 text-sm">
              Here&apos;s your personalized travel guide — everything you need to know before you go
            </p>
          </div>
          <MagicPackage
            destination={trip.destination.city}
            country={trip.destination.country}
            departureDate={tripDates.departure}
            returnDate={tripDates.return}
            travelerType="couple"
            hotelName={selectedHotel?.name || trip.hotel?.name}
            activities={favoriteStops?.map((s) => s.name) || trip.highlights || []}
            vibes={trip.destination.vibes || []}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/flash')}
            className="flex-1 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Plan Another Trip
          </button>
          <button
            onClick={handleProceedToBooking}
            className="flex-1 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            {grandTotal > 0 ? 'Proceed to Payment' : 'Get My Itinerary'}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          {grandTotal > 0
            ? "You won't be charged until you confirm your booking details"
            : "Your personalized itinerary will be emailed to you"
          }
        </p>
      </div>

      {/* Booking Coming Soon Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center relative">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚀</span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Booking Launching Soon
            </h3>
            <p className="text-gray-600 mb-6">
              We&apos;re putting the finishing touches on secure hotel booking for {trip.destination.city}.
              Your trip details have been saved.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-medium text-gray-900 mb-1">Your trip summary:</p>
              <p className="text-sm text-gray-600">
                {trip.destination.city}, {trip.destination.country} &bull; {tripDays} nights
                {selectedHotel && ` \u2022 ${selectedHotel.name}`}
                {grandTotal > 0 && ` \u2022 ${formatPrice(grandTotal, trip.pricing.currency)}`}
              </p>
            </div>

            <button
              onClick={() => setShowBookingModal(false)}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
