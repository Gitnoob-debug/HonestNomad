// Mock hotel data for demo/testing when Duffel Stays API is not available

import type { NormalizedHotel } from '@/types/hotel';

const MOCK_HOTELS: Record<string, NormalizedHotel[]> = {
  // Toronto hotels
  toronto: [
    {
      id: 'mock_htl_toronto_1',
      duffelId: 'mock_htl_toronto_1',
      name: 'The Fairmont Royal York',
      description: 'Historic luxury hotel in the heart of downtown Toronto, steps from Union Station. Features elegant rooms, multiple restaurants, and a world-class spa.',
      location: {
        address: '100 Front Street West',
        city: 'Toronto',
        country: 'CA',
        latitude: 43.6459,
        longitude: -79.3816,
      },
      rating: {
        stars: 5,
        reviewScore: 8.9,
        reviewCount: 4521,
      },
      photos: [
        { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', caption: 'Hotel Exterior' },
        { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', caption: 'Luxury Room' },
      ],
      amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'room_service', '24_hour_front_desk'],
      pricing: {
        totalAmount: 450,
        currency: 'CAD',
        nightlyRate: 225,
      },
      cheapestRateId: 'mock_rate_toronto_1',
      rooms: [],
    },
    {
      id: 'mock_htl_toronto_2',
      duffelId: 'mock_htl_toronto_2',
      name: 'Hotel X Toronto',
      description: 'Modern lakefront hotel with stunning views of Lake Ontario. Features rooftop pool, sports facilities, and contemporary design.',
      location: {
        address: '111 Princes Boulevard',
        city: 'Toronto',
        country: 'CA',
        latitude: 43.6312,
        longitude: -79.4103,
      },
      rating: {
        stars: 4,
        reviewScore: 8.7,
        reviewCount: 2834,
      },
      photos: [
        { url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', caption: 'Hotel View' },
      ],
      amenities: ['wifi', 'pool', 'gym', 'restaurant', 'parking'],
      pricing: {
        totalAmount: 320,
        currency: 'CAD',
        nightlyRate: 160,
      },
      cheapestRateId: 'mock_rate_toronto_2',
      rooms: [],
    },
    {
      id: 'mock_htl_toronto_3',
      duffelId: 'mock_htl_toronto_3',
      name: 'The Broadview Hotel',
      description: 'Boutique hotel in a beautifully restored heritage building in the trendy east end. Rooftop bar with panoramic city views.',
      location: {
        address: '106 Broadview Avenue',
        city: 'Toronto',
        country: 'CA',
        latitude: 43.6621,
        longitude: -79.3526,
      },
      rating: {
        stars: 4,
        reviewScore: 9.1,
        reviewCount: 1567,
      },
      photos: [
        { url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', caption: 'Boutique Style' },
      ],
      amenities: ['wifi', 'restaurant', 'bar', '24_hour_front_desk'],
      pricing: {
        totalAmount: 280,
        currency: 'CAD',
        nightlyRate: 140,
      },
      cheapestRateId: 'mock_rate_toronto_3',
      rooms: [],
    },
  ],

  // Paris hotels
  paris: [
    {
      id: 'mock_htl_paris_1',
      duffelId: 'mock_htl_paris_1',
      name: 'Hotel Plaza Athenee',
      description: 'Iconic luxury hotel on Avenue Montaigne with views of the Eiffel Tower. Features Alain Ducasse restaurant and world-renowned service.',
      location: {
        address: '25 Avenue Montaigne',
        city: 'Paris',
        country: 'FR',
        latitude: 48.8663,
        longitude: 2.3046,
      },
      rating: {
        stars: 5,
        reviewScore: 9.4,
        reviewCount: 3892,
      },
      photos: [
        { url: 'https://images.unsplash.com/photo-1549294413-26f195200c16?w=800', caption: 'Elegant Facade' },
      ],
      amenities: ['wifi', 'spa', 'gym', 'restaurant', 'room_service', 'concierge'],
      pricing: {
        totalAmount: 890,
        currency: 'EUR',
        nightlyRate: 445,
      },
      cheapestRateId: 'mock_rate_paris_1',
      rooms: [],
    },
    {
      id: 'mock_htl_paris_2',
      duffelId: 'mock_htl_paris_2',
      name: 'Hotel Le Marais',
      description: 'Charming boutique hotel in the historic Marais district. Walking distance to Notre-Dame, Centre Pompidou, and trendy cafes.',
      location: {
        address: '8 Rue de Sevigne',
        city: 'Paris',
        country: 'FR',
        latitude: 48.8556,
        longitude: 2.3617,
      },
      rating: {
        stars: 4,
        reviewScore: 8.8,
        reviewCount: 2156,
      },
      photos: [
        { url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800', caption: 'Parisian Charm' },
      ],
      amenities: ['wifi', 'breakfast', '24_hour_front_desk'],
      pricing: {
        totalAmount: 320,
        currency: 'EUR',
        nightlyRate: 160,
      },
      cheapestRateId: 'mock_rate_paris_2',
      rooms: [],
    },
    {
      id: 'mock_htl_paris_3',
      duffelId: 'mock_htl_paris_3',
      name: 'Generator Paris',
      description: 'Stylish design hostel near Canal Saint-Martin. Great value with private rooms available, rooftop terrace, and vibrant social scene.',
      location: {
        address: '9-11 Place du Colonel Fabien',
        city: 'Paris',
        country: 'FR',
        latitude: 48.8768,
        longitude: 2.3702,
      },
      rating: {
        stars: 3,
        reviewScore: 8.2,
        reviewCount: 5621,
      },
      photos: [
        { url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800', caption: 'Modern Design' },
      ],
      amenities: ['wifi', 'bar', 'lounge'],
      pricing: {
        totalAmount: 140,
        currency: 'EUR',
        nightlyRate: 70,
      },
      cheapestRateId: 'mock_rate_paris_3',
      rooms: [],
    },
  ],

  // New York hotels
  'new york': [
    {
      id: 'mock_htl_nyc_1',
      duffelId: 'mock_htl_nyc_1',
      name: 'The Plaza',
      description: 'Legendary luxury hotel on Central Park South. Iconic New York landmark with opulent rooms, fine dining, and impeccable service.',
      location: {
        address: '768 5th Avenue',
        city: 'New York',
        country: 'US',
        latitude: 40.7645,
        longitude: -73.9742,
      },
      rating: {
        stars: 5,
        reviewScore: 9.2,
        reviewCount: 6234,
      },
      photos: [
        { url: 'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=800', caption: 'Grand Entrance' },
      ],
      amenities: ['wifi', 'spa', 'gym', 'restaurant', 'room_service', 'concierge', 'butler'],
      pricing: {
        totalAmount: 950,
        currency: 'USD',
        nightlyRate: 475,
      },
      cheapestRateId: 'mock_rate_nyc_1',
      rooms: [],
    },
    {
      id: 'mock_htl_nyc_2',
      duffelId: 'mock_htl_nyc_2',
      name: 'The Standard High Line',
      description: 'Trendy hotel straddling the High Line in the Meatpacking District. Floor-to-ceiling windows, rooftop bar, and downtown cool.',
      location: {
        address: '848 Washington Street',
        city: 'New York',
        country: 'US',
        latitude: 40.7408,
        longitude: -74.0080,
      },
      rating: {
        stars: 4,
        reviewScore: 8.6,
        reviewCount: 3456,
      },
      photos: [
        { url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', caption: 'Modern Luxury' },
      ],
      amenities: ['wifi', 'gym', 'restaurant', 'bar', 'rooftop'],
      pricing: {
        totalAmount: 420,
        currency: 'USD',
        nightlyRate: 210,
      },
      cheapestRateId: 'mock_rate_nyc_2',
      rooms: [],
    },
  ],

  // London hotels
  london: [
    {
      id: 'mock_htl_london_1',
      duffelId: 'mock_htl_london_1',
      name: 'The Savoy',
      description: 'Legendary Thames-side hotel with Art Deco elegance. World-famous afternoon tea, Kaspar\'s seafood bar, and timeless luxury.',
      location: {
        address: 'Strand',
        city: 'London',
        country: 'GB',
        latitude: 51.5101,
        longitude: -0.1205,
      },
      rating: {
        stars: 5,
        reviewScore: 9.3,
        reviewCount: 4123,
      },
      photos: [
        { url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', caption: 'Classic Elegance' },
      ],
      amenities: ['wifi', 'spa', 'gym', 'restaurant', 'room_service', 'concierge', 'pool'],
      pricing: {
        totalAmount: 680,
        currency: 'GBP',
        nightlyRate: 340,
      },
      cheapestRateId: 'mock_rate_london_1',
      rooms: [],
    },
    {
      id: 'mock_htl_london_2',
      duffelId: 'mock_htl_london_2',
      name: 'Shoreditch House',
      description: 'Members club with hotel rooms in trendy East London. Rooftop pool, creative atmosphere, and excellent restaurants.',
      location: {
        address: 'Ebor Street',
        city: 'London',
        country: 'GB',
        latitude: 51.5246,
        longitude: -0.0765,
      },
      rating: {
        stars: 4,
        reviewScore: 8.7,
        reviewCount: 1876,
      },
      photos: [
        { url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800', caption: 'Rooftop Pool' },
      ],
      amenities: ['wifi', 'pool', 'gym', 'restaurant', 'bar'],
      pricing: {
        totalAmount: 380,
        currency: 'GBP',
        nightlyRate: 190,
      },
      cheapestRateId: 'mock_rate_london_2',
      rooms: [],
    },
  ],

  // Default/fallback hotels for any city
  default: [
    {
      id: 'mock_htl_default_1',
      duffelId: 'mock_htl_default_1',
      name: 'Grand City Hotel',
      description: 'Centrally located hotel with modern amenities and comfortable rooms. Perfect for both business and leisure travelers.',
      location: {
        address: 'City Center',
        city: 'Your Destination',
        country: '',
        latitude: 0,
        longitude: 0,
      },
      rating: {
        stars: 4,
        reviewScore: 8.5,
        reviewCount: 2500,
      },
      photos: [
        { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', caption: 'Hotel Exterior' },
      ],
      amenities: ['wifi', 'gym', 'restaurant', '24_hour_front_desk'],
      pricing: {
        totalAmount: 200,
        currency: 'USD',
        nightlyRate: 100,
      },
      cheapestRateId: 'mock_rate_default_1',
      rooms: [],
    },
    {
      id: 'mock_htl_default_2',
      duffelId: 'mock_htl_default_2',
      name: 'Boutique Inn',
      description: 'Charming boutique property with personalized service and unique character. A home away from home.',
      location: {
        address: 'Historic District',
        city: 'Your Destination',
        country: '',
        latitude: 0,
        longitude: 0,
      },
      rating: {
        stars: 3,
        reviewScore: 8.8,
        reviewCount: 1200,
      },
      photos: [
        { url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', caption: 'Cozy Interior' },
      ],
      amenities: ['wifi', 'breakfast', 'parking'],
      pricing: {
        totalAmount: 120,
        currency: 'USD',
        nightlyRate: 60,
      },
      cheapestRateId: 'mock_rate_default_2',
      rooms: [],
    },
    {
      id: 'mock_htl_default_3',
      duffelId: 'mock_htl_default_3',
      name: 'Luxury Palace Resort',
      description: 'Five-star resort offering the ultimate in luxury and relaxation. World-class spa, fine dining, and exceptional service.',
      location: {
        address: 'Premium Location',
        city: 'Your Destination',
        country: '',
        latitude: 0,
        longitude: 0,
      },
      rating: {
        stars: 5,
        reviewScore: 9.4,
        reviewCount: 3800,
      },
      photos: [
        { url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', caption: 'Resort Pool' },
      ],
      amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'room_service', 'concierge'],
      pricing: {
        totalAmount: 500,
        currency: 'USD',
        nightlyRate: 250,
      },
      cheapestRateId: 'mock_rate_default_3',
      rooms: [],
    },
  ],
};

export function getMockHotels(
  city: string,
  checkIn: string,
  checkOut: string,
  budget?: { min?: number; max?: number }
): NormalizedHotel[] {
  // Normalize city name for lookup
  const normalizedCity = city.toLowerCase().trim();

  // Find matching hotels or use default
  let hotels = MOCK_HOTELS[normalizedCity] || MOCK_HOTELS.default;

  // Update location info for default hotels
  if (!MOCK_HOTELS[normalizedCity]) {
    hotels = hotels.map(h => ({
      ...h,
      location: { ...h.location, city },
    }));
  }

  // Calculate number of nights
  const nights = Math.max(1, Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  ));

  // Adjust pricing based on nights
  hotels = hotels.map(h => ({
    ...h,
    pricing: {
      ...h.pricing,
      totalAmount: h.pricing.nightlyRate * nights,
    },
  }));

  // Filter by budget if provided
  if (budget) {
    hotels = hotels.filter(h => {
      const nightlyRate = h.pricing.nightlyRate;
      const meetsMin = !budget.min || nightlyRate >= budget.min;
      const meetsMax = !budget.max || nightlyRate <= budget.max;
      return meetsMin && meetsMax;
    });
  }

  return hotels;
}

export function isMockMode(): boolean {
  // Always use mock mode until Duffel Stays API access is granted
  // Set DUFFEL_STAYS_ENABLED=true in env to use real API
  return process.env.DUFFEL_STAYS_ENABLED !== 'true';
}
