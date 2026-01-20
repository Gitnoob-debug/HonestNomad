import { NextRequest, NextResponse } from 'next/server';
import { parseIntent, buildConversationHistory } from '@/lib/claude/intent';
import { generateResultsResponse, generateNoResultsResponse } from '@/lib/claude/response';
import { generateItinerary, createItineraryFromHotel } from '@/lib/claude/itinerary';
import { searchHotels } from '@/lib/duffel/search';
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
      case 'search': {
        // Execute hotel search
        const searchParams = buildSearchParams(updatedPreferences);

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

function buildSearchParams(preferences: any): HotelSearchParams {
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
