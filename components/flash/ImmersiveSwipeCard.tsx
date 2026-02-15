'use client';

import { useState } from 'react';
import { FlashTripPackage } from '@/types/flash';

interface PriceState {
  // Hotel pricing
  hotelLoading?: boolean;
  hotelLoaded?: boolean;
  hotelError?: string;
  hotelPrice?: number;
  // Combined state
  loading: boolean;
  loaded: boolean;
  error?: string;
  realPrice?: number;
  overBudget?: boolean;
  budgetDiff?: number;
}

// Vibe colors for destination personality tags
const VIBE_STYLES: Record<string, { bg: string; text: string; emoji: string }> = {
  beach:     { bg: 'rgba(6,182,212,0.7)',   text: '#fff', emoji: '🏖️' },
  culture:   { bg: 'rgba(168,85,247,0.7)',  text: '#fff', emoji: '🎭' },
  food:      { bg: 'rgba(249,115,22,0.7)',  text: '#fff', emoji: '🍜' },
  romance:   { bg: 'rgba(244,63,94,0.7)',   text: '#fff', emoji: '💕' },
  adventure: { bg: 'rgba(34,197,94,0.7)',   text: '#fff', emoji: '🧗' },
  nightlife: { bg: 'rgba(168,85,247,0.7)',  text: '#fff', emoji: '🎉' },
  history:   { bg: 'rgba(180,83,9,0.7)',    text: '#fff', emoji: '🏛️' },
  nature:    { bg: 'rgba(22,163,74,0.7)',   text: '#fff', emoji: '🌿' },
  city:      { bg: 'rgba(99,102,241,0.7)',  text: '#fff', emoji: '🏙️' },
  luxury:    { bg: 'rgba(234,179,8,0.7)',   text: '#fff', emoji: '✨' },
  wellness:  { bg: 'rgba(20,184,166,0.7)',  text: '#fff', emoji: '🧘' },
  shopping:  { bg: 'rgba(236,72,153,0.7)',  text: '#fff', emoji: '🛍️' },
  art:       { bg: 'rgba(139,92,246,0.7)',  text: '#fff', emoji: '🎨' },
  music:     { bg: 'rgba(217,70,239,0.7)',  text: '#fff', emoji: '🎵' },
  spiritual: { bg: 'rgba(251,191,36,0.7)',  text: '#fff', emoji: '🕉️' },
};

interface ImmersiveSwipeCardProps {
  trip: FlashTripPackage;
  priceState?: PriceState;
  onTap?: () => void;
  style?: React.CSSProperties;
  swipeDirection?: 'left' | 'right' | null;
  swipeProgress?: number;
  isActive?: boolean;
}

export function ImmersiveSwipeCard({
  trip,
  priceState,
  onTap,
  style,
  swipeDirection,
  swipeProgress = 0,
  isActive = true,
}: ImmersiveSwipeCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get all images for the carousel - extract URLs from DestinationImage objects
  const imageUrls = trip.images?.length
    ? trip.images.map(img => typeof img === 'string' ? img : img.url)
    : [trip.imageUrl];
  const totalImages = imageUrls.length;

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Handle tap zones for image navigation
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isActive) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in e ? e.changedTouches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const width = rect.width;
    const tapZone = x / width;

    // Left 25% = previous image, right 25% = next image, middle = expand
    if (tapZone < 0.25 && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    } else if (tapZone > 0.75 && currentImageIndex < totalImages - 1) {
      setCurrentImageIndex(prev => prev + 1);
    } else if (tapZone >= 0.25 && tapZone <= 0.75) {
      onTap?.();
    }
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-black"
      style={style}
      onClick={handleTap}
    >
      {/* Full-screen background image */}
      <div className="absolute inset-0">
        <img
          src={imageUrls[currentImageIndex]}
          alt={trip.destination.city}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
      </div>

      {/* Gradient overlays for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

      {/* Swipe overlay indicators */}
      {swipeDirection === 'left' && swipeProgress > 0 && (
        <div
          className="absolute inset-0 bg-red-500/60 z-20 flex items-center justify-center"
          style={{ opacity: Math.min(swipeProgress * 1.5, 1) }}
        >
          <div className="text-white text-5xl sm:text-7xl font-black tracking-wider rotate-[-15deg] border-4 border-white px-6 py-2 rounded-lg">
            NOPE
          </div>
        </div>
      )}
      {swipeDirection === 'right' && swipeProgress > 0 && (
        <div
          className="absolute inset-0 bg-green-500/60 z-20 flex items-center justify-center"
          style={{ opacity: Math.min(swipeProgress * 1.5, 1) }}
        >
          <div className="text-white text-5xl sm:text-7xl font-black tracking-wider rotate-[15deg] border-4 border-white px-6 py-2 rounded-lg">
            LIKE
          </div>
        </div>
      )}

      {/* Image carousel indicators - top */}
      {totalImages > 1 && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="flex gap-1">
            {imageUrls.map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-1 rounded-full transition-all ${
                  idx === currentImageIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top right: Price badge with loading state */}
      <div className="absolute top-8 right-4 z-10">
        {priceState?.loading ? (
          // Loading state - show what's loading
          <div className="flex flex-col items-end gap-1">
            <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              <span className="text-gray-600 text-sm font-medium">
                {priceState.realPrice ? formatPrice(priceState.realPrice, trip.pricing.currency) : 'Checking...'}
              </span>
            </div>
            <div className="flex gap-1">
              {priceState.hotelLoading ? (
                <span className="text-xs bg-blue-500/80 text-white px-2 py-0.5 rounded-full">🏨 loading</span>
              ) : priceState.hotelLoaded ? (
                <span className="text-xs bg-green-500/80 text-white px-2 py-0.5 rounded-full">🏨 ✓</span>
              ) : (
                <span className="text-xs bg-gray-500/80 text-white px-2 py-0.5 rounded-full">🏨 est.</span>
              )}
            </div>
          </div>
        ) : priceState?.overBudget ? (
          // Over budget warning
          <div className="flex flex-col items-end gap-1">
            <div className="bg-amber-500 px-4 py-2 rounded-full shadow-lg">
              <span className="font-bold text-white text-lg">
                {formatPrice(priceState.realPrice || trip.pricing.total, trip.pricing.currency)}
              </span>
            </div>
            <div className="bg-red-500/90 px-3 py-1 rounded-full shadow-lg">
              <span className="text-white text-xs font-medium">
                +{formatPrice(priceState.budgetDiff || 0, trip.pricing.currency)} over budget
              </span>
            </div>
          </div>
        ) : priceState?.loaded ? (
          // Price loaded and within budget
          <div className="flex flex-col items-end gap-1">
            <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
              <span className="font-bold text-gray-900 text-lg">
                {formatPrice(priceState.realPrice || trip.pricing.total, trip.pricing.currency)}
              </span>
            </div>
            <div className="bg-green-500/90 px-3 py-1 rounded-full shadow-lg">
              <span className="text-white text-xs font-medium">✓ Verified price</span>
            </div>
          </div>
        ) : (
          // Default/estimated price (no priceState provided or error)
          <div className="flex flex-col items-end gap-1">
            {trip.pricing.total > 0 ? (
              <>
                <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                  <span className="font-bold text-gray-900 text-lg">
                    ~{formatPrice(trip.pricing.total, trip.pricing.currency)}
                  </span>
                </div>
                <div className="bg-white/80 px-2 py-0.5 rounded-full">
                  <span className="text-gray-600 text-xs">Est. total</span>
                </div>
              </>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                <span className="text-gray-600 text-sm font-medium">Price on select</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top left: Badges */}
      <div className="absolute top-8 left-4 z-10 flex flex-col gap-1.5">
        {trip.matchScore >= 0.8 && (
          <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
            {Math.round(trip.matchScore * 100)}% match
          </div>
        )}
        {trip.perfectTiming && (
          <div className="bg-amber-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1.5">
            <span>🎯</span>
            <span>Perfect timing</span>
          </div>
        )}
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-5 pb-7">
        {/* Vibes row — colorful pills */}
        {trip.destination.vibes && trip.destination.vibes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {trip.destination.vibes.slice(0, 4).map((vibe, i) => (
              <span
                key={i}
                className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full"
                style={{
                  background: VIBE_STYLES[vibe]?.bg || 'rgba(255,255,255,0.2)',
                  color: VIBE_STYLES[vibe]?.text || '#fff',
                }}
              >
                {VIBE_STYLES[vibe]?.emoji || '✨'} {vibe}
              </span>
            ))}
          </div>
        )}

        {/* Destination name - large and bold */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-0.5 drop-shadow-lg leading-tight">
          {trip.destination.city}
        </h1>
        <p className="text-white/80 text-base mb-1.5 drop-shadow">
          {trip.destination.country}
        </p>

        {/* Tagline - the one-liner sell */}
        {trip.tagline && (
          <p className="text-white/70 text-sm italic mb-3 drop-shadow leading-snug">
            &ldquo;{trip.tagline}&rdquo;
          </p>
        )}

        {/* Highlights — the selling points */}
        {trip.highlights.length > 0 && (
          <div className="mb-3">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {trip.highlights.slice(0, 4).map((highlight, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-green-400 text-xs flex-shrink-0">✓</span>
                  <span className="text-white/90 text-[13px] truncate">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick info row — compact */}
        <div className="flex flex-wrap items-center gap-1.5 text-white/70 text-xs">
          <span className="flex items-center gap-1 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full">
            🗓 {trip.itinerary.days} nights
          </span>

          {trip.poiCount && trip.poiCount > 0 && (
            <span className="flex items-center gap-1 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full">
              📍 {trip.poiCount}+ places
            </span>
          )}

          {trip.transferInfo && (
            <span className="flex items-center gap-1 bg-amber-500/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-white">
              🚗 +{Math.round(trip.transferInfo.groundTransferMinutes / 60)}hr transfer
            </span>
          )}
        </div>

        {/* Tap hint */}
        <p className="text-white/40 text-[11px] mt-2.5 text-center">
          Tap for details · Swipe to explore
        </p>
      </div>

      {/* Invisible tap zones for carousel navigation */}
      {totalImages > 1 && isActive && (
        <>
          {/* Left tap zone indicator */}
          {currentImageIndex > 0 && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-black/30 p-2 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </div>
          )}
          {/* Right tap zone indicator */}
          {currentImageIndex < totalImages - 1 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-black/30 p-2 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
