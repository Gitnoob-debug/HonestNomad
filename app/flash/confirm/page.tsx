'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import type { FlashTripPackage, DestinationVibe } from '@/types/flash';
import type { HotelOption } from '@/lib/liteapi/types';
import { useRevealedPreferences } from '@/hooks/useRevealedPreferences';
import { MagicPackage } from '@/components/flash/MagicPackage';

interface BookingData {
  trip: FlashTripPackage;
  itineraryType: string;
  itinerary: any[];
  skipHotels: boolean;
  selectedHotel: HotelOption | null;
  favoriteStops: any[];
}

export default function FlashConfirmPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [tripDates, setTripDates] = useState<{ departure: string; return: string }>({ departure: '', return: '' });
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate totals - hotel only (no flights)
  const hotelTotal = skipHotels ? 0 : (selectedHotel?.totalPrice || trip.hotel?.totalPrice || 0);
  const grandTotal = hotelTotal;

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

    // In full implementation, this would:
    // 1. Create a trip record
    // 2. Redirect to the booking/payment flow
    // For now, show a success message
    alert('Booking flow coming soon! Your trip to ' + trip.destination.city + ' would be booked here.');
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
            Great Choice!
          </h1>
          <p className="text-gray-600">
            You selected a trip to {trip.destination.city}
          </p>
        </div>

        {/* Trip summary card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Hero image */}
          <div className="relative h-48">
            <img
              src={trip.imageUrl}
              alt={trip.destination.city}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <h2 className="text-2xl font-bold text-white">
                {trip.destination.city}, {trip.destination.country}
              </h2>
              <p className="text-white/80">
                {tripDays} nights
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="p-6">
            {/* Hotel */}
            <div className="flex items-center gap-4 py-4 border-b border-gray-100">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                skipHotels || !selectedHotel ? 'bg-gray-100' : 'bg-purple-100'
              }`}>
                <svg className={`w-6 h-6 ${skipHotels || !selectedHotel ? 'text-gray-400' : 'text-purple-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1">
                {skipHotels || !selectedHotel ? (
                  <>
                    <p className="font-semibold text-gray-500">Hotel not included</p>
                    <p className="text-sm text-gray-400">You'll book your own accommodation</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-900">{selectedHotel.name}</p>
                    <p className="text-sm text-gray-500">
                      {'★'.repeat(selectedHotel.stars)} &bull; {tripDays} nights
                      {selectedHotel.refundable && (
                        <span className="text-green-600 ml-2">&bull; Free cancellation</span>
                      )}
                    </p>
                  </>
                )}
              </div>
              {!skipHotels && selectedHotel && (
                <p className="font-semibold text-gray-900">
                  {formatPrice(selectedHotel.totalPrice, selectedHotel.currency)}
                </p>
              )}
            </div>

            {/* Itinerary */}
            {itineraryType && (
              <div className="flex items-center gap-4 py-4 border-b border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Personalized Itinerary</p>
                  <p className="text-sm text-gray-500">
                    {itineraryType.charAt(0).toUpperCase() + itineraryType.slice(1)} experience
                    {favoriteStops?.length > 0 && ` \u2022 ${favoriteStops.length} saved places`}
                  </p>
                </div>
                <p className="text-green-600 font-medium">Free</p>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm text-gray-500">Total Price</p>
                <p className="text-3xl font-bold text-gray-900">
                  {grandTotal > 0 ? formatPrice(grandTotal, trip.pricing.currency) : 'Free'}
                </p>
              </div>
              {grandTotal > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Breakdown</p>
                  <div className="text-sm text-gray-600">
                    {!skipHotels && selectedHotel && <p>Hotel: {formatPrice(hotelTotal, selectedHotel.currency)}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Trip Highlights</h3>
          <div className="grid grid-cols-2 gap-3">
            {trip.highlights.map((highlight, i) => (
              <div key={i} className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-700">{highlight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Places */}
        {favoriteStops && favoriteStops.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Your Saved Places</h3>
            <div className="space-y-2">
              {favoriteStops.slice(0, 6).map((stop: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <span className="text-lg">
                    {{
                      landmark: '\ud83c\udfdb\ufe0f',
                      restaurant: '\ud83c\udf7d\ufe0f',
                      activity: '\ud83c\udfaf',
                      museum: '\ud83c\udfdb\ufe0f',
                      park: '\ud83c\udf33',
                      cafe: '\u2615',
                      bar: '\ud83c\udf78',
                    }[stop.type as string] || '\ud83d\udccd'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{stop.name}</p>
                    {stop.googleRating && (
                      <p className="text-xs text-gray-500">
                        \u2605 {stop.googleRating.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {favoriteStops.length > 6 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  +{favoriteStops.length - 6} more places
                </p>
              )}
            </div>
          </div>
        )}

        {/* Magic Package */}
        <div className="mb-6">
          <MagicPackage
            destination={trip.destination.city}
            country={trip.destination.country}
            departureDate={tripDates.departure}
            returnDate={tripDates.return}
            travelerType="couple"
            hotelName={selectedHotel?.name || trip.hotel?.name}
            activities={favoriteStops?.map((s: any) => s.name) || trip.highlights || []}
            vibes={trip.destination.vibes || []}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/flash/explore')}
            className="flex-1 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Go Back
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
    </main>
  );
}
