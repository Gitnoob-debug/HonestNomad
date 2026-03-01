'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { HotelOption } from '@/lib/liteapi/types';
import { BlurUpImage } from '@/components/ui/BlurUpImage';
import { formatTravelTime } from '@/lib/hotels/formatTravelTime';

// ── HotelTile ──────────────────────────────────────────────────────
// Immersive hotel card with conversion-optimized layout:
// - Multi-image carousel (tap left/right edges, swipe, progress bars)
// - "Recommended" treatment for pre-selected hotel (walk-time hero, glow ring)
// - Walk-time to landmark as hero metric (our unique value prop)
// - Differentiated CTAs: "Book this hotel" vs "Select"

export type HotelTileRole = 'closest' | 'budget' | 'high_end';

interface HotelTileProps {
  hotel: HotelOption;
  role: HotelTileRole;
  label: string;
  landmarkLat: number;
  landmarkLng: number;
  onSelect: (hotel: HotelOption) => void;
  isRecommended?: boolean;
}

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

function renderStars(stars: number): string {
  return '★'.repeat(Math.min(stars, 5));
}

export function HotelTile({ hotel, role, label, landmarkLat, landmarkLng, onSelect, isRecommended = false }: HotelTileProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Build image list — prefer HD images, fall back to standard photos, then mainPhoto
  const hdPhotos = hotel.photosHd && hotel.photosHd.length > 0 ? hotel.photosHd : [];
  const stdPhotos = hotel.photos.length > 0 ? hotel.photos : hotel.mainPhoto ? [hotel.mainPhoto] : [];
  const allPhotos = hdPhotos.length > 0 ? hdPhotos : stdPhotos;
  const imageUrls = allPhotos.slice(0, 6);
  const fallbackImg = hotel.mainPhoto || '';
  const totalImages = imageUrls.length;
  const hasCarousel = totalImages > 1;

  // Travel time from landmark
  const travelTime = formatTravelTime(hotel.distanceFromZoneCenter);

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

  // ── Carousel navigation (tap edges or swipe) ────────────────
  const handleImageClick = useCallback((e: React.MouseEvent) => {
    if (!hasCarousel) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const tapZone = x / rect.width;

    if (tapZone < 0.35 && currentIndex > 0) {
      e.stopPropagation();
      setCurrentIndex(prev => prev - 1);
    } else if (tapZone > 0.65 && currentIndex < totalImages - 1) {
      e.stopPropagation();
      setCurrentIndex(prev => prev + 1);
    }
  }, [hasCarousel, currentIndex, totalImages]);

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

  return (
    <div className={`group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all text-left w-full ${
      isRecommended
        ? 'h-80 sm:h-full ring-2 ring-primary-400/60 shadow-lg shadow-primary-500/20'
        : 'h-72 sm:h-80'
    }`}>
      {/* Image area — tap edges to browse carousel */}
      <div
        onClick={handleImageClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="absolute inset-0 cursor-pointer"
      >
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
        <div className="absolute top-2 left-2 right-2 z-10 pointer-events-none">
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

      {/* Badge (top left) — Recommended vs Role */}
      <div className={`absolute ${hasCarousel ? 'top-4' : 'top-2'} left-2 z-10 pointer-events-none`}>
        {isRecommended ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-600 text-white shadow-lg">
            ⭐ Recommended
          </span>
        ) : (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ROLE_BADGE_STYLES[role]}`}>
            {ROLE_ICONS[role]} {label}
          </span>
        )}
      </div>

      {/* Price badge (top right) */}
      <div className={`absolute ${hasCarousel ? 'top-4' : 'top-2'} right-2 z-10 pointer-events-none`}>
        <span className="bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
          ${hotel.pricePerNight}/night
        </span>
      </div>

      {/* Bottom content overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-3">
        {/* Stars + rating + chain */}
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
          {hotel.chain && (
            <span className="text-white/50 text-[10px]">&middot; {hotel.chain}</span>
          )}
        </div>

        {/* RECOMMENDED: Walk-time hero ABOVE hotel name */}
        {isRecommended && travelTime && (
          <p className="text-white text-base font-bold drop-shadow-lg mb-0.5">
            {travelTime.emoji} {travelTime.label}
          </p>
        )}

        {/* Hotel name */}
        <h3 className={`font-bold text-white leading-tight drop-shadow-lg truncate ${
          isRecommended ? 'text-xl' : 'text-lg'
        }`}>
          {hotel.name}
        </h3>

        {/* ALTERNATIVE: Walk-time below name, smaller */}
        {!isRecommended && travelTime && (
          <p className={`text-xs drop-shadow mt-0.5 ${
            travelTime.mode === 'walk' ? 'text-green-300' : 'text-white/70'
          }`}>
            {travelTime.emoji} {travelTime.label}
          </p>
        )}

        {/* Cancel micro-badge */}
        {hotel.cancelDeadline ? (
          <p className="text-[10px] text-green-300 mt-0.5 truncate">
            ✓ {hotel.cancelDeadline}
          </p>
        ) : hotel.refundable === false ? (
          <p className="text-[10px] text-red-300 mt-0.5">
            Non-refundable
          </p>
        ) : null}

        {/* Review snippet — recommended tile only */}
        {isRecommended && hotel.reviews && hotel.reviews.length > 0 && (
          <p className="text-[10px] text-white/70 italic mt-0.5 truncate">
            &ldquo;{hotel.reviews[0].headline || hotel.reviews[0].pros}&rdquo;
          </p>
        )}

        {/* Amenities + CTA row */}
        <div className="flex items-end justify-between mt-1.5">
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {hotel.amenities.slice(0, 3).map((amenity, i) => (
              <span
                key={i}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-white/20 text-white/90"
              >
                {amenity}
              </span>
            ))}
          </div>

          {/* Differentiated CTA */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(hotel);
            }}
            className={`ml-2 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-lg flex-shrink-0 transition-colors ${
              isRecommended
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-white text-gray-900 hover:bg-white/90'
            }`}
          >
            {isRecommended ? 'Book this hotel' : 'Select'}
          </button>
        </div>
      </div>

      {/* Hover glow */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors rounded-2xl pointer-events-none" />
    </div>
  );
}
