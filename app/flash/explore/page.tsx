'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { ItineraryMap } from '@/components/flash/ItineraryMap';
import { Spinner } from '@/components/ui';
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

type BookingStep = 'choice' | 'itinerary' | 'flights' | 'hotels' | 'checkout';
type ItineraryType = SimplePathChoice | null;

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
  type: 'landmark' | 'restaurant' | 'activity' | 'accommodation' | 'transport';
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

export default function FlashExplorePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [trip, setTrip] = useState<FlashTripPackage | null>(null);
  const [step, setStep] = useState<BookingStep>('itinerary'); // Start directly on itinerary
  const [itineraryType, setItineraryType] = useState<ItineraryType>('classic'); // Default to classic
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [activeDay, setActiveDay] = useState(1);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);

  // Favorites - persists across shuffles
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoriteStops, setFavoriteStops] = useState<ItineraryStop[]>([]);

  // Error handling for POI loading
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Booking selections
  const [skipFlights, setSkipFlights] = useState(false);
  const [skipHotels, setSkipHotels] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);

  // Load trip from session storage
  useEffect(() => {
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
  }, [router]);

  // Auto-load classic itinerary when trip is loaded
  useEffect(() => {
    if (trip && itinerary.length === 0 && !isLoadingItinerary) {
      loadItinerary('classic');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip]);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?redirect=/flash');
    }
  }, [user, authLoading, router]);

  // Auto-save draft when user makes changes (debounced)
  useEffect(() => {
    if (!trip?.destination?.city || !trip?.dates?.departure || !itinerary.length || !itineraryType) return;

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

  // Load draft on mount if trip matches
  useEffect(() => {
    if (!trip?.destination?.city || !trip?.dates?.departure || !trip?.dates?.return) return;

    const destId = trip.destination.city.toLowerCase().replace(/\s+/g, '-');
    const dateKey = `${trip.dates.departure}-${trip.dates.return}`;
    const draftId = `${destId}-${dateKey}`;

    const draft = getDraftTrip(draftId);
    if (draft && draft.favorites.length > 0) {
      // Restore favorites from draft
      setFavorites(new Set(draft.favorites));
      setFavoriteStops(draft.favoriteStops);
    }
  }, [trip]);

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
      } else {
        newFavorites.add(stop.id);
        // Add to favoriteStops (keep full stop data)
        setFavoriteStops(current => [...current, stop]);
      }
      return newFavorites;
    });
  }, []);

  const handleGoBack = () => {
    if (step === 'itinerary') {
      // Go back to swipe to pick a different destination
      router.push('/flash/swipe');
    } else if (step === 'flights') {
      setStep('itinerary');
    } else if (step === 'hotels') {
      setStep('flights');
    } else if (step === 'checkout') {
      setStep('hotels');
    }
  };

  const handleContinueFromItinerary = () => {
    setStep('flights');
  };

  const handleContinueFromFlights = () => {
    setStep('hotels');
  };

  const handleContinueFromHotels = () => {
    setStep('checkout');
  };

  const handleCheckout = () => {
    // Store booking data and go to confirm
    const bookingData = {
      trip,
      itineraryType,
      itinerary,
      skipFlights,
      skipHotels,
      selectedFlight: skipFlights ? null : (selectedFlight || trip?.flight),
      selectedHotel: skipHotels ? null : (selectedHotel || trip?.hotel),
      favoriteStops, // Include saved favorites
    };
    sessionStorage.setItem('flash_booking_data', JSON.stringify(bookingData));
    router.push('/flash/confirm');
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (authLoading || !trip) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Spinner size="lg" className="text-white" />
      </div>
    );
  }

  // Itinerary view with map (main step)
  if (step === 'itinerary') {
    // Get ALL stops from all days for the map
    const allStops = itinerary.flatMap((day) => day.stops);
    const activeStop = activeStopId ? allStops.find((s) => s.id === activeStopId) : null;
    // Center on first stop
    const centerLat = allStops[0]?.latitude || 0;
    const centerLng = allStops[0]?.longitude || 0;

    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* Map background - show ALL stops */}
        <ItineraryMap
          stops={allStops}
          centerLatitude={centerLat}
          centerLongitude={centerLng}
          activeStopId={activeStopId || undefined}
          onStopClick={handleStopClick}
          className="absolute inset-0"
        />

        {/* Top gradient overlay */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-safe">
          <div className="flex items-center justify-between">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors p-2 -ml-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>

            <div className="text-center">
              <h1 className="text-white font-bold text-lg">
                {itineraryType && PATH_CONFIG[itineraryType]?.emoji} {itineraryType && PATH_CONFIG[itineraryType]?.name}
              </h1>
              <p className="text-white/60 text-xs">{trip.destination.city}, {trip.destination.country}</p>
            </div>

            <div className="w-16" />
          </div>
        </div>

        {/* Bottom panel */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="h-20 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

          <div className="bg-black/90 backdrop-blur-md px-4 pb-safe">
            {/* Route info */}
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div>
                <h2 className="text-white font-semibold">Your Route</h2>
                <p className="text-white/50 text-sm">{allStops.length} places to explore</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Favorites indicator */}
                {favorites.size > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/20 rounded-full">
                    <svg className="w-4 h-4 text-pink-500 fill-pink-500" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-pink-400 text-sm font-medium">{favorites.size}</span>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-white/50 text-xs">Step 1 of 4</p>
                  <p className="text-white/70 text-sm font-medium">Itinerary</p>
                </div>
              </div>
            </div>

            {/* Error message (dismissible) */}
            {loadingError && (
              <div className="flex items-center justify-between gap-3 py-2 px-3 mb-2 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-amber-200 text-sm">{loadingError}</span>
                </div>
                <button
                  onClick={() => setLoadingError(null)}
                  className="text-amber-400 hover:text-amber-200 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Stops carousel - ALL stops */}
            <div className="flex gap-3 overflow-x-auto py-4 scrollbar-hide">
              {isLoadingItinerary ? (
                <div className="flex-1 flex items-center justify-center py-8">
                  <Spinner size="md" className="text-white" />
                  <span className="text-white/60 ml-3">Loading {itineraryType && PATH_CONFIG[itineraryType]?.name}...</span>
                </div>
              ) : allStops.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-white/60 mb-2">No places found for this itinerary</p>
                  <button
                    onClick={handleShuffle}
                    className="text-white underline hover:text-white/80 text-sm"
                  >
                    Try a different style
                  </button>
                </div>
              ) : allStops.map((stop, index) => (
                <div
                  key={stop.id}
                  onClick={() => handleStopClick(stop)}
                  className={`flex-shrink-0 w-72 bg-white/10 rounded-xl p-3 text-left transition-all cursor-pointer relative ${
                    activeStopId === stop.id
                      ? 'ring-2 ring-white bg-white/20'
                      : 'hover:bg-white/15'
                  } ${favorites.has(stop.id) ? 'ring-1 ring-pink-500/50' : ''}`}
                >
                  {/* Favorite heart button */}
                  <button
                    onClick={(e) => toggleFavorite(stop, e)}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors z-10"
                  >
                    <svg
                      className={`w-5 h-5 transition-colors ${favorites.has(stop.id) ? 'text-pink-500 fill-pink-500' : 'text-white/60'}`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      fill={favorites.has(stop.id) ? 'currentColor' : 'none'}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <div className="flex items-start gap-3 pr-8">
                    {stop.imageUrl ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white/20">
                        <img
                          src={getProxiedImageUrl(stop.imageUrl)}
                          alt={stop.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to emoji on image error
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full bg-white/20 flex items-center justify-center text-lg">${
                                stop.type === 'landmark' ? '🏛️' :
                                stop.type === 'restaurant' ? '🍽️' :
                                stop.type === 'activity' ? '🎯' :
                                stop.type === 'accommodation' ? '🏨' : '✈️'
                              }</div>`;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg flex-shrink-0">
                        {stop.type === 'landmark' && '🏛️'}
                        {stop.type === 'restaurant' && '🍽️'}
                        {stop.type === 'activity' && '🎯'}
                        {stop.type === 'accommodation' && '🏨'}
                        {stop.type === 'transport' && '✈️'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white/50 text-xs">#{index + 1}</span>
                        {stop.googleRating && (
                          <span className="text-amber-400 text-xs flex items-center gap-0.5">
                            ★ {stop.googleRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-medium truncate">{stop.name}</h3>
                      <p className="text-white/60 text-sm line-clamp-2">{stop.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons: Shuffle, Skip, Continue */}
            <div className="flex gap-2 mb-4">
              {/* Shuffle button */}
              <button
                onClick={handleShuffle}
                disabled={isLoadingItinerary}
                className="flex items-center justify-center gap-2 px-4 py-4 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Shuffle</span>
              </button>

              {/* Skip to Booking button - for users who already know what they want */}
              <button
                onClick={() => setStep('checkout')}
                disabled={isLoadingItinerary}
                className="flex items-center justify-center gap-2 px-4 py-4 bg-white/10 border border-white/20 text-white/80 font-medium rounded-xl hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                <span>Skip</span>
              </button>

              {/* Continue button */}
              <button
                onClick={handleContinueFromItinerary}
                disabled={isLoadingItinerary}
                className="flex-1 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Continue to Flights
              </button>
            </div>
          </div>
        </div>

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

              {/* Image if available */}
              {activeStop.imageUrl && (
                <div className="relative w-full h-40 rounded-xl overflow-hidden mb-4 bg-gray-800">
                  <img
                    src={getProxiedImageUrl(activeStop.imageUrl)}
                    alt={activeStop.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  {/* Favorite button on image */}
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
              )}

              <div className="flex items-start gap-4 mb-4">
                {activeStop.imageUrl ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white/20">
                    <img
                      src={getProxiedImageUrl(activeStop.imageUrl)}
                      alt={activeStop.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full bg-white/10 flex items-center justify-center text-2xl">${
                            activeStop.type === 'landmark' ? '🏛️' :
                            activeStop.type === 'restaurant' ? '🍽️' :
                            activeStop.type === 'activity' ? '🎯' :
                            activeStop.type === 'accommodation' ? '🏨' : '✈️'
                          }</div>`;
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                    {activeStop.type === 'landmark' && '🏛️'}
                    {activeStop.type === 'restaurant' && '🍽️'}
                    {activeStop.type === 'activity' && '🎯'}
                    {activeStop.type === 'accommodation' && '🏨'}
                    {activeStop.type === 'transport' && '✈️'}
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-white text-xl font-bold">{activeStop.name}</h2>

                  {/* Rating and reviews */}
                  {activeStop.googleRating && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-amber-400 flex items-center gap-1">
                        ★ {activeStop.googleRating.toFixed(1)}
                      </span>
                      {activeStop.googleReviewCount && (
                        <span className="text-white/40 text-sm">
                          ({activeStop.googleReviewCount.toLocaleString()} reviews)
                        </span>
                      )}
                      {activeStop.googlePrice !== undefined && (
                        <span className="text-green-400 text-sm ml-2">
                          {'$'.repeat(activeStop.googlePrice + 1)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {/* Favorite button when no image */}
                {!activeStop.imageUrl && (
                  <button
                    onClick={() => toggleFavorite(activeStop)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0 ${
                      favorites.has(activeStop.id) ? 'bg-pink-500' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <svg
                      className={`w-6 h-6 ${favorites.has(activeStop.id) ? 'text-white fill-white' : 'text-white/60'}`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      fill={favorites.has(activeStop.id) ? 'currentColor' : 'none'}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                )}
              </div>

              <p className="text-white/80 mb-4">{activeStop.description}</p>

              {/* Address */}
              {activeStop.address && (
                <p className="text-white/50 text-sm mb-4 flex items-start gap-2">
                  <span>📍</span>
                  <span>{activeStop.address}</span>
                </p>
              )}

              {/* Best time to visit */}
              {activeStop.bestTimeOfDay && activeStop.bestTimeOfDay !== 'any' && (
                <p className="text-white/50 text-sm mb-4 flex items-center gap-2">
                  <span>🕐</span>
                  <span>Best time: {activeStop.bestTimeOfDay}</span>
                </p>
              )}

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

  // Step 3: Flight booking
  if (step === 'flights') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 pt-safe border-b border-white/10">
            <div className="flex items-center justify-between">
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </button>
              <div className="text-center">
                <p className="text-white/50 text-xs">Step 2 of 4</p>
                <h1 className="text-white font-bold">Flights</h1>
              </div>
              <div className="w-16" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-lg mx-auto">
              {/* Flight info */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{trip.flight.airline}</h3>
                    <p className="text-white/60 text-sm">
                      {trip.flight.outbound.stops === 0 ? 'Direct flight' : `${trip.flight.outbound.stops} stop`}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-white font-bold text-xl">
                      {formatPrice(trip.flight.price, trip.flight.currency)}
                    </p>
                    <p className="text-white/50 text-xs">round trip</p>
                  </div>
                </div>

                {/* Outbound */}
                <div className="border-t border-white/10 pt-4 mb-4">
                  <p className="text-white/50 text-xs mb-2">OUTBOUND</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{new Date(trip.flight.outbound.departure).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      <p className="text-white/60 text-sm">{trip.flight.outbound.duration}</p>
                    </div>
                  </div>
                </div>

                {/* Return */}
                <div className="border-t border-white/10 pt-4">
                  <p className="text-white/50 text-xs mb-2">RETURN</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{new Date(trip.flight.return.arrival).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      <p className="text-white/60 text-sm">{trip.flight.return.duration}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skip option */}
              <button
                onClick={() => setSkipFlights(!skipFlights)}
                className={`w-full p-4 rounded-xl border-2 transition-all mb-4 ${
                  skipFlights
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    skipFlights ? 'border-amber-500 bg-amber-500' : 'border-white/40'
                  }`}>
                    {skipFlights && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">I'll book flights myself</p>
                    <p className="text-white/50 text-sm">Skip this step and just get the itinerary</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Bottom button */}
          <div className="p-4 pb-safe border-t border-white/10">
            <button
              onClick={handleContinueFromFlights}
              className="w-full py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Continue to Hotels
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Hotel booking
  if (step === 'hotels') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 pt-safe border-b border-white/10">
            <div className="flex items-center justify-between">
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </button>
              <div className="text-center">
                <p className="text-white/50 text-xs">Step 3 of 4</p>
                <h1 className="text-white font-bold">Hotels</h1>
              </div>
              <div className="w-16" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-lg mx-auto">
              {trip.hotel ? (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden mb-4">
                  {/* Hotel image */}
                  <div className="h-40 bg-gray-700">
                    <img
                      src={trip.hotel.imageUrl}
                      alt={trip.hotel.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold text-lg">{trip.hotel.name}</h3>
                        <p className="text-amber-400 text-sm">{'★'.repeat(trip.hotel.stars)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-xl">
                          {formatPrice(trip.hotel.totalPrice, trip.hotel.currency)}
                        </p>
                        <p className="text-white/50 text-xs">{trip.itinerary.days} nights</p>
                      </div>
                    </div>
                    <p className="text-white/60 text-sm">
                      {formatPrice(trip.hotel.pricePerNight, trip.hotel.currency)} per night
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">No hotel included</h3>
                      <p className="text-white/60 text-sm">This package is flights only</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Skip option */}
              <button
                onClick={() => setSkipHotels(!skipHotels)}
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

          {/* Bottom button */}
          <div className="p-4 pb-safe border-t border-white/10">
            <button
              onClick={handleContinueFromHotels}
              className="w-full py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Continue to Checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 5: Checkout summary
  if (step === 'checkout') {
    const flightTotal = skipFlights ? 0 : trip.flight.price;
    const hotelTotal = skipHotels ? 0 : (trip.hotel?.totalPrice || 0);
    const grandTotal = flightTotal + hotelTotal;
    const hasAnythingToBook = !skipFlights || !skipHotels;

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 pt-safe border-b border-white/10">
            <div className="flex items-center justify-between">
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </button>
              <div className="text-center">
                <p className="text-white/50 text-xs">Step 4 of 4</p>
                <h1 className="text-white font-bold">Checkout</h1>
              </div>
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

                  {/* Flights */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✈️</span>
                      <span className={skipFlights ? 'text-white/40 line-through' : 'text-white/80'}>
                        Round-trip flights
                      </span>
                    </div>
                    {skipFlights ? (
                      <span className="text-white/40">Skipped</span>
                    ) : (
                      <span className="text-white font-medium">
                        {formatPrice(trip.flight.price, trip.flight.currency)}
                      </span>
                    )}
                  </div>

                  {/* Hotel */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏨</span>
                      <span className={skipHotels || !trip.hotel ? 'text-white/40 line-through' : 'text-white/80'}>
                        {trip.hotel ? `${trip.itinerary.days} nights hotel` : 'Hotel'}
                      </span>
                    </div>
                    {skipHotels || !trip.hotel ? (
                      <span className="text-white/40">Skipped</span>
                    ) : (
                      <span className="text-white font-medium">
                        {formatPrice(trip.hotel.totalPrice, trip.hotel.currency)}
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
              {hasAnythingToBook ? 'Proceed to Payment' : 'Get My Itinerary'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
