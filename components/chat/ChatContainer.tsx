'use client';

import { useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { InputBar } from './InputBar';
import { HotelList } from '@/components/hotels/HotelList';
import { GuestForm } from '@/components/booking/GuestForm';
import { ItineraryView } from '@/components/itinerary/ItineraryView';
import { useChat } from '@/hooks/useChat';
import { Spinner } from '@/components/ui';

export function ChatContainer() {
  const {
    messages,
    isLoading,
    hotels,
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
  }, [messages, hotels, itinerary]);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin">
        <MessageList messages={messages} />

        {/* Show hotels when available */}
        {hotels && hotels.length > 0 && currentAction === 'show_results' && (
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

        {/* Show itinerary when generated */}
        {itinerary && (
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
