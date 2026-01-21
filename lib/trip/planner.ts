// Trip planning service - orchestrates flight/hotel search and itinerary generation

import { searchFlights } from '@/lib/duffel/flights';
import { searchHotels } from '@/lib/duffel/search';
import type { FlightSearchParams, NormalizedFlight } from '@/types/flight';
import type { HotelSearchParams, NormalizedHotel } from '@/types/hotel';
import type {
  TripPlan,
  TripSearchParams,
  TripPlanGenerationResult,
  TripDay,
  TripActivity,
} from '@/types/trip';
import { createEmptyTripPlan, calculateTripPricing } from '@/types/trip';

export async function planTrip(params: TripSearchParams): Promise<TripPlanGenerationResult> {
  // Create base trip structure
  const tripPlan = createEmptyTripPlan(params);

  // Build search params for flights and hotels
  const flightParams: FlightSearchParams = {
    origin: params.origin,
    destination: params.destination,
    departureDate: params.departureDate,
    returnDate: params.returnDate,
    passengers: buildPassengerList(params.travelers),
    cabinClass: params.preferences?.cabinClass || 'economy',
    budget: params.preferences?.budget,
    maxConnections: 1,
  };

  const hotelParams: HotelSearchParams = {
    location: { city: params.destination },
    checkIn: params.departureDate,
    checkOut: params.returnDate,
    guests: params.travelers.adults + (params.travelers.children || 0),
    rooms: Math.ceil((params.travelers.adults + (params.travelers.children || 0)) / 2),
    budget: params.preferences?.budget,
  };

  // Search for flights and hotels in parallel
  const [flights, hotels] = await Promise.all([
    searchFlights(flightParams).catch((err) => {
      console.error('Flight search failed:', err);
      return [] as NormalizedFlight[];
    }),
    searchHotels(hotelParams).catch((err) => {
      console.error('Hotel search failed:', err);
      return [] as NormalizedHotel[];
    }),
  ]);

  // Select best options (cheapest that meets criteria)
  const selectedFlight = selectBestFlight(flights, params);
  const selectedHotel = selectBestHotel(hotels, params);

  // Update trip plan with selections
  if (selectedFlight) {
    // For round trips, the flight contains both slices
    tripPlan.outboundFlight = selectedFlight;
    if (selectedFlight.slices.length > 1) {
      // Round trip - same flight object, but we note it has return
      tripPlan.returnFlight = selectedFlight;
    }
  }

  if (selectedHotel) {
    tripPlan.accommodation = selectedHotel;
  }

  // Generate itinerary
  tripPlan.itinerary = generateItinerary(tripPlan, params);

  // Calculate pricing
  const totalTravelers = params.travelers.adults + (params.travelers.children || 0);
  tripPlan.pricing = calculateTripPricing(
    selectedFlight,
    selectedHotel,
    tripPlan.totalNights,
    totalTravelers
  );

  // Generate summary and highlights
  tripPlan.summary = generateTripSummary(tripPlan);
  tripPlan.highlights = generateHighlights(params.destination);
  tripPlan.tips = generateTravelTips(params.destination);

  // Mark as ready if we have both flight and hotel
  if (selectedFlight && selectedHotel) {
    tripPlan.status = 'ready';
  }

  return {
    tripPlan,
    alternatives: {
      flights: flights.slice(0, 5),
      hotels: hotels.slice(0, 5),
    },
    messages: buildResultMessages(tripPlan, flights.length, hotels.length),
  };
}

function buildPassengerList(travelers: TripSearchParams['travelers']) {
  const passengers: Array<{ type: 'adult' | 'child' | 'infant_without_seat'; age?: number }> = [];

  for (let i = 0; i < travelers.adults; i++) {
    passengers.push({ type: 'adult' });
  }

  for (let i = 0; i < (travelers.children || 0); i++) {
    passengers.push({ type: 'child', age: 10 });
  }

  for (let i = 0; i < (travelers.infants || 0); i++) {
    passengers.push({ type: 'infant_without_seat', age: 1 });
  }

  return passengers;
}

function selectBestFlight(
  flights: NormalizedFlight[],
  params: TripSearchParams
): NormalizedFlight | undefined {
  if (flights.length === 0) return undefined;

  // Prefer direct flights, then sort by price
  const directFlights = flights.filter((f) => f.slices.every((s) => s.stops === 0));

  if (directFlights.length > 0) {
    return directFlights[0]; // Already sorted by price
  }

  // Fall back to cheapest connecting flight
  return flights[0];
}

function selectBestHotel(
  hotels: NormalizedHotel[],
  params: TripSearchParams
): NormalizedHotel | undefined {
  if (hotels.length === 0) return undefined;

  // If star preference, filter first
  if (params.preferences?.hotelStars) {
    const starFiltered = hotels.filter(
      (h) => h.rating.stars && h.rating.stars >= (params.preferences?.hotelStars || 0)
    );
    if (starFiltered.length > 0) {
      return starFiltered[0];
    }
  }

  // Return best value (first one, assuming sorted by value)
  return hotels[0];
}

function generateItinerary(tripPlan: TripPlan, params: TripSearchParams): TripDay[] {
  const itinerary: TripDay[] = [];
  const startDate = new Date(params.departureDate);
  const endDate = new Date(params.returnDate);

  let currentDate = new Date(startDate);
  let dayNumber = 1;

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const isFirstDay = dayNumber === 1;
    const isLastDay = currentDate.getTime() === endDate.getTime();

    const activities: TripActivity[] = [];

    if (isFirstDay) {
      // Arrival day
      const outboundSlice = tripPlan.outboundFlight?.slices[0];
      if (outboundSlice) {
        activities.push({
          id: `act_${Math.random().toString(36).slice(2, 9)}`,
          time: new Date(outboundSlice.departureTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          title: `Depart from ${outboundSlice.origin}`,
          type: 'departure',
          description: `Flight ${tripPlan.outboundFlight?.airlines[0]?.name || ''} to ${params.destination}`,
        });

        activities.push({
          id: `act_${Math.random().toString(36).slice(2, 9)}`,
          time: new Date(outboundSlice.arrivalTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          title: `Arrive in ${params.destination}`,
          type: 'arrival',
        });
      }

      if (tripPlan.accommodation) {
        activities.push({
          id: `act_${Math.random().toString(36).slice(2, 9)}`,
          time: '15:00',
          title: `Check in to ${tripPlan.accommodation.name}`,
          type: 'check_in',
          location: tripPlan.accommodation.location?.address,
        });
      }

      activities.push({
        id: `act_${Math.random().toString(36).slice(2, 9)}`,
        time: '18:00',
        title: 'Dinner & explore neighborhood',
        type: 'dining',
        description: 'Get settled and explore the local area',
      });
    } else if (isLastDay) {
      // Departure day
      if (tripPlan.accommodation) {
        activities.push({
          id: `act_${Math.random().toString(36).slice(2, 9)}`,
          time: '10:00',
          title: `Check out from ${tripPlan.accommodation.name}`,
          type: 'check_out',
        });
      }

      const returnSlice = tripPlan.returnFlight?.slices[1] || tripPlan.returnFlight?.slices[0];
      if (returnSlice) {
        activities.push({
          id: `act_${Math.random().toString(36).slice(2, 9)}`,
          time: new Date(returnSlice.departureTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          title: `Depart from ${params.destination}`,
          type: 'departure',
          description: `Return flight home`,
        });
      }
    } else {
      // Regular day - add placeholder activities
      activities.push({
        id: `act_${Math.random().toString(36).slice(2, 9)}`,
        time: '09:00',
        title: 'Breakfast at hotel',
        type: 'dining',
      });

      activities.push({
        id: `act_${Math.random().toString(36).slice(2, 9)}`,
        time: '10:00',
        title: `Explore ${params.destination}`,
        type: 'sightseeing',
        description: getActivitySuggestion(params.destination, dayNumber),
      });

      activities.push({
        id: `act_${Math.random().toString(36).slice(2, 9)}`,
        time: '13:00',
        title: 'Lunch',
        type: 'dining',
      });

      activities.push({
        id: `act_${Math.random().toString(36).slice(2, 9)}`,
        time: '14:30',
        title: 'Afternoon activity',
        type: 'activity',
        description: getAfternoonSuggestion(params.destination, dayNumber),
      });

      activities.push({
        id: `act_${Math.random().toString(36).slice(2, 9)}`,
        time: '19:00',
        title: 'Dinner',
        type: 'dining',
      });
    }

    itinerary.push({
      date: dateStr,
      dayNumber,
      location: params.destination,
      isTravel: isFirstDay || isLastDay,
      activities,
    });

    currentDate.setDate(currentDate.getDate() + 1);
    dayNumber++;
  }

  return itinerary;
}

function getActivitySuggestion(destination: string, day: number): string {
  const suggestions: Record<string, string[]> = {
    paris: [
      'Visit the Eiffel Tower and Trocadéro Gardens',
      'Explore the Louvre Museum',
      'Walk through Montmartre and Sacré-Cœur',
      'Stroll along the Champs-Élysées',
      'Visit Notre-Dame and Île de la Cité',
    ],
    london: [
      'Tour the Tower of London and Tower Bridge',
      'Visit the British Museum',
      'Explore Westminster and Big Ben',
      'Walk through Hyde Park and Kensington',
      'Visit the Tate Modern and South Bank',
    ],
    tokyo: [
      'Explore Shibuya and the famous crossing',
      'Visit Senso-ji Temple in Asakusa',
      'Experience Harajuku and Meiji Shrine',
      'Explore Tsukiji Outer Market',
      'Visit teamLab Borderless digital art museum',
    ],
    'new york': [
      'Walk through Central Park',
      'Visit the Metropolitan Museum of Art',
      'Explore Times Square and Broadway',
      'See the Statue of Liberty and Ellis Island',
      'Walk the High Line and Chelsea',
    ],
    toronto: [
      'Visit the CN Tower',
      'Explore the Distillery District',
      'Walk through Kensington Market',
      'Visit the Royal Ontario Museum',
      'Explore the Toronto Islands',
    ],
  };

  const cityKey = destination.toLowerCase();
  const citySuggestions = suggestions[cityKey] || [
    `Explore downtown ${destination}`,
    `Visit local museums and galleries`,
    `Discover historic neighborhoods`,
    `Experience local culture and markets`,
  ];

  return citySuggestions[(day - 2) % citySuggestions.length];
}

function getAfternoonSuggestion(destination: string, day: number): string {
  const suggestions: Record<string, string[]> = {
    paris: [
      'Coffee at a classic Parisian café',
      'Shopping in Le Marais',
      'Seine river cruise',
      'Visit Musée d\'Orsay',
      'Explore Latin Quarter bookshops',
    ],
    london: [
      'Afternoon tea experience',
      'Shopping on Oxford Street',
      'Thames river cruise',
      'Explore Camden Market',
      'Visit the Natural History Museum',
    ],
    tokyo: [
      'Japanese tea ceremony experience',
      'Shopping in Ginza',
      'Visit a traditional onsen',
      'Explore Akihabara electronics district',
      'Sunset at Tokyo Skytree',
    ],
    'new york': [
      'Shopping on Fifth Avenue',
      'Visit the MoMA',
      'Brooklyn Bridge walk',
      'Explore SoHo galleries',
      'Sunset at Top of the Rock',
    ],
    toronto: [
      'St. Lawrence Market food tour',
      'Shopping on Queen Street West',
      'Visit the Art Gallery of Ontario',
      'Explore Yorkville',
      'Sunset at the Harbourfront',
    ],
  };

  const cityKey = destination.toLowerCase();
  const citySuggestions = suggestions[cityKey] || [
    `Relax at a local café`,
    `Visit local shops and boutiques`,
    `Explore a neighborhood park`,
    `Take a guided walking tour`,
  ];

  return citySuggestions[(day - 2) % citySuggestions.length];
}

function generateTripSummary(tripPlan: TripPlan): string {
  const destination = tripPlan.destinations[0]?.city || 'your destination';
  const nights = tripPlan.totalNights;
  const travelers = tripPlan.travelers.adults + tripPlan.travelers.children;

  let summary = `${nights}-night trip to ${destination} for ${travelers} traveler${travelers > 1 ? 's' : ''}`;

  if (tripPlan.outboundFlight) {
    const airline = tripPlan.outboundFlight.airlines[0]?.name || 'airline';
    const stops = tripPlan.outboundFlight.slices[0]?.stops || 0;
    summary += `. Flying ${stops === 0 ? 'direct' : 'with ' + stops + ' stop' + (stops > 1 ? 's' : '')} via ${airline}`;
  }

  if (tripPlan.accommodation) {
    summary += `. Staying at ${tripPlan.accommodation.name}`;
  }

  return summary + '.';
}

function generateHighlights(destination: string): string[] {
  const highlights: Record<string, string[]> = {
    paris: [
      'World-class art at the Louvre',
      'Iconic Eiffel Tower views',
      'Charming Montmartre streets',
      'Exquisite French cuisine',
    ],
    london: [
      'Historic royal palaces',
      'World-renowned museums',
      'Vibrant theater scene',
      'Classic British pubs',
    ],
    tokyo: [
      'Ancient temples meet modern tech',
      'Incredible food scene',
      'Unique pop culture experiences',
      'Beautiful cherry blossoms (seasonal)',
    ],
    'new york': [
      'Broadway shows and entertainment',
      'Diverse culinary scene',
      'Iconic skyline views',
      'World-famous museums',
    ],
    toronto: [
      'Multicultural food scene',
      'Stunning CN Tower views',
      'Charming neighborhoods',
      'Waterfront activities',
    ],
  };

  const cityKey = destination.toLowerCase();
  return highlights[cityKey] || [
    `Explore local culture`,
    `Try regional cuisine`,
    `Visit historic sites`,
    `Experience local life`,
  ];
}

function generateTravelTips(destination: string): string[] {
  const tips: Record<string, string[]> = {
    paris: [
      'Learn a few French phrases - locals appreciate the effort',
      'Metro is the fastest way to get around',
      'Many museums are free on the first Sunday',
      'Tipping is included in prices but rounding up is appreciated',
    ],
    london: [
      'Get an Oyster card for public transport',
      'Many major museums are free',
      'Bring layers - weather changes quickly',
      'Look right when crossing the street!',
    ],
    tokyo: [
      'Get a Suica or Pasmo card for trains',
      'Cash is still king in many places',
      'Bow slightly when greeting people',
      'Shoes off when entering homes and some restaurants',
    ],
    'new york': [
      'Walk when possible - NYC is very walkable',
      'Get a MetroCard for subway',
      'Tip 18-20% at restaurants',
      'Book popular attractions in advance',
    ],
    toronto: [
      'TTC day pass is good value for transit',
      'Downtown is very walkable',
      'Tipping 15-20% is standard',
      'Weather can be extreme - check forecast',
    ],
  };

  const cityKey = destination.toLowerCase();
  return tips[cityKey] || [
    `Research local customs before you go`,
    `Check visa requirements for your nationality`,
    `Notify your bank about travel dates`,
    `Save offline maps for navigation`,
  ];
}

function buildResultMessages(
  tripPlan: TripPlan,
  flightCount: number,
  hotelCount: number
): string[] {
  const messages: string[] = [];

  if (tripPlan.outboundFlight && tripPlan.accommodation) {
    messages.push(`Found ${flightCount} flight options and ${hotelCount} hotels for your trip.`);
    messages.push(`Selected the best combination within your preferences.`);
  } else {
    if (!tripPlan.outboundFlight) {
      messages.push(`Could not find flights for these dates. Try different dates or routes.`);
    }
    if (!tripPlan.accommodation) {
      messages.push(`Could not find hotels for these dates. Try different dates or locations.`);
    }
  }

  return messages;
}
