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
  const [step, setStep] = useState<BookingStep>('choice');
  const [itineraryType, setItineraryType] = useState<ItineraryType>(null);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [activeDay, setActiveDay] = useState(1);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

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

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?redirect=/flash');
    }
  }, [user, authLoading, router]);

  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);

  const handleChooseItinerary = async (pathType: SimplePathChoice) => {
    if (!trip) return;
    setItineraryType(pathType);
    setIsLoadingItinerary(true);

    try {
      // Use the new async generator that loads real POI data
      const generated = await generateItineraryAuto(trip, pathType);
      setItinerary(generated);
      setStep('itinerary');
    } catch (error) {
      console.error('Failed to generate itinerary:', error);
      // Fall back to hardcoded data
      const generated = pathType === 'classic' || pathType === 'cultural' || pathType === 'adventure'
        ? generateSampleItinerary(trip)
        : generateTrendyItinerary(trip);
      setItinerary(generated);
      setStep('itinerary');
    } finally {
      setIsLoadingItinerary(false);
    }
  };

  const handleRemix = () => {
    // Pick a random path that's different from the current one
    const availablePaths = itineraryType
      ? ALL_PATHS.filter(p => p !== itineraryType)
      : ALL_PATHS;
    const randomPath = availablePaths[Math.floor(Math.random() * availablePaths.length)];
    handleChooseItinerary(randomPath);
  };

  const handleStopClick = useCallback((stop: ItineraryStop) => {
    setActiveStopId(stop.id);
    setShowDetails(true);
  }, []);

  const handleGoBack = () => {
    if (step === 'choice') {
      router.push('/flash/swipe');
    } else if (step === 'itinerary') {
      setStep('choice');
      setItinerary([]);
      setItineraryType(null);
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

  // Step 1: Choose itinerary type
  if (step === 'choice') {
    return (
      <div className="fixed inset-0 bg-black">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={trip.imageUrl}
            alt={trip.destination.city}
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="p-4 pt-safe">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back to browsing</span>
            </button>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col justify-end p-6 pb-safe">
            {/* Destination info */}
            <div className="mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">
                {trip.destination.city}
              </h1>
              <p className="text-white/70 text-lg">
                {trip.itinerary.days} days in {trip.destination.country}
              </p>
            </div>

            {/* Choice heading */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                How do you want to explore?
              </h2>
              {/* Remix button */}
              <button
                onClick={handleRemix}
                disabled={isLoadingItinerary}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/80 hover:bg-white/20 hover:text-white transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm font-medium">Surprise me</span>
              </button>
            </div>

            {/* Loading state */}
            {isLoadingItinerary && (
              <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center mb-4">
                <Spinner size="lg" className="text-white mx-auto mb-3" />
                <p className="text-white/80">Loading your personalized itinerary...</p>
              </div>
            )}

            {/* Path choice grid */}
            <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pb-4 scrollbar-hide">
              {ALL_PATHS.map((pathType) => {
                const config = PATH_CONFIG[pathType];
                return (
                  <button
                    key={pathType}
                    onClick={() => handleChooseItinerary(pathType)}
                    disabled={isLoadingItinerary}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-left hover:bg-white/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className={`w-12 h-12 ${config.color} rounded-xl flex items-center justify-center text-2xl mb-3`}>
                      {config.emoji}
                    </div>
                    <h3 className={`text-white font-bold text-sm mb-1 ${config.hoverColor} transition-colors`}>
                      {config.name}
                    </h3>
                    <p className="text-white/50 text-xs line-clamp-2">
                      {config.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: View itinerary with map
  if (step === 'itinerary') {
    const activeDayData = itinerary.find((d) => d.day === activeDay);
    const allStops = itinerary.flatMap((day) => day.stops);
    const dayStops = activeDayData?.stops || [];
    const activeStop = activeStopId ? allStops.find((s) => s.id === activeStopId) : null;
    const centerLat = dayStops[0]?.latitude || 0;
    const centerLng = dayStops[0]?.longitude || 0;

    return (
      <div className="fixed inset-0 bg-black">
        {/* Map background */}
        <ItineraryMap
          stops={dayStops}
          centerLatitude={centerLat}
          centerLongitude={centerLng}
          activeStopId={activeStopId || undefined}
          onStopClick={handleStopClick}
          className="absolute inset-0"
        />

        {/* Top gradient overlay */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />

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
                {itineraryType && PATH_CONFIG[itineraryType]?.emoji} {itineraryType && PATH_CONFIG[itineraryType]?.name} {trip.itinerary.days}-Day Plan
              </h1>
              <p className="text-white/60 text-xs">{trip.destination.city}, {trip.destination.country}</p>
            </div>

            <div className="w-16" />
          </div>
        </div>

        {/* Day selector pills */}
        <div className="absolute top-20 left-0 right-0 z-20 px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {itinerary.map((day) => (
              <button
                key={day.day}
                onClick={() => {
                  setActiveDay(day.day);
                  setActiveStopId(null);
                  setShowDetails(false);
                }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeDay === day.day
                    ? 'bg-white text-gray-900'
                    : 'bg-white/20 text-white backdrop-blur-sm hover:bg-white/30'
                }`}
              >
                Day {day.day}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom panel */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="h-20 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

          <div className="bg-black/90 backdrop-blur-md px-4 pb-safe">
            {/* Day title */}
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div>
                <h2 className="text-white font-semibold">
                  {activeDayData?.title || `Day ${activeDay}`}
                </h2>
                <p className="text-white/50 text-sm">{dayStops.length} stops planned</p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-xs">Step 1 of 4</p>
                <p className="text-white/70 text-sm font-medium">Itinerary</p>
              </div>
            </div>

            {/* Stops carousel */}
            <div className="flex gap-3 overflow-x-auto py-4 scrollbar-hide">
              {dayStops.map((stop, index) => (
                <button
                  key={stop.id}
                  onClick={() => handleStopClick(stop)}
                  className={`flex-shrink-0 w-72 bg-white/10 rounded-xl p-3 text-left transition-all ${
                    activeStopId === stop.id
                      ? 'ring-2 ring-white bg-white/20'
                      : 'hover:bg-white/15'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg flex-shrink-0">
                      {stop.type === 'landmark' && '🏛️'}
                      {stop.type === 'restaurant' && '🍽️'}
                      {stop.type === 'activity' && '🎯'}
                      {stop.type === 'accommodation' && '🏨'}
                      {stop.type === 'transport' && '✈️'}
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
                          <span className="text-white/40 text-xs">• {stop.duration}</span>
                        )}
                      </div>
                      <h3 className="text-white font-medium truncate">{stop.name}</h3>
                      <p className="text-white/60 text-sm line-clamp-2">{stop.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Continue button */}
            <button
              onClick={handleContinueFromItinerary}
              className="w-full py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors mb-4"
            >
              Continue to Flights
            </button>
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
                <div className="w-full h-40 rounded-xl overflow-hidden mb-4 bg-gray-800">
                  <img
                    src={activeStop.imageUrl}
                    alt={activeStop.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              )}

              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                  {activeStop.type === 'landmark' && '🏛️'}
                  {activeStop.type === 'restaurant' && '🍽️'}
                  {activeStop.type === 'activity' && '🎯'}
                  {activeStop.type === 'accommodation' && '🏨'}
                  {activeStop.type === 'transport' && '✈️'}
                </div>
                <div className="flex-1">
                  <p className="text-white/50 text-sm">Day {activeStop.day} • {activeStop.duration}</p>
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

              {/* Best time to visit */}
              {activeStop.bestTimeOfDay && activeStop.bestTimeOfDay !== 'any' && (
                <p className="text-white/50 text-sm mb-4 flex items-center gap-2">
                  <span>🕐</span>
                  <span>Best time: {activeStop.bestTimeOfDay}</span>
                </p>
              )}

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
