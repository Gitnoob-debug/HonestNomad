'use client';

import { useState } from 'react';
import type { TripPlan } from '@/types/trip';

interface TripCardProps {
  trip: TripPlan;
  onSwapHotel?: () => void;
  onSwapFlight?: () => void;
  onCheaperOption?: () => void;
  onMoreLuxury?: () => void;
  onBook?: () => void;
}

// Destination hero images (placeholder - would come from API)
const DESTINATION_IMAGES: Record<string, string> = {
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
  london: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80',
  tokyo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80',
  'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80',
  nyc: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80',
  toronto: 'https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=1200&q=80',
  barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=80',
  rome: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80',
  amsterdam: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&q=80',
  dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80',
  singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=80',
  sydney: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80',
};

function getDestinationImage(city: string): string {
  const key = city.toLowerCase();
  return DESTINATION_IMAGES[key] || DESTINATION_IMAGES.default;
}

export default function TripCard({
  trip,
  onSwapHotel,
  onSwapFlight,
  onCheaperOption,
  onMoreLuxury,
  onBook,
}: TripCardProps) {
  const [showItinerary, setShowItinerary] = useState(false);

  const destination = trip.destinations[0]?.city || 'Your Destination';
  const heroImage = getDestinationImage(destination);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const outboundSlice = trip.outboundFlight?.slices[0];
  const returnSlice = trip.outboundFlight?.slices[1];
  const totalTravelers = trip.travelers.adults + trip.travelers.children + trip.travelers.infants;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
      {/* Hero Section */}
      <div className="relative h-64 sm:h-80">
        <img
          src={heroImage}
          alt={destination}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Destination Title */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2">{destination}</h1>
          <div className="flex items-center gap-4 text-white/90">
            <span className="flex items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </span>
            <span>•</span>
            <span>{trip.totalNights} nights</span>
            <span>•</span>
            <span>{totalTravelers} traveler{totalTravelers > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Price Badge */}
        <div className="absolute top-4 right-4 bg-white rounded-xl px-4 py-2 shadow-lg">
          <div className="text-2xl font-bold text-gray-900">
            ${trip.pricing.total.amount.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 text-right">total estimate</div>
        </div>
      </div>

      {/* Trip Details */}
      <div className="p-6 space-y-6">
        {/* Flight Summary */}
        {trip.outboundFlight && outboundSlice && (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Flights</h3>
                <span className="text-lg font-semibold text-gray-900">
                  ${trip.pricing.flights.perPerson}
                  <span className="text-sm font-normal text-gray-500">/person</span>
                </span>
              </div>
              <div className="mt-2 space-y-2">
                {/* Outbound */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 w-16">Outbound</span>
                  <span className="font-medium">{outboundSlice.origin}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="font-medium">{outboundSlice.destination}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">
                    {outboundSlice.stops === 0 ? 'Direct' : `${outboundSlice.stops} stop`}
                  </span>
                </div>
                {/* Return */}
                {returnSlice && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 w-16">Return</span>
                    <span className="font-medium">{returnSlice.origin}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="font-medium">{returnSlice.destination}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">
                      {returnSlice.stops === 0 ? 'Direct' : `${returnSlice.stops} stop`}
                    </span>
                  </div>
                )}
              </div>
              {trip.outboundFlight.airlines[0] && (
                <div className="mt-2 flex items-center gap-2">
                  {trip.outboundFlight.airlines[0].logoUrl && (
                    <img
                      src={trip.outboundFlight.airlines[0].logoUrl}
                      alt={trip.outboundFlight.airlines[0].name}
                      className="w-5 h-5 object-contain"
                    />
                  )}
                  <span className="text-sm text-gray-600">
                    {trip.outboundFlight.airlines[0].name}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hotel Summary */}
        {trip.accommodation && (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Stay</h3>
                <span className="text-lg font-semibold text-gray-900">
                  ${trip.pricing.accommodation.perNight}
                  <span className="text-sm font-normal text-gray-500">/night</span>
                </span>
              </div>
              <p className="mt-1 text-gray-900">{trip.accommodation.name}</p>
              <div className="mt-1 flex items-center gap-2">
                {trip.accommodation.rating.stars && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: trip.accommodation.rating.stars }).map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                )}
                <span className="text-sm text-gray-600">
                  {trip.totalNights} nights
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Itinerary Preview */}
        {trip.itinerary && trip.itinerary.length > 0 && (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Itinerary</h3>
              <p className="mt-1 text-sm text-gray-600">
                {trip.itinerary.length}-day plan with activities, restaurants, and local tips
              </p>
              <button
                onClick={() => setShowItinerary(!showItinerary)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showItinerary ? 'Hide itinerary' : 'View day-by-day'}
              </button>
            </div>
          </div>
        )}

        {/* Expandable Itinerary */}
        {showItinerary && trip.itinerary && (
          <div className="border-t pt-4 space-y-4">
            {trip.itinerary.map((day) => (
              <div key={day.date} className="pl-16">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900">Day {day.dayNumber}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  {day.isTravel && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Travel
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {day.activities.slice(0, 3).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400 w-16">{activity.time || '—'}</span>
                      <span className="text-gray-700">{activity.title}</span>
                    </div>
                  ))}
                  {day.activities.length > 3 && (
                    <div className="text-sm text-gray-500 pl-16">
                      +{day.activities.length - 3} more activities
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Highlights */}
        {trip.highlights && trip.highlights.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {trip.highlights.map((highlight, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
              >
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {highlight}
              </span>
            ))}
          </div>
        )}

        {/* Refinement Actions */}
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500 mb-3">Not quite right?</p>
          <div className="flex flex-wrap gap-2">
            {onSwapFlight && (
              <button
                onClick={onSwapFlight}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Different flight
              </button>
            )}
            {onSwapHotel && (
              <button
                onClick={onSwapHotel}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Different hotel
              </button>
            )}
            {onCheaperOption && (
              <button
                onClick={onCheaperOption}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cheaper option
              </button>
            )}
            {onMoreLuxury && (
              <button
                onClick={onMoreLuxury}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                More luxury
              </button>
            )}
          </div>
        </div>

        {/* Book Button */}
        {onBook && trip.status === 'ready' && (
          <button
            onClick={onBook}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl transition-colors"
          >
            Book This Trip — ${trip.pricing.total.amount.toLocaleString()}
          </button>
        )}
      </div>
    </div>
  );
}
