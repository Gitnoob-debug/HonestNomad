'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { ItineraryMap } from '@/components/flash/ItineraryMap';
import { Spinner } from '@/components/ui';
import type { FlashTripPackage } from '@/types/flash';
import { generateSampleItinerary, type ItineraryDay } from '@/lib/flash/itinerary-generator';

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
}

export default function FlashExplorePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [trip, setTrip] = useState<FlashTripPackage | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [activeDay, setActiveDay] = useState(1);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load trip from session storage
  useEffect(() => {
    const stored = sessionStorage.getItem('flash_selected_trip');
    if (stored) {
      try {
        const tripData = JSON.parse(stored) as FlashTripPackage;
        setTrip(tripData);
        // Generate sample itinerary based on destination
        const generated = generateSampleItinerary(tripData);
        setItinerary(generated);
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

  const handleStopClick = useCallback((stop: ItineraryStop) => {
    setActiveStopId(stop.id);
    setShowDetails(true);
  }, []);

  const handleBookTrip = () => {
    router.push('/flash/confirm');
  };

  const handleGoBack = () => {
    router.push('/flash/swipe');
  };

  if (authLoading || !trip || itinerary.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Spinner size="lg" className="text-white" />
      </div>
    );
  }

  // Get stops for the active day
  const activeDayData = itinerary.find((d) => d.day === activeDay);
  const allStops = itinerary.flatMap((day) => day.stops);
  const dayStops = activeDayData?.stops || [];
  const activeStop = activeStopId ? allStops.find((s) => s.id === activeStopId) : null;

  // Get destination coordinates
  const centerLat = dayStops[0]?.latitude || 0;
  const centerLng = dayStops[0]?.longitude || 0;

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
            <h1 className="text-white font-bold text-lg">{trip.itinerary.days} Days in {trip.destination.city}</h1>
            <p className="text-white/60 text-xs">{trip.destination.country}</p>
          </div>

          <div className="w-16" /> {/* Spacer for centering */}
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

      {/* Bottom panel - itinerary list */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Gradient */}
        <div className="h-20 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

        {/* Scrollable stops list */}
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
              <p className="text-white/50 text-xs">Trip total</p>
              <p className="text-white font-bold">
                {formatPrice(trip.pricing.total, trip.pricing.currency)}
              </p>
            </div>
          </div>

          {/* Stops carousel */}
          <div className="flex gap-3 overflow-x-auto py-4 scrollbar-hide">
            {dayStops.map((stop, index) => (
              <button
                key={stop.id}
                onClick={() => handleStopClick(stop)}
                className={`flex-shrink-0 w-64 bg-white/10 rounded-xl p-3 text-left transition-all ${
                  activeStopId === stop.id
                    ? 'ring-2 ring-white bg-white/20'
                    : 'hover:bg-white/15'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg flex-shrink-0">
                    {stop.type === 'landmark' && '🏛️'}
                    {stop.type === 'restaurant' && '🍽️'}
                    {stop.type === 'activity' && '🎯'}
                    {stop.type === 'accommodation' && '🏨'}
                    {stop.type === 'transport' && '✈️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white/50 text-xs">#{index + 1}</span>
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

          {/* Book button */}
          <button
            onClick={handleBookTrip}
            className="w-full py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors mb-4"
          >
            Book This Trip
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
            className="relative w-full max-w-lg bg-gray-900 rounded-t-3xl p-6 pb-safe animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-6" />

            {/* Content */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                {activeStop.type === 'landmark' && '🏛️'}
                {activeStop.type === 'restaurant' && '🍽️'}
                {activeStop.type === 'activity' && '🎯'}
                {activeStop.type === 'accommodation' && '🏨'}
                {activeStop.type === 'transport' && '✈️'}
              </div>
              <div>
                <p className="text-white/50 text-sm">Day {activeStop.day} • {activeStop.duration}</p>
                <h2 className="text-white text-xl font-bold">{activeStop.name}</h2>
              </div>
            </div>

            <p className="text-white/80 mb-6">{activeStop.description}</p>

            {activeStop.imageUrl && (
              <img
                src={activeStop.imageUrl}
                alt={activeStop.name}
                className="w-full h-40 object-cover rounded-xl mb-6"
              />
            )}

            <button
              onClick={() => setShowDetails(false)}
              className="w-full py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Custom styles */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .pt-safe {
          padding-top: max(16px, env(safe-area-inset-top));
        }
        .pb-safe {
          padding-bottom: max(16px, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}
