'use client';

import type { NormalizedFlight } from '@/types/flight';

interface FlightCardProps {
  flight: NormalizedFlight;
  onSelect?: (flight: NormalizedFlight) => void;
}

export default function FlightCard({ flight, onSelect }: FlightCardProps) {
  const outbound = flight.slices[0];
  const returnFlight = flight.slices[1];

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (match) {
      const hours = match[1] ? parseInt(match[1]) : 0;
      const minutes = match[2] ? parseInt(match[2]) : 0;
      if (hours && minutes) return `${hours}h ${minutes}m`;
      if (hours) return `${hours}h`;
      if (minutes) return `${minutes}m`;
    }
    return duration;
  };

  const renderSlice = (slice: typeof outbound, label: string) => {
    const departTime = formatTime(slice.departureTime);
    const arriveTime = formatTime(slice.arrivalTime);
    const departDate = formatDate(slice.departureTime);

    return (
      <div className="flex items-center justify-between py-3">
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">{label} - {departDate}</div>
          <div className="flex items-center gap-4">
            {/* Departure */}
            <div className="text-center">
              <div className="text-lg font-semibold">{departTime}</div>
              <div className="text-sm text-gray-600">{slice.origin}</div>
            </div>

            {/* Flight Path */}
            <div className="flex-1 flex flex-col items-center px-2">
              <div className="text-xs text-gray-500">{formatDuration(slice.duration)}</div>
              <div className="w-full flex items-center">
                <div className="h-px flex-1 bg-gray-300"></div>
                <div className="mx-2">
                  {slice.stops === 0 ? (
                    <span className="text-xs text-green-600 font-medium">Direct</span>
                  ) : (
                    <span className="text-xs text-orange-600">
                      {slice.stops} stop{slice.stops > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="h-px flex-1 bg-gray-300"></div>
              </div>
            </div>

            {/* Arrival */}
            <div className="text-center">
              <div className="text-lg font-semibold">{arriveTime}</div>
              <div className="text-sm text-gray-600">{slice.destination}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4">
      {/* Airlines */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
        {flight.airlines.map((airline, i) => (
          <div key={i} className="flex items-center gap-2">
            {airline.logoUrl && (
              <img
                src={airline.logoUrl}
                alt={airline.name}
                className="w-6 h-6 object-contain"
              />
            )}
            <span className="text-sm font-medium text-gray-700">{airline.name}</span>
            {i < flight.airlines.length - 1 && <span className="text-gray-400">+</span>}
          </div>
        ))}
        <span className="ml-auto text-xs text-gray-500 capitalize">
          {flight.cabinClass.replace('_', ' ')}
        </span>
      </div>

      {/* Outbound Flight */}
      {renderSlice(outbound, 'Outbound')}

      {/* Return Flight */}
      {returnFlight && (
        <>
          <div className="border-t border-gray-100"></div>
          {renderSlice(returnFlight, 'Return')}
        </>
      )}

      {/* Footer: Price and Booking */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {flight.baggageAllowance?.checkedBags ? (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                {flight.baggageAllowance.checkedBags} checked bag{flight.baggageAllowance.checkedBags > 1 ? 's' : ''}
              </span>
            ) : (
              <span>Carry-on only</span>
            )}
            {flight.restrictions.refundable && (
              <span className="text-green-600">Refundable</span>
            )}
            {flight.restrictions.changeable && (
              <span className="text-blue-600">Changeable</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900">
              ${flight.pricing.perPassenger.toFixed(0)}
            </div>
            <div className="text-xs text-gray-500">per person</div>
            {flight.passengers.reduce((sum, p) => sum + p.count, 0) > 1 && (
              <div className="text-xs text-gray-400">
                ${flight.pricing.totalAmount.toFixed(0)} total
              </div>
            )}
          </div>

          {onSelect && (
            <button
              onClick={() => onSelect(flight)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Select
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
