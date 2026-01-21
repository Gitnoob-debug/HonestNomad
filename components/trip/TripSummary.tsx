'use client';

import type { TripPlan } from '@/types/trip';

interface TripSummaryProps {
  trip: TripPlan;
  onBookFlight?: () => void;
  onBookHotel?: () => void;
  onConfirmTrip?: () => void;
}

export default function TripSummary({
  trip,
  onBookFlight,
  onBookHotel,
  onConfirmTrip,
}: TripSummaryProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const totalTravelers = trip.travelers.adults + trip.travelers.children + trip.travelers.infants;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{trip.title}</h2>
            <p className="text-blue-100 mt-1">{trip.summary}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">${trip.pricing.total.amount.toLocaleString()}</div>
            <div className="text-blue-100 text-sm">estimated total</div>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{trip.totalNights} nights</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{totalTravelers} traveler{totalTravelers > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Flight Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Flights
            </h3>
            {trip.outboundFlight && (
              <span className="text-lg font-semibold text-gray-900">
                ${trip.pricing.flights.amount.toLocaleString()}
              </span>
            )}
          </div>

          {trip.outboundFlight ? (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              {/* Outbound */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {trip.outboundFlight.airlines[0]?.logoUrl && (
                    <img
                      src={trip.outboundFlight.airlines[0].logoUrl}
                      alt={trip.outboundFlight.airlines[0].name}
                      className="w-8 h-8 object-contain"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium text-gray-900">Outbound</span>
                    <span>•</span>
                    <span>{formatDate(trip.outboundFlight.slices[0].departureTime)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-semibold">
                      {formatTime(trip.outboundFlight.slices[0].departureTime)}
                    </span>
                    <span className="text-gray-400">{trip.outboundFlight.slices[0].origin}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-semibold">
                      {formatTime(trip.outboundFlight.slices[0].arrivalTime)}
                    </span>
                    <span className="text-gray-400">{trip.outboundFlight.slices[0].destination}</span>
                    <span className="text-xs text-gray-500">
                      {trip.outboundFlight.slices[0].stops === 0
                        ? 'Direct'
                        : `${trip.outboundFlight.slices[0].stops} stop`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Return */}
              {trip.outboundFlight.slices[1] && (
                <>
                  <div className="border-t border-gray-200"></div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {trip.outboundFlight.airlines[0]?.logoUrl && (
                        <img
                          src={trip.outboundFlight.airlines[0].logoUrl}
                          alt={trip.outboundFlight.airlines[0].name}
                          className="w-8 h-8 object-contain"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium text-gray-900">Return</span>
                        <span>•</span>
                        <span>{formatDate(trip.outboundFlight.slices[1].departureTime)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="font-semibold">
                          {formatTime(trip.outboundFlight.slices[1].departureTime)}
                        </span>
                        <span className="text-gray-400">{trip.outboundFlight.slices[1].origin}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-semibold">
                          {formatTime(trip.outboundFlight.slices[1].arrivalTime)}
                        </span>
                        <span className="text-gray-400">{trip.outboundFlight.slices[1].destination}</span>
                        <span className="text-xs text-gray-500">
                          {trip.outboundFlight.slices[1].stops === 0
                            ? 'Direct'
                            : `${trip.outboundFlight.slices[1].stops} stop`}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
              No flights found for these dates. Try adjusting your search.
            </div>
          )}
        </section>

        {/* Hotel Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Accommodation
            </h3>
            {trip.accommodation && (
              <span className="text-lg font-semibold text-gray-900">
                ${trip.pricing.accommodation.amount.toLocaleString()}
              </span>
            )}
          </div>

          {trip.accommodation ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex gap-4">
                {trip.accommodation.photos?.[0]?.url && (
                  <img
                    src={trip.accommodation.photos[0].url}
                    alt={trip.accommodation.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{trip.accommodation.name}</h4>
                  {trip.accommodation.rating.stars && (
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: trip.accommodation.rating.stars }).map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    {trip.accommodation.location?.address}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    ${trip.pricing.accommodation.perNight}/night × {trip.totalNights} nights
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
              No hotels found for these dates. Try adjusting your search.
            </div>
          )}
        </section>

        {/* Price Breakdown */}
        <section>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Price Breakdown
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Flights</span>
              <span className="font-medium">${trip.pricing.flights.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Accommodation ({trip.totalNights} nights)</span>
              <span className="font-medium">${trip.pricing.accommodation.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Est. food & dining</span>
              <span>~${trip.pricing.estimated.food.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Est. activities</span>
              <span>~${trip.pricing.estimated.activities.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Est. local transport</span>
              <span>~${trip.pricing.estimated.transport.toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Estimated Total</span>
                <span className="text-blue-600">${trip.pricing.total.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Highlights */}
        {trip.highlights && trip.highlights.length > 0 && (
          <section>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Trip Highlights
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {trip.highlights.map((highlight, i) => (
                <div
                  key={i}
                  className="bg-blue-50 text-blue-700 rounded-lg px-3 py-2 text-sm"
                >
                  {highlight}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Travel Tips */}
        {trip.tips && trip.tips.length > 0 && (
          <section>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Travel Tips
            </h3>
            <ul className="space-y-2">
              {trip.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-blue-600 mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          {trip.status === 'ready' && onConfirmTrip && (
            <button
              onClick={onConfirmTrip}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Book This Trip
            </button>
          )}
          {trip.status === 'draft' && (
            <div className="flex-1 text-center py-3 text-gray-500 text-sm">
              Complete your search to book this trip
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
