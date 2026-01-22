'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import type { FlashTripPackage } from '@/types/flash';

export default function FlashConfirmPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [trip, setTrip] = useState<FlashTripPackage | null>(null);

  useEffect(() => {
    // Load selected trip from session storage
    const stored = sessionStorage.getItem('flash_selected_trip');
    if (stored) {
      try {
        setTrip(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse trip:', e);
        router.push('/flash');
      }
    } else {
      router.push('/flash');
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?redirect=/flash');
    }
  }, [user, authLoading, router]);

  if (authLoading || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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

  const handleProceedToBooking = () => {
    // In full implementation, this would:
    // 1. Create a trip record
    // 2. Redirect to the booking/payment flow
    // For now, show a success message
    alert('Booking flow coming soon! Your trip to ' + trip.destination.city + ' would be booked here.');
  };

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
                {formatDate(trip.flight.outbound.departure)} - {formatDate(trip.flight.return.arrival)}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="p-6">
            {/* Flight */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{trip.flight.airline}</p>
                <p className="text-sm text-gray-500">
                  {trip.flight.outbound.stops === 0 ? 'Direct flight' : `${trip.flight.outbound.stops} stop`}
                </p>
              </div>
              <p className="font-semibold text-gray-900">
                {formatPrice(trip.flight.price, trip.flight.currency)}
              </p>
            </div>

            {/* Hotel (if included) */}
            {trip.hotel ? (
              <div className="flex items-center gap-4 py-4 border-b border-gray-100">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{trip.hotel.name}</p>
                  <p className="text-sm text-gray-500">
                    {'★'.repeat(trip.hotel.stars)} • {trip.itinerary.days} nights
                  </p>
                </div>
                <p className="font-semibold text-gray-900">
                  {formatPrice(trip.hotel.totalPrice, trip.hotel.currency)}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4 py-4 border-b border-gray-100">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-500">Hotel not included</p>
                  <p className="text-sm text-gray-400">
                    Book your own accommodation
                  </p>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm text-gray-500">Total Price</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatPrice(trip.pricing.total, trip.pricing.currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Per person</p>
                <p className="text-lg font-semibold text-gray-700">
                  {formatPrice(trip.pricing.perPerson || 0, trip.pricing.currency)}
                </p>
              </div>
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

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/flash/swipe')}
            className="flex-1 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={handleProceedToBooking}
            className="flex-1 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            Proceed to Payment
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          You won't be charged until you confirm your booking details
        </p>
      </div>
    </main>
  );
}
