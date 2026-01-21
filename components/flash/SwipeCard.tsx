'use client';

import { FlashTripPackage } from '@/types/flash';

interface SwipeCardProps {
  trip: FlashTripPackage;
  onExpand?: () => void;
  style?: React.CSSProperties;
  swipeDirection?: 'left' | 'right' | null;
  swipeProgress?: number;
}

export function SwipeCard({
  trip,
  onExpand,
  style,
  swipeDirection,
  swipeProgress = 0,
}: SwipeCardProps) {
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (duration: string) => {
    // Duration comes as ISO 8601 duration like "PT12H30M"
    const match = duration.match(/PT(\d+)H(?:(\d+)M)?/);
    if (match) {
      const hours = match[1];
      const minutes = match[2] || '0';
      return `${hours}h ${minutes}m`;
    }
    return duration;
  };

  return (
    <div
      className="relative w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden cursor-pointer select-none"
      style={style}
      onClick={onExpand}
    >
      {/* Swipe overlay indicators */}
      {swipeDirection === 'left' && swipeProgress > 0 && (
        <div
          className="absolute inset-0 bg-red-500 z-10 flex items-center justify-center"
          style={{ opacity: swipeProgress * 0.5 }}
        >
          <span className="text-white text-6xl font-bold rotate-[-20deg]">NOPE</span>
        </div>
      )}
      {swipeDirection === 'right' && swipeProgress > 0 && (
        <div
          className="absolute inset-0 bg-green-500 z-10 flex items-center justify-center"
          style={{ opacity: swipeProgress * 0.5 }}
        >
          <span className="text-white text-6xl font-bold rotate-[20deg]">LIKE</span>
        </div>
      )}

      {/* Hero image */}
      <div className="relative h-56 sm:h-64">
        <img
          src={trip.imageUrl}
          alt={trip.destination.city}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Destination name */}
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {trip.destination.city}
          </h2>
          <p className="text-white/80 text-sm">{trip.destination.country}</p>
        </div>

        {/* Price badge */}
        <div className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-full shadow-lg">
          <span className="font-bold text-gray-900">
            {formatPrice(trip.pricing.total, trip.pricing.currency)}
          </span>
          <span className="text-xs text-gray-500 block">total</span>
        </div>

        {/* Match score */}
        {trip.matchScore >= 0.7 && (
          <div className="absolute top-4 left-4 bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
            {Math.round(trip.matchScore * 100)}% match
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        {/* Dates & Duration */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>
            {formatDate(trip.flight.outbound.departure)} - {formatDate(trip.flight.return.arrival)}
          </span>
          <span className="text-gray-400">•</span>
          <span>{trip.itinerary.days} nights</span>
        </div>

        {/* Flight info */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 text-sm">{trip.flight.airline}</p>
            <p className="text-xs text-gray-500">
              {trip.flight.outbound.stops === 0 ? 'Direct' : `${trip.flight.outbound.stops} stop`}
              {' • '}{formatDuration(trip.flight.outbound.duration)}
            </p>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {formatPrice(trip.flight.price, trip.flight.currency)}
          </span>
        </div>

        {/* Hotel info */}
        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">{trip.hotel.name}</p>
            <p className="text-xs text-gray-500">
              {'★'.repeat(trip.hotel.stars)} • {trip.hotel.rating}/10
            </p>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {formatPrice(trip.hotel.totalPrice, trip.hotel.currency)}
          </span>
        </div>

        {/* Highlights */}
        <div className="flex flex-wrap gap-2">
          {trip.highlights.slice(0, 3).map((highlight, i) => (
            <span
              key={i}
              className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {highlight}
            </span>
          ))}
        </div>

        {/* Tap to expand hint */}
        <p className="mt-4 text-center text-xs text-gray-400">
          Tap to see full details
        </p>
      </div>
    </div>
  );
}
