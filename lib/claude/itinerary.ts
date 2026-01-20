import { openrouter, MODEL } from './client';
import { ITINERARY_PROMPT, ATTRACTIONS_PROMPT } from './prompts';
import type { Itinerary, ItineraryGenerateParams } from '@/types/itinerary';
import type { NormalizedHotel } from '@/types/hotel';
import { v4 as uuidv4 } from 'uuid';

export async function generateItinerary(
  params: ItineraryGenerateParams
): Promise<Itinerary> {
  const {
    hotelName,
    hotelNeighborhood,
    hotelLat,
    hotelLng,
    destination,
    checkIn,
    checkOut,
    travelerType = 'solo traveler',
    interests = ['general sightseeing'],
    pace = 'moderate',
    budgetLevel = 'moderate',
  } = params;

  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const prompt = ITINERARY_PROMPT.replace('{destination}', destination)
    .replace('{hotelName}', hotelName)
    .replace('{neighborhood}', hotelNeighborhood)
    .replace('{hotelLat}', hotelLat.toString())
    .replace('{hotelLng}', hotelLng.toString())
    .replace('{checkIn}', checkIn)
    .replace('{checkOut}', checkOut)
    .replace('{nights}', nights.toString())
    .replace('{travelerType}', travelerType)
    .replace('{preferences}', interests.join(', '))
    .replace('{budgetLevel}', budgetLevel);

  const response = await openrouter.chat.completions.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.choices[0]?.message?.content;
  if (!textContent) {
    throw new Error('No response from LLM');
  }

  // Parse JSON response
  let jsonText = textContent.trim();

  // Handle markdown code blocks
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.slice(7);
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.slice(3);
  }
  if (jsonText.endsWith('```')) {
    jsonText = jsonText.slice(0, -3);
  }
  jsonText = jsonText.trim();

  const itineraryData = JSON.parse(jsonText);

  return {
    id: uuidv4(),
    destination,
    hotel: {
      name: hotelName,
      neighborhood: hotelNeighborhood,
      coordinates: {
        lat: hotelLat,
        lng: hotelLng,
      },
    },
    dates: {
      start: checkIn,
      end: checkOut,
      nights,
    },
    days: itineraryData.days || [],
    packingTips: itineraryData.packingTips || [],
    localTips: itineraryData.localTips || [],
    emergencyInfo: itineraryData.emergencyInfo || {
      emergencyNumber: '911',
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function generateAttractions(
  hotel: NormalizedHotel,
  preferences: string[]
): Promise<
  Array<{
    name: string;
    type: string;
    lat: number;
    lng: number;
    walkTime: string;
    why: string;
  }>
> {
  const prompt = ATTRACTIONS_PROMPT.replace('{hotelName}', hotel.name)
    .replace('{neighborhood}', hotel.location.address)
    .replace('{city}', hotel.location.city)
    .replace('{preferences}', preferences.join(', ') || 'general sightseeing');

  const response = await openrouter.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.choices[0]?.message?.content;
  if (!textContent) {
    return [];
  }

  try {
    let jsonText = textContent.trim();

    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const data = JSON.parse(jsonText);
    return data.attractions || [];
  } catch (e) {
    console.error('Failed to parse attractions:', e);
    return [];
  }
}

export function createItineraryFromHotel(
  hotel: NormalizedHotel,
  checkIn: string,
  checkOut: string,
  preferences?: {
    travelerType?: string;
    interests?: string[];
    pace?: 'relaxed' | 'moderate' | 'packed';
    budgetLevel?: 'budget' | 'moderate' | 'luxury';
  }
): ItineraryGenerateParams {
  return {
    hotelName: hotel.name,
    hotelNeighborhood: hotel.location.address,
    hotelLat: hotel.location.latitude,
    hotelLng: hotel.location.longitude,
    destination: hotel.location.city,
    checkIn,
    checkOut,
    travelerType: preferences?.travelerType,
    interests: preferences?.interests,
    pace: preferences?.pace,
    budgetLevel: preferences?.budgetLevel,
  };
}
