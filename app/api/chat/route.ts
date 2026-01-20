import { NextRequest, NextResponse } from 'next/server';
import { parseIntent, buildConversationHistory } from '@/lib/claude/intent';
import { generateResultsResponse, generateNoResultsResponse, generateFlightResultsResponse } from '@/lib/claude/response';
import { generateItinerary, createItineraryFromHotel } from '@/lib/claude/itinerary';
import { searchHotels } from '@/lib/duffel/search';
import { searchFlights } from '@/lib/duffel/flights';
import { createBooking } from '@/lib/duffel/book';
import {
  getConversation,
  createConversation,
  updateConversation,
  addMessage,
  getMessages,
} from '@/lib/supabase/conversations';
import { createBookingRecord } from '@/lib/supabase/bookings';
import type { HotelSearchParams } from '@/types/hotel';
import type { FlightSearchParams } from '@/types/flight';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      sessionId,
      conversationId,
      guestDetails,
      paymentToken,
    } = body;

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'message and sessionId are required' },
        { status: 400 }
      );
    }

    // Get or create conversation
    let conversation = conversationId
      ? await getConversation(conversationId)
      : null;

    if (!conversation) {
      conversation = await createConversation(sessionId);
    }

    // Get conversation history
    const dbMessages = await getMessages(conversation.id);
    const history = buildConversationHistory(dbMessages);

    // Parse user intent
    const intent = await parseIntent(message, history, {
      stage: conversation.state?.stage,
      preferences: conversation.preferences,
      lastSearchResultsCount: conversation.lastSearchResults?.length || 0,
      selectedHotelId: conversation.state?.selectedHotelId,
    });

    // Store user message
    await addMessage(conversation.id, 'user', message);

    // Initialize response
    let response: any = {
      message: intent.message,
      conversationId: conversation.id,
    };

    // Merge extracted params into preferences
    const updatedPreferences = {
      ...conversation.preferences,
      ...intent.extractedParams,
    };

    // Handle based on intent action
    switch (intent.action) {
      case 'search':
      case 'search_hotels': {
        // Execute hotel search
        const searchParams = buildHotelSearchParams(updatedPreferences);

        try {
          const hotels = await searchHotels(searchParams);

          if (hotels.length === 0) {
            // No results
            const noResultsMessage = await generateNoResultsResponse(updatedPreferences);
            response.message = noResultsMessage;
            response.action = 'ask_clarification';
          } else {
            // Generate conversational response
            const resultsMessage = await generateResultsResponse(
              hotels,
              updatedPreferences,
              message
            );

            // Update conversation state
            await updateConversation(conversation.id, {
              state: {
                ...conversation.state,
                stage: 'showing_results',
              },
              preferences: updatedPreferences,
              lastSearchResults: hotels,
            });

            response.message = resultsMessage;
            response.hotels = hotels.slice(0, 5);
            response.action = 'show_results';
          }
        } catch (error: any) {
          console.error('Search error:', error);
          const errorMessage = error.message || error.errors?.[0]?.message || JSON.stringify(error);
          response.message = `I had trouble searching for hotels: ${errorMessage}. Could you try again or provide more details about your destination?`;
          response.action = 'ask_clarification';
        }
        break;
      }

      case 'search_flights': {
        // Execute flight search
        const flightParams = buildFlightSearchParams(updatedPreferences);

        try {
          const flights = await searchFlights(flightParams);

          if (flights.length === 0) {
            response.message = `I couldn't find any flights from ${updatedPreferences.origin} to ${updatedPreferences.destination} for those dates. Would you like to try different dates or airports?`;
            response.action = 'ask_clarification';
          } else {
            // Generate conversational response for flights
            const resultsMessage = await generateFlightResultsResponse(
              flights,
              updatedPreferences,
              message
            );

            // Update conversation state
            await updateConversation(conversation.id, {
              state: {
                ...conversation.state,
                stage: 'showing_results',
              },
              preferences: updatedPreferences,
              lastSearchResults: flights,
            });

            response.message = resultsMessage;
            response.flights = flights.slice(0, 5);
            response.action = 'show_flights';
          }
        } catch (error: any) {
          console.error('Flight search error:', error);
          const errorMessage = error.message || error.errors?.[0]?.message || JSON.stringify(error);
          response.message = `I had trouble searching for flights: ${errorMessage}. Could you try again or provide more details?`;
          response.action = 'ask_clarification';
        }
        break;
      }

      case 'search_trip': {
        // Execute combined flight + hotel search
        try {
          const flightParams = buildFlightSearchParams(updatedPreferences);
          const hotelParams = buildHotelSearchParams(updatedPreferences);

          const [flights, hotels] = await Promise.all([
            searchFlights(flightParams),
            searchHotels(hotelParams),
          ]);

          // Update conversation state with both results
          // Store flights and hotels together in lastSearchResults array
          const combinedResults = [
            ...flights.map((f: any) => ({ ...f, _type: 'flight' })),
            ...hotels.map((h: any) => ({ ...h, _type: 'hotel' })),
          ];

          await updateConversation(conversation.id, {
            state: {
              ...conversation.state,
              stage: 'showing_results',
            },
            preferences: updatedPreferences,
            lastSearchResults: combinedResults,
          });

          // Generate combined response
          let resultsMessage = '';
          if (flights.length > 0 && hotels.length > 0) {
            resultsMessage = `Great news! I found ${flights.length} flight options and ${hotels.length} hotels for your trip to ${updatedPreferences.destination}.\n\n`;
            resultsMessage += `**Flights from ${updatedPreferences.origin}:**\n`;
            flights.slice(0, 3).forEach((f, i) => {
              const slice = f.slices[0];
              resultsMessage += `${i + 1}. ${f.airlines[0]?.name || 'Airline'} - $${f.pricing.perPassenger}/person, ${slice.stops === 0 ? 'Direct' : `${slice.stops} stop(s)`}, ${slice.duration}\n`;
            });
            resultsMessage += `\n**Hotels:**\n`;
            hotels.slice(0, 3).forEach((h, i) => {
              resultsMessage += `${i + 1}. ${h.name} - $${h.pricing.nightlyRate}/night, ${h.rating.stars || '?'}★\n`;
            });
            resultsMessage += `\nWhich flights and hotels interest you?`;
          } else if (flights.length === 0) {
            resultsMessage = `I found ${hotels.length} hotels but couldn't find flights for those dates. Would you like to adjust your travel dates?`;
          } else {
            resultsMessage = `I found ${flights.length} flights but no hotels matched your criteria. Would you like to adjust your preferences?`;
          }

          response.message = resultsMessage;
          response.flights = flights.slice(0, 5);
          response.hotels = hotels.slice(0, 5);
          response.action = 'show_results';
        } catch (error: any) {
          console.error('Trip search error:', error);
          response.message = `I had trouble searching for your trip. ${error.message}. Let me know if you'd like to try again.`;
          response.action = 'ask_clarification';
        }
        break;
      }

      case 'collect_guest_info': {
        // User selected a hotel, need guest details
        const selectedHotel = conversation.lastSearchResults?.find(
          (h: any) => h.id === intent.selectedHotelId || h.name.toLowerCase().includes(message.toLowerCase().split(' ').pop() || '')
        ) || conversation.lastSearchResults?.[0];

        if (selectedHotel) {
          await updateConversation(conversation.id, {
            state: {
              ...conversation.state,
              stage: 'booking',
              selectedHotelId: selectedHotel.id,
            },
            preferences: updatedPreferences,
          });

          response.action = 'collect_guest_info';
          response.selectedHotel = selectedHotel;
          response.requiredFields = ['givenName', 'familyName', 'email', 'phone'];
        } else {
          response.message = "I couldn't identify which hotel you'd like to book. Could you specify?";
          response.action = 'ask_clarification';
        }
        break;
      }

      case 'confirm_booking': {
        // Guest details provided, create booking
        if (!guestDetails || !paymentToken) {
          response.message =
            'I need your guest details and payment information to complete the booking.';
          response.action = 'collect_guest_info';
          break;
        }

        const hotelToBook = conversation.lastSearchResults?.find(
          (h: any) => h.id === conversation.state?.selectedHotelId
        );

        if (!hotelToBook) {
          response.message =
            "I couldn't find the selected hotel. Let's start fresh - what are you looking for?";
          response.action = 'ask_clarification';
          break;
        }

        try {
          // Create the booking via Duffel
          const booking = await createBooking({
            rateId: hotelToBook.cheapestRateId,
            guests: [guestDetails],
            payment: {
              type: 'card',
              cardToken: paymentToken,
            },
          });

          // Store booking in our database
          await createBookingRecord({
            conversationId: conversation.id,
            duffelBookingId: booking.id,
            hotelName: hotelToBook.name,
            hotelId: hotelToBook.id,
            checkIn: updatedPreferences.checkIn || '',
            checkOut: updatedPreferences.checkOut || '',
            guestName: `${guestDetails.givenName} ${guestDetails.familyName}`,
            guestEmail: guestDetails.email,
            guestPhone: guestDetails.phone,
            totalAmount: hotelToBook.pricing.totalAmount,
            currency: hotelToBook.pricing.currency,
            duffelResponse: booking,
          });

          await updateConversation(conversation.id, {
            state: {
              ...conversation.state,
              stage: 'complete',
            },
          });

          response.message = `Booking confirmed! Your reservation at ${hotelToBook.name} is all set. Confirmation number: ${booking.bookingReference}. You'll receive a confirmation email shortly. Would you like me to create a personalized itinerary for your trip?`;
          response.action = 'booking_complete';
          response.booking = booking;
        } catch (error: any) {
          console.error('Booking error:', error);
          response.message = `There was an issue processing your booking: ${error.message}. Please try again.`;
          response.action = 'collect_guest_info';
        }
        break;
      }

      case 'generate_itinerary': {
        // Generate itinerary for the booked hotel
        const bookedHotel = conversation.lastSearchResults?.find(
          (h: any) => h.id === conversation.state?.selectedHotelId
        );

        if (bookedHotel && updatedPreferences.checkIn && updatedPreferences.checkOut) {
          try {
            const itineraryParams = createItineraryFromHotel(
              bookedHotel,
              updatedPreferences.checkIn,
              updatedPreferences.checkOut,
              {
                travelerType: updatedPreferences.travelerType,
                interests: updatedPreferences.preferences,
              }
            );

            const generatedItinerary = await generateItinerary(itineraryParams);

            response.message = `Here's your personalized ${generatedItinerary.dates.nights}-day itinerary for ${generatedItinerary.destination}! I've planned activities around your hotel and included spots I think you'll love.`;
            response.itinerary = generatedItinerary;
            response.action = 'generate_itinerary';
          } catch (error: any) {
            console.error('Itinerary generation error:', error);
            response.message = "I had trouble generating your itinerary. Would you like me to try again?";
          }
        } else {
          response.message = "I'd be happy to create an itinerary! First, let me help you find and book a hotel.";
        }
        break;
      }

      case 'ask_clarification':
      default: {
        // Just update preferences and continue conversation
        await updateConversation(conversation.id, {
          preferences: updatedPreferences,
        });
        response.action = 'continue';
        break;
      }
    }

    // Store assistant response
    await addMessage(conversation.id, 'assistant', response.message);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildHotelSearchParams(preferences: any): HotelSearchParams {
  if (!preferences.destination) {
    throw new Error('Destination is required');
  }
  if (!preferences.checkIn || !preferences.checkOut) {
    throw new Error('Check-in and check-out dates are required');
  }

  return {
    location: {
      city: preferences.destination,
      ...(preferences.neighborhood && { area: preferences.neighborhood }),
    },
    checkIn: preferences.checkIn,
    checkOut: preferences.checkOut,
    guests: preferences.guests || 1,
    rooms: preferences.rooms || 1,
    budget:
      preferences.budgetMin || preferences.budgetMax
        ? {
            min: preferences.budgetMin,
            max: preferences.budgetMax,
            currency: preferences.currency || 'USD',
          }
        : undefined,
  };
}

function buildFlightSearchParams(preferences: any): FlightSearchParams {
  if (!preferences.origin) {
    throw new Error('Origin is required for flight search');
  }
  if (!preferences.destination) {
    throw new Error('Destination is required for flight search');
  }

  // Use departureDate if specified, otherwise fall back to checkIn
  const departureDate = preferences.departureDate || preferences.checkIn;
  if (!departureDate) {
    throw new Error('Departure date is required for flight search');
  }

  // Build passengers array
  const passengerCount = preferences.passengers || 1;
  const passengers = Array(passengerCount).fill({ type: 'adult' as const });

  return {
    origin: preferences.origin,
    destination: preferences.destination,
    departureDate,
    returnDate: preferences.returnDate || preferences.checkOut,
    passengers,
    cabinClass: preferences.cabinClass || 'economy',
    budget: preferences.flightBudgetMax
      ? {
          max: preferences.flightBudgetMax,
          currency: preferences.currency || 'USD',
        }
      : undefined,
  };
}
