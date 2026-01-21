'use client';

import { useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { InputBar } from './InputBar';
import { HotelList } from '@/components/hotels/HotelList';
import FlightList from '@/components/flights/FlightList';
import { TripSummary, TripItinerary } from '@/components/trip';
import { GuestForm } from '@/components/booking/GuestForm';
import { ItineraryView } from '@/components/itinerary/ItineraryView';
import { useChat } from '@/hooks/useChat';
import { Spinner } from '@/components/ui';

export function ChatContainer() {
  const {
    messages,
    isLoading,
    hotels,
    flights,
    tripPlan,
    currentAction,
    selectedHotel,
    itinerary,
    sendMessage,
    selectHotel,
    submitGuestDetails,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, hotels, flights, tripPlan, itinerary]);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin">
        <MessageList messages={messages} />

        {/* Show complete trip plan */}
        {tripPlan && currentAction === 'show_trip' && (
          <div className="mt-4 space-y-6">
            <TripSummary
              trip={tripPlan}
              onConfirmTrip={() => sendMessage('Book this trip')}
            />
            {tripPlan.itinerary && tripPlan.itinerary.length > 0 && (
              <TripItinerary
                itinerary={tripPlan.itinerary}
                destination={tripPlan.destinations[0]?.city || ''}
              />
            )}
          </div>
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
