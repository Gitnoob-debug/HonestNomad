'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AlternativeTile } from '@/types/location';
import { BlurUpImage } from '@/components/ui/BlurUpImage';
import { VIBE_STYLES } from '@/lib/flash/vibeStyles';
import { getDestinationImagesById, getPrimaryDestinationImage } from '@/lib/flash/destinationImages';

// ── DestinationTile ─────────────────────────────────────────────────
// Immersive card matching the Flash swipe card aesthetic:
// - Multi-image carousel (tap left/right edges, swipe, progress bars)
// - Center tap opens detail modal
// - Full-bleed image, gradient overlay, vibes, highlights

interface DestinationTileProps {
  tile: AlternativeTile;
  onSelect: (tile: AlternativeTile) => void;
  isBestMatch?: boolean;
}

// Role badge colors — dark glass for most, green accent for best match
const ROLE_BADGE_STYLES: Record<string, string> = {
  best_match: 'bg-green-500/90 text-white',
  closer: 'bg-black/50 backdrop-blur-sm text-white',
  budget: 'bg-black/50 backdrop-blur-sm text-white',
  similar_vibe: 'bg-black/50 backdrop-blur-sm text-white',
};

export function DestinationTile({ tile, onSelect, isBestMatch = false }: DestinationTileProps) {
  const dest = tile.destination;

  // ── Image carousel state ──────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Load carousel images — up to 6 per tile (limits network for 4-tile grid)
  const carouselImages = getDestinationImagesById(dest.id, 6);
  const fallbackImg = getPrimaryDestinationImage(dest.id) || dest.imageUrl || '';

  // Build image URL list: carousel images if available, else single fallback
  const imageUrls = carouselImages.length > 0
    ? carouselImages.map(img => img.url)
    : fallbackImg ? [fallbackImg] : [];

  const totalImages = imageUrls.length;
  const hasCarousel = totalImages > 1;

  // Preload next 2 images when carousel moves
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

  // ── Tap zone handler (matches ImmersiveSwipeCard pattern) ──────
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!hasCarousel) {
      // No carousel — any click opens detail
      onSelect(tile);
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const tapZone = x / rect.width;

    if (tapZone < 0.30 && currentIndex > 0) {
      // Left 30% — previous image
      e.stopPropagation();
      setCurrentIndex(prev => prev - 1);
    } else if (tapZone > 0.70 && currentIndex < totalImages - 1) {
      // Right 30% — next image
      e.stopPropagation();
      setCurrentIndex(prev => prev + 1);
    } else {
      // Center 40% — open detail modal
      onSelect(tile);
    }
  }, [hasCarousel, currentIndex, totalImages, onSelect, tile]);

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

    // Only horizontal swipes (ignore vertical scroll)
    if (Math.abs(dx) < 30 || Math.abs(dy) > Math.abs(dx)) return;

    if (dx < 0 && currentIndex < totalImages - 1) {
      // Swipe left → next image
      setCurrentIndex(prev => prev + 1);
    } else if (dx > 0 && currentIndex > 0) {
      // Swipe right → previous image
      setCurrentIndex(prev => prev - 1);
    }
  }, [hasCarousel, currentIndex, totalImages]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all text-left w-full h-56 cursor-pointer"
    >
      {/* Full-bleed image */}
      <div className="absolute inset-0">
        <BlurUpImage
          key={imageUrls[currentIndex] || fallbackImg}
          src={imageUrls[currentIndex] || fallbackImg}
          alt={dest.city}
          className="w-full h-full"
          fallbackGradient="bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900"
          fallbackEmoji={VIBE_STYLES[dest.vibes?.[0] || '']?.emoji || '✈️'}
        />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

      {/* ── Image progress bars (top) ── */}
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

      {/* ── Role badge (top left) ── */}
      <div className={`absolute ${hasCarousel ? 'top-4' : 'top-2'} left-2 z-10`}>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ROLE_BADGE_STYLES[tile.role] || 'bg-black/50 text-white'}`}>
          {isBestMatch ? '★ ' : ''}{tile.label}
        </span>
      </div>

      {/* ── Cost badge (top right) ── */}
      {tile.averageCost && (
        <div className={`absolute ${hasCarousel ? 'top-4' : 'top-2'} right-2 z-10`}>
          <span className="bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
            ~${tile.averageCost.toLocaleString()}/wk
          </span>
        </div>
      )}

      {/* ── Bottom content overlay ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-3">
        {/* Vibe pills — up to 3 */}
        {dest.vibes && dest.vibes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {dest.vibes.slice(0, 3).map((vibe, i) => (
              <span
                key={i}
                className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
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

        {/* City name */}
        <h3 className="text-lg font-bold text-white leading-tight drop-shadow-lg">
          {dest.city}
        </h3>
        <p className="text-white/70 text-xs drop-shadow">
          {dest.country}
        </p>

        {/* Highlights — up to 2 */}
        {dest.highlights && dest.highlights.length > 0 && (
          <div className="mt-1.5 space-y-0.5">
            {dest.highlights.slice(0, 2).map((highlight, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-green-400 text-[10px] flex-shrink-0">✓</span>
                <span className="text-white/80 text-[11px] truncate">{highlight}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hover glow */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded-2xl pointer-events-none" />
    </div>
  );
}
