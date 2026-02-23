'use client';

import { useState } from 'react';
import { FlashTripPackage } from '@/types/flash';
import { BlurUpImage } from '@/components/ui/BlurUpImage';
import { VIBE_STYLES } from '@/lib/flash/vibeStyles';

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
      {/* Full-screen background image with blur-up loading + Ken Burns */}
      <div className="absolute inset-0">
        <BlurUpImage
          key={imageUrls[currentImageIndex]}
          src={imageUrls[currentImageIndex]}
          alt={trip.destination.city}
          className="w-full h-full"
          fallbackGradient="bg-gradient-to-br from-gray-800 via-gray-900 to-black"
          fallbackEmoji={VIBE_STYLES[trip.destination.vibes?.[0] || '']?.emoji || '✈️'}
          enableKenBurns={isActive}
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

      {/* Top right: Price badge — per-night is the hero number */}
      <div className="absolute top-8 right-4 z-10">
        {priceState?.loading ? (
          // Loading — show spinner with whatever partial price we have
          <div className="bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-white/80 text-sm font-medium">
              {trip.hotel?.pricePerNight
                ? `${formatPrice(trip.hotel.pricePerNight, trip.pricing.currency)}/night`
                : 'Checking prices...'}
            </span>
          </div>
        ) : trip.hotel ? (
          // Hotel loaded — show per-night price + hotel name
          <div className="flex flex-col items-end gap-1.5">
            <div className={`px-4 py-2.5 rounded-2xl shadow-lg ${
              priceState?.overBudget
                ? 'bg-amber-500'
                : 'bg-black/60 backdrop-blur-md'
            }`}>
              <span className={`font-bold text-lg ${priceState?.overBudget ? 'text-white' : 'text-white'}`}>
                {formatPrice(trip.hotel.pricePerNight, trip.pricing.currency)}
              </span>
              <span className="text-white/70 text-sm">/night</span>
            </div>
            <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-xl max-w-[200px]">
              <p className="text-white/90 text-[11px] font-medium truncate">
                🏨 {trip.hotel.name}
              </p>
              <p className="text-white/50 text-[10px]">
                {'★'.repeat(trip.hotel.stars)} · {trip.hotel.rating.toFixed(1)} rating
              </p>
            </div>
          </div>
        ) : trip.pricing.total > 0 ? (
          // Estimate only — no hotel data yet
          <div className="bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg">
            <span className="text-white/60 text-sm">from </span>
            <span className="font-bold text-white text-lg">
              ~{formatPrice(Math.round(trip.pricing.hotel / Math.max(trip.itinerary.days, 1)), trip.pricing.currency)}
            </span>
            <span className="text-white/60 text-sm">/night</span>
          </div>
        ) : (
          <div className="bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg">
            <span className="text-white/70 text-sm font-medium">Price on select</span>
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
