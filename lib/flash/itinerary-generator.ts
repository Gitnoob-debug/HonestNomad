import type { FlashTripPackage } from '@/types/flash';
import { DESTINATIONS } from './destinations';

export interface ItineraryStop {
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

export interface ItineraryDay {
  day: number;
  title: string;
  stops: ItineraryStop[];
}

// Sample POI data for popular destinations
// In production, this would come from a POI API (Google Places, Foursquare, etc.)
const DESTINATION_POIS: Record<string, Omit<ItineraryStop, 'day' | 'id'>[]> = {
  paris: [
    { name: 'Eiffel Tower', description: 'Iconic iron lattice tower with stunning city views from observation decks', type: 'landmark', latitude: 48.8584, longitude: 2.2945, duration: '2-3 hours' },
    { name: 'Louvre Museum', description: 'World\'s largest art museum, home to the Mona Lisa and Venus de Milo', type: 'landmark', latitude: 48.8606, longitude: 2.3376, duration: '3-4 hours' },
    { name: 'Café de Flore', description: 'Historic café in Saint-Germain, famous for its literary past and classic French cuisine', type: 'restaurant', latitude: 48.8541, longitude: 2.3325, duration: '1.5 hours' },
    { name: 'Notre-Dame Cathedral', description: 'Medieval Gothic cathedral, currently under restoration but exterior still impressive', type: 'landmark', latitude: 48.8530, longitude: 2.3499, duration: '1 hour' },
    { name: 'Montmartre & Sacré-Cœur', description: 'Artistic hilltop neighborhood with stunning basilica and panoramic views', type: 'activity', latitude: 48.8867, longitude: 2.3431, duration: '3 hours' },
    { name: 'Seine River Cruise', description: 'Romantic boat ride past Paris\'s illuminated monuments', type: 'activity', latitude: 48.8599, longitude: 2.3063, duration: '1.5 hours' },
    { name: 'Le Marais District', description: 'Trendy neighborhood with boutiques, galleries, and the best falafel in Paris', type: 'activity', latitude: 48.8566, longitude: 2.3622, duration: '2-3 hours' },
    { name: 'Arc de Triomphe', description: 'Monumental triumphal arch with rooftop terrace overlooking Champs-Élysées', type: 'landmark', latitude: 48.8738, longitude: 2.2950, duration: '1.5 hours' },
    { name: 'Musée d\'Orsay', description: 'Impressionist art museum in a beautiful Beaux-Arts railway station', type: 'landmark', latitude: 48.8600, longitude: 2.3266, duration: '2-3 hours' },
    { name: 'Luxembourg Gardens', description: 'Elegant formal gardens perfect for a morning stroll or afternoon picnic', type: 'activity', latitude: 48.8462, longitude: 2.3372, duration: '1.5 hours' },
  ],
  rome: [
    { name: 'Colosseum', description: 'Ancient Roman amphitheater, the largest ever built, iconic symbol of Rome', type: 'landmark', latitude: 41.8902, longitude: 12.4922, duration: '2-3 hours' },
    { name: 'Vatican Museums & Sistine Chapel', description: 'World-renowned art collections culminating in Michelangelo\'s masterpiece', type: 'landmark', latitude: 41.9065, longitude: 12.4536, duration: '4-5 hours' },
    { name: 'Trevi Fountain', description: 'Baroque masterpiece where tradition says tossing a coin ensures your return to Rome', type: 'landmark', latitude: 41.9009, longitude: 12.4833, duration: '30 min' },
    { name: 'Pantheon', description: 'Best-preserved ancient Roman temple with remarkable domed ceiling', type: 'landmark', latitude: 41.8986, longitude: 12.4769, duration: '1 hour' },
    { name: 'Trastevere District', description: 'Charming medieval neighborhood with cobblestone streets and authentic trattorias', type: 'activity', latitude: 41.8867, longitude: 12.4692, duration: '3 hours' },
    { name: 'Roscioli', description: 'Legendary deli and restaurant famous for carbonara and Roman classics', type: 'restaurant', latitude: 41.8933, longitude: 12.4751, duration: '2 hours' },
    { name: 'Roman Forum', description: 'Ancient civic center with impressive ruins of temples and government buildings', type: 'landmark', latitude: 41.8925, longitude: 12.4853, duration: '2 hours' },
    { name: 'Spanish Steps', description: 'Elegant stairway in the heart of Rome\'s fashion district', type: 'landmark', latitude: 41.9060, longitude: 12.4828, duration: '45 min' },
    { name: 'Borghese Gallery', description: 'Intimate museum with masterpieces by Bernini, Caravaggio, and Raphael', type: 'landmark', latitude: 41.9142, longitude: 12.4921, duration: '2 hours' },
    { name: 'Gelato Tasting Tour', description: 'Sample Rome\'s best artisanal gelato at legendary shops', type: 'activity', latitude: 41.8986, longitude: 12.4730, duration: '2 hours' },
  ],
  barcelona: [
    { name: 'La Sagrada Familia', description: 'Gaudí\'s unfinished masterpiece, Barcelona\'s most iconic building', type: 'landmark', latitude: 41.4036, longitude: 2.1744, duration: '2-3 hours' },
    { name: 'Park Güell', description: 'Whimsical hilltop park with colorful mosaics and city views', type: 'landmark', latitude: 41.4145, longitude: 2.1527, duration: '2 hours' },
    { name: 'La Boqueria Market', description: 'Vibrant food market on La Rambla with fresh produce and tapas bars', type: 'activity', latitude: 41.3816, longitude: 2.1719, duration: '1.5 hours' },
    { name: 'Gothic Quarter', description: 'Medieval labyrinth of narrow streets, hidden plazas, and Roman ruins', type: 'activity', latitude: 41.3833, longitude: 2.1761, duration: '3 hours' },
    { name: 'Casa Batlló', description: 'Gaudí\'s fantastical apartment building with dragon-scale roof', type: 'landmark', latitude: 41.3917, longitude: 2.1650, duration: '1.5 hours' },
    { name: 'Barceloneta Beach', description: 'Lively urban beach with seafood restaurants and Mediterranean vibes', type: 'activity', latitude: 41.3784, longitude: 2.1925, duration: '3 hours' },
    { name: 'Tickets Tapas Bar', description: 'Playful tapas by the Adrià brothers, molecular gastronomy meets tradition', type: 'restaurant', latitude: 41.3754, longitude: 2.1542, duration: '2.5 hours' },
    { name: 'Montjuïc', description: 'Hill with gardens, museums, and panoramic views of the city and port', type: 'activity', latitude: 41.3639, longitude: 2.1589, duration: '3-4 hours' },
    { name: 'Picasso Museum', description: 'Extensive collection of Picasso\'s formative works in medieval palaces', type: 'landmark', latitude: 41.3851, longitude: 2.1808, duration: '2 hours' },
    { name: 'El Born', description: 'Trendy neighborhood with boutiques, bars, and the cultural center', type: 'activity', latitude: 41.3858, longitude: 2.1822, duration: '2-3 hours' },
  ],
  tokyo: [
    { name: 'Senso-ji Temple', description: 'Tokyo\'s oldest temple with iconic Thunder Gate and Nakamise shopping street', type: 'landmark', latitude: 35.7148, longitude: 139.7967, duration: '2 hours' },
    { name: 'Shibuya Crossing', description: 'World\'s busiest pedestrian crossing, quintessential Tokyo experience', type: 'landmark', latitude: 35.6595, longitude: 139.7004, duration: '30 min' },
    { name: 'Tsukiji Outer Market', description: 'Food lover\'s paradise with fresh sushi, tamagoyaki, and street food', type: 'activity', latitude: 35.6654, longitude: 139.7707, duration: '2 hours' },
    { name: 'Meiji Shrine', description: 'Serene Shinto shrine in a tranquil forest in the heart of Tokyo', type: 'landmark', latitude: 35.6764, longitude: 139.6993, duration: '1.5 hours' },
    { name: 'TeamLab Planets', description: 'Immersive digital art museum where you wade through water and light', type: 'activity', latitude: 35.6528, longitude: 139.7883, duration: '2 hours' },
    { name: 'Sushi Saito', description: 'Three Michelin star omakase experience (reservation required months ahead)', type: 'restaurant', latitude: 35.6625, longitude: 139.7350, duration: '2 hours' },
    { name: 'Shinjuku Golden Gai', description: 'Maze of tiny bars in narrow alleys, each with unique atmosphere', type: 'activity', latitude: 35.6942, longitude: 139.7039, duration: '3 hours' },
    { name: 'Harajuku & Takeshita Street', description: 'Youth culture epicenter with wild fashion, crepes, and kawaii shops', type: 'activity', latitude: 35.6702, longitude: 139.7027, duration: '2 hours' },
    { name: 'Tokyo Skytree', description: 'Tallest tower in Japan with observation decks offering 360° city views', type: 'landmark', latitude: 35.7101, longitude: 139.8107, duration: '1.5 hours' },
    { name: 'Akihabara Electric Town', description: 'Anime, manga, and electronics mecca with themed cafés', type: 'activity', latitude: 35.7023, longitude: 139.7745, duration: '3 hours' },
  ],
  london: [
    { name: 'Tower of London', description: 'Medieval fortress housing Crown Jewels and 1000 years of history', type: 'landmark', latitude: 51.5081, longitude: -0.0759, duration: '3 hours' },
    { name: 'British Museum', description: 'World-class collection including Rosetta Stone and Egyptian mummies', type: 'landmark', latitude: 51.5194, longitude: -0.1270, duration: '3-4 hours' },
    { name: 'Borough Market', description: 'London\'s oldest food market with artisan producers and street food', type: 'activity', latitude: 51.5055, longitude: -0.0910, duration: '2 hours' },
    { name: 'Westminster Abbey', description: 'Gothic church where monarchs are crowned and legends are buried', type: 'landmark', latitude: 51.4994, longitude: -0.1273, duration: '2 hours' },
    { name: 'Buckingham Palace', description: 'Royal residence with famous Changing of the Guard ceremony', type: 'landmark', latitude: 51.5014, longitude: -0.1419, duration: '1.5 hours' },
    { name: 'Dishoom', description: 'Bombay-style café serving legendary bacon naan rolls and chai', type: 'restaurant', latitude: 51.5139, longitude: -0.1218, duration: '1.5 hours' },
    { name: 'Camden Market', description: 'Eclectic markets, live music venues, and alternative culture', type: 'activity', latitude: 51.5416, longitude: -0.1461, duration: '3 hours' },
    { name: 'Tate Modern', description: 'World\'s most visited modern art gallery in a converted power station', type: 'landmark', latitude: 51.5076, longitude: -0.0994, duration: '2-3 hours' },
    { name: 'Hyde Park', description: 'Royal park perfect for picnics, rowing, and watching Londoners', type: 'activity', latitude: 51.5073, longitude: -0.1657, duration: '2 hours' },
    { name: 'West End Theatre', description: 'Catch a world-class musical or play in London\'s theatre district', type: 'activity', latitude: 51.5117, longitude: -0.1277, duration: '3 hours' },
  ],
  amsterdam: [
    { name: 'Anne Frank House', description: 'Moving museum in the secret annex where Anne Frank wrote her diary', type: 'landmark', latitude: 52.3752, longitude: 4.8840, duration: '1.5 hours' },
    { name: 'Van Gogh Museum', description: 'World\'s largest collection of Van Gogh\'s masterpieces', type: 'landmark', latitude: 52.3584, longitude: 4.8811, duration: '2-3 hours' },
    { name: 'Canal Ring Cruise', description: 'Glide through UNESCO-listed canals past gabled houses and bridges', type: 'activity', latitude: 52.3738, longitude: 4.8910, duration: '1 hour' },
    { name: 'Rijksmuseum', description: 'Dutch Golden Age art including Rembrandt\'s Night Watch', type: 'landmark', latitude: 52.3600, longitude: 4.8852, duration: '3 hours' },
    { name: 'Jordaan District', description: 'Charming neighborhood with boutiques, cafés, and hidden courtyards', type: 'activity', latitude: 52.3747, longitude: 4.8792, duration: '3 hours' },
    { name: 'De Foodhallen', description: 'Indoor food market in historic tram depot with global cuisines', type: 'restaurant', latitude: 52.3637, longitude: 4.8614, duration: '2 hours' },
    { name: 'Vondelpark', description: 'Amsterdam\'s beloved park for cycling, people-watching, and picnics', type: 'activity', latitude: 52.3579, longitude: 4.8686, duration: '1.5 hours' },
    { name: 'Albert Cuyp Market', description: 'Bustling street market with Dutch treats, stroopwafels, and herring', type: 'activity', latitude: 52.3554, longitude: 4.8939, duration: '1.5 hours' },
    { name: 'Heineken Experience', description: 'Interactive brewery tour with beer tasting and canal boat ride', type: 'activity', latitude: 52.3577, longitude: 4.8914, duration: '2 hours' },
    { name: 'A\'DAM Lookout', description: 'Rooftop observation deck with swing over the edge and city views', type: 'landmark', latitude: 52.3843, longitude: 4.9018, duration: '1 hour' },
  ],
};

// Generic POIs for destinations without specific data
function generateGenericPOIs(trip: FlashTripPackage): Omit<ItineraryStop, 'day' | 'id'>[] {
  const destination = DESTINATIONS.find(d => d.id === trip.destination.city.toLowerCase().replace(/\s+/g, '-'));
  const baseLat = destination?.latitude || 0;
  const baseLng = destination?.longitude || 0;

  // Use highlights from the trip to generate POIs
  const pois: Omit<ItineraryStop, 'day' | 'id'>[] = [];

  // Add highlights as landmarks
  trip.highlights.forEach((highlight, i) => {
    pois.push({
      name: highlight,
      description: `Must-see attraction in ${trip.destination.city}`,
      type: 'landmark',
      latitude: baseLat + (Math.random() - 0.5) * 0.03,
      longitude: baseLng + (Math.random() - 0.5) * 0.03,
      duration: '1-2 hours',
    });
  });

  // Add some generic activities
  pois.push({
    name: `${trip.destination.city} Old Town`,
    description: `Explore the historic center and local atmosphere`,
    type: 'activity',
    latitude: baseLat + 0.005,
    longitude: baseLng - 0.005,
    duration: '2-3 hours',
  });

  pois.push({
    name: `Local Food Market`,
    description: `Taste authentic local cuisine and fresh produce`,
    type: 'restaurant',
    latitude: baseLat - 0.008,
    longitude: baseLng + 0.003,
    duration: '1.5 hours',
  });

  pois.push({
    name: `Sunset Viewpoint`,
    description: `Catch breathtaking sunset views over the city`,
    type: 'activity',
    latitude: baseLat + 0.012,
    longitude: baseLng + 0.008,
    duration: '1 hour',
  });

  return pois;
}

export function generateSampleItinerary(trip: FlashTripPackage): ItineraryDay[] {
  const cityKey = trip.destination.city.toLowerCase().replace(/\s+/g, '');
  let pois = DESTINATION_POIS[cityKey];

  // If no specific POIs, generate generic ones
  if (!pois || pois.length === 0) {
    pois = generateGenericPOIs(trip);
  }

  const days: ItineraryDay[] = [];
  const numDays = trip.itinerary.days;
  const stopsPerDay = Math.ceil(pois.length / numDays);

  // Day titles based on themes
  const dayThemes = [
    'Arrival & First Impressions',
    'Iconic Landmarks',
    'Local Life & Culture',
    'Hidden Gems',
    'Relaxation & Farewell',
    'Adventure Day',
    'Art & History',
  ];

  for (let day = 1; day <= numDays; day++) {
    const startIdx = (day - 1) * stopsPerDay;
    const endIdx = Math.min(startIdx + stopsPerDay, pois.length);
    const dayPois = pois.slice(startIdx, endIdx);

    // If we run out of POIs, cycle back
    if (dayPois.length === 0 && pois.length > 0) {
      const cycleIdx = (day - 1) % pois.length;
      dayPois.push(pois[cycleIdx]);
    }

    const stops: ItineraryStop[] = dayPois.map((poi, idx) => ({
      ...poi,
      id: `day${day}-stop${idx + 1}`,
      day,
    }));

    days.push({
      day,
      title: dayThemes[(day - 1) % dayThemes.length],
      stops,
    });
  }

  return days;
}
