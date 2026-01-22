'use client';

import { useEffect } from 'react';
import { FlashTripPackage } from '@/types/flash';

interface TripDetailModalProps {
  trip: FlashTripPackage | null;
  onClose: () => void;
  onBook: () => void;
}

export function TripDetailModal({ trip, onClose, onBook }: TripDetailModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (trip) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [trip]);

  if (!trip) return null;

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(\d+)H(?:(\d+)M)?/);
    if (match) {
      return `${match[1]}h ${match[2] || '0'}m`;
    }
    return duration;
  };

  const outbound = formatDateTime(trip.flight.outbound.departure);
  const outboundArrival = formatDateTime(trip.flight.outbound.arrival);
  const returnFlight = formatDateTime(trip.flight.return.departure);
  const returnArrival = formatDateTime(trip.flight.return.arrival);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Hero image */}
          <div className="relative h-48 sm:h-64">
            <img
              src={trip.imageUrl}
              alt={trip.destination.city}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {trip.destination.city}
              </h2>
              <p className="text-white/80">{trip.destination.country}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Price summary */}
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl mb-6">
              <div>
                <p className="text-sm text-primary-600 font-medium">Total Price</p>
                <p className="text-2xl font-bold text-primary-700">
                  {formatPrice(trip.pricing.total, trip.pricing.currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {formatPrice(trip.pricing.perPerson || 0, trip.pricing.currency)} per person
                </p>
                <p className="text-sm text-gray-500">{trip.itinerary.days} nights</p>
              </div>
            </div>

            {/* Flight details */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </span>
                Flights with {trip.flight.airline}
              </h3>

              {/* Outbound */}
              <div className="p-4 bg-gray-50 rounded-lg mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase">Outbound</span>
                  <span className="text-xs text-gray-500">{outbound.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">{outbound.time}</p>
                    <p className="text-sm text-gray-500">{trip.destination.airportCode}</p>
                  </div>
                  <div className="flex-1 px-4">
                    <div className="border-t border-dashed border-gray-300 relative">
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50 px-2 text-xs text-gray-500">
                        {formatDuration(trip.flight.outbound.duration)}
                        {trip.flight.outbound.stops > 0 && ` • ${trip.flight.outbound.stops} stop`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{outboundArrival.time}</p>
                    <p className="text-sm text-gray-500">{trip.destination.airportCode}</p>
                  </div>
                </div>
              </div>

              {/* Return */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase">Return</span>
                  <span className="text-xs text-gray-500">{returnFlight.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">{returnFlight.time}</p>
                    <p className="text-sm text-gray-500">{trip.destination.airportCode}</p>
                  </div>
                  <div className="flex-1 px-4">
                    <div className="border-t border-dashed border-gray-300 relative">
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50 px-2 text-xs text-gray-500">
                        {formatDuration(trip.flight.return.duration)}
                        {trip.flight.return.stops > 0 && ` • ${trip.flight.return.stops} stop`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{returnArrival.time}</p>
                    <p className="text-sm text-gray-500">Home</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hotel details (if included) */}
            {trip.hotel ? (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </span>
                  Accommodation
                </h3>

                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                  <img
                    src={trip.hotel.imageUrl}
                    alt={trip.hotel.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{trip.hotel.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-yellow-400">{'★'.repeat(trip.hotel.stars)}</span>
                      <span className="text-sm text-gray-600">{trip.hotel.rating}/10</span>
                      <span className="text-sm text-gray-400">({trip.hotel.reviewCount} reviews)</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {trip.hotel.amenities.slice(0, 4).map((amenity, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-white rounded text-gray-600">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">per night</p>
                    <p className="font-semibold text-gray-900">
                      {formatPrice(trip.hotel.pricePerNight, trip.hotel.currency)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </span>
                  Accommodation
                </h3>

                <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <p className="text-gray-600 font-medium">Hotel not included</p>
                  <p className="text-sm text-gray-500 mt-1">
                    This package includes flights only. You'll need to book your own accommodation in {trip.destination.city}.
                  </p>
                </div>
              </div>
            )}

            {/* Highlights */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Highlights</h3>
              <div className="grid grid-cols-2 gap-2">
                {trip.highlights.map((highlight, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-gray-700">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activities */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Suggested Activities</h3>
              <div className="flex flex-wrap gap-2">
                {trip.itinerary.activities.map((activity, i) => (
                  <span
                    key={i}
                    className="inline-block px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm"
                  >
                    {activity}
                  </span>
                ))}
              </div>
            </div>

            {/* Book button */}
            <button
              onClick={onBook}
              className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors text-lg"
            >
              Book This Trip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
