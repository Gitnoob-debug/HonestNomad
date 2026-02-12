'use client';

import { useEffect } from 'react';
import { FlashTripPackage } from '@/types/flash';
import { ImageCarousel } from './ImageCarousel';

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

          {/* Hero image carousel */}
          <div className="relative h-48 sm:h-72">
            <ImageCarousel
              images={trip.images || []}
              primaryImage={trip.imageUrl}
              alt={trip.destination.city}
              className="w-full h-full"
              showCaptions={true}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 pointer-events-none">
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

            {/* Getting There - Transfer info for remote destinations */}
            {trip.transferInfo && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </span>
                  Getting There
                </h3>

                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      {trip.transferInfo.transferType === 'drive' && (
                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      )}
                      {trip.transferInfo.transferType === 'train' && (
                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                      {trip.transferInfo.transferType === 'ferry' && (
                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                      {trip.transferInfo.transferType === 'connecting_flight' && (
                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-amber-800">
                        {trip.destination.city} is {Math.round(trip.transferInfo.groundTransferMinutes / 60 * 10) / 10} hours from the nearest major airport
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        Nearest airport: <span className="font-semibold">{trip.transferInfo.hubCity} ({trip.transferInfo.hubAirportCode})</span>.
                        {trip.transferInfo.transferType === 'drive' && (
                          <> You'll need to arrange ground transportation (rental car or shuttle) for the {Math.round(trip.transferInfo.groundTransferMinutes / 60 * 10) / 10}-hour drive.</>
                        )}
                        {trip.transferInfo.transferType === 'train' && (
                          <> Take a {Math.round(trip.transferInfo.groundTransferMinutes / 60 * 10) / 10}-hour train ride to reach {trip.destination.city}.</>
                        )}
                        {trip.transferInfo.transferType === 'ferry' && (
                          <> Take a {Math.round(trip.transferInfo.groundTransferMinutes / 60 * 10) / 10}-hour ferry ride to reach {trip.destination.city}.</>
                        )}
                        {trip.transferInfo.transferType === 'connecting_flight' && (
                          <> A short connecting flight ({Math.round(trip.transferInfo.groundTransferMinutes)} min) takes you to {trip.destination.city}.</>
                        )}
                      </p>
                      {trip.transferInfo.transferNote && (
                        <p className="text-xs text-amber-600 mt-2 italic">{trip.transferInfo.transferNote}</p>
                      )}
                    </div>
                  </div>

                  {/* Visual timeline */}
                  <div className="flex items-center mt-4 pt-3 border-t border-amber-200">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </div>
                      <p className="text-xs text-amber-700 mt-1 font-medium">{trip.transferInfo.hubAirportCode}</p>
                    </div>
                    <div className="flex-1 px-2">
                      <div className="h-0.5 bg-amber-300 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-50 px-2 text-xs text-amber-600">
                          {Math.round(trip.transferInfo.groundTransferMinutes / 60 * 10) / 10}hr {trip.transferInfo.transferType}
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-xs text-amber-700 mt-1 font-medium">{trip.destination.city}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                    You'll need to book your own accommodation in {trip.destination.city}.
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
