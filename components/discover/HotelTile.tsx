'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { HotelOption } from '@/lib/liteapi/types';
import { BlurUpImage } from '@/components/ui/BlurUpImage';

// ── HotelTile ──────────────────────────────────────────────────────
// Immersive hotel card matching the DestinationTile aesthetic:
// - Multi-image carousel (tap left/right edges, swipe, progress bars)
// - Center tap selects hotel
// - Full-bleed image, gradient overlay, role badge, price, rating

export type HotelTileRole = 'closest' | 'budget' | 'high_end';

interface HotelTileProps {
  hotel: HotelOption;
  role: HotelTileRole;
  label: string; // "Closest to Spot" | "Best Value" | "Premium Pick"
  landmarkLat: number;
  landmarkLng: number;
  onSelect: (hotel: HotelOption) => void;
}

// Role badge colors
const ROLE_BADGE_STYLES: Record<HotelTileRole, string> = {
  closest: 'bg-blue-500/90 text-white',
  budget: 'bg-green-500/90 text-white',
  high_end: 'bg-purple-500/90 text-white',
};

const ROLE_ICONS: Record<HotelTileRole, string> = {
  closest: '📍',
  budget: '💰',
  high_end: '✨',
};

/**
 * Calculate distance in a human-readable format
 */
function formatDistance(meters: number | undefined): string {
  if (!meters) return '';
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

/**
 * Render star rating as stars
 */
function renderStars(stars: number): string {
  return '★'.repeat(Math.min(stars, 5));
}

export function HotelTile({ hotel, role, label, landmarkLat, landmarkLng, onSelect }: HotelTileProps) {
  // ── Image carousel state ──────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Use hotel photos for carousel
  const imageUrls = hotel.photos.length > 0 ? hotel.photos.slice(0, 6) : hotel.mainPhoto ? [hotel.mainPhoto] : [];
  const fallbackImg = hotel.mainPhoto || '';
  const totalImages = imageUrls.length;
  const hasCarousel = totalImages > 1;

  // Preload next 2 images
  useEffect(() => {
    if (!hasCarousel) return;
    for (let i = 1; i <= 2; i++) {
      const nextImg = imageUrls[currentIndex + i];
      if (nextImg) {
        const preload = new Image();
        preload.src = nextImg;
      }
    }
  }, [currentIndex, hasCarousel, imageUrls]);

  // ── Tap zone handler (matches DestinationTile pattern) ──────
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!hasCarousel) {
      onSelect(hotel);
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const tapZone = x / rect.width;

    if (tapZone < 0.30 && currentIndex > 0) {
      e.stopPropagation();
      setCurrentIndex(prev => prev - 1);
    } else if (tapZone > 0.70 && currentIndex < totalImages - 1) {
      e.stopPropagation();
      setCurrentIndex(prev => prev + 1);
    } else {
      onSelect(hotel);
    }
  }, [hasCarousel, currentIndex, totalImages, onSelect, hotel]);

  // ── Swipe gesture support ──────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !hasCarousel) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) < 30 || Math.abs(dy) > Math.abs(dx)) return;

    if (dx < 0 && currentIndex < totalImages - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (dx > 0 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [hasCarousel, currentIndex, totalImages]);

  const distanceText = formatDistance(hotel.distanceFromZoneCenter);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all text-left w-full h-72 sm:h-80 cursor-pointer"
    >
      {/* Full-bleed image */}
      <div className="absolute inset-0">
        <BlurUpImage
          key={imageUrls[currentIndex] || fallbackImg}
          src={imageUrls[currentIndex] || fallbackImg}
          alt={hotel.name}
          className="w-full h-full"
          fallbackGradient="bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900"
          fallbackEmoji="🏨"
        />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

      {/* Image progress bars */}
      {hasCarousel && (
        <div className="absolute top-2 left-2 right-2 z-10">
          <div className="flex gap-0.5">
            {imageUrls.map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-0.5 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Role badge (top left) */}
      <div className={`absolute ${hasCarousel ? 'top-4' : 'top-2'} left-2 z-10`}>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ROLE_BADGE_STYLES[role]}`}>
          {ROLE_ICONS[role]} {label}
        </span>
      </div>

      {/* Price badge (top right) */}
      <div className={`absolute ${hasCarousel ? 'top-4' : 'top-2'} right-2 z-10`}>
        <span className="bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
          ${hotel.pricePerNight}/night
        </span>
      </div>

      {/* Bottom content overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-3">
        {/* Stars */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-yellow-400 text-xs">{renderStars(hotel.stars)}</span>
          {hotel.rating > 0 && (
            <span className="bg-primary-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
              {hotel.rating.toFixed(1)}
            </span>
          )}
          {hotel.reviewCount > 0 && (
            <span className="text-white/60 text-[10px]">
              ({hotel.reviewCount.toLocaleString()} reviews)
            </span>
          )}
        </div>

        {/* Hotel name */}
        <h3 className="text-lg font-bold text-white leading-tight drop-shadow-lg truncate">
          {hotel.name}
        </h3>

        {/* Distance from landmark */}
        {distanceText && (
          <p className="text-white/70 text-xs drop-shadow mt-0.5">
            {distanceText}
          </p>
        )}

        {/* Key amenities — up to 3 */}
        {hotel.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {hotel.amenities.slice(0, 3).map((amenity, i) => (
              <span
                key={i}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-white/20 text-white/90"
              >
                {amenity}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hover glow */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded-2xl pointer-events-none" />
    </div>
  );
}
