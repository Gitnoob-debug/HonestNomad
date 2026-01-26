'use client';

import { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { DESTINATIONS } from '@/lib/flash/destinations';
import type { HotelOption } from '@/lib/liteapi/types';
import type { LiteAPIReview } from '@/lib/liteapi/types';
import { useRevealedPreferences } from '@/hooks/useRevealedPreferences';
import { getClimate, type ClimateInfo } from '@/lib/climate';

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

// Parse ISO duration (PT2H30M) to minutes
function parseDurationMinutes(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (match) {
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    return hours * 60 + minutes;
  }
  return 0;
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

function FlashExploreContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('draft');
  const [trip, setTrip] = useState<FlashTripPackage | null>(null);
  const [loadedFromDraft, setLoadedFromDraft] = useState(false);
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
  const [selectedHotel, setSelectedHotel] = useState<HotelOption | null>(null);

  // Hotel search state
  const [hotelOptions, setHotelOptions] = useState<HotelOption[]>([]);
  const [isLoadingHotels, setIsLoadingHotels] = useState(false);
  const [hotelError, setHotelError] = useState<string | null>(null);
  const [hotelsLoaded, setHotelsLoaded] = useState(false);

  // Flight search state
  const [flightOptions, setFlightOptions] = useState<any[]>([]);
  const [outOfPrefFlights, setOutOfPrefFlights] = useState<any[]>([]);
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);
  const [flightError, setFlightError] = useState<string | null>(null);
  const [flightFetchAttempted, setFlightFetchAttempted] = useState(false);
  const [showOutOfPref, setShowOutOfPref] = useState(false);
  const [expandedFlightId, setExpandedFlightId] = useState<string | null>(null);
  const [expandedHotelId, setExpandedHotelId] = useState<string | null>(null);

  // Photo lightbox state
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  // Hotel reviews state
  const [hotelReviews, setHotelReviews] = useState<Record<string, LiteAPIReview[]>>({});
  const [loadingReviews, setLoadingReviews] = useState<string | null>(null);

  // Climate data
  const [tripClimate, setTripClimate] = useState<ClimateInfo | null>(null);

  // Revealed preferences tracking
  const { trackFlightSelection, trackHotelSelection, trackPOIAction } = useRevealedPreferences();

  // Compute climate when trip loads
  useEffect(() => {
    if (trip?.destination?.city && trip?.flight?.outbound?.departure) {
      const destinationId = trip.destination.city.toLowerCase().replace(/\s+/g, '-');
      const travelDate = new Date(trip.flight.outbound.departure);
      const climate = getClimate(destinationId, travelDate);
      setTripClimate(climate);
    }
  }, [trip?.destination?.city, trip?.flight?.outbound?.departure]);

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

  // Auto-load classic itinerary when trip is loaded (skip if resuming from draft)
  useEffect(() => {
    if (trip && itinerary.length === 0 && !isLoadingItinerary && !loadedFromDraft) {
      loadItinerary('classic');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip, loadedFromDraft]);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?redirect=/flash');
    }
  }, [user, authLoading, router]);

  // Auto-save draft when user makes changes (debounced)
  useEffect(() => {
    if (!trip?.destination?.city || !trip?.flight?.outbound?.departure || !itinerary.length || !itineraryType) return;

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
      // Debug: Log the first stop to see if imageUrl is present
      console.log('[Explore] Generated itinerary:', {
        days: generated.length,
        totalStops: generated.reduce((sum, day) => sum + day.stops.length, 0),
        firstStop: generated[0]?.stops[0],
        hasImageUrl: generated[0]?.stops[0]?.imageUrl ? 'YES' : 'NO',
      });
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

  // Fetch flights when entering the flights step
  useEffect(() => {
    if (step !== 'flights' || flightFetchAttempted) return;

    async function fetchFlights() {
      if (!trip) return;

      setFlightFetchAttempted(true);
      setIsLoadingFlights(true);
      setFlightError(null);

      try {
        // Get origin from user's home airport (stored in trip or default)
        const origin = trip.flight.outbound.segments?.[0]?.departure?.airport?.code || 'JFK';
        const destination = trip.destination.airportCode;

        // Get dates from flight
        const departureDate = new Date(trip.flight.outbound.departure).toISOString().split('T')[0];
        const returnDate = new Date(trip.flight.return.departure).toISOString().split('T')[0];

        console.log(`Searching flights ${origin} → ${destination}`);
        console.log(`Dates: ${departureDate} to ${returnDate}`);

        const response = await fetch('/api/flights/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin,
            destination,
            departureDate,
            returnDate,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to search flights');
        }

        const data = await response.json();
        setFlightOptions(data.flights || []);
        setOutOfPrefFlights(data.outOfPreference || []);

        // Auto-select first (best match) flight if available
        if (data.flights && data.flights.length > 0) {
          setSelectedFlight(data.flights[0]);
        }
      } catch (error) {
        console.error('Failed to fetch flights:', error);
        setFlightError(error instanceof Error ? error.message : 'Failed to load flights');
      } finally {
        setIsLoadingFlights(false);
      }
    }

    fetchFlights();
  }, [step, trip, flightFetchAttempted]);

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
        // Get destination coordinates from DESTINATIONS
        const destination = DESTINATIONS.find(
          d => d.city === trip.destination.city || d.airportCode === trip.destination.airportCode
        );

        if (!destination) {
          throw new Error(`Could not find coordinates for ${trip.destination.city}`);
        }

        // Get checkin/checkout dates from flight
        // Checkin = day of arrival (outbound arrival)
        // Checkout = day of return departure
        const arrivalDate = new Date(trip.flight.outbound.arrival);
        const departureDate = new Date(trip.flight.return.departure);

        // Format as YYYY-MM-DD
        const checkin = arrivalDate.toISOString().split('T')[0];
        const checkout = departureDate.toISOString().split('T')[0];

        console.log(`Searching hotels in ${trip.destination.city} (${destination.latitude}, ${destination.longitude})`);
        console.log(`Dates: ${checkin} to ${checkout}`);

        const response = await fetch('/api/hotels/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: destination.latitude,
            longitude: destination.longitude,
            checkin,
            checkout,
            destinationName: trip.destination.city,
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
    // Store booking data and go to confirm
    const bookingData = {
      trip,
      itineraryType,
      itinerary,
      skipFlights,
      skipHotels,
      selectedFlight: skipFlights ? null : (selectedFlight || trip?.flight),
      selectedHotel: skipHotels ? null : selectedHotel,
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
              <div className="flex items-center justify-center gap-2">
                <p className="text-white/60 text-xs">{trip.destination.city}, {trip.destination.country}</p>
                {tripClimate && (
                  <span className="text-white/60 text-xs flex items-center gap-1">
                    <span>{tripClimate.icon}</span>
                    <span>{tripClimate.high}°C</span>
                  </span>
                )}
              </div>
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                      {
                        landmark: 'bg-amber-500/20',
                        restaurant: 'bg-red-500/20',
                        activity: 'bg-blue-500/20',
                        museum: 'bg-purple-500/20',
                        park: 'bg-green-500/20',
                        cafe: 'bg-orange-500/20',
                        bar: 'bg-pink-500/20',
                      }[stop.type as string] || 'bg-white/20'
                    }`}>
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
                      }[stop.type as string] || '📍'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white/50 text-xs">#{index + 1}</span>
                        {stop.googleRating && (
                          <span className="text-amber-400 text-xs flex items-center gap-0.5">
                            ★ {stop.googleRating.toFixed(1)}
                          </span>
                        )}
                        {stop.duration && (
                          <span className="text-white/40 text-xs">
                            · {stop.duration}
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
              </div>

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

  // Helper to format flight duration
  const formatDuration = (iso: string) => {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return iso;
    const hours = match[1] || '0';
    const minutes = match[2] || '0';
    return `${hours}h ${minutes}m`;
  };

  // Helper to format time
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Helper to format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Helper to calculate layover duration
  const calculateLayover = (arrival: string, departure: string) => {
    const arrTime = new Date(arrival).getTime();
    const depTime = new Date(departure).getTime();
    const diffMs = depTime - arrTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Step 3: Flight booking
  if (step === 'flights') {
    return (
      <div className="fixed inset-0 z-40 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
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
              {/* Loading state */}
              {isLoadingFlights && (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-4">
                  <div className="flex flex-col items-center justify-center">
                    <Spinner size="lg" className="text-white mb-4" />
                    <p className="text-white/80 font-medium">Finding your perfect flights...</p>
                    <p className="text-white/50 text-sm mt-1">Filtering by your preferences</p>
                  </div>
                </div>
              )}

              {/* Error state */}
              {flightError && !isLoadingFlights && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mb-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-red-400 font-medium">Couldn't load flights</p>
                      <p className="text-red-300/70 text-sm mt-1">{flightError}</p>
                      <button
                        onClick={() => {
                          setFlightFetchAttempted(false);
                          setFlightError(null);
                        }}
                        className="text-red-400 underline text-sm mt-2 hover:text-red-300"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Flight options - Your Picks */}
              {!isLoadingFlights && !flightError && flightOptions.length > 0 && (
                <>
                  <p className="text-white/60 text-sm mb-3">
                    Flights to {trip.destination.city} matching your preferences
                  </p>
                  <div className="space-y-3 mb-4">
                    {flightOptions.slice(0, 5).map((flight: any) => {
                      const outbound = flight.slices?.[0];
                      const returnFlight = flight.slices?.[1];
                      const isSelected = selectedFlight?.id === flight.id && !skipFlights;
                      const isExpanded = expandedFlightId === flight.id;

                      return (
                        <div
                          key={flight.id}
                          className={`w-full text-left bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden transition-all ${
                            isSelected ? 'ring-2 ring-white' : ''
                          }`}
                        >
                          {/* Collapsed view - always visible */}
                          <button
                            onClick={() => setExpandedFlightId(isExpanded ? null : flight.id)}
                            className="w-full p-4 text-left hover:bg-white/5 transition-colors"
                          >
                            {/* Airline and price row */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {flight.airlines?.[0]?.logoUrl && (
                                  <img
                                    src={flight.airlines[0].logoUrl}
                                    alt={flight.airlines[0].name}
                                    className="w-8 h-8 rounded"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                )}
                                <div>
                                  <p className="text-white font-medium">{flight.airlines?.[0]?.name || 'Multiple Airlines'}</p>
                                  <p className="text-white/50 text-xs">
                                    {outbound?.stops === 0 ? 'Direct' : `${outbound?.stops} stop${outbound?.stops > 1 ? 's' : ''}`}
                                    {' · '}{formatDuration(outbound?.duration || 'PT0H')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <div>
                                  <p className="text-white font-bold text-lg">
                                    {formatPrice(flight.pricing?.totalAmount || 0, flight.pricing?.currency || 'USD')}
                                  </p>
                                  <p className="text-white/50 text-xs">
                                    {formatPrice(flight.pricing?.perPassenger || 0, flight.pricing?.currency || 'USD')}/person
                                  </p>
                                </div>
                                <svg
                                  className={`w-5 h-5 text-white/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>

                            {/* Flight times summary */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="bg-white/5 rounded-lg p-2">
                                <p className="text-white/50 text-xs mb-1">OUTBOUND · {formatDate(outbound?.departureTime)}</p>
                                <p className="text-white text-sm font-medium">
                                  {formatTime(outbound?.departureTime)} → {formatTime(outbound?.arrivalTime)}
                                </p>
                              </div>
                              {returnFlight && (
                                <div className="bg-white/5 rounded-lg p-2">
                                  <p className="text-white/50 text-xs mb-1">RETURN · {formatDate(returnFlight?.departureTime)}</p>
                                  <p className="text-white text-sm font-medium">
                                    {formatTime(returnFlight?.departureTime)} → {formatTime(returnFlight?.arrivalTime)}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Fare info badges */}
                            <div className="flex flex-wrap gap-1.5">
                              {outbound?.fareBrandName && (
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                                  {outbound.fareBrandName}
                                </span>
                              )}
                              {flight.totalEmissionsKg && (
                                <span className="px-2 py-0.5 bg-green-500/10 text-green-400/80 rounded-full text-xs flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {flight.totalEmissionsKg}kg CO₂
                                </span>
                              )}
                              {/* Match reasons */}
                              {flight.matchReasons && flight.matchReasons.slice(0, 2).map((reason: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs"
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </button>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div className="border-t border-white/10 p-4 space-y-4">
                              {/* Outbound flight details */}
                              <div>
                                <h4 className="text-white/60 text-xs font-semibold mb-3 uppercase tracking-wide">Outbound Flight</h4>
                                <div className="space-y-3">
                                  {outbound?.segments?.map((segment: any, idx: number) => (
                                    <div key={segment.id}>
                                      {/* Segment */}
                                      <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                          {segment.airline?.logoUrl ? (
                                            <img src={segment.airline.logoUrl} alt={segment.airline.name} className="w-6 h-6 rounded" />
                                          ) : (
                                            <span className="text-lg">✈️</span>
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-white font-medium">{segment.airline?.name || 'Airline'}</span>
                                            <span className="text-white/40 text-xs">{segment.flightNumber}</span>
                                            {segment.aircraft && (
                                              <span className="text-white/40 text-xs">· {segment.aircraft}</span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-4 text-sm">
                                            <div>
                                              <p className="text-white font-semibold">{formatTime(segment.departureTime)}</p>
                                              <p className="text-white/60">{segment.departureAirport?.code} · {segment.departureAirport?.city}</p>
                                              {segment.departureTerminal && (
                                                <p className="text-white/40 text-xs">Terminal {segment.departureTerminal}</p>
                                              )}
                                            </div>
                                            <div className="flex-1 flex items-center gap-2">
                                              <div className="h-px flex-1 bg-white/20"></div>
                                              <span className="text-white/50 text-xs">{formatDuration(segment.duration)}</span>
                                              <div className="h-px flex-1 bg-white/20"></div>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-white font-semibold">{formatTime(segment.arrivalTime)}</p>
                                              <p className="text-white/60">{segment.arrivalAirport?.code} · {segment.arrivalAirport?.city}</p>
                                              {segment.arrivalTerminal && (
                                                <p className="text-white/40 text-xs">Terminal {segment.arrivalTerminal}</p>
                                              )}
                                            </div>
                                          </div>
                                          {/* Segment amenities */}
                                          <div className="flex items-center gap-3 mt-2">
                                            {segment.cabinClassMarketingName && (
                                              <span className="text-white/50 text-xs">{segment.cabinClassMarketingName}</span>
                                            )}
                                            {segment.wifi?.available && (
                                              <span className="text-white/50 text-xs flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                                </svg>
                                                WiFi
                                              </span>
                                            )}
                                            {segment.power?.available && (
                                              <span className="text-white/50 text-xs flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                                </svg>
                                                Power
                                              </span>
                                            )}
                                            {segment.seatPitch && (
                                              <span className="text-white/50 text-xs">{segment.seatPitch} pitch</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      {/* Layover between segments */}
                                      {idx < outbound.segments.length - 1 && (
                                        <div className="ml-13 my-3 flex items-center gap-3 pl-10">
                                          <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                          </div>
                                          <span className="text-amber-400 text-sm">
                                            {calculateLayover(segment.arrivalTime, outbound.segments[idx + 1].departureTime)} layover in {segment.arrivalAirport?.city}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Return flight details */}
                              {returnFlight && (
                                <div>
                                  <h4 className="text-white/60 text-xs font-semibold mb-3 uppercase tracking-wide">Return Flight</h4>
                                  <div className="space-y-3">
                                    {returnFlight?.segments?.map((segment: any, idx: number) => (
                                      <div key={segment.id}>
                                        {/* Segment */}
                                        <div className="flex items-start gap-3">
                                          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                            {segment.airline?.logoUrl ? (
                                              <img src={segment.airline.logoUrl} alt={segment.airline.name} className="w-6 h-6 rounded" />
                                            ) : (
                                              <span className="text-lg">✈️</span>
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-white font-medium">{segment.airline?.name || 'Airline'}</span>
                                              <span className="text-white/40 text-xs">{segment.flightNumber}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                              <div>
                                                <p className="text-white font-semibold">{formatTime(segment.departureTime)}</p>
                                                <p className="text-white/60">{segment.departureAirport?.code} · {segment.departureAirport?.city}</p>
                                              </div>
                                              <div className="flex-1 flex items-center gap-2">
                                                <div className="h-px flex-1 bg-white/20"></div>
                                                <span className="text-white/50 text-xs">{formatDuration(segment.duration)}</span>
                                                <div className="h-px flex-1 bg-white/20"></div>
                                              </div>
                                              <div className="text-right">
                                                <p className="text-white font-semibold">{formatTime(segment.arrivalTime)}</p>
                                                <p className="text-white/60">{segment.arrivalAirport?.code} · {segment.arrivalAirport?.city}</p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        {/* Layover */}
                                        {idx < returnFlight.segments.length - 1 && (
                                          <div className="ml-13 my-3 flex items-center gap-3 pl-10">
                                            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                                              <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                              </svg>
                                            </div>
                                            <span className="text-amber-400 text-sm">
                                              {calculateLayover(segment.arrivalTime, returnFlight.segments[idx + 1].departureTime)} layover in {segment.arrivalAirport?.city}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Baggage & Fare info */}
                              <div className="grid grid-cols-2 gap-3">
                                {/* Baggage */}
                                <div className="bg-white/5 rounded-xl p-3">
                                  <h5 className="text-white/60 text-xs mb-2 uppercase">Baggage</h5>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                      <span className="text-white text-sm">
                                        {flight.baggageAllowance?.carryOn ? 'Carry-on included' : 'No carry-on'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                      </svg>
                                      <span className="text-white text-sm">
                                        {flight.baggageAllowance?.checkedBags > 0
                                          ? `${flight.baggageAllowance.checkedBags} checked bag${flight.baggageAllowance.checkedBags > 1 ? 's' : ''}`
                                          : 'No checked bags'}
                                        {flight.baggageAllowance?.checkedBagWeightKg && (
                                          <span className="text-white/50"> ({flight.baggageAllowance.checkedBagWeightKg}kg each)</span>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Fare conditions */}
                                <div className="bg-white/5 rounded-xl p-3">
                                  <h5 className="text-white/60 text-xs mb-2 uppercase">Fare Conditions</h5>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      {flight.restrictions?.refundable ? (
                                        <>
                                          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                          <span className="text-green-400 text-sm">Refundable</span>
                                        </>
                                      ) : (
                                        <>
                                          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                          <span className="text-white/60 text-sm">Non-refundable</span>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {flight.restrictions?.changeable ? (
                                        <>
                                          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                          <span className="text-green-400 text-sm">
                                            Changeable
                                            {flight.restrictions?.changesFee && (
                                              <span className="text-white/50"> (${flight.restrictions.changesFee} fee)</span>
                                            )}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                          <span className="text-white/60 text-sm">No changes allowed</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Fare brand & cabin */}
                              <div className="flex items-center gap-3">
                                {outbound?.fareBrandName && (
                                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                                    {outbound.fareBrandName}
                                  </span>
                                )}
                                <span className="px-3 py-1 bg-white/10 text-white/70 rounded-full text-xs capitalize">
                                  {flight.cabinClass?.replace('_', ' ') || 'Economy'}
                                </span>
                                {flight.totalEmissionsKg && (
                                  <span className="px-3 py-1 bg-green-500/10 text-green-400/70 rounded-full text-xs">
                                    {flight.totalEmissionsKg}kg CO₂
                                  </span>
                                )}
                              </div>

                              {/* Select button */}
                              <button
                                onClick={() => {
                                  setSelectedFlight(flight);
                                  setSkipFlights(false);
                                  // Track flight selection for preference learning
                                  if (trip) {
                                    const outboundSlice = flight.slices?.[0];
                                    const departureHour = outboundSlice?.departureTime
                                      ? new Date(outboundSlice.departureTime).getHours()
                                      : 12;
                                    const isRedEye = departureHour >= 21 || departureHour <= 5;
                                    trackFlightSelection({
                                      destinationId: trip.destination.city.toLowerCase().replace(/\s+/g, '-'),
                                      departureHour,
                                      price: flight.amount || flight.totalAmount || 0,
                                      stops: outboundSlice?.stops ?? 0,
                                      duration: parseDurationMinutes(outboundSlice?.duration || 'PT0H'),
                                      cabinClass: flight.cabinClass || 'economy',
                                      isRedEye,
                                    });
                                  }
                                }}
                                className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                                  isSelected
                                    ? 'bg-white text-gray-900'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                              >
                                {isSelected ? '✓ Selected' : 'Select This Flight'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Out of preference section */}
              {!isLoadingFlights && !flightError && outOfPrefFlights.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowOutOfPref(!showOutOfPref)}
                    className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <span className="text-white/60 text-sm">
                      {outOfPrefFlights.length} more option{outOfPrefFlights.length > 1 ? 's' : ''} outside your preferences
                    </span>
                    <svg
                      className={`w-5 h-5 text-white/60 transition-transform ${showOutOfPref ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showOutOfPref && (
                    <div className="mt-3 space-y-3">
                      {outOfPrefFlights.slice(0, 5).map((flight: any) => {
                        const outbound = flight.slices?.[0];
                        const returnFlight = flight.slices?.[1];
                        const isSelected = selectedFlight?.id === flight.id && !skipFlights;
                        const isExpanded = expandedFlightId === flight.id;

                        return (
                          <div
                            key={flight.id}
                            className={`w-full text-left bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden transition-all ${
                              isSelected ? 'ring-2 ring-amber-500' : ''
                            }`}
                          >
                            <button
                              onClick={() => setExpandedFlightId(isExpanded ? null : flight.id)}
                              className="w-full p-4 text-left hover:bg-white/5 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <p className="text-white/80 font-medium">{flight.airlines?.[0]?.name || 'Multiple Airlines'}</p>
                                  <span className="text-white/40">·</span>
                                  <p className="text-white/50 text-sm">
                                    {outbound?.stops === 0 ? 'Direct' : `${outbound?.stops} stop${outbound?.stops > 1 ? 's' : ''}`}
                                    {' · '}{formatDuration(outbound?.duration || 'PT0H')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="text-white/80 font-bold">
                                    {formatPrice(flight.pricing?.totalAmount || 0, flight.pricing?.currency || 'USD')}
                                  </p>
                                  <svg
                                    className={`w-4 h-4 text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                              {/* Out of preference reasons */}
                              {flight.outOfPreferenceReasons && flight.outOfPreferenceReasons.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {flight.outOfPreferenceReasons.map((reason: string, i: number) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs"
                                    >
                                      {reason}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </button>

                            {/* Expanded details for out-of-pref flights */}
                            {isExpanded && (
                              <div className="border-t border-white/10 p-4 space-y-3">
                                {/* Times */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-white/5 rounded-lg p-2">
                                    <p className="text-white/50 text-xs mb-1">OUTBOUND</p>
                                    <p className="text-white text-sm font-medium">
                                      {formatTime(outbound?.departureTime)} → {formatTime(outbound?.arrivalTime)}
                                    </p>
                                    <p className="text-white/40 text-xs">{formatDate(outbound?.departureTime)}</p>
                                  </div>
                                  {returnFlight && (
                                    <div className="bg-white/5 rounded-lg p-2">
                                      <p className="text-white/50 text-xs mb-1">RETURN</p>
                                      <p className="text-white text-sm font-medium">
                                        {formatTime(returnFlight?.departureTime)} → {formatTime(returnFlight?.arrivalTime)}
                                      </p>
                                      <p className="text-white/40 text-xs">{formatDate(returnFlight?.departureTime)}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Quick info */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2 py-1 bg-white/10 text-white/70 rounded-full text-xs capitalize">
                                    {flight.cabinClass?.replace('_', ' ') || 'Economy'}
                                  </span>
                                  {flight.baggageAllowance?.checkedBags > 0 && (
                                    <span className="px-2 py-1 bg-white/10 text-white/70 rounded-full text-xs">
                                      {flight.baggageAllowance.checkedBags} checked bag{flight.baggageAllowance.checkedBags > 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {flight.restrictions?.refundable && (
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                                      Refundable
                                    </span>
                                  )}
                                </div>

                                <button
                                  onClick={() => {
                                    setSelectedFlight(flight);
                                    setSkipFlights(false);
                                    // Track flight selection for preference learning
                                    if (trip) {
                                      const outboundSlice = flight.slices?.[0];
                                      const departureHour = outboundSlice?.departureTime
                                        ? new Date(outboundSlice.departureTime).getHours()
                                        : 12;
                                      const isRedEye = departureHour >= 21 || departureHour <= 5;
                                      trackFlightSelection({
                                        destinationId: trip.destination.city.toLowerCase().replace(/\s+/g, '-'),
                                        departureHour,
                                        price: flight.amount || flight.totalAmount || 0,
                                        stops: outboundSlice?.stops ?? 0,
                                        duration: parseDurationMinutes(outboundSlice?.duration || 'PT0H'),
                                        cabinClass: flight.cabinClass || 'economy',
                                        isRedEye,
                                      });
                                    }
                                  }}
                                  className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                                    isSelected
                                      ? 'bg-amber-500 text-white'
                                      : 'bg-white/20 text-white hover:bg-white/30'
                                  }`}
                                >
                                  {isSelected ? '✓ Selected' : 'Select Anyway'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* No flights found */}
              {!isLoadingFlights && !flightError && flightOptions.length === 0 && flightFetchAttempted && (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">No flights found</h3>
                      <p className="text-white/60 text-sm">
                        We couldn't find flights for these dates. You can book separately.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Skip option */}
              <button
                onClick={() => {
                  setSkipFlights(!skipFlights);
                  if (!skipFlights) {
                    setSelectedFlight(null);
                  } else if (flightOptions.length > 0) {
                    setSelectedFlight(flightOptions[0]);
                  }
                }}
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
              disabled={isLoadingFlights}
              className="w-full py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {isLoadingFlights ? 'Loading...' : 'Continue to Hotels'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Hotel booking
  if (step === 'hotels') {
    return (
      <div className="fixed inset-0 z-40 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
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
              {/* Loading state */}
              {isLoadingHotels && (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-4">
                  <div className="flex flex-col items-center justify-center">
                    <Spinner size="lg" className="text-white mb-4" />
                    <p className="text-white/80 font-medium">Finding the best hotels...</p>
                    <p className="text-white/50 text-sm mt-1">Matching your preferences</p>
                  </div>
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
                    Top picks for your stay in {trip.destination.city}
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
                              {/* Refundable badge */}
                              {hotel.refundable && (
                                <div className="absolute top-3 left-3 px-2 py-1 bg-green-500/90 rounded-full">
                                  <span className="text-white text-xs font-medium">Free cancellation</span>
                                </div>
                              )}
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

          {/* Bottom button */}
          <div className="p-4 pb-safe border-t border-white/10">
            <button
              onClick={handleContinueFromHotels}
              disabled={isLoadingHotels}
              className="w-full py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {isLoadingHotels ? 'Loading...' : 'Continue to Checkout'}
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

  // Step 5: Checkout summary
  if (step === 'checkout') {
    const flightTotal = skipFlights ? 0 : trip.flight.price;
    const hotelTotal = skipHotels ? 0 : (selectedHotel?.totalPrice || 0);
    const grandTotal = flightTotal + hotelTotal;
    const hasAnythingToBook = !skipFlights || (!skipHotels && selectedHotel);

    return (
      <div className="fixed inset-0 z-40 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
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
              {hasAnythingToBook ? 'Proceed to Payment' : 'Get My Itinerary'}
            </button>
          </div>
        </div>
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
