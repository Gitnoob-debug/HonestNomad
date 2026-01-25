'use client';

import { useState } from 'react';
import { FlashTripPackage } from '@/types/flash';

interface PriceState {
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
          // Loading state
          <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            <span className="text-gray-600 text-sm font-medium">Checking price...</span>
          </div>
        ) : priceState?.overBudget ? (
          // Over budget warning
          <div className="flex flex-col items-end gap-1">
            <div className="bg-amber-500 px-4 py-2 rounded-full shadow-lg">
              <span className="font-bold text-white text-lg">
                {formatPrice(trip.pricing.total, trip.pricing.currency)}
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
                {formatPrice(trip.pricing.total, trip.pricing.currency)}
              </span>
            </div>
            <div className="bg-green-500/90 px-3 py-1 rounded-full shadow-lg">
              <span className="text-white text-xs font-medium">✓ Within budget</span>
            </div>
          </div>
        ) : (
          // Default/estimated price (no priceState provided or error)
          <div className="flex flex-col items-end gap-1">
            <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
              <span className="font-bold text-gray-900 text-lg">
                ~{formatPrice(trip.pricing.total, trip.pricing.currency)}
              </span>
            </div>
            <div className="bg-white/80 px-2 py-0.5 rounded-full">
              <span className="text-gray-600 text-xs">Est. price</span>
            </div>
          </div>
        )}
      </div>

      {/* Top left: Match score (if high) */}
      {trip.matchScore >= 0.8 && (
        <div className="absolute top-8 left-4 z-10">
          <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
            {Math.round(trip.matchScore * 100)}% match
          </div>
        </div>
      )}

      {/* Bottom content - minimal overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 pb-8">
        {/* Destination name - large and bold */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-1 drop-shadow-lg">
          {trip.destination.city}
        </h1>
        <p className="text-white/90 text-lg mb-4 drop-shadow">
          {trip.destination.country}
        </p>

        {/* Quick info row */}
        <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm">
          {/* Duration */}
          <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {trip.itinerary.days} nights
          </span>

          {/* Flight type */}
          <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            {trip.flight.outbound.stops === 0 ? 'Direct' : `${trip.flight.outbound.stops} stop`}
          </span>

          {/* Transfer info badge if applicable */}
          {trip.transferInfo && (
            <span className="flex items-center gap-1.5 bg-amber-500/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              +{Math.round(trip.transferInfo.groundTransferMinutes / 60)}hr {trip.transferInfo.transferType}
            </span>
          )}
        </div>

        {/* Highlights - as subtle tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {trip.highlights.slice(0, 3).map((highlight, i) => (
            <span
              key={i}
              className="text-white/70 text-xs bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full"
            >
              {highlight}
            </span>
          ))}
        </div>

        {/* Tap hint */}
        <p className="text-white/50 text-xs mt-4 text-center">
          Tap center to see details
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
