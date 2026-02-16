'use client';

import { useEffect } from 'react';
import { FlashTripPackage } from '@/types/flash';
import { ImageCarousel } from './ImageCarousel';

interface TripDetailModalProps {
  trip: FlashTripPackage | null;
  onClose: () => void;
  onBook: () => void;
}

// Map vibes to emoji for visual flair
const VIBE_EMOJI: Record<string, string> = {
  beach: '🏖️', romance: '💕', culture: '🏛️', food: '🍷', history: '🏰',
  nightlife: '🎉', adventure: '🏔️', nature: '🌿', city: '🌆', luxury: '✨',
  relaxation: '🧘', family: '👨‍👩‍👧‍👦',
};

const VIBE_LABELS: Record<string, string> = {
  beach: 'Beach', romance: 'Romance', culture: 'Culture', food: 'Foodie',
  history: 'History', nightlife: 'Nightlife', adventure: 'Adventure',
  nature: 'Nature', city: 'City Life', luxury: 'Luxury',
  relaxation: 'Relaxation', family: 'Family-Friendly',
};

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

  const hasHotel = !!trip.hotel;
  const hasPricing = trip.pricing.total > 0;

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

          {/* Hero image carousel — taller for drama */}
          <div className="relative h-56 sm:h-80">
            <ImageCarousel
              images={trip.images || []}
              primaryImage={trip.imageUrl}
              alt={trip.destination.city}
              className="w-full h-full"
              showCaptions={true}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-5 right-5 pointer-events-none">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
                    {trip.destination.city}
                  </h2>
                  <p className="text-white/80 text-sm mt-0.5">{trip.destination.country} · {trip.itinerary.days} nights</p>
                </div>
                {hasPricing && (
                  <div className="text-right">
                    <p className="text-white/60 text-xs">from</p>
                    <p className="text-2xl font-bold text-white drop-shadow-lg">
                      {formatPrice(trip.hotel?.pricePerNight || Math.round(trip.pricing.total / trip.itinerary.days), trip.pricing.currency)}
                    </p>
                    <p className="text-white/70 text-xs">/night</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6">

            {/* ═══ THE PITCH — hero section ═══ */}
            <div className="mb-6">
              {/* Tagline as bold hook */}
              {trip.tagline && (
                <p className="text-primary-600 font-semibold text-sm uppercase tracking-wide mb-2">
                  {trip.tagline}
                </p>
              )}

              {/* Sales pitch — the main event */}
              {trip.pitch && (
                <p className="text-gray-700 text-[15px] leading-relaxed">
                  {trip.pitch}
                </p>
              )}

              {/* Perfect timing badge */}
              {trip.perfectTiming && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                  <span className="text-green-600 text-xs">☀️</span>
                  <span className="text-green-700 text-xs font-medium">Great time to visit — ideal weather for your dates</span>
                </div>
              )}
            </div>

            {/* ═══ VIBES — visual identity ═══ */}
            {trip.destination.vibes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {trip.destination.vibes.map((vibe) => (
                  <span
                    key={vibe}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700"
                  >
                    <span>{VIBE_EMOJI[vibe] || '✨'}</span>
                    <span>{VIBE_LABELS[vibe] || vibe}</span>
                  </span>
                ))}
              </div>
            )}

            {/* ═══ WHAT YOU'LL EXPERIENCE — highlights as storytelling ═══ */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What you&apos;ll experience</h3>
              <div className="space-y-2.5">
                {trip.highlights.map((highlight, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center mt-0.5">
                      <span className="text-primary-600 text-xs font-bold">{i + 1}</span>
                    </div>
                    <span className="text-gray-700 text-[15px]">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ THINGS TO DO — activities as visual tags ═══ */}
            {trip.itinerary.activities.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Things to do</h3>
                <div className="flex flex-wrap gap-2">
                  {trip.itinerary.activities.map((activity, i) => (
                    <span
                      key={i}
                      className="inline-block px-3.5 py-2 bg-primary-50 text-primary-700 rounded-xl text-sm font-medium"
                    >
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ POI COUNT — social proof ═══ */}
            {trip.poiCount && trip.poiCount > 20 && (
              <div className="mb-6 p-3.5 bg-gray-50 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {trip.poiCount}+ curated places to explore
                  </p>
                  <p className="text-xs text-gray-500">
                    We&apos;ll build you a personalized day-by-day itinerary
                  </p>
                </div>
              </div>
            )}

            {/* ═══ GETTING THERE — transfer info ═══ */}
            {trip.transferInfo && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-amber-500">✈️</span>
                  Getting There
                </h3>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-amber-600 font-medium">{trip.transferInfo.hubAirportCode}</p>
                      <p className="text-[11px] text-amber-500">{trip.transferInfo.hubCity}</p>
                    </div>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="h-px flex-1 bg-amber-300" />
                      <span className="text-xs text-amber-600 px-2 whitespace-nowrap">
                        {Math.round(trip.transferInfo.groundTransferMinutes / 60 * 10) / 10}hr {trip.transferInfo.transferType}
                      </span>
                      <div className="h-px flex-1 bg-amber-300" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-amber-600 font-medium">{trip.destination.city}</p>
                      <p className="text-[11px] text-amber-500">Destination</p>
                    </div>
                  </div>
                  {trip.transferInfo.transferNote && (
                    <p className="text-xs text-amber-600 mt-2 italic">{trip.transferInfo.transferNote}</p>
                  )}
                </div>
              </div>
            )}

            {/* ═══ YOUR STAY — hotel card ═══ */}
            {hasHotel && trip.hotel && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>🏨</span>
                  Your Stay
                </h3>
                <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  <img
                    src={trip.hotel.imageUrl}
                    alt={trip.hotel.name}
                    className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{trip.hotel.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-yellow-400 text-sm">{'★'.repeat(trip.hotel.stars)}</span>
                      <span className="text-sm text-gray-600">{trip.hotel.rating}/10</span>
                      <span className="text-sm text-gray-400">({trip.hotel.reviewCount} reviews)</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {trip.hotel.amenities.slice(0, 4).map((amenity, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-white rounded-full text-gray-600">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ PRICE SUMMARY ═══ */}
            {hasPricing && (
              <div className="mb-6 p-4 bg-primary-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-primary-500 font-medium uppercase tracking-wide">Total for {trip.itinerary.days} nights</p>
                    <p className="text-2xl font-bold text-primary-700">
                      {formatPrice(trip.pricing.total, trip.pricing.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    {trip.pricing.perPerson && trip.pricing.perPerson > 0 && (
                      <p className="text-sm text-primary-600 font-medium">
                        {formatPrice(trip.pricing.perPerson, trip.pricing.currency)}/person
                      </p>
                    )}
                    {trip.hotel && (
                      <p className="text-xs text-primary-500">
                        {formatPrice(trip.hotel.pricePerNight, trip.pricing.currency)}/night
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ CTA ═══ */}
            <button
              onClick={onBook}
              className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors text-lg shadow-lg shadow-primary-600/20"
            >
              Explore {trip.destination.city}
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              We&apos;ll create your personalized itinerary next
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
