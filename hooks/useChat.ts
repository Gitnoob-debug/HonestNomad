'use client';

import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Message, ChatAction, NormalizedHotel, Itinerary, GuestDetails } from '@/types';
import type { TripPlan } from '@/types/trip';
import type { NormalizedFlight } from '@/types/flight';

interface TripAlternatives {
  flights: NormalizedFlight[];
  hotels: NormalizedHotel[];
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hotels, setHotels] = useState<NormalizedHotel[] | null>(null);
  const [flights, setFlights] = useState<NormalizedFlight[] | null>(null);
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [tripAlternatives, setTripAlternatives] = useState<TripAlternatives | null>(null);
  const [currentAction, setCurrentAction] = useState<ChatAction | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<NormalizedHotel | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<NormalizedFlight | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('session_id');
      if (!id) {
        id = uuidv4();
        localStorage.setItem('session_id', id);
      }
      return id;
    }
    return uuidv4();
  });

  // Initial greeting
  useEffect(() => {
    setMessages([
      {
        id: uuidv4(),
        role: 'assistant',
        content:
          "Hi! I'm here to help you plan your perfect trip. Tell me where you want to go and when, and I'll find flights, hotels, and create a personalized itinerary for you.",
        timestamp: new Date(),
      },
    ]);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      // Add user message
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            sessionId,
            conversationId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Something went wrong');
        }

        // Update conversation ID
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }

        // Add assistant response
        const assistantMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Handle action-specific updates
        setCurrentAction(data.action || null);

        if (data.hotels) {
          setHotels(data.hotels);
        }

        if (data.flights) {
          setFlights(data.flights);
        }

        if (data.tripPlan) {
          setTripPlan(data.tripPlan);
          // Clear individual lists since we have a complete plan
          setHotels(null);
          setFlights(null);
          // Store trip in sessionStorage for the trip page
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`trip_${data.tripPlan.id}`, JSON.stringify(data.tripPlan));
            // Also store alternatives if available
            if (data.alternatives) {
              sessionStorage.setItem(`trip_${data.tripPlan.id}_alternatives`, JSON.stringify(data.alternatives));
            }
          }
        }

        if (data.alternatives) {
          setTripAlternatives(data.alternatives);
        }

        if (data.selectedHotel) {
          setSelectedHotel(data.selectedHotel);
        }

        if (data.selectedFlight) {
          setSelectedFlight(data.selectedFlight);
        }

        if (data.itinerary) {
          setItinerary(data.itinerary);
        }

        if (data.action === 'booking_complete' && data.booking) {
          setHotels(null);
          setFlights(null);
          setSelectedHotel(null);
          setSelectedFlight(null);
          setTripPlan(null);
          setTripAlternatives(null);
        }
      } catch (error: any) {
        console.error('Chat error:', error);
        const errorMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: "Sorry, I ran into an issue. Could you try again?",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, conversationId]
  );

  const selectHotel = useCallback(
    async (hotelId: string) => {
      const hotel = hotels?.find((h) => h.id === hotelId);
      if (hotel) {
        await sendMessage(`I'd like to book ${hotel.name}`);
      }
    },
    [hotels, sendMessage]
  );

  const submitGuestDetails = useCallback(
    async (details: GuestDetails, paymentToken: string) => {
      setIsLoading(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Complete my booking',
            sessionId,
            conversationId,
            guestDetails: details,
            paymentToken,
          }),
        });

        const data = await response.json();

        const confirmationMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, confirmationMessage]);

        setCurrentAction(data.action || null);

        if (data.action === 'booking_complete') {
          setHotels(null);
          setSelectedHotel(null);

          // If itinerary was generated with booking
          if (data.itinerary) {
            setItinerary(data.itinerary);
          }
        }
      } catch (error) {
        console.error('Booking error:', error);
        const errorMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: 'There was an error processing your booking. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, conversationId]
  );

  // Function to swap the selected hotel in the trip plan
  const swapTripHotel = useCallback((hotel: NormalizedHotel) => {
    if (!tripPlan) return;

    const updatedTrip = {
      ...tripPlan,
      accommodation: hotel,
      pricing: {
        ...tripPlan.pricing,
        accommodation: {
          amount: hotel.pricing.nightlyRate * tripPlan.totalNights,
          currency: hotel.pricing.currency,
          perNight: hotel.pricing.nightlyRate,
        },
        total: {
          ...tripPlan.pricing.total,
          amount: tripPlan.pricing.flights.amount +
                  (hotel.pricing.nightlyRate * tripPlan.totalNights) +
                  tripPlan.pricing.estimated.activities +
                  tripPlan.pricing.estimated.food +
                  tripPlan.pricing.estimated.transport,
        },
      },
    };

    setTripPlan(updatedTrip);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`trip_${updatedTrip.id}`, JSON.stringify(updatedTrip));
    }
  }, [tripPlan]);

  // Function to swap the selected flight in the trip plan
  const swapTripFlight = useCallback((flight: NormalizedFlight) => {
    if (!tripPlan) return;

    const updatedTrip = {
      ...tripPlan,
      outboundFlight: flight,
      returnFlight: flight.slices.length > 1 ? flight : undefined,
      pricing: {
        ...tripPlan.pricing,
        flights: {
          amount: flight.pricing.totalAmount,
          currency: flight.pricing.currency,
          perPerson: flight.pricing.perPassenger,
        },
        total: {
          ...tripPlan.pricing.total,
          amount: flight.pricing.totalAmount +
                  tripPlan.pricing.accommodation.amount +
                  tripPlan.pricing.estimated.activities +
                  tripPlan.pricing.estimated.food +
                  tripPlan.pricing.estimated.transport,
        },
      },
    };

    setTripPlan(updatedTrip);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`trip_${updatedTrip.id}`, JSON.stringify(updatedTrip));
    }
  }, [tripPlan]);

  return {
    messages,
    isLoading,
    hotels,
    flights,
    tripPlan,
    tripAlternatives,
    currentAction,
    selectedHotel,
    selectedFlight,
    itinerary,
    sendMessage,
    selectHotel,
    submitGuestDetails,
    swapTripHotel,
    swapTripFlight,
  };
}
