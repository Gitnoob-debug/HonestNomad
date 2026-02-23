'use client';

import { useEffect, useMemo } from 'react';
import type { AlternativeTile, MatchedDestination } from '@/types/location';
import { ImageCarousel } from '@/components/flash/ImageCarousel';
import { VIBE_STYLES } from '@/lib/flash/vibeStyles';
import { getDestinationImagesById } from '@/lib/flash/destinationImages';
import { DESTINATIONS } from '@/lib/flash/destinations';
import { generateTagline } from '@/lib/flash/taglines';
import { generateCityPitch } from '@/lib/flash/cityPitches';

// ── DiscoverDetailModal ─────────────────────────────────────────────
// Full-screen detail view for a Discover destination tile.
// Follows the same layout as TripDetailModal but adapted for the
// leaner MatchedDestination data available from the Discover pipeline.

interface DiscoverDetailModalProps {
  tile: AlternativeTile | null;
  onClose: () => void;
  onExplore: (destination: MatchedDestination) => void;
}

// Role badge labels
const ROLE_LABELS: Record<string, { emoji: string; color: string }> = {
  best_match: { emoji: '★', color: 'bg-green-100 text-green-800' },
  closer: { emoji: '📍', color: 'bg-blue-100 text-blue-800' },
  budget: { emoji: '💰', color: 'bg-emerald-100 text-emerald-800' },
  similar_vibe: { emoji: '✨', color: 'bg-purple-100 text-purple-800' },
};

export function DiscoverDetailModal({ tile, onClose, onExplore }: DiscoverDetailModalProps) {
  // ── Escape key handler ──────────────────────────────────────────
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // ── Body scroll lock ────────────────────────────────────────────
  useEffect(() => {
    if (tile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [tile]);

  // ── Enrich data from full Destinations lookup ───────────────────
  const enriched = useMemo(() => {
    if (!tile) return null;
    const dest = tile.destination;
    const fullDest = DESTINATIONS.find(d => d.id === dest.id);
    const images = getDestinationImagesById(dest.id, 10);
    const tagline = fullDest ? generateTagline(fullDest) : null;
    const pitch = fullDest ? generateCityPitch(fullDest) : null;
    const bestMonths = fullDest?.bestMonths || [];

    return { dest, fullDest, images, tagline, pitch, bestMonths };
  }, [tile]);

  if (!tile || !enriched) return null;

  const { dest, images, tagline, pitch } = enriched;
  const roleMeta = ROLE_LABELS[tile.role] || { emoji: '🌍', color: 'bg-gray-100 text-gray-800' };

  // Check if current month is in bestMonths
  const currentMonth = new Date().getMonth() + 1;
  const isGoodTiming = enriched.bestMonths.includes(currentMonth);

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

          {/* ═══ HERO IMAGE CAROUSEL ═══ */}
          <div className="relative h-56 sm:h-80">
            <ImageCarousel
              images={images}
              primaryImage={dest.imageUrl}
              alt={dest.city}
              className="w-full h-full"
              showCaptions={true}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-5 right-5 pointer-events-none">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
                    {dest.city}
                  </h2>
                  <p className="text-white/80 text-sm mt-0.5">{dest.country}</p>
                </div>
                {tile.dailyCostPerPerson ? (
                  <div className="text-right">
                    <p className="text-white/60 text-xs">from</p>
                    <p className="text-2xl font-bold text-white drop-shadow-lg">
                      ~${tile.dailyCostPerPerson}
                    </p>
                    <p className="text-white/70 text-xs">/day per person</p>
                  </div>
                ) : tile.averageCost ? (
                  <div className="text-right">
                    <p className="text-white/60 text-xs">from</p>
                    <p className="text-2xl font-bold text-white drop-shadow-lg">
                      ~${tile.averageCost.toLocaleString()}
                    </p>
                    <p className="text-white/70 text-xs">/week</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* ═══ CONTENT ═══ */}
          <div className="p-5 sm:p-6">

            {/* Role badge + reasoning */}
            <div className="flex items-start gap-2 mb-4">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${roleMeta.color}`}>
                {roleMeta.emoji} {tile.label}
              </span>
              {tile.reasoning && (
                <p className="text-sm text-gray-500 pt-0.5">{tile.reasoning}</p>
              )}
            </div>

            {/* ═══ THE PITCH ═══ */}
            <div className="mb-6">
              {tagline && (
                <p className="text-primary-600 font-semibold text-sm uppercase tracking-wide mb-2">
                  {tagline}
                </p>
              )}
              {pitch && (
                <p className="text-gray-700 text-[15px] leading-relaxed">
                  {pitch}
                </p>
              )}

              {/* Good timing badge */}
              {isGoodTiming && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                  <span className="text-green-600 text-xs">☀️</span>
                  <span className="text-green-700 text-xs font-medium">Great time to visit — ideal weather right now</span>
                </div>
              )}
            </div>

            {/* ═══ VIBES ═══ */}
            {dest.vibes && dest.vibes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {dest.vibes.map((vibe) => (
                  <span
                    key={vibe}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700"
                  >
                    <span>{VIBE_STYLES[vibe]?.emoji || '✨'}</span>
                    <span className="capitalize">{vibe}</span>
                  </span>
                ))}
              </div>
            )}

            {/* ═══ WHAT YOU'LL EXPERIENCE ═══ */}
            {dest.highlights && dest.highlights.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">What you&apos;ll experience</h3>
                <div className="space-y-2.5">
                  {dest.highlights.map((highlight, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center mt-0.5">
                        <span className="text-primary-600 text-xs font-bold">{i + 1}</span>
                      </div>
                      <span className="text-gray-700 text-[15px]">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ COST INFO ═══ */}
            {enriched.fullDest?.dailyCosts ? (
              <div className="mb-6 p-4 bg-primary-50 rounded-xl">
                <p className="text-xs text-primary-500 font-medium uppercase tracking-wide mb-3">Daily budget (per person)</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">🍽 Food &amp; dining</span>
                    <span className="text-sm font-semibold text-gray-800">${enriched.fullDest.dailyCosts.foodPerDay}/day</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">🎭 Activities &amp; tours</span>
                    <span className="text-sm font-semibold text-gray-800">${enriched.fullDest.dailyCosts.activitiesPerDay}/day</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">🚕 Getting around</span>
                    <span className="text-sm font-semibold text-gray-800">${enriched.fullDest.dailyCosts.transportPerDay}/day</span>
                  </div>
                  <div className="border-t border-primary-200 pt-2 mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary-700">Total (excl. hotel)</span>
                    <span className="text-lg font-bold text-primary-700">
                      ~${enriched.fullDest.dailyCosts.foodPerDay + enriched.fullDest.dailyCosts.activitiesPerDay + enriched.fullDest.dailyCosts.transportPerDay}/day
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-primary-400 mt-2">Mid-range estimates. Hotel costs shown during booking.</p>
              </div>
            ) : tile.averageCost ? (
              <div className="mb-6 p-4 bg-primary-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-primary-500 font-medium uppercase tracking-wide">Estimated cost</p>
                    <p className="text-2xl font-bold text-primary-700">
                      ~${tile.averageCost.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-primary-600 font-medium">per week</p>
                    <p className="text-xs text-primary-500">for 2 adults</p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* ═══ CTA ═══ */}
            <button
              onClick={() => onExplore(dest)}
              className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors text-lg shadow-lg shadow-primary-600/20"
            >
              Explore {dest.city}
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              Build your personalized trip
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
