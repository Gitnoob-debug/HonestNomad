'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageList } from './MessageList';
import { InputBar } from './InputBar';
import { HotelList } from '@/components/hotels/HotelList';
import FlightList from '@/components/flights/FlightList';
import { TripCard, AlternativesModal } from '@/components/trip';
import { GuestForm } from '@/components/booking/GuestForm';
import { ItineraryView } from '@/components/itinerary/ItineraryView';
import { useChat } from '@/hooks/useChat';
import { Spinner } from '@/components/ui';
import type { NormalizedFlight } from '@/types/flight';
import type { NormalizedHotel } from '@/types/hotel';

interface ChatContainerProps {
  initialMessage?: string;
}

export function ChatContainer({ initialMessage }: ChatContainerProps) {
  const router = useRouter();
  const {
    messages,
    isLoading,
    hotels,
    flights,
    tripPlan,
    tripAlternatives,
    currentAction,
    selectedHotel,
    itinerary,
    sendMessage,
    selectHotel,
    submitGuestDetails,
    swapTripHotel,
    swapTripFlight,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showAlternatives, setShowAlternatives] = useState<'flight' | 'hotel' | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && !hasInitialized && messages.length > 0) {
      setHasInitialized(true);
      sendMessage(initialMessage);
    }
  }, [initialMessage, hasInitialized, messages.length, sendMessage]);

  const handleViewTrip = () => {
    if (tripPlan) {
      router.push(`/trip/${tripPlan.id}`);
    }
  };

  const handleBookTrip = () => {
    if (tripPlan) {
      router.push(`/trip/${tripPlan.id}/book`);
    }
  };

  const handleSwapHotel = () => {
    if (tripAlternatives?.hotels && tripAlternatives.hotels.length > 0) {
      setShowAlternatives('hotel');
    } else {
      sendMessage("Show me different hotel options");
    }
  };

  const handleSwapFlight = () => {
    if (tripAlternatives?.flights && tripAlternatives.flights.length > 0) {
      setShowAlternatives('flight');
    } else {
      sendMessage("Show me different flight options");
    }
  };

  const handleSelectAlternative = (item: NormalizedFlight | NormalizedHotel) => {
    if (showAlternatives === 'flight') {
      swapTripFlight(item as NormalizedFlight);
    } else if (showAlternatives === 'hotel') {
      swapTripHotel(item as NormalizedHotel);
    }
    setShowAlternatives(null);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, hotels, flights, tripPlan, itinerary]);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin">
        <MessageList messages={messages} />

        {/* Show complete trip plan as a card */}
        {tripPlan && currentAction === 'show_trip' && (
          <div className="mt-4">
            <TripCard
              trip={tripPlan}
              onSwapHotel={handleSwapHotel}
              onSwapFlight={handleSwapFlight}
              onCheaperOption={() => sendMessage("Find me a cheaper option")}
              onMoreLuxury={() => sendMessage("Show me more luxury options")}
              onBook={handleBookTrip}
            />
            <div className="mt-4 text-center">
              <button
                onClick={handleViewTrip}
                className="text-blue-600 hover:text-blue-800 font-medium underline"
              >
                Open full trip view →
              </button>
            </div>
          </div>
        )}

        {/* Alternatives Modal */}
        {showAlternatives && tripAlternatives && (
          <AlternativesModal
            type={showAlternatives}
            alternatives={showAlternatives === 'flight' ? tripAlternatives.flights : tripAlternatives.hotels}
            currentId={showAlternatives === 'flight' ? tripPlan?.outboundFlight?.id : tripPlan?.accommodation?.id}
            onSelect={handleSelectAlternative}
            onClose={() => setShowAlternatives(null)}
          />
        )}

        {/* Show flights when searching for flights only */}
        {flights && flights.length > 0 && currentAction === 'show_flights' && !tripPlan && (
          <div className="mt-4">
            <FlightList flights={flights} />
          </div>
        )}

        {/* Show hotels when searching for hotels only */}
        {hotels && hotels.length > 0 && currentAction === 'show_results' && !tripPlan && (
          <div className="mt-4">
            <HotelList hotels={hotels} onSelect={selectHotel} />
          </div>
        )}

        {/* Show guest form when collecting info */}
        {currentAction === 'collect_guest_info' && selectedHotel && (
          <div className="mt-4">
            <GuestForm hotel={selectedHotel} onSubmit={submitGuestDetails} />
          </div>
        )}

        {/* Show itinerary when generated (for hotel-only bookings) */}
        {itinerary && !tripPlan && (
          <div className="mt-4">
            <ItineraryView itinerary={itinerary} />
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 text-gray-500">
            <Spinner size="sm" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4">
        <InputBar
          onSend={sendMessage}
          disabled={isLoading || currentAction === 'collect_guest_info'}
          placeholder={
            currentAction === 'collect_guest_info'
              ? 'Please complete the booking form above'
              : 'Tell me where you want to go...'
          }
        />
      </div>
    </div>
  );
}
