'use client';

import { Suspense, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { ItineraryMap } from '@/components/flash/ItineraryMap';
import { PackageMiniMap } from '@/components/flash/PackageMiniMap';
import { TripIntelligence } from '@/components/flash/TripIntelligence';
import { Spinner } from '@/components/ui';
import { BlurUpImage } from '@/components/ui/BlurUpImage';
import { format } from 'date-fns';
// DirectionsLeg type retained for future use (walk-time calculations)
import type { FlashTripPackage } from '@/types/flash';
import {
  generateSampleItinerary,
  generateTrendyItinerary,
  generateItineraryAuto,
  hasRealPOIData,
  type ItineraryDay,
  type SimplePathChoice
} from '@/lib/flash/itinerary-generator';
import { saveDraftTrip, getDraftTrip } from '@/lib/flash/draft-storage';
import { DESTINATIONS } from '@/lib/flash/destinations';
import type { HotelOption } from '@/lib/liteapi/types';
import type { LiteAPIReview } from '@/lib/liteapi/types';
import { useRevealedPreferences } from '@/hooks/useRevealedPreferences';
import { calculateHotelZone, clusterPOIsGeographic } from '@/lib/flash/hotelZoneClustering';

type BookingStep = 'choice' | 'itinerary' | 'hotels' | 'checkout' | 'package';
type ItineraryType = SimplePathChoice | null;

// Step progress configuration
const BOOKING_STEPS: { key: BookingStep; label: string; emoji: string }[] = [
  { key: 'choice', label: 'Vibe', emoji: '✨' },
  { key: 'itinerary', label: 'Explore', emoji: '🗺️' },
  { key: 'hotels', label: 'Stay', emoji: '🏨' },
  { key: 'checkout', label: 'Review', emoji: '📋' },
  { key: 'package', label: 'Package', emoji: '🎁' },
];

function StepProgressTrail({ currentStep }: { currentStep: BookingStep }) {
  const currentIndex = BOOKING_STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="flex flex-col items-center gap-0">
      {BOOKING_STEPS.map((stepConfig, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === BOOKING_STEPS.length - 1;

        return (
          <div key={stepConfig.key} className="flex flex-col items-center">
            {/* Dot */}
            <div className="relative group">
              <div
                className={`w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-primary-500/80'
                    : isCurrent
                      ? 'bg-primary-500 shadow-lg shadow-primary-500/40 ring-[3px] ring-primary-400/30'
                      : 'bg-white/10 border border-white/20'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isCurrent ? (
                  <span className="text-[14px]">{stepConfig.emoji}</span>
                ) : (
                  <span className="text-[10px] text-white/40 font-medium">{index + 1}</span>
                )}
              </div>
              {/* Label — always visible for completed + current, hover for future */}
              <span className={`absolute left-10 top-1/2 -translate-y-1/2 text-xs font-medium whitespace-nowrap px-2 py-0.5 rounded transition-opacity duration-200 ${
                isCurrent ? 'opacity-100 text-white' : isCompleted ? 'opacity-100 text-white/70' : 'opacity-0 group-hover:opacity-100 text-white/40'
              }`}>
                {stepConfig.label}
              </span>
            </div>
            {/* Connector line */}
            {!isLast && (
              <div
                className={`w-[3px] h-8 rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-primary-500/60' : 'bg-white/15'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Horizontal progress bar for non-map steps (choice, hotels, checkout, package) */
function StepProgressBar({ currentStep }: { currentStep: BookingStep; variant?: 'default' | 'overlay' }) {
  const currentIndex = BOOKING_STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="w-full px-6 sm:px-10">
      <div className="flex items-start">
        {BOOKING_STEPS.map((stepConfig, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === BOOKING_STEPS.length - 1;
          const connectorFilled = index < currentIndex;

          return (
            <div key={stepConfig.key} className={`flex items-start ${isLast ? '' : 'flex-1'}`}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={`w-[22px] h-[22px] rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary-500 shadow-lg shadow-primary-500/30'
                      : isCurrent
                        ? 'bg-primary-500 shadow-lg shadow-primary-500/40 ring-[3px] ring-primary-400/30'
                        : 'bg-white/10 border border-white/20'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-[10px]">{stepConfig.emoji}</span>
                  )}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap transition-colors duration-300 ${
                  isCompleted ? 'text-primary-400' : isCurrent ? 'text-white' : 'text-white/30'
                }`}>
                  {stepConfig.label}
                </span>
              </div>
              {!isLast && (
                <div className="flex-1 flex items-center h-[22px]">
                  <div
                    className={`w-full h-[2px] rounded-full transition-all duration-500 ${connectorFilled ? '' : 'bg-white/10'}`}
                    style={connectorFilled ? { background: 'linear-gradient(to right, #60a5fa, #818cf8)' } : undefined}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Path configuration with metadata
const PATH_CONFIG: Record<SimplePathChoice, {
  emoji: string;
  name: string;
  description: string;
  color: string;
  hoverColor: string;
}> = {
  classic: {
    emoji: '🏛️',
    name: 'Classic Must-See',
    description: 'Hit all the iconic landmarks and famous spots. The full experience every traveler needs.',
    color: 'bg-amber-500/20',
    hoverColor: 'group-hover:text-amber-300',
  },
  foodie: {
    emoji: '🍽️',
    name: 'Foodie Paradise',
    description: 'Best restaurants, markets, and local cuisine. Eat your way through the city.',
    color: 'bg-orange-500/20',
    hoverColor: 'group-hover:text-orange-300',
  },
  adventure: {
    emoji: '🏔️',
    name: 'Adventure Seeker',
    description: 'Outdoor activities, day trips, and exciting experiences for the thrill-seeker.',
    color: 'bg-emerald-500/20',
    hoverColor: 'group-hover:text-emerald-300',
  },
  cultural: {
    emoji: '🎭',
    name: 'Culture & Arts',
    description: 'Museums, galleries, theaters, and historical sites. Immerse in local culture.',
    color: 'bg-purple-500/20',
    hoverColor: 'group-hover:text-purple-300',
  },
  relaxation: {
    emoji: '🌿',
    name: 'Chill & Relaxed',
    description: 'Parks, gardens, spas, and peaceful spots. Take it slow and unwind.',
    color: 'bg-teal-500/20',
    hoverColor: 'group-hover:text-teal-300',
  },
  nightlife: {
    emoji: '🌙',
    name: 'Night Owl',
    description: 'Best bars, clubs, and late-night spots. Experience the city after dark.',
    color: 'bg-indigo-500/20',
    hoverColor: 'group-hover:text-indigo-300',
  },
  trendy: {
    emoji: '✨',
    name: 'Trendy Local Guide',
    description: 'Hidden gems, local favorites, and off-the-beaten-path spots tourists miss.',
    color: 'bg-pink-500/20',
    hoverColor: 'group-hover:text-pink-300',
  },
};

const ALL_PATHS: SimplePathChoice[] = ['classic', 'foodie', 'adventure', 'cultural', 'relaxation', 'nightlife', 'trendy'];

// Time-of-day config for visual day planner timeline
const TIME_OF_DAY_CONFIG: Record<string, { emoji: string; label: string; time: string; order: number }> = {
  morning:   { emoji: '\u{1F305}', label: 'Morning',   time: '9am\u201312pm', order: 1 },
  afternoon: { emoji: '\u2600\uFE0F', label: 'Afternoon', time: '12pm\u20135pm', order: 2 },
  evening:   { emoji: '\u{1F319}', label: 'Evening',   time: '5pm\u201310pm', order: 3 },
  night:     { emoji: '\u{1F303}', label: 'Night',     time: '10pm+',    order: 4 },
  any:       { emoji: '\u23F0', label: 'Anytime',   time: '',         order: 5 },
};

// Quick navigator config — adapts label/emoji per path type
const QUICK_NAV_CONFIG: Record<SimplePathChoice, { emoji: string; label: string }> = {
  classic: { emoji: '📸', label: 'Photo Route' },
  foodie: { emoji: '🍴', label: 'Food Crawl' },
  adventure: { emoji: '🥾', label: 'Trail Guide' },
  cultural: { emoji: '🎭', label: 'Culture Trail' },
  relaxation: { emoji: '🧘', label: 'Zen Path' },
  nightlife: { emoji: '🌙', label: 'Night Route' },
  trendy: { emoji: '✨', label: 'Local Trail' },
};

/** Parse duration strings like "30-60 min", "1-2 hours" and return the MAX value in minutes */
function estimateTotalMinutes(stops: { duration?: string }[]): number {
  let total = 0;
  stops.forEach(s => {
    if (!s.duration) { total += 45; return; } // default 45min
    const d = s.duration.toLowerCase();
    // "1-2 hours" → 120, "2-3 hours" → 180
    const hourMatch = d.match(/(\d+)\s*-\s*(\d+)\s*hour/);
    if (hourMatch) { total += parseInt(hourMatch[2]) * 60; return; }
    // "~2 hours", "2 hours"
    const singleHour = d.match(/(\d+)\s*hour/);
    if (singleHour) { total += parseInt(singleHour[1]) * 60; return; }
    // "30-60 min" → 60
    const minMatch = d.match(/(\d+)\s*-\s*(\d+)\s*min/);
    if (minMatch) { total += parseInt(minMatch[2]); return; }
    // "30 min", "~45 min"
    const singleMin = d.match(/(\d+)\s*min/);
    if (singleMin) { total += parseInt(singleMin[1]); return; }
    total += 45; // fallback
  });
  return total;
}

// Calculate distance between two coordinates in meters using Haversine formula
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Format distance for display
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

// Proxy Google Places image URLs through our API to keep the key secure
function getProxiedImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;
  // Only proxy Google Places URLs
  if (imageUrl.startsWith('https://places.googleapis.com/')) {
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  }
  return imageUrl;
}

// Get nearby stops within a radius (default 800m ~10 min walk)
function getNearbyStops(
  currentStop: ItineraryStop,
  allStops: ItineraryStop[],
  maxDistance: number = 800
): Array<{ stop: ItineraryStop; distance: number }> {
  return allStops
    .filter(stop => stop.id !== currentStop.id)
    .map(stop => ({
      stop,
      distance: getDistanceMeters(
        currentStop.latitude, currentStop.longitude,
        stop.latitude, stop.longitude
      )
    }))
    .filter(item => item.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4); // Max 4 nearby spots
}

interface ItineraryStop {
  id: string;
  name: string;
  description: string;
  type: 'landmark' | 'restaurant' | 'activity' | 'accommodation' | 'transport' | 'museum' | 'park' | 'cafe' | 'bar' | 'market' | 'nightclub' | 'viewpoint' | 'neighborhood';
  latitude: number;
  longitude: number;
  duration?: string;
  imageUrl?: string;
  day: number;
  // Extended Google Places data
  googleRating?: number;
  googleReviewCount?: number;
  googlePrice?: number;
  address?: string;
  websiteUrl?: string;
  googleMapsUrl?: string;
  bestTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
  category?: string;
}

// ─── POICarousel: Horizontal scrollable POI cards overlaying map ───
const CAROUSEL_EMOJIS: Record<string, string> = {
  landmark: '🏛️', restaurant: '🍽️', activity: '🎯', museum: '🎨',
  park: '🌳', cafe: '☕', bar: '🍸', market: '🛒',
  viewpoint: '🌄', nightclub: '🎉', accommodation: '🏨', transport: '✈️', neighborhood: '🏘️',
};

function POICarousel({
  stops,
  activeStopId,
  onStopSelect,
  hotelLocation,
}: {
  stops: ItineraryStop[];
  activeStopId: string | null;
  onStopSelect: (stopId: string) => void;
  hotelLocation?: { latitude: number; longitude: number } | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active card
  useEffect(() => {
    if (!activeStopId || !scrollRef.current) return;
    const card = scrollRef.current.querySelector(`[data-stop-id="${activeStopId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeStopId]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto px-4 pb-4 pt-2 scrollbar-hide"
    >
      {stops.map((stop, index) => {
        const isActive = activeStopId === stop.id;
        // Haversine walk estimate from hotel
        let walkMin: number | null = null;
        if (hotelLocation) {
          const dist = getDistanceMeters(
            hotelLocation.latitude, hotelLocation.longitude,
            stop.latitude, stop.longitude
          );
          walkMin = Math.round(dist / 80); // ~80m per minute walking
        }

        return (
          <button
            key={stop.id}
            data-stop-id={stop.id}
            onClick={() => onStopSelect(stop.id)}
            className={`flex-shrink-0 w-[220px] h-[180px] rounded-xl overflow-hidden text-left transition-all relative ${
              isActive
                ? 'ring-2 ring-primary-400 scale-[1.03] shadow-lg shadow-primary-500/20'
                : 'ring-1 ring-white/10 hover:ring-white/20'
            }`}
          >
            {/* Background image */}
            <BlurUpImage
              src={stop.imageUrl || ''}
              alt={stop.name}
              fallbackEmoji={CAROUSEL_EMOJIS[stop.type] || '\uD83D\uDCCD'}
              fallbackGradient="bg-gradient-to-br from-gray-800 to-gray-900"
              enableKenBurns={isActive}
              className="absolute inset-0"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

            {/* Top row: number badge + type emoji */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shadow-md ${
                isActive ? 'bg-primary-500 text-white' : 'bg-black/60 text-white/90 backdrop-blur-sm'
              }`}>
                {index + 1}
              </span>
              <span className="text-lg drop-shadow-md">{CAROUSEL_EMOJIS[stop.type] || '\uD83D\uDCCD'}</span>
            </div>

            {/* Bottom content over gradient */}
            <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
              {/* Name */}
              <p className="text-white text-sm font-bold truncate mb-1 drop-shadow-sm">{stop.name}</p>

              {/* Rating + time */}
              <div className="flex items-center gap-1.5 mb-1">
                {stop.googleRating && (
                  <span className="text-amber-400 text-[11px] font-medium drop-shadow-sm">{'\u2605'} {stop.googleRating.toFixed(1)}</span>
                )}
                {stop.bestTimeOfDay && stop.bestTimeOfDay !== 'any' && (
                  <span className="text-white/60 text-[10px] capitalize">{stop.bestTimeOfDay}</span>
                )}
              </div>

              {/* Walk time from hotel */}
              {walkMin !== null && walkMin > 0 && (
                <p className="text-white/50 text-[10px]">
                  {'\uD83D\uDEB6'} ~{walkMin} min from hotel
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function FlashExploreContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('draft');
  const [trip, setTrip] = useState<FlashTripPackage | null>(null);
  const [loadedFromDraft, setLoadedFromDraft] = useState(false);
  const [step, setStep] = useState<BookingStep>('choice'); // Start with path selection
  const [itineraryType, setItineraryType] = useState<ItineraryType>(null);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [activeDay, setActiveDay] = useState(1);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showMapHint, setShowMapHint] = useState(true);

  // Favorites - persists across shuffles
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoriteStops, setFavoriteStops] = useState<ItineraryStop[]>([]);

  // Error handling for POI loading
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Booking selections
  const [skipHotels, setSkipHotels] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelOption | null>(null);

  // Hotel search state
  const [hotelOptions, setHotelOptions] = useState<HotelOption[]>([]);
  const [isLoadingHotels, setIsLoadingHotels] = useState(false);
  const [hotelError, setHotelError] = useState<string | null>(null);
  const [hotelsLoaded, setHotelsLoaded] = useState(false);

  const [expandedHotelId, setExpandedHotelId] = useState<string | null>(null);
  const [hotelViewMode, setHotelViewMode] = useState<'list' | 'map'>('list');

  // Photo lightbox state
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  // Hotel reviews state
  const [hotelReviews, setHotelReviews] = useState<Record<string, LiteAPIReview[]>>({});
  const [loadingReviews, setLoadingReviews] = useState<string | null>(null);

  // Package step — walking route + trip dates + carousel sync
  const [activeRoute, setActiveRoute] = useState<{ geometry: string; distance: number; duration: number } | null>(null);
  const [tripDates, setTripDates] = useState<{ departure: string; return: string }>({ departure: '', return: '' });
  const [activeCarouselStopId, setActiveCarouselStopId] = useState<string | null>(null);
  const [dayNarratives, setDayNarratives] = useState<Record<number, string>>({});
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [timeOverrides, setTimeOverrides] = useState<Record<string, string>>({});
  const [editingStopTime, setEditingStopTime] = useState<string | null>(null);

  // Revealed preferences tracking
  const { trackHotelSelection, trackPOIAction } = useRevealedPreferences();

  // Saved spots panel toggle
  const [showSavedSpots, setShowSavedSpots] = useState(true);

  // Compute allStops unconditionally (needed for memos — hooks can't be conditional)
  const allStops = useMemo(() => itinerary.flatMap(d => d.stops), [itinerary]);

  // Cluster POIs for smart planner
  const poiClusters = useMemo(() => {
    if (allStops.length < 4) return [];
    return clusterPOIsGeographic(allStops);
  }, [allStops]);

  // Map stopId → clusterId for tile highlighting
  const stopClusterMap = useMemo(() => {
    const map = new Map<string, number>();
    poiClusters.forEach(cluster => {
      cluster.points.forEach(point => {
        const stop = allStops.find(s => s.latitude === point.latitude && s.longitude === point.longitude);
        if (stop) map.set(stop.id, cluster.id);
      });
    });
    return map;
  }, [poiClusters, allStops]);

  // Fetch hotel reviews
  const fetchHotelReviews = useCallback(async (hotelId: string) => {
    if (hotelReviews[hotelId] || loadingReviews === hotelId) return;

    setLoadingReviews(hotelId);
    try {
      const response = await fetch(`/api/hotels/reviews?hotelId=${hotelId}&limit=3`);
      if (response.ok) {
        const data = await response.json();
        setHotelReviews(prev => ({ ...prev, [hotelId]: data.reviews || [] }));
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoadingReviews(null);
    }
  }, [hotelReviews, loadingReviews]);

  // Load trip from draft (if resuming) or session storage
  useEffect(() => {
    async function loadTrip() {
      // If resuming from a draft, load the draft data
      if (draftId) {
        const draft = await getDraftTrip(draftId);
        if (draft) {
          setTrip(draft.trip);
          setItinerary(draft.itinerary);
          setItineraryType(draft.itineraryType as SimplePathChoice);
          setFavorites(new Set(draft.favorites));
          setFavoriteStops(draft.favoriteStops);
          setLoadedFromDraft(true);
          // Also store in session for consistency
          sessionStorage.setItem('flash_selected_trip', JSON.stringify(draft.trip));
          return;
        }
      }

      // Otherwise load from session storage (normal flow)
      const stored = sessionStorage.getItem('flash_selected_trip');
      if (stored) {
        try {
          const tripData = JSON.parse(stored) as FlashTripPackage;
          setTrip(tripData);
        } catch (e) {
          console.error('Failed to parse trip:', e);
          router.push('/flash');
        }
      } else {
        router.push('/flash');
      }
    }
    loadTrip();
  }, [router, draftId]);

  // If resuming from draft, skip choice step since they already picked a path
  useEffect(() => {
    if (trip && loadedFromDraft && itinerary.length > 0 && itineraryType) {
      setStep('itinerary');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip, loadedFromDraft]);

  // Auto-save draft when user makes changes (debounced)
  useEffect(() => {
    if (!trip?.destination?.city || !itinerary.length || !itineraryType) return;

    // Debounce the save to avoid too frequent writes
    const saveTimeout = setTimeout(() => {
      saveDraftTrip({
        trip,
        itinerary,
        itineraryType,
        favorites,
        favoriteStops,
        step,
      });
    }, 1000); // Save 1 second after last change

    return () => clearTimeout(saveTimeout);
  }, [trip, itinerary, itineraryType, favorites, favoriteStops, step]);

  // Note: Draft loading now happens via draftId URL param in the first useEffect
  // The Supabase-backed draft system uses UUID IDs, so we don't need to match by trip data

  // Auto-dismiss "tap markers" hint after 4 seconds
  const totalStops = allStops.length;
  useEffect(() => {
    if (showMapHint && !isLoadingItinerary && totalStops > 0) {
      const timer = setTimeout(() => setShowMapHint(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showMapHint, isLoadingItinerary, totalStops]);

  const loadItinerary = async (pathType: SimplePathChoice) => {
    if (!trip) return;
    setItineraryType(pathType);
    setIsLoadingItinerary(true);
    setLoadingError(null);
    setActiveDay(1);
    setActiveStopId(null);
    setShowDetails(false);

    try {
      // Use the new async generator that loads real POI data
      const generated = await generateItineraryAuto(trip, pathType);
      setItinerary(generated);
    } catch (error) {
      console.error('Failed to generate itinerary:', error);
      // Show error but also fall back to hardcoded data so user isn't stuck
      setLoadingError('Some places may be unavailable. Showing alternative suggestions.');
      const generated = pathType === 'classic' || pathType === 'cultural' || pathType === 'adventure'
        ? generateSampleItinerary(trip)
        : generateTrendyItinerary(trip);
      setItinerary(generated);
    } finally {
      setIsLoadingItinerary(false);
    }
  };

  const handleShuffle = () => {
    // Pick a random path that's different from the current one
    const availablePaths = itineraryType
      ? ALL_PATHS.filter(p => p !== itineraryType)
      : ALL_PATHS;
    const randomPath = availablePaths[Math.floor(Math.random() * availablePaths.length)];
    loadItinerary(randomPath);
  };

  const handleStopClick = useCallback((stop: ItineraryStop) => {
    setActiveStopId(stop.id);
    setShowDetails(true);
    // Track POI expand for preference learning
    trackPOIAction(stop.type, 'expand', stop.category);
  }, [trackPOIAction]);

  // Deduplicate hotels by name, keeping the one with best price
  const deduplicatedHotels = useMemo(() => {
    const hotelMap = new Map<string, HotelOption>();
    hotelOptions.forEach(hotel => {
      const key = hotel.name.toLowerCase().trim();
      const existing = hotelMap.get(key);
      if (!existing || hotel.totalPrice < existing.totalPrice) {
        hotelMap.set(key, hotel);
      }
    });
    return Array.from(hotelMap.values()).sort((a, b) => a.totalPrice - b.totalPrice);
  }, [hotelOptions]);

  // Open photo lightbox
  const openPhotoLightbox = useCallback((photos: string[], startIndex: number = 0) => {
    setLightboxPhotos(photos);
    setLightboxIndex(startIndex);
    setShowLightbox(true);
  }, []);

  const toggleFavorite = useCallback((stop: ItineraryStop, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(stop.id)) {
        newFavorites.delete(stop.id);
        // Remove from favoriteStops
        setFavoriteStops(current => current.filter(s => s.id !== stop.id));
        // Track unfavorite for preference learning
        trackPOIAction(stop.type, 'unfavorite', stop.category);
      } else {
        newFavorites.add(stop.id);
        // Add to favoriteStops (keep full stop data)
        setFavoriteStops(current => [...current, stop]);
        // Track favorite for preference learning
        trackPOIAction(stop.type, 'favorite', stop.category);
      }
      return newFavorites;
    });
  }, [trackPOIAction]);

  const handleGoBack = () => {
    if (step === 'choice') {
      // Go back to swipe to pick a different destination
      router.push('/flash/swipe');
    } else if (step === 'itinerary') {
      setStep('choice');
    } else if (step === 'hotels') {
      setStep('itinerary');
    } else if (step === 'checkout') {
      setStep('hotels');
    } else if (step === 'package') {
      setStep('checkout');
    }
  };

  const handlePathSelect = (path: SimplePathChoice) => {
    setStep('itinerary');
    loadItinerary(path);
  };

  const handleContinueFromItinerary = () => {
    setStep('hotels');
  };

  // Fetch hotels when entering the hotels step
  const [hotelFetchAttempted, setHotelFetchAttempted] = useState(false);

  useEffect(() => {
    // Only fetch once when entering hotels step
    if (step !== 'hotels' || hotelFetchAttempted) return;

    async function fetchHotels() {
      if (!trip) return;

      setHotelFetchAttempted(true);
      setIsLoadingHotels(true);
      setHotelError(null);

      try {
        // Calculate ideal hotel zone with IQR clustering (excludes outliers)
        const stopsForZone = favoriteStops.length >= 2
          ? favoriteStops
          : itinerary.flatMap(d => d.stops);

        let searchLat: number;
        let searchLng: number;

        const zone = calculateHotelZone(stopsForZone);

        if (zone) {
          // Use clustered centroid (outliers excluded)
          searchLat = zone.centerLat;
          searchLng = zone.centerLng;
        } else {
          // Fallback to destination center
          const destination = DESTINATIONS.find(
            d => d.city === trip.destination.city || d.airportCode === trip.destination.airportCode
          );
          if (!destination) {
            throw new Error(`Could not find coordinates for ${trip.destination.city}`);
          }
          searchLat = destination.latitude;
          searchLng = destination.longitude;
        }

        // Get checkin/checkout dates from the search params stored in session
        let checkin: string;
        let checkout: string;

        // Try to get dates from the session's lastGenerateParams
        const tripsStored = sessionStorage.getItem('flash_vacation_trips');
        if (tripsStored) {
          const tripsData = JSON.parse(tripsStored);
          const params = tripsData.lastGenerateParams;
          if (params?.departureDate && params?.returnDate) {
            checkin = params.departureDate;
            checkout = params.returnDate;
          } else {
            throw new Error('Trip dates not found in session');
          }
        } else if (trip.flight?.outbound?.arrival && trip.flight?.return?.departure) {
          // Legacy fallback: use flight dates if available (old stored trips)
          checkin = new Date(trip.flight.outbound.arrival).toISOString().split('T')[0];
          checkout = new Date(trip.flight.return.departure).toISOString().split('T')[0];
        } else {
          throw new Error('Trip dates not available. Please start a new search.');
        }

        // Read traveler type from session (set by /flash form or Discover page)
        let travelers: string | null = null;
        try { travelers = sessionStorage.getItem('flash_traveler_type'); } catch {}

        // Read budget tier from session (set when user clicks Budget-Friendly tile in Discover)
        let budgetTier: string | null = null;
        try { budgetTier = sessionStorage.getItem('flash_budget_tier'); } catch {}

        const response = await fetch('/api/hotels/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: searchLat,
            longitude: searchLng,
            checkin,
            checkout,
            destinationName: trip.destination.city,
            // Pass zone radius so hotel search is tighter around the cluster
            zoneRadiusKm: zone ? zone.radiusMeters / 1000 : undefined,
            // Pass traveler type for correct room occupancy
            travelers: travelers || undefined,
            // Pass budget tier so hotel scoring favors cheaper options
            budgetTier: budgetTier || undefined,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          const errorMsg = error.details || error.error || 'Failed to search hotels';
          throw new Error(errorMsg);
        }

        const data = await response.json();
        setHotelOptions(data.hotels || []);
        setHotelsLoaded(true);

        // Auto-select first hotel if available
        if (data.hotels && data.hotels.length > 0) {
          setSelectedHotel(data.hotels[0]);
        }
      } catch (error) {
        console.error('Failed to fetch hotels:', error);
        setHotelError(error instanceof Error ? error.message : 'Failed to load hotels');
      } finally {
        setIsLoadingHotels(false);
      }
    }

    fetchHotels();
  }, [step, trip, hotelFetchAttempted]);

  const handleContinueFromHotels = () => {
    setStep('checkout');
  };

  const handleCheckout = () => {
    // Move to the adventure package reveal step
    setStep('package');
  };

  const handleFinalConfirm = () => {
    // Store booking data and go to confirm/payment
    const bookingData = {
      trip,
      itineraryType,
      itinerary,
      skipHotels,
      selectedHotel: skipHotels ? null : selectedHotel,
      favoriteStops,
      timeOverrides, // User's time-of-day adjustments
    };
    sessionStorage.setItem('flash_booking_data', JSON.stringify(bookingData));
    router.push('/flash/confirm');
  };

  // Load trip dates when package step is entered
  useEffect(() => {
    if (step !== 'package') return;

    // Load trip dates from sessionStorage
    try {
      const params = sessionStorage.getItem('flash_generate_params');
      if (params) {
        const parsed = JSON.parse(params);
        setTripDates({ departure: parsed.departureDate || '', return: parsed.returnDate || '' });
      }
    } catch {}
  }, [step]);

  // Fetch walking route for active POI (hotel → stop) on click
  useEffect(() => {
    if (step !== 'package') return;
    if (!activeCarouselStopId || !selectedHotel || skipHotels) {
      setActiveRoute(null);
      return;
    }

    const stop = allStops.find(s => s.id === activeCarouselStopId);
    if (!stop) {
      setActiveRoute(null);
      return;
    }

    let cancelled = false;

    fetch('/api/directions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: [
          [selectedHotel.latitude, selectedHotel.longitude],
          [stop.latitude, stop.longitude],
        ],
      }),
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled && data) {
          setActiveRoute({
            geometry: data.geometry,
            distance: data.totalDistance,
            duration: data.totalDuration,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setActiveRoute(null);
      });

    return () => { cancelled = true; };
  }, [activeCarouselStopId, step, selectedHotel, skipHotels]);

  // Auto-scroll day planner timeline to active stop
  useEffect(() => {
    if (step !== 'package' || !activeCarouselStopId) return;
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-timeline-stop-id="${activeCarouselStopId}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    return () => clearTimeout(timer);
  }, [activeCarouselStopId, step]);

  // Fetch AI-generated day narratives when package step loads
  useEffect(() => {
    if (step !== 'package') return;
    if (narrativeLoading || Object.keys(dayNarratives).length > 0) return;
    if (allStops.length < 4) return;

    const pkgClusters = clusterPOIsGeographic(allStops);
    if (pkgClusters.length < 2) return;

    const hasHotel = !skipHotels && selectedHotel;
    let travelerType = 'couple';
    try {
      const stored = sessionStorage.getItem('flash_traveler_type');
      if (stored) travelerType = stored;
    } catch {}

    const days = pkgClusters.map((cluster, idx) => {
      const clusterStops = allStops.filter((s) =>
        cluster.points.some(
          (p) => p.latitude === s.latitude && p.longitude === s.longitude,
        ),
      );
      return {
        dayIndex: idx,
        zoneLabel: cluster.label,
        stops: clusterStops.map((s) => ({
          name: s.name,
          type: s.type,
          category: s.category || undefined,
          rating: s.googleRating,
          duration: s.duration,
          bestTimeOfDay: s.bestTimeOfDay,
          isFavorite: favorites.has(s.id),
          walkMinFromHotel:
            hasHotel && selectedHotel
              ? Math.max(
                  1,
                  Math.round(
                    getDistanceMeters(
                      selectedHotel.latitude,
                      selectedHotel.longitude,
                      s.latitude,
                      s.longitude,
                    ) / 80,
                  ),
                )
              : undefined,
        })),
        totalHours: Math.round(estimateTotalMinutes(clusterStops) / 60),
        walkMinFromHotel:
          hasHotel && selectedHotel
            ? Math.max(
                1,
                Math.round(
                  getDistanceMeters(
                    selectedHotel.latitude,
                    selectedHotel.longitude,
                    cluster.center.latitude,
                    cluster.center.longitude,
                  ) / 80,
                ),
              )
            : undefined,
      };
    });

    const payload = {
      destinationId: trip?.destination.id || '',
      destinationCity: trip?.destination.city || '',
      destinationCountry: trip?.destination.country || '',
      departureDate: tripDates.departure,
      days,
      hotel:
        hasHotel && selectedHotel
          ? { name: selectedHotel.name, stars: selectedHotel.stars }
          : undefined,
      travelerType,
      pathType: itineraryType || 'classic',
      favoriteNames: allStops
        .filter((s) => favorites.has(s.id))
        .map((s) => s.name),
    };

    setNarrativeLoading(true);
    fetch('/api/flash/trip-narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.dayNarratives && Object.keys(data.dayNarratives).length > 0) {
          setDayNarratives(data.dayNarratives);
        }
      })
      .catch(() => {
        // Silently degrade — no narrative shown
      })
      .finally(() => setNarrativeLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, allStops.length, selectedHotel?.id, skipHotels]);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!trip) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Spinner size="lg" className="text-white" />
      </div>
    );
  }

  // Step 0: Path selection — "How do you want to experience [City]?"
  if (step === 'choice') {
    // Find destination data for city context
    const destData = DESTINATIONS.find(
      d => d.city === trip.destination.city || d.id === trip.destination.city.toLowerCase().replace(/\s+/g, '-')
    );

    return (
      <div className="fixed inset-0 z-50 bg-black">
        {/* Hero background image */}
        <div className="absolute inset-0">
          <img
            src={trip.imageUrl}
            alt={trip.destination.city}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
        </div>

        {/* Top bar: back + progress */}
        <div className="absolute top-0 left-0 right-0 z-20 pt-safe">
          <div className="px-4 pt-3 pb-1">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors p-2 -ml-2 mb-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>
          <StepProgressBar currentStep="choice" variant="overlay" />
        </div>

        {/* Content */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end pb-safe">
          {/* City context */}
          <div className="px-6 mb-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-1 drop-shadow-lg">
              {trip.destination.city}
            </h1>
            <p className="text-white/80 text-lg mb-2">{trip.destination.country}</p>

            {/* Tagline */}
            {trip.tagline && (
              <p className="text-white/70 text-sm italic mb-3">
                &ldquo;{trip.tagline}&rdquo;
              </p>
            )}

            {/* City stats row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-white/80 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {trip.itinerary.days} nights
              </span>
              {trip.poiCount && trip.poiCount > 0 && (
                <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-white/80 text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {trip.poiCount}+ places curated
                </span>
              )}
              {trip.perfectTiming && (
                <span className="flex items-center gap-1.5 bg-amber-500/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm font-medium">
                  🎯 Perfect timing
                </span>
              )}
            </div>
          </div>

          {/* Path selection */}
          <div className="px-6 mb-4">
            <h2 className="text-white font-semibold text-lg mb-3">
              How do you want to experience {trip.destination.city}?
            </h2>
          </div>

          {/* Path cards - horizontal scroll */}
          <div className="flex gap-3 overflow-x-auto px-6 pb-6 scrollbar-hide">
            {ALL_PATHS.map((path) => {
              const config = PATH_CONFIG[path];
              return (
                <button
                  key={path}
                  onClick={() => handlePathSelect(path)}
                  className="flex-shrink-0 w-36 group"
                >
                  <div className={`${config.color} backdrop-blur-md border border-white/10 rounded-2xl p-4 text-left transition-all hover:border-white/30 hover:scale-[1.03] active:scale-[0.98]`}>
                    <span className="text-3xl mb-2 block">{config.emoji}</span>
                    <h3 className={`text-white font-semibold text-sm mb-1 ${config.hoverColor} transition-colors`}>
                      {config.name}
                    </h3>
                    <p className="text-white/50 text-xs leading-snug line-clamp-2">
                      {config.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Value proposition teaser */}
          <div className="px-6 pb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <p className="text-white/70 text-xs">
                Pick your vibe, explore the hotspots, and we&apos;ll plan the perfect day-by-day itinerary so you don&apos;t have to
              </p>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          .pt-safe { padding-top: max(16px, env(safe-area-inset-top)); }
          .pb-safe { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
        `}</style>
      </div>
    );
  }

  // Itinerary view with map (main step)
  if (step === 'itinerary') {
    const activeStop = activeStopId ? allStops.find((s) => s.id === activeStopId) : null;
    // Center on first stop
    const centerLat = allStops[0]?.latitude || 0;
    const centerLng = allStops[0]?.longitude || 0;
    // Filtered stops for display
    const filteredStops = typeFilter ? allStops.filter(s => s.type === typeFilter) : allStops;
    // Quick nav stats
    const quickNavConfig = itineraryType ? QUICK_NAV_CONFIG[itineraryType] : null;
    const totalMinutes = estimateTotalMinutes(allStops);
    const totalHours = Math.round(totalMinutes / 60);

    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* Map background — filtered by type when a filter chip is active */}
        <ItineraryMap
          stops={typeFilter ? allStops.filter(s => s.type === typeFilter) : allStops}
          centerLatitude={centerLat}
          centerLongitude={centerLng}
          activeStopId={activeStopId || undefined}
          activeDay={activeDay}
          favoriteStops={favoriteStops}
          onStopClick={handleStopClick}
          className="absolute inset-0"
          hotelLocation={null}
          clusterZones={poiClusters.map(c => ({
            id: c.id,
            center: c.center,
            radiusMeters: c.radiusMeters,
            color: c.color,
            label: c.label,
          }))}
        />

        {/* ═══ QUICK NAVIGATOR — top-right map overlay ═══ */}
        {quickNavConfig && !isLoadingItinerary && allStops.length > 0 && (
          <div className="absolute top-3 right-14 z-20">
            <div className="bg-black/60 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-2.5 shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{quickNavConfig.emoji}</span>
                <span className="text-white font-semibold text-sm">{quickNavConfig.label}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-white/60">{allStops.length} spots</span>
                <span className="text-white/30">·</span>
                <span className={favorites.size > 0 ? 'text-pink-400 font-medium' : 'text-white/60'}>
                  {favorites.size} saved
                </span>
                <span className="text-white/30">·</span>
                <span className="text-white/60">~{totalHours}hr</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ LEFT SIDEBAR — step trail + POI list + shuffle ═══ */}
        <div className="absolute top-0 left-0 bottom-0 w-[320px] z-20 flex flex-col bg-black/75 backdrop-blur-lg border-r border-white/10">

          {/* Back button + path label */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors p-1 -ml-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-xs font-medium">Back</span>
            </button>
            <div className="bg-white/10 rounded-full px-2.5 py-1">
              <p className="text-white text-xs font-semibold">
                {itineraryType && PATH_CONFIG[itineraryType]?.emoji} {itineraryType && PATH_CONFIG[itineraryType]?.name}
              </p>
            </div>
          </div>

          {/* Step progress — compact horizontal row */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            {BOOKING_STEPS.map((stepConfig, index) => {
              const currentIndex = BOOKING_STEPS.findIndex(s => s.key === 'itinerary');
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isLast = index === BOOKING_STEPS.length - 1;
              return (
                <div key={stepConfig.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] transition-all ${
                      isCompleted ? 'bg-primary-500/80' :
                      isCurrent ? 'bg-primary-500 ring-2 ring-primary-400/30' :
                      'bg-white/10 border border-white/15'
                    }`}>
                      {isCompleted ? (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span>{stepConfig.emoji}</span>
                      )}
                    </div>
                    <span className={`text-[8px] font-medium ${isCurrent ? 'text-white' : isCompleted ? 'text-white/60' : 'text-white/30'}`}>
                      {stepConfig.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-[2px] mx-1 rounded-full mt-[-8px] ${isCompleted ? 'bg-primary-500/50' : 'bg-white/10'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Teaser text */}
          <div className="px-3 py-2 border-b border-white/10">
            <p className="text-white/50 text-[11px] leading-snug">
              Save your favorite spots and we&apos;ll build the perfect itinerary
            </p>
            {favorites.size > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <svg className="w-3 h-3 text-pink-500 fill-pink-500" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-pink-400 text-[11px] font-medium">{favorites.size} saved</span>
              </div>
            )}
          </div>

          {/* Filter chips */}
          {!isLoadingItinerary && allStops.length > 0 && (() => {
            const types = Array.from(new Set(allStops.map(s => s.type)));
            if (types.length <= 1) return null;
            const typeLabels: Record<string, { emoji: string; label: string }> = {
              landmark: { emoji: '🏛️', label: 'Sights' },
              restaurant: { emoji: '🍽️', label: 'Food' },
              museum: { emoji: '🎨', label: 'Museums' },
              park: { emoji: '🌳', label: 'Parks' },
              cafe: { emoji: '☕', label: 'Cafes' },
              bar: { emoji: '🍸', label: 'Bars' },
              activity: { emoji: '🎯', label: 'Activities' },
              market: { emoji: '🛒', label: 'Markets' },
              viewpoint: { emoji: '🌄', label: 'Views' },
              nightclub: { emoji: '🎉', label: 'Nightlife' },
            };
            return (
              <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-hide border-b border-white/10">
                <button
                  onClick={() => setTypeFilter(null)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    typeFilter === null ? 'bg-white text-gray-900' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  All
                </button>
                {types.map(type => {
                  const info = typeLabels[type] || { emoji: '📍', label: type };
                  return (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                      className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        typeFilter === type ? 'bg-white text-gray-900' : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      <span>{info.emoji}</span>
                      <span>{info.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* POI tiles + smart planner — scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {isLoadingItinerary ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="md" className="text-white" />
                <span className="text-white/60 ml-3 text-sm">Loading...</span>
              </div>
            ) : allStops.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <p className="text-white/60 text-sm mb-2">No places found</p>
                <button onClick={handleShuffle} className="text-primary-400 text-sm font-medium">Try a different style</button>
              </div>
            ) : (
              <>
                {/* ═══ SAVED SPOTS — shows saved POIs with remove ═══ */}
                {favoriteStops.length > 0 && (
                  <div className="px-2 pt-2 pb-1">
                    <button
                      onClick={() => setShowSavedSpots(!showSavedSpots)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-pink-500/10 hover:bg-pink-500/15 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">❤️</span>
                        <span className="text-white text-xs font-semibold">Your Saved Spots</span>
                        <span className="text-pink-400 text-[10px] font-medium">{favoriteStops.length}</span>
                      </div>
                      <svg
                        className={`w-3.5 h-3.5 text-white/40 transition-transform ${showSavedSpots ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showSavedSpots && (
                      <div className="mt-1.5 space-y-1 px-1">
                        {favoriteStops.map(stop => {
                          const TILE_EMOJIS: Record<string, string> = {
                            landmark: '🏛️', restaurant: '🍽️', activity: '🎯', museum: '🎨',
                            park: '🌳', cafe: '☕', bar: '🍸', market: '🛒',
                            viewpoint: '🌄', nightclub: '🎉',
                          };

                          return (
                            <div
                              key={stop.id}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/8 transition-colors group"
                            >
                              <button
                                onClick={() => {
                                  setActiveStopId(stop.id);
                                  handleStopClick(stop);
                                }}
                                className="flex-1 flex items-center gap-2.5 text-left min-w-0"
                              >
                                <span className="text-sm flex-shrink-0">{TILE_EMOJIS[stop.type] || '📍'}</span>
                                <div className="flex-1 min-w-0">
                                  <span className="text-white text-xs font-medium truncate block">{stop.name}</span>
                                  <span className="text-white/40 text-[10px]">
                                    {stop.googleRating ? `★ ${stop.googleRating.toFixed(1)}` : ''}
                                    {stop.duration ? ` · ${stop.duration}` : ''}
                                  </span>
                                </div>
                              </button>
                              <button
                                onClick={(e) => toggleFavorite(stop, e)}
                                className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 opacity-50 group-hover:opacity-100 transition-opacity"
                                title="Remove from saved"
                              >
                                <svg className="w-3.5 h-3.5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ═══ TILE GRID — 2 column compact POI tiles ═══ */}
                <div className="grid grid-cols-2 gap-1.5 px-2 py-2">
                  {filteredStops.map((stop) => {
                    const isFav = favorites.has(stop.id);
                    const isActive = activeStopId === stop.id;
                    const TILE_EMOJIS: Record<string, string> = {
                      landmark: '🏛️', restaurant: '🍽️', activity: '🎯', museum: '🎨',
                      park: '🌳', cafe: '☕', bar: '🍸', market: '🛒',
                      viewpoint: '🌄', nightclub: '🎉', accommodation: '🏨', transport: '✈️', neighborhood: '🏘️',
                    };

                    return (
                      <div
                        key={stop.id}
                        onClick={() => handleStopClick(stop)}
                        className={`relative rounded-xl p-2.5 cursor-pointer transition-all ${
                          isActive
                            ? 'bg-white/15 ring-1 ring-white/20'
                            : isFav
                              ? 'bg-pink-500/15 hover:bg-pink-500/20'
                              : 'bg-white/8 hover:bg-white/12'
                        } ${isFav ? 'border border-pink-500/40' : ''}`}
                      >
                        {/* Top row: emoji + rating */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-base">{TILE_EMOJIS[stop.type] || '📍'}</span>
                          {stop.googleRating && (
                            <span className="text-amber-400 text-[10px] font-medium">★ {stop.googleRating.toFixed(1)}</span>
                          )}
                        </div>

                        {/* Name + heart */}
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-white text-xs font-medium leading-tight line-clamp-2 flex-1">{stop.name}</h4>
                          <button
                            onClick={(e) => toggleFavorite(stop, e)}
                            className="flex-shrink-0 mt-0.5"
                          >
                            <svg
                              className={`w-5 h-5 transition-colors ${isFav ? 'text-pink-500 fill-pink-500' : 'text-white/50 hover:text-white/70'}`}
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                              fill={isFav ? 'currentColor' : 'none'}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                        </div>

                        {/* Duration + Saved badge */}
                        <div className="flex items-center justify-between mt-1">
                          {stop.duration && (
                            <p className="text-white/40 text-[10px]">{stop.duration}</p>
                          )}
                          {isFav && (
                            <span className="text-pink-400 text-[10px] font-medium">♥ Saved</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Bottom: Shuffle tile */}
          <div className="px-3 py-2.5 border-t border-white/10">
            <button
              onClick={handleShuffle}
              disabled={isLoadingItinerary}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/10 border border-white/15 text-white text-sm font-medium rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Shuffle New POIs
            </button>
          </div>
        </div>

        {/* ═══ BOTTOM-RIGHT: "Next Step" CTA tile ═══ */}
        <div className="absolute bottom-4 right-4 z-20">
          <button
            onClick={handleContinueFromItinerary}
            disabled={isLoadingItinerary}
            className="flex items-center gap-2 px-5 py-3.5 bg-white text-gray-900 font-bold text-sm rounded-xl shadow-xl shadow-black/30 hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            Next Step: Book My Hotel
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

        {/* Loading overlay — centered on map */}
        {isLoadingItinerary && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center gap-3">
              <Spinner size="md" className="text-white" />
              <span className="text-white/80 text-sm">Loading {itineraryType && PATH_CONFIG[itineraryType]?.name}...</span>
            </div>
          </div>
        )}

        {/* Error message floating */}
        {loadingError && (
          <div className="absolute top-3 left-[340px] right-4 z-20">
            <div className="flex items-center justify-between gap-3 py-2 px-3 bg-amber-500/20 border border-amber-500/30 rounded-lg backdrop-blur-sm">
              <span className="text-amber-200 text-xs">{loadingError}</span>
              <button onClick={() => setLoadingError(null)} className="text-amber-400 hover:text-amber-200 p-0.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Stop detail modal */}
        {showDetails && activeStop && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            onClick={() => setShowDetails(false)}
          >
            <div className="absolute inset-0 bg-black/60" />
            <div
              className="relative w-full max-w-lg bg-gray-900 rounded-t-3xl p-6 pb-safe animate-slide-up max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-6" />

              {/* Header banner - always show */}
              <div className={`relative w-full h-24 rounded-xl overflow-hidden mb-4 ${
                {
                  landmark: 'bg-gradient-to-br from-amber-600/30 to-orange-800/30',
                  restaurant: 'bg-gradient-to-br from-red-600/30 to-pink-800/30',
                  activity: 'bg-gradient-to-br from-blue-600/30 to-cyan-800/30',
                  museum: 'bg-gradient-to-br from-purple-600/30 to-indigo-800/30',
                  park: 'bg-gradient-to-br from-green-600/30 to-emerald-800/30',
                  cafe: 'bg-gradient-to-br from-orange-600/30 to-amber-800/30',
                  bar: 'bg-gradient-to-br from-pink-600/30 to-rose-800/30',
                }[activeStop.type as string] || 'bg-gradient-to-br from-gray-600/30 to-gray-800/30'
              }`}>
                {/* Large category emoji */}
                <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">
                  {{
                    landmark: '🏛️',
                    restaurant: '🍽️',
                    activity: '🎯',
                    museum: '🏛️',
                    park: '🌳',
                    accommodation: '🏨',
                    transport: '✈️',
                    cafe: '☕',
                    bar: '🍸',
                    market: '🛒',
                    viewpoint: '🌄',
                  }[activeStop.type as string] || '📍'}
                </div>
                {/* Favorite button */}
                <button
                  onClick={() => toggleFavorite(activeStop)}
                  className={`absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                    favorites.has(activeStop.id) ? 'bg-pink-500' : 'bg-black/50 hover:bg-black/70'
                  }`}
                >
                  <svg
                    className={`w-6 h-6 ${favorites.has(activeStop.id) ? 'text-white fill-white' : 'text-white'}`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    fill={favorites.has(activeStop.id) ? 'currentColor' : 'none'}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                  {{
                    landmark: '🏛️',
                    restaurant: '🍽️',
                    activity: '🎯',
                    museum: '🏛️',
                    park: '🌳',
                    accommodation: '🏨',
                    transport: '✈️',
                    cafe: '☕',
                    bar: '🍸',
                    market: '🛒',
                    viewpoint: '🌄',
                  }[activeStop.type as string] || '📍'}
                </div>
                <div className="flex-1">
                  <h2 className="text-white text-xl font-bold">{activeStop.name}</h2>
                  {activeStop.category && (
                    <span className="text-white/40 text-sm capitalize">{activeStop.category}</span>
                  )}
                </div>
              </div>

              {/* Google Rating — prominent card */}
              {activeStop.googleRating && (
                <div className="flex items-center gap-4 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <div className="text-center">
                    <p className="text-amber-400 text-2xl font-bold">{activeStop.googleRating.toFixed(1)}</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= Math.round(activeStop.googleRating!) ? 'text-amber-400' : 'text-white/20'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    {activeStop.googleReviewCount && (
                      <p className="text-white/60 text-sm">
                        {activeStop.googleReviewCount.toLocaleString()} Google reviews
                      </p>
                    )}
                    {activeStop.googlePrice !== undefined && (
                      <p className="text-green-400 text-sm mt-0.5">
                        Price level: {'$'.repeat(activeStop.googlePrice + 1)}
                        <span className="text-white/30 ml-1">{'$'.repeat(Math.max(0, 3 - activeStop.googlePrice))}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <p className="text-white/80 mb-4">{activeStop.description}</p>

              {/* Address */}
              {activeStop.address && (
                <p className="text-white/50 text-sm mb-4 flex items-start gap-2">
                  <span>📍</span>
                  <span>{activeStop.address}</span>
                </p>
              )}

              {/* Duration and best time */}
              <div className="flex flex-wrap gap-3 mb-4">
                {activeStop.duration && (
                  <span className="text-white/60 text-sm flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full">
                    <span>⏱️</span>
                    <span>{activeStop.duration}</span>
                  </span>
                )}
                {activeStop.bestTimeOfDay && activeStop.bestTimeOfDay !== 'any' && (
                  <span className="text-white/60 text-sm flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full">
                    <span>🕐</span>
                    <span>Best: {activeStop.bestTimeOfDay}</span>
                  </span>
                )}
              </div>

              {/* Nearby places */}
              {(() => {
                const nearbyStops = getNearbyStops(activeStop, allStops);
                if (nearbyStops.length === 0) return null;
                return (
                  <div className="mb-4">
                    <p className="text-white/50 text-sm mb-2 flex items-center gap-2">
                      <span>📍</span>
                      <span>Also nearby (walkable)</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {nearbyStops.map(({ stop, distance }) => (
                        <button
                          key={stop.id}
                          onClick={() => {
                            setActiveStopId(stop.id);
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            favorites.has(stop.id)
                              ? 'bg-pink-500/20 border border-pink-500/30'
                              : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          {stop.imageUrl ? (
                            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                              <img
                                src={getProxiedImageUrl(stop.imageUrl)}
                                alt={stop.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <span className="text-base">
                              {stop.type === 'landmark' && '🏛️'}
                              {stop.type === 'restaurant' && '🍽️'}
                              {stop.type === 'activity' && '🎯'}
                              {stop.type === 'accommodation' && '🏨'}
                              {stop.type === 'transport' && '✈️'}
                            </span>
                          )}
                          <span className="text-white/80 truncate max-w-[120px]">{stop.name}</span>
                          <span className="text-white/40 text-xs">{formatDistance(distance)}</span>
                          {favorites.has(stop.id) && (
                            <svg className="w-3 h-3 text-pink-500 fill-pink-500 flex-shrink-0" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Action buttons */}
              <div className="flex gap-3 mb-4">
                {activeStop.googleMapsUrl && (
                  <a
                    href={activeStop.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 bg-blue-500/20 text-blue-400 font-medium rounded-xl hover:bg-blue-500/30 transition-colors text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open in Maps
                  </a>
                )}
                {activeStop.websiteUrl && (
                  <a
                    href={activeStop.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Website
                  </a>
                )}
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="w-full py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
          .animate-slide-up { animation: slide-up 0.3s ease-out; }
          .pt-safe { padding-top: max(16px, env(safe-area-inset-top)); }
          .pb-safe { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
        `}</style>
      </div>
    );
  }


  // Step 2: Hotel booking
  if (step === 'hotels') {
    return (
      <div className="fixed inset-0 z-40 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="h-full flex flex-col">
          {/* Header with progress */}
          <div className="pt-safe border-b border-white/10">
            <div className="py-3">
              <StepProgressBar currentStep="hotels" />
            </div>
            <div className="px-4 pb-3 flex items-center justify-between">
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </button>
              <h1 className="text-white font-bold">Choose Your Hotel</h1>
              {/* Map/List toggle */}
              <div className="flex bg-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => setHotelViewMode('list')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    hotelViewMode === 'list' ? 'bg-white/20 text-white' : 'text-white/50'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setHotelViewMode('map')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    hotelViewMode === 'map' ? 'bg-white/20 text-white' : 'text-white/50'
                  }`}
                >
                  Map
                </button>
              </div>
            </div>
          </div>

          {/* Content — Map or List view */}
          {hotelViewMode === 'map' ? (
            /* Hotel Map View */
            <div className="flex-1 relative">
              <ItineraryMap
                stops={[
                  // Show favorite POIs as markers
                  ...favoriteStops.map(s => ({
                    ...s,
                    day: 0, // Special day for favorites
                  })),
                ]}
                centerLatitude={trip?.destination.latitude || 0}
                centerLongitude={trip?.destination.longitude || 0}
                favoriteStops={favoriteStops}
                className="absolute inset-0"
              />

              {/* Hotel pins overlay — floating cards */}
              <div className="absolute bottom-4 left-0 right-0 z-20">
                <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
                  {hotelOptions.map(hotel => {
                    const isSelected = selectedHotel?.id === hotel.id;
                    return (
                      <button
                        key={hotel.id}
                        onClick={() => setSelectedHotel(hotel)}
                        className={`flex-shrink-0 w-64 snap-center rounded-xl overflow-hidden shadow-lg transition-all ${
                          isSelected
                            ? 'ring-2 ring-white scale-[1.02]'
                            : 'ring-1 ring-white/20'
                        }`}
                      >
                        <div className="h-20 relative">
                          <img
                            src={hotel.mainPhoto}
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
                            }}
                          />
                          {hotel.insideZone && (
                            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-purple-500/90 rounded-full">
                              <span className="text-white text-[10px] font-medium">📍 In zone</span>
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="bg-gray-900 p-2.5">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="text-white text-sm font-semibold truncate">{hotel.name}</p>
                              <p className="text-amber-400 text-xs">{'★'.repeat(hotel.stars)} {hotel.rating > 0 ? hotel.rating.toFixed(1) : ''}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-white font-bold text-sm">
                                {formatPrice(hotel.pricePerNight, hotel.currency)}
                              </p>
                              <p className="text-white/50 text-[10px]">/night</p>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Floating "your spots" legend */}
              {favoriteStops.length > 0 && (
                <div className="absolute top-3 left-3 z-20">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                    <p className="text-white/80 text-[11px]">
                      📍 Your {favoriteStops.length} saved spot{favoriteStops.length !== 1 ? 's' : ''} · 🏨 Hotels
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-lg mx-auto">
              {/* Loading state — skeleton hotel cards with contextual messaging */}
              {isLoadingHotels && (
                <div className="space-y-4 mb-4">
                  <div className="text-center mb-2">
                    <p className="text-white/80 font-medium">
                      {favoriteStops.length >= 2
                        ? `Finding hotels near your ${favoriteStops.length} saved spots...`
                        : 'Finding the best hotels...'}
                    </p>
                    <p className="text-white/50 text-sm mt-1">
                      {favoriteStops.length >= 2
                        ? 'Centered between your favorite places'
                        : 'Near your planned hotspots'}
                    </p>
                  </div>
                  {/* Skeleton cards */}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden animate-pulse">
                      <div className="h-40 bg-white/5" />
                      <div className="p-4 space-y-3">
                        <div className="h-5 bg-white/10 rounded w-3/4" />
                        <div className="h-4 bg-white/10 rounded w-1/2" />
                        <div className="flex gap-2">
                          <div className="h-6 bg-white/10 rounded w-16" />
                          <div className="h-6 bg-white/10 rounded w-20" />
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <div className="h-6 bg-white/10 rounded w-24" />
                          <div className="h-10 bg-white/10 rounded w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error state */}
              {hotelError && !isLoadingHotels && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mb-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-red-400 font-medium">Couldn't load hotels</p>
                      <p className="text-red-300/70 text-sm mt-1">{hotelError}</p>
                      <button
                        onClick={() => {
                          setHotelFetchAttempted(false);
                          setHotelsLoaded(false);
                          setHotelError(null);
                        }}
                        className="text-red-400 underline text-sm mt-2 hover:text-red-300"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Hotel options */}
              {!isLoadingHotels && !hotelError && hotelOptions.length > 0 && (
                <>
                  <p className="text-white/60 text-sm mb-3">
                    {favoriteStops.length >= 2
                      ? `Hotels near your ${favoriteStops.length} favorite spots`
                      : `Top picks for your stay in ${trip.destination.city}`}
                  </p>
                  <div className="space-y-3 mb-4">
                    {deduplicatedHotels.map((hotel) => {
                      const isSelected = selectedHotel?.id === hotel.id && !skipHotels;
                      const isExpanded = expandedHotelId === hotel.id;

                      return (
                        <div
                          key={hotel.id}
                          className={`w-full text-left bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden transition-all ${
                            isSelected ? 'ring-2 ring-white' : ''
                          }`}
                        >
                          {/* Clickable header */}
                          <button
                            onClick={() => {
                              const newExpanded = isExpanded ? null : hotel.id;
                              setExpandedHotelId(newExpanded);
                              // Fetch reviews when expanding
                              if (newExpanded) {
                                fetchHotelReviews(hotel.id);
                              }
                            }}
                            className="w-full text-left"
                          >
                            {/* Hotel image */}
                            <div className="h-32 bg-gray-700 relative">
                              <img
                                src={hotel.mainPhoto}
                                alt={hotel.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
                                }}
                              />
                              {/* Selection indicator */}
                              {isSelected && (
                                <div className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                  <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              {/* Zone + Refundable badges */}
                              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                                {hotel.insideZone && (
                                  <div className="px-2 py-1 bg-purple-500/90 rounded-full">
                                    <span className="text-white text-xs font-medium">📍 Near your spots</span>
                                  </div>
                                )}
                                {hotel.refundable && (
                                  <div className="px-2 py-1 bg-green-500/90 rounded-full">
                                    <span className="text-white text-xs font-medium">Free cancellation</span>
                                  </div>
                                )}
                              </div>
                              {/* Expand indicator */}
                              <div className="absolute bottom-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                                <svg
                                  className={`w-5 h-5 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0 pr-3">
                                  <h3 className="text-white font-semibold truncate">{hotel.name}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-amber-400 text-sm">{'★'.repeat(hotel.stars)}</span>
                                    {hotel.rating > 0 && (
                                      <span className="text-white/60 text-sm">
                                        {hotel.rating.toFixed(1)} ({hotel.reviewCount} reviews)
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-white font-bold text-lg">
                                    {formatPrice(hotel.totalPrice, hotel.currency)}
                                  </p>
                                  <p className="text-white/50 text-xs">
                                    {formatPrice(hotel.pricePerNight, hotel.currency)}/night
                                  </p>
                                </div>
                              </div>
                              {/* Amenities preview */}
                              {hotel.amenities.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {hotel.amenities.slice(0, 4).map((amenity, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 bg-white/10 rounded-full text-white/70 text-xs"
                                    >
                                      {amenity}
                                    </span>
                                  ))}
                                  {hotel.amenities.length > 4 && (
                                    <span className="px-2 py-0.5 text-white/50 text-xs">
                                      +{hotel.amenities.length - 4} more
                                    </span>
                                  )}
                                </div>
                              )}
                              {/* Board type */}
                              {hotel.boardName && hotel.boardName !== 'Room Only' && (
                                <p className="text-green-400 text-xs mt-2">{hotel.boardName} included</p>
                              )}
                            </div>
                          </button>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div className="border-t border-white/10 p-4 space-y-4">
                              {/* Photo gallery */}
                              {hotel.photos && hotel.photos.length > 1 && (
                                <div>
                                  <h4 className="text-white/60 text-xs font-semibold mb-2 uppercase tracking-wide">Photos</h4>
                                  <div className="flex gap-2 overflow-x-auto pb-2">
                                    {hotel.photos.slice(0, 6).map((photo, i) => (
                                      <button
                                        key={i}
                                        onClick={() => openPhotoLightbox(hotel.photos, i)}
                                        className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg"
                                      >
                                        <img
                                          src={photo}
                                          alt={`${hotel.name} photo ${i + 1}`}
                                          className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Check-in/out times */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 rounded-xl p-3">
                                  <h5 className="text-white/60 text-xs mb-1 uppercase">Check-in</h5>
                                  <p className="text-white font-medium">{hotel.checkinTime}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3">
                                  <h5 className="text-white/60 text-xs mb-1 uppercase">Check-out</h5>
                                  <p className="text-white font-medium">{hotel.checkoutTime}</p>
                                </div>
                              </div>

                              {/* Room info */}
                              <div className="bg-white/5 rounded-xl p-3">
                                <h5 className="text-white/60 text-xs mb-2 uppercase">Room</h5>
                                <p className="text-white font-medium">{hotel.roomName || 'Standard Room'}</p>
                                {hotel.roomDescription && (
                                  <p className="text-white/60 text-sm mt-1">{hotel.roomDescription}</p>
                                )}
                              </div>

                              {/* All amenities */}
                              {hotel.amenities.length > 0 && (
                                <div>
                                  <h4 className="text-white/60 text-xs font-semibold mb-2 uppercase tracking-wide">All Amenities</h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {hotel.amenities.map((amenity, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-1 bg-white/10 rounded-full text-white/80 text-xs"
                                      >
                                        {amenity}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Price breakdown */}
                              <div className="bg-white/5 rounded-xl p-3">
                                <h5 className="text-white/60 text-xs mb-2 uppercase">Price Details</h5>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-white/70">{formatPrice(hotel.pricePerNight, hotel.currency)} × {trip?.itinerary.days} nights</span>
                                    <span className="text-white">{formatPrice(hotel.totalPrice, hotel.currency)}</span>
                                  </div>
                                  {hotel.taxesIncluded && (
                                    <p className="text-white/50 text-xs">Taxes & fees included</p>
                                  )}
                                </div>
                              </div>

                              {/* Cancellation policy */}
                              <div className="flex items-center gap-2">
                                {hotel.refundable ? (
                                  <>
                                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-green-400 text-sm">Free cancellation available</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span className="text-amber-400 text-sm">Non-refundable rate</span>
                                  </>
                                )}
                              </div>

                              {/* Guest Reviews */}
                              <div>
                                <h4 className="text-white/60 text-xs font-semibold mb-2 uppercase tracking-wide">Guest Reviews</h4>
                                {loadingReviews === hotel.id ? (
                                  <div className="flex items-center gap-2 text-white/50 text-sm">
                                    <Spinner size="sm" className="text-white/50" />
                                    <span>Loading reviews...</span>
                                  </div>
                                ) : hotelReviews[hotel.id]?.length > 0 ? (
                                  <div className="space-y-3">
                                    {hotelReviews[hotel.id].slice(0, 3).map((review, i) => (
                                      <div key={i} className="bg-white/5 rounded-xl p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-white font-medium text-sm">{review.name || 'Guest'}</span>
                                            {review.country && (
                                              <span className="text-white/40 text-xs">{review.country}</span>
                                            )}
                                          </div>
                                          {review.averageScore && (
                                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs font-medium">
                                              {review.averageScore.toFixed(1)}/10
                                            </span>
                                          )}
                                        </div>
                                        {review.headline && (
                                          <p className="text-white/90 text-sm font-medium mb-1">{review.headline}</p>
                                        )}
                                        {review.pros && (
                                          <p className="text-green-400/80 text-xs mb-1">
                                            <span className="font-medium">+</span> {review.pros}
                                          </p>
                                        )}
                                        {review.cons && (
                                          <p className="text-red-400/80 text-xs">
                                            <span className="font-medium">−</span> {review.cons}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-white/40 text-sm">No reviews available</p>
                                )}
                              </div>

                              {/* Select button */}
                              <button
                                onClick={() => {
                                  setSelectedHotel(hotel);
                                  setSkipHotels(false);
                                  // Track hotel selection for preference learning
                                  if (trip) {
                                    trackHotelSelection({
                                      destinationId: trip.destination.city.toLowerCase().replace(/\s+/g, '-'),
                                      stars: hotel.stars || 3,
                                      pricePerNight: hotel.pricePerNight || hotel.totalPrice / (trip.itinerary.days || 3),
                                      amenities: hotel.amenities || [],
                                    });
                                  }
                                }}
                                className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                                  isSelected
                                    ? 'bg-white text-gray-900'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                              >
                                {isSelected ? '✓ Selected' : 'Select This Hotel'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* No hotels found */}
              {!isLoadingHotels && !hotelError && deduplicatedHotels.length === 0 && hotelsLoaded && (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">No hotels available</h3>
                      <p className="text-white/60 text-sm">
                        We couldn't find hotels for these dates. You can book accommodation separately.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Skip option */}
              <button
                onClick={() => {
                  setSkipHotels(!skipHotels);
                  if (!skipHotels) {
                    setSelectedHotel(null);
                  } else if (hotelOptions.length > 0) {
                    setSelectedHotel(hotelOptions[0]);
                  }
                }}
                className={`w-full p-4 rounded-xl border-2 transition-all mb-4 ${
                  skipHotels
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    skipHotels ? 'border-amber-500 bg-amber-500' : 'border-white/40'
                  }`}>
                    {skipHotels && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">I'll book accommodation myself</p>
                    <p className="text-white/50 text-sm">Skip this step</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
          )}

          {/* Bottom button */}
          <div className="p-4 pb-safe border-t border-white/10">
            <button
              onClick={handleContinueFromHotels}
              disabled={isLoadingHotels}
              className="w-full py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {isLoadingHotels ? 'Finding hotels...' : 'Review Trip →'}
            </button>
          </div>
        </div>

        {/* Photo Lightbox Modal */}
        {showLightbox && lightboxPhotos.length > 0 && (
          <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setShowLightbox(false)}
          >
            {/* Close button */}
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 right-4 text-white/80 hover:text-white p-2 z-10"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-4 text-white/80 text-sm">
              {lightboxIndex + 1} / {lightboxPhotos.length}
            </div>

            {/* Previous button */}
            {lightboxIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev - 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
              >
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Next button */}
            {lightboxIndex < lightboxPhotos.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev + 1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
              >
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Main image */}
            <img
              src={lightboxPhotos[lightboxIndex]}
              alt={`Photo ${lightboxIndex + 1}`}
              className="max-w-[90vw] max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  // Step 3: Checkout summary
  if (step === 'checkout') {
    const hotelTotal = skipHotels ? 0 : (selectedHotel?.totalPrice || 0);
    const grandTotal = hotelTotal;
    const hasAnythingToBook = !skipHotels && selectedHotel;

    return (
      <div className="fixed inset-0 z-40 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="h-full flex flex-col">
          {/* Header with progress */}
          <div className="pt-safe border-b border-white/10">
            <div className="py-3">
              <StepProgressBar currentStep="checkout" />
            </div>
            <div className="px-4 pb-3 flex items-center justify-between">
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </button>
              <h1 className="text-white font-bold">Review Trip</h1>
              <div className="w-16" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-lg mx-auto">
              {/* Trip summary */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-4">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={trip.imageUrl}
                    alt={trip.destination.city}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                  <div>
                    <h3 className="text-white font-bold text-lg">{trip.destination.city}</h3>
                    <p className="text-white/60">{trip.destination.country}</p>
                    <p className="text-white/50 text-sm">{trip.itinerary.days} days • {itineraryType && PATH_CONFIG[itineraryType]?.name} itinerary</p>
                  </div>
                </div>

                {/* Line items */}
                <div className="border-t border-white/10 pt-4 space-y-3">
                  {/* Itinerary - always included */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📋</span>
                      <span className="text-white/80">Personalized Itinerary</span>
                    </div>
                    <span className="text-green-400 font-medium">Free</span>
                  </div>

                  {/* Hotel */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏨</span>
                      <span className={skipHotels || !selectedHotel ? 'text-white/40 line-through' : 'text-white/80'}>
                        {selectedHotel ? `${trip.itinerary.days} nights at ${selectedHotel.name}` : 'Hotel'}
                      </span>
                    </div>
                    {skipHotels || !selectedHotel ? (
                      <span className="text-white/40">Skipped</span>
                    ) : (
                      <span className="text-white font-medium">
                        {formatPrice(selectedHotel.totalPrice, selectedHotel.currency)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-white/10 mt-4 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-lg">Total</span>
                    <span className="text-white font-bold text-2xl">
                      {grandTotal > 0 ? formatPrice(grandTotal, trip.pricing.currency) : 'Free'}
                    </span>
                  </div>
                </div>
              </div>

              {!hasAnythingToBook && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                  <p className="text-green-400 text-sm">
                    You'll receive your personalized {trip.destination.city} itinerary with the {itineraryType && PATH_CONFIG[itineraryType]?.name.toLowerCase()} experience!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom button */}
          <div className="p-4 pb-safe border-t border-white/10">
            <button
              onClick={handleCheckout}
              className="w-full py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors"
            >
              See My Adventure Package →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Your Adventure Package — real trip content
  // ═══════════════════════════════════════════════════════
  // Step 4: Your Adventure Package — Two-Column Editorial
  // ═══════════════════════════════════════════════════════
  if (step === 'package') {
    const hasHotel = !skipHotels && selectedHotel;
    const totalDays = trip.itinerary?.days || 3;
    const allStops = itinerary.flatMap((day) => day.stops);
    const totalStops = allStops.length;
    const grandTotal = skipHotels ? 0 : (selectedHotel?.totalPrice || 0);

    // Read traveler type from session (fix: was hardcoded as "couple")
    let resolvedTravelerType = 'couple';
    try { const stored = sessionStorage.getItem('flash_traveler_type'); if (stored) resolvedTravelerType = stored; } catch {}

    // Trip prep context
    const poiDetailsForAI = allStops.map(stop => ({
      name: stop.name,
      type: stop.type,
      category: stop.category || undefined,
      rating: stop.googleRating,
      reviewCount: stop.googleReviewCount,
      duration: stop.duration,
      bestTimeOfDay: stop.bestTimeOfDay,
      distanceFromHotel: hasHotel && selectedHotel
        ? Math.round(getDistanceMeters(
            selectedHotel.latitude, selectedHotel.longitude,
            stop.latitude, stop.longitude
          ))
        : undefined,
    }));

    const clusterSummaries = poiClusters.map(cluster => {
      const clusterStopsList = allStops.filter(s => stopClusterMap.get(s.id) === cluster.id);
      const walkMin = hasHotel && selectedHotel
        ? Math.max(1, Math.round(getDistanceMeters(
            selectedHotel.latitude, selectedHotel.longitude,
            cluster.center.latitude, cluster.center.longitude
          ) / 80))
        : undefined;
      return {
        label: cluster.label,
        poiNames: clusterStopsList.map(s => s.name),
        walkFromHotel: walkMin,
      };
    });

    const hotelContextForAI = hasHotel && selectedHotel ? {
      name: selectedHotel.name,
      stars: selectedHotel.stars,
      pricePerNight: selectedHotel.pricePerNight,
      totalPrice: selectedHotel.totalPrice,
      currency: selectedHotel.currency,
      amenities: selectedHotel.amenities,
    } : undefined;

    // Calculate 3 nearest POIs to hotel for proximity display
    const nearestToHotel = hasHotel && selectedHotel
      ? allStops
          .map((stop) => ({
            stop,
            distance: getDistanceMeters(
              selectedHotel.latitude, selectedHotel.longitude,
              stop.latitude, stop.longitude
            ),
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 3)
      : [];

    return (
      <div className="fixed inset-0 z-40 bg-gray-900">
        <div className="h-full flex flex-col">
          {/* Header with progress */}
          <div className="pt-safe border-b border-white/10 bg-gray-900/95 backdrop-blur-sm z-10">
            <div className="py-2">
              <StepProgressBar currentStep="package" />
            </div>
            <div className="px-4 pb-2 flex items-center justify-between">
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </button>
              <h1 className="text-white font-bold text-sm">
                Your {trip.destination.city} Basecamp
              </h1>
              <div className="w-16" />
            </div>
          </div>

          {/* ═══ SCROLLABLE CONTENT ═══ */}
          <div className="flex-1 overflow-y-auto pb-24">

            {/* 1. FULL-WIDTH HERO MAP with carousel overlay */}
            <div className="relative">
              <PackageMiniMap
                stops={allStops}
                hotelLocation={hasHotel && selectedHotel ? {
                  latitude: selectedHotel.latitude,
                  longitude: selectedHotel.longitude,
                  name: selectedHotel.name,
                } : null}
                routeGeometry={activeRoute?.geometry || null}
                heroMode
                activeStopId={activeCarouselStopId}
                onStopClick={(stopId) => setActiveCarouselStopId(stopId)}
              />

              {/* Walk time chip — shows when a route is active */}
              {activeRoute && activeCarouselStopId && (
                <div className="absolute top-3 left-3 z-20">
                  <div className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5">
                    <span className="text-sm">🚶</span>
                    <span className="text-white text-xs font-medium">
                      {activeRoute.duration < 3600
                        ? `${Math.round(activeRoute.duration / 60)} min`
                        : `${Math.floor(activeRoute.duration / 3600)}h ${Math.round((activeRoute.duration % 3600) / 60)}m`}
                    </span>
                    <span className="text-white/40 text-xs">·</span>
                    <span className="text-white/60 text-xs">
                      {activeRoute.distance < 1000
                        ? `${Math.round(activeRoute.distance)}m`
                        : `${(activeRoute.distance / 1000).toFixed(1)}km`}
                    </span>
                  </div>
                </div>
              )}

              {/* POI Carousel overlapping map bottom */}
              <div className="absolute bottom-0 left-0 right-0 z-10">
                <div className="bg-gradient-to-t from-black/70 via-black/40 to-transparent pt-10">
                  <POICarousel
                    stops={allStops}
                    activeStopId={activeCarouselStopId}
                    onStopSelect={(stopId) => setActiveCarouselStopId(stopId)}
                    hotelLocation={hasHotel && selectedHotel ? {
                      latitude: selectedHotel.latitude,
                      longitude: selectedHotel.longitude,
                    } : null}
                  />
                </div>
              </div>

              {/* Destination badge — top left overlay on map */}
              <div className="absolute top-3 left-3 z-10">
                <div className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5">
                  <span className="text-xs">
                    {itineraryType && PATH_CONFIG[itineraryType]?.emoji}
                  </span>
                  <span className="text-white/90 text-xs font-medium">
                    {totalStops} stops · {totalDays} days
                  </span>
                </div>
              </div>
            </div>

            {/* 2. TRIP NARRATIVE HEADER */}
            <div className="px-4 pt-5 pb-3">
              <div className="bg-gradient-to-br from-primary-500/10 to-purple-500/10 border border-primary-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500/30 to-purple-500/30 rounded-full flex items-center justify-center">
                    <span className="text-2xl">{itineraryType ? PATH_CONFIG[itineraryType]?.emoji : '\u2708\uFE0F'}</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-white font-bold text-lg leading-tight">
                      Your {totalDays}-Day {itineraryType ? PATH_CONFIG[itineraryType]?.name : 'Adventure'} in {trip.destination.city}
                    </h2>
                    {tripDates.departure && tripDates.return && (
                      <p className="text-white/50 text-xs mt-0.5">
                        {(() => { try { return `${format(new Date(tripDates.departure + 'T12:00:00'), 'MMM d')} \u2013 ${format(new Date(tripDates.return + 'T12:00:00'), 'MMM d, yyyy')}`; } catch { return ''; } })()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Key stats */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-primary-400">{'\uD83D\uDCCD'}</span>
                    <span className="text-white/80">{totalStops} handpicked stops</span>
                  </div>
                  {favoriteStops.length > 0 && (
                    <>
                      <div className="w-px h-3 bg-white/15" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-pink-400">{'\u2764\uFE0F'}</span>
                        <span className="text-white/80">{favoriteStops.length} favorite{favoriteStops.length !== 1 ? 's' : ''}</span>
                      </div>
                    </>
                  )}
                  <div className="w-px h-3 bg-white/15" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400">{'\u23F1\uFE0F'}</span>
                    <span className="text-white/80">~{Math.round(estimateTotalMinutes(allStops) / 60)}hr of exploration</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. HOTEL DEEP-DIVE CARD */}
            {hasHotel && selectedHotel && (
              <div className="px-4 py-5">
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {/* Hotel photo */}
                    <div className="relative sm:w-[180px] sm:flex-shrink-0 h-44 sm:h-auto">
                      {selectedHotel.mainPhoto ? (
                        <img
                          src={selectedHotel.mainPhoto}
                          alt={selectedHotel.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600/30 to-indigo-800/30 flex items-center justify-center">
                          <span className="text-4xl">🏨</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-black/20" />
                      {selectedHotel.refundable && (
                        <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                          Free cancellation
                        </div>
                      )}
                    </div>

                    {/* Hotel details */}
                    <div className="flex-1 p-4 space-y-3">
                      {/* Name + stars + rating */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-white font-bold text-lg leading-tight">{selectedHotel.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-amber-400 text-sm">{'★'.repeat(selectedHotel.stars)}</span>
                              {selectedHotel.rating > 0 && (
                                <span className="text-white/60 text-xs">{selectedHotel.rating.toFixed(1)} ({selectedHotel.reviewCount})</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-white font-bold text-lg">{formatPrice(selectedHotel.totalPrice, selectedHotel.currency)}</p>
                            <p className="text-white/40 text-[11px]">{formatPrice(selectedHotel.pricePerNight, selectedHotel.currency)}/night</p>
                          </div>
                        </div>
                      </div>

                      {/* Proximity to POIs — the key "basecamp" insight */}
                      {nearestToHotel.length > 0 && (
                        <div className="bg-white/5 rounded-xl px-3 py-2.5 space-y-1.5">
                          <p className="text-white/60 text-[10px] font-medium uppercase tracking-wider">Walking distance</p>
                          {nearestToHotel.map(({ stop, distance }) => (
                            <div key={stop.id} className="flex items-center gap-2">
                              <span className="text-[11px]">🚶</span>
                              <span className="text-white/80 text-xs">
                                ~{Math.max(1, Math.round(distance / 80))} min to {stop.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Check-in/out + room */}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white/40">Check-in</span>
                          <span className="text-white font-medium">{selectedHotel.checkinTime || '3:00 PM'}</span>
                        </div>
                        <div className="w-px h-3 bg-white/15" />
                        <div className="flex items-center gap-1.5">
                          <span className="text-white/40">Check-out</span>
                          <span className="text-white font-medium">{selectedHotel.checkoutTime || '11:00 AM'}</span>
                        </div>
                      </div>
                      <p className="text-white/50 text-xs">
                        {totalDays} nights · {selectedHotel.roomName || 'Standard Room'}
                        {selectedHotel.boardName ? ` · ${selectedHotel.boardName}` : ''}
                      </p>

                      {/* Amenities */}
                      {selectedHotel.amenities && selectedHotel.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedHotel.amenities.slice(0, 6).map((amenity, i) => (
                            <span key={i} className="bg-white/8 text-white/60 text-[10px] px-2 py-0.5 rounded-full border border-white/5">
                              {amenity}
                            </span>
                          ))}
                          {selectedHotel.amenities.length > 6 && (
                            <span className="text-white/30 text-[10px] px-1 self-center">
                              +{selectedHotel.amenities.length - 6} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No hotel — show trip summary instead */}
            {!hasHotel && (
              <div className="px-4 py-5">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <p className="text-white/60 text-sm">Hotel skipped — itinerary only</p>
                  <p className="text-white font-semibold mt-1">{totalStops} stops across {totalDays} days</p>
                </div>
              </div>
            )}

            {/* 3b. TRIP PREP — Data-driven destination intelligence */}
            <div className="px-4 py-5 border-t border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">🧭</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Trip Prep</h3>
                  <p className="text-sm text-white/50">Your {trip.destination.city} briefing</p>
                </div>
              </div>
              {tripDates.departure && tripDates.return ? (
                <TripIntelligence
                  destinationId={trip.destination.id}
                  city={trip.destination.city}
                  country={trip.destination.country}
                  departureDate={tripDates.departure}
                  returnDate={tripDates.return}
                  travelerType={resolvedTravelerType}
                  vibes={trip.destination.vibes || []}
                  variant="dark"
                  layout="grid"
                  pathType={itineraryType || undefined}
                />
              ) : (
                <div className="flex items-center gap-2 text-white/40 text-sm py-4">
                  <Spinner className="w-4 h-4" />
                  <span>Loading trip details...</span>
                </div>
              )}
            </div>

            {/* 4. VISUAL DAY PLANNER TIMELINE */}
            {(() => {
              const pkgClusters = allStops.length >= 4
                ? clusterPOIsGeographic(allStops)
                : [];
              if (pkgClusters.length < 2) return null;

              // Map stop IDs to clusters
              const pkgStopClusterMap = new Map<string, number>();
              pkgClusters.forEach(cluster => {
                cluster.points.forEach(point => {
                  const stop = allStops.find(s => s.latitude === point.latitude && s.longitude === point.longitude);
                  if (stop) pkgStopClusterMap.set(stop.id, cluster.id);
                });
              });

              return (
                <div className="px-4 py-5 border-t border-white/5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
                      <span className="text-xl">{'\uD83E\uDDED'}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base">Your Day-by-Day Adventure</h3>
                      <p className="text-white/50 text-xs">Nearby spots grouped for efficient exploring</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {pkgClusters.map((cluster, dayIdx) => {
                      const clusterStops = allStops.filter(s => pkgStopClusterMap.get(s.id) === cluster.id);
                      const clusterMinutes = estimateTotalMinutes(clusterStops);
                      const clusterHours = Math.round(clusterMinutes / 60);

                      let hotelWalkMin: number | null = null;
                      if (hasHotel && selectedHotel) {
                        const dist = getDistanceMeters(
                          selectedHotel.latitude, selectedHotel.longitude,
                          cluster.center.latitude, cluster.center.longitude
                        );
                        hotelWalkMin = Math.max(1, Math.round(dist / 80));
                      }

                      // Group stops by bestTimeOfDay (respecting user overrides)
                      const stopsByTime = new Map<string, typeof clusterStops>();
                      clusterStops.forEach(stop => {
                        const timeKey = timeOverrides[stop.id] || stop.bestTimeOfDay || 'any';
                        if (!stopsByTime.has(timeKey)) stopsByTime.set(timeKey, []);
                        stopsByTime.get(timeKey)!.push(stop);
                      });

                      // Sort time groups, filter out empty ones (from time overrides)
                      const sortedTimeGroups = Array.from(stopsByTime.entries())
                        .filter(([, stops]) => stops.length > 0)
                        .sort((a, b) => (TIME_OF_DAY_CONFIG[a[0]]?.order ?? 99) - (TIME_OF_DAY_CONFIG[b[0]]?.order ?? 99));

                      const hasActiveStop = clusterStops.some(s => s.id === activeCarouselStopId);

                      return (
                        <div
                          key={cluster.id}
                          className={`rounded-xl p-4 transition-all duration-200 ${
                            hasActiveStop
                              ? 'bg-white/8 border border-primary-500/25'
                              : 'bg-white/5 border border-white/10'
                          }`}
                          style={{ borderLeftWidth: '4px', borderLeftColor: cluster.color }}
                        >
                          {/* Day header */}
                          <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
                            <div className="flex items-center gap-2.5">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cluster.color }} />
                              <h4 className="text-white font-bold text-sm">
                                Day {dayIdx + 1}: {cluster.label} Zone
                              </h4>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-white/50">
                              <span>{clusterStops.length} spots</span>
                              <span>{'\u00B7'}</span>
                              <span>~{clusterHours}hr</span>
                              {hotelWalkMin !== null && (
                                <>
                                  <span>{'\u00B7'}</span>
                                  <span>{'\uD83D\uDEB6'} {hotelWalkMin}min walk</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* AI-generated narrative intro */}
                          {narrativeLoading ? (
                            <div className="mb-3 space-y-2 px-1">
                              <div className="h-3 bg-white/5 rounded-full animate-pulse w-full" />
                              <div className="h-3 bg-white/5 rounded-full animate-pulse w-5/6" />
                              <div className="h-3 bg-white/5 rounded-full animate-pulse w-4/6" />
                            </div>
                          ) : dayNarratives[dayIdx] ? (
                            <p className="text-white/70 text-sm leading-relaxed mb-3 px-1">
                              {dayNarratives[dayIdx]}
                            </p>
                          ) : null}

                          {/* Timeline by time of day */}
                          <div className="space-y-4">
                            {sortedTimeGroups.map(([timeKey, timeStops]) => {
                              const timeConfig = TIME_OF_DAY_CONFIG[timeKey] || TIME_OF_DAY_CONFIG.any;

                              return (
                                <div key={timeKey} className="relative pl-8">
                                  {/* Time-of-day marker */}
                                  <div className="absolute left-0 top-0 flex flex-col items-center">
                                    <span className="text-lg">{timeConfig.emoji}</span>
                                    <div className="w-px flex-1 bg-white/10 mt-1" />
                                  </div>

                                  <div className="mb-2">
                                    <span className="text-white/70 text-xs font-medium">{timeConfig.label}</span>
                                    {timeConfig.time && (
                                      <span className="text-white/35 text-[10px] ml-1.5">({timeConfig.time})</span>
                                    )}
                                  </div>

                                  {/* POI cards for this time slot */}
                                  <div className="space-y-2">
                                    {timeStops.map(stop => {
                                      const stopDistM = hasHotel && selectedHotel
                                        ? Math.round(getDistanceMeters(
                                            selectedHotel.latitude, selectedHotel.longitude,
                                            stop.latitude, stop.longitude
                                          ))
                                        : null;

                                      const stopTimeConfig = TIME_OF_DAY_CONFIG[timeOverrides[stop.id] || stop.bestTimeOfDay || 'any'] || TIME_OF_DAY_CONFIG.any;
                                      const isStopActive = activeCarouselStopId === stop.id;

                                      return (
                                        <div
                                          key={stop.id}
                                          data-timeline-stop-id={stop.id}
                                          role="button"
                                          tabIndex={0}
                                          onClick={() => { setActiveCarouselStopId(stop.id); setEditingStopTime(null); }}
                                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveCarouselStopId(stop.id); }}
                                          className={`flex gap-2.5 rounded-lg p-2 cursor-pointer transition-all ${
                                            isStopActive
                                              ? 'bg-primary-500/15 ring-1 ring-primary-400/40'
                                              : 'bg-white/5 hover:bg-white/8'
                                          }`}
                                        >
                                          {/* Thumbnail */}
                                          <div className="relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0">
                                            <BlurUpImage
                                              src={stop.imageUrl || ''}
                                              alt={stop.name}
                                              fallbackEmoji={CAROUSEL_EMOJIS[stop.type] || '\uD83D\uDCCD'}
                                              fallbackGradient="bg-gradient-to-br from-gray-700 to-gray-800"
                                              className="w-full h-full"
                                            />
                                          </div>

                                          {/* Details */}
                                          <div className="flex-1 min-w-0">
                                            <p className="text-white text-xs font-semibold truncate">{stop.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              {stop.googleRating && (
                                                <span className="text-amber-400 text-[10px]">{'\u2605'} {stop.googleRating.toFixed(1)}</span>
                                              )}
                                              {stop.duration && (
                                                <span className="text-white/40 text-[10px]">{stop.duration}</span>
                                              )}
                                              {stopDistM !== null && (
                                                <span className="text-white/30 text-[10px]">{formatDistance(stopDistM)}</span>
                                              )}
                                            </div>
                                            {favorites.has(stop.id) && (
                                              <span className="inline-flex items-center gap-1 text-pink-400 text-[9px] mt-0.5 font-medium">
                                                {'\u2764\uFE0F'} Favorite
                                              </span>
                                            )}

                                            {/* Time-of-day chip — tap to reassign */}
                                            <div className="mt-1">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingStopTime(editingStopTime === stop.id ? null : stop.id);
                                                }}
                                                className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-white/60 bg-white/5 hover:bg-white/10 rounded-full px-2 py-0.5 transition-colors"
                                              >
                                                <span>{stopTimeConfig.emoji}</span>
                                                <span>{stopTimeConfig.label}</span>
                                                <svg className="w-2.5 h-2.5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                </svg>
                                              </button>

                                              {editingStopTime === stop.id && (
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                  {Object.entries(TIME_OF_DAY_CONFIG)
                                                    .filter(([k]) => k !== 'any')
                                                    .map(([key, config]) => {
                                                      const currentTime = timeOverrides[stop.id] || stop.bestTimeOfDay || 'any';
                                                      const isSelected = currentTime === key;
                                                      return (
                                                        <button
                                                          key={key}
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (key === (stop.bestTimeOfDay || 'any')) {
                                                              // Selecting original time = remove override
                                                              setTimeOverrides(prev => {
                                                                const next = { ...prev };
                                                                delete next[stop.id];
                                                                return next;
                                                              });
                                                            } else {
                                                              setTimeOverrides(prev => ({ ...prev, [stop.id]: key }));
                                                            }
                                                            setEditingStopTime(null);
                                                          }}
                                                          className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                                                            isSelected
                                                              ? 'bg-primary-500/30 text-primary-300 ring-1 ring-primary-400/40'
                                                              : 'bg-white/8 text-white/50 hover:bg-white/15 hover:text-white/70'
                                                          }`}
                                                        >
                                                          {config.emoji} {config.label}
                                                        </button>
                                                      );
                                                    })}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}


          </div>

          {/* ═══ STICKY BOTTOM ACTION BAR ═══ */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/98 backdrop-blur-md border-t border-white/10 pb-safe shadow-2xl">
            <div className="px-4 py-3 max-w-4xl mx-auto">
              {hasHotel && selectedHotel ? (
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Trip summary */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate mb-0.5">{selectedHotel.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-white/50">
                      <span>{totalDays} nights</span>
                      <span>{'\u00B7'}</span>
                      <span className="truncate">{selectedHotel.roomName || 'Standard Room'}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-green-400">{'\u2713'}</span>
                        <span className="text-[10px] text-white/50">{totalStops}-stop itinerary</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-purple-400">{'\u2713'}</span>
                        <span className="text-[10px] text-white/50">Travel prep</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Price */}
                  <div className="text-right flex-shrink-0 mr-3">
                    <p className="text-white/40 text-[9px] uppercase tracking-wide mb-0.5">Total</p>
                    <p className="text-white font-bold text-xl leading-none">
                      {formatPrice(grandTotal, trip.pricing.currency)}
                    </p>
                    <p className="text-white/30 text-[10px] mt-0.5">
                      {formatPrice(selectedHotel.pricePerNight, selectedHotel.currency)}/night
                    </p>
                  </div>

                  {/* Right: CTA */}
                  <button
                    onClick={handleFinalConfirm}
                    className="px-5 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-sm rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-xl shadow-primary-500/30 flex-shrink-0"
                  >
                    Confirm & Book
                    <svg className="w-4 h-4 inline-block ml-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm mb-0.5">Your {trip.destination.city} Itinerary</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-green-400">{'\u2713'}</span>
                        <span className="text-[10px] text-white/50">{totalStops} stops {'\u00B7'} {totalDays} days</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-purple-400">{'\u2713'}</span>
                        <span className="text-[10px] text-white/50">Complete travel guides</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleFinalConfirm}
                    className="px-6 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-sm rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-xl shadow-primary-500/30"
                  >
                    Get My Package
                    <svg className="w-4 h-4 inline-block ml-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <style jsx global>{`
          .pt-safe { padding-top: max(16px, env(safe-area-inset-top)); }
          .pb-safe { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    );
  }

  return null;
}

// Wrap with Suspense for useSearchParams
export default function FlashExplorePage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Spinner size="lg" className="text-white" />
      </div>
    }>
      <FlashExploreContent />
    </Suspense>
  );
}
