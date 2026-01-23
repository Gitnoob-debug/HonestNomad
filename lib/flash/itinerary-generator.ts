import type { FlashTripPackage } from '@/types/flash';
import type { CachedPOI, DestinationPOICache, ItineraryPathType } from '@/types/poi';
import type { POICategory } from '@/types/poi';
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
  // Extended data from Google Places
  googleRating?: number;
  googleReviewCount?: number;
  googlePrice?: number;
  address?: string;
  websiteUrl?: string;
  googleMapsUrl?: string;
  bestTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
  category?: POICategory;
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

// Trendy/Local hidden gem POIs for popular destinations
// These are off-the-beaten-path spots that locals love
const TRENDY_POIS: Record<string, Omit<ItineraryStop, 'day' | 'id'>[]> = {
  paris: [
    { name: 'Canal Saint-Martin', description: 'Hip neighborhood with indie boutiques, cool cafés, and iron footbridges', type: 'activity', latitude: 48.8720, longitude: 2.3655, duration: '3 hours' },
    { name: 'Le Comptoir Général', description: 'Hidden Afro-Caribbean bar in a colonial-style warehouse, feels like another world', type: 'restaurant', latitude: 48.8715, longitude: 2.3660, duration: '2-3 hours' },
    { name: 'Belleville', description: 'Multicultural neighborhood with street art, authentic Asian food, and artist studios', type: 'activity', latitude: 48.8722, longitude: 2.3847, duration: '3 hours' },
    { name: 'Le Perchoir Rooftop', description: 'Secret rooftop bar with panoramic views, popular with creative locals', type: 'restaurant', latitude: 48.8663, longitude: 2.3814, duration: '2 hours' },
    { name: 'Marché d\'Aligre', description: 'Authentic neighborhood market where Parisians actually shop, not tourists', type: 'activity', latitude: 48.8489, longitude: 2.3787, duration: '1.5 hours' },
    { name: 'La REcyclerie', description: 'Urban farm and café in a converted train station, sustainability meets cool', type: 'restaurant', latitude: 48.8917, longitude: 2.3447, duration: '2 hours' },
    { name: 'Parc des Buttes-Chaumont', description: 'Dramatic cliffs, waterfalls, and temple in this lesser-known romantic park', type: 'activity', latitude: 48.8809, longitude: 2.3828, duration: '2 hours' },
    { name: 'Musée de la Chasse', description: 'Quirky hunting museum with contemporary art installations, surprisingly cool', type: 'landmark', latitude: 48.8612, longitude: 2.3582, duration: '1.5 hours' },
    { name: 'Broken Arm Café', description: 'Fashion-forward concept store with minimalist café, local designer hangout', type: 'restaurant', latitude: 48.8659, longitude: 2.3607, duration: '1.5 hours' },
    { name: 'Petite Ceinture', description: 'Abandoned railway line turned urban hiking trail through secret Paris', type: 'activity', latitude: 48.8430, longitude: 2.3820, duration: '2 hours' },
  ],
  rome: [
    { name: 'Testaccio', description: 'Working-class neighborhood with Rome\'s best trattorias and nightlife', type: 'activity', latitude: 41.8758, longitude: 12.4756, duration: '3 hours' },
    { name: 'Da Enzo al 29', description: 'Tiny trattoria with legendary cacio e pepe, locals queue for hours', type: 'restaurant', latitude: 41.8875, longitude: 12.4685, duration: '2 hours' },
    { name: 'Ostiense Street Art District', description: 'Industrial zone transformed into open-air street art gallery', type: 'activity', latitude: 41.8683, longitude: 12.4819, duration: '2 hours' },
    { name: 'Garbatella', description: 'Garden city neighborhood with 1920s architecture and authentic Roman life', type: 'activity', latitude: 41.8614, longitude: 12.4883, duration: '2 hours' },
    { name: 'Mercato di Testaccio', description: 'Covered market where Romans shop, fantastic for lunch', type: 'restaurant', latitude: 41.8750, longitude: 12.4750, duration: '1.5 hours' },
    { name: 'Aventine Keyhole', description: 'Peer through a keyhole for a perfectly framed view of St. Peter\'s dome', type: 'landmark', latitude: 41.8833, longitude: 12.4789, duration: '30 min' },
    { name: 'Ponte Milvio at Sunset', description: 'Local lovers\' bridge with aperitivo bars, where Romans gather at golden hour', type: 'activity', latitude: 41.9372, longitude: 12.4672, duration: '2 hours' },
    { name: 'Pigneto', description: 'Pasolini\'s old neighborhood, now Rome\'s hippest bar and café scene', type: 'activity', latitude: 41.8897, longitude: 12.5300, duration: '3 hours' },
    { name: 'Trapizzino', description: 'Roman street food revolution - pizza pockets with traditional fillings', type: 'restaurant', latitude: 41.8755, longitude: 12.4758, duration: '45 min' },
    { name: 'Non-Catholic Cemetery', description: 'Serene resting place of Keats and Shelley, unexpectedly beautiful', type: 'landmark', latitude: 41.8761, longitude: 12.4797, duration: '1 hour' },
  ],
  barcelona: [
    { name: 'Gràcia', description: 'Village-like neighborhood with local plazas, indie shops, and vermouth bars', type: 'activity', latitude: 41.4028, longitude: 2.1567, duration: '3 hours' },
    { name: 'Bar Brutal', description: 'Natural wine bar with exposed stone and eclectic tapas, local favorite', type: 'restaurant', latitude: 41.3847, longitude: 2.1789, duration: '2 hours' },
    { name: 'Bunkers del Carmel', description: 'Civil war bunkers with the best panoramic views of Barcelona, sunset essential', type: 'landmark', latitude: 41.4189, longitude: 2.1611, duration: '2 hours' },
    { name: 'Poblenou', description: 'Former industrial zone now tech hub with cool coffee shops and design studios', type: 'activity', latitude: 41.4028, longitude: 2.2006, duration: '3 hours' },
    { name: 'Els Quatre Gats', description: 'Art Nouveau café where Picasso had his first exhibition', type: 'restaurant', latitude: 41.3856, longitude: 2.1742, duration: '1.5 hours' },
    { name: 'Sant Antoni Market', description: 'Renovated modernist market with trendy food stalls and Sunday book fair', type: 'activity', latitude: 41.3783, longitude: 2.1611, duration: '2 hours' },
    { name: 'Parc del Laberint d\'Horta', description: 'Hidden neoclassical garden with a hedge maze, Barcelona\'s secret park', type: 'activity', latitude: 41.4397, longitude: 2.1461, duration: '1.5 hours' },
    { name: 'La Xampanyeria', description: 'Standing-room-only cava bar, dirt cheap bubbles and incredible vibes', type: 'restaurant', latitude: 41.3844, longitude: 2.1847, duration: '1 hour' },
    { name: 'Hospital de Sant Pau', description: 'Stunning modernist complex, less crowded than Sagrada Familia', type: 'landmark', latitude: 41.4139, longitude: 2.1750, duration: '1.5 hours' },
    { name: 'Mercat de Sant Antoni Vermouth', description: 'Sunday vermouth tradition at the market\'s outdoor bars', type: 'restaurant', latitude: 41.3781, longitude: 2.1614, duration: '2 hours' },
  ],
  tokyo: [
    { name: 'Shimokitazawa', description: 'Bohemian neighborhood with vintage shops, live houses, and indie cafés', type: 'activity', latitude: 35.6617, longitude: 139.6694, duration: '3 hours' },
    { name: 'Yanaka', description: 'Old Tokyo atmosphere with traditional shops, temples, and cat-themed cafés', type: 'activity', latitude: 35.7256, longitude: 139.7667, duration: '3 hours' },
    { name: 'Fuunji', description: 'Legendary tsukemen shop, locals brave the queue for these dipping noodles', type: 'restaurant', latitude: 35.6892, longitude: 139.6978, duration: '1 hour' },
    { name: 'Nakameguro', description: 'Stylish canal-side area with design stores and specialty coffee', type: 'activity', latitude: 35.6436, longitude: 139.6983, duration: '3 hours' },
    { name: 'Koenji', description: 'Alternative culture hub with vintage stores, punk bars, and street art', type: 'activity', latitude: 35.7056, longitude: 139.6497, duration: '3 hours' },
    { name: 'Onibus Coffee', description: 'Third-wave coffee pioneer in a converted garage, local roasters', type: 'restaurant', latitude: 35.6450, longitude: 139.6942, duration: '1 hour' },
    { name: 'Todoroki Valley', description: 'Hidden ravine with walking trail and shrine in the middle of the city', type: 'activity', latitude: 35.6086, longitude: 139.6444, duration: '1.5 hours' },
    { name: 'Standing Sushi Bar Uogashi', description: 'Counter-only sushi at Tsukiji, no seats but phenomenal fish', type: 'restaurant', latitude: 35.6656, longitude: 139.7697, duration: '45 min' },
    { name: 'Tokyo Jazz Kissaten', description: 'Vinyl jazz café culture - sit in silence and listen to rare records', type: 'activity', latitude: 35.6592, longitude: 139.7006, duration: '2 hours' },
    { name: 'Daikanyama T-Site', description: 'Architectural marvel bookstore, design lovers\' paradise', type: 'landmark', latitude: 35.6492, longitude: 139.7036, duration: '1.5 hours' },
  ],
  london: [
    { name: 'Peckham', description: 'South London\'s coolest neighborhood with rooftop bars and diverse food scene', type: 'activity', latitude: 51.4733, longitude: -0.0672, duration: '3 hours' },
    { name: 'Dishoom King\'s Cross', description: 'Best bacon naan in London, worth the queue at this Bombay café', type: 'restaurant', latitude: 51.5361, longitude: -0.1247, duration: '1.5 hours' },
    { name: 'Maltby Street Market', description: 'Small artisan market under railway arches, the locals\' Borough', type: 'activity', latitude: 51.4994, longitude: -0.0781, duration: '2 hours' },
    { name: 'Hackney Wick', description: 'Industrial canalside with breweries, art studios, and warehouse parties', type: 'activity', latitude: 51.5456, longitude: -0.0244, duration: '3 hours' },
    { name: 'Coal Drops Yard', description: 'Victorian coal drops transformed into design destination', type: 'activity', latitude: 51.5397, longitude: -0.1256, duration: '2 hours' },
    { name: 'Bermondsey Beer Mile', description: 'Railway arch breweries and taprooms, craft beer pilgrimage', type: 'activity', latitude: 51.4978, longitude: -0.0700, duration: '3 hours' },
    { name: 'Barbican Conservatory', description: 'Hidden tropical oasis inside brutalist architecture', type: 'landmark', latitude: 51.5200, longitude: -0.0936, duration: '1 hour' },
    { name: 'Columbia Road Flower Market', description: 'Sunday flower market with East End atmosphere and coffee', type: 'activity', latitude: 51.5303, longitude: -0.0736, duration: '2 hours' },
    { name: 'Brixton Village', description: 'Covered market with global food stalls and late-night bars', type: 'restaurant', latitude: 51.4614, longitude: -0.1131, duration: '2.5 hours' },
    { name: 'Leake Street Graffiti Tunnel', description: 'Legal graffiti tunnel near Waterloo, constantly changing street art', type: 'landmark', latitude: 51.5022, longitude: -0.1139, duration: '45 min' },
  ],
  amsterdam: [
    { name: 'De Pijp', description: 'Amsterdam\'s Latin Quarter with diverse restaurants and Albert Cuyp market', type: 'activity', latitude: 52.3553, longitude: 4.8925, duration: '3 hours' },
    { name: 'Pllek', description: 'Beach bar made from shipping containers on NDSM wharf', type: 'restaurant', latitude: 52.4017, longitude: 4.8939, duration: '2 hours' },
    { name: 'NDSM Wharf', description: 'Post-industrial creative hub with street art, festivals, and alternative culture', type: 'activity', latitude: 52.4008, longitude: 4.8917, duration: '3 hours' },
    { name: 'De Ceuvel', description: 'Sustainable urban village on former shipyard with eco-café', type: 'activity', latitude: 52.3944, longitude: 4.9286, duration: '2 hours' },
    { name: 'Oost', description: 'Multicultural neighborhood with Tropical Museum and Dappermarkt', type: 'activity', latitude: 52.3631, longitude: 4.9256, duration: '3 hours' },
    { name: 'Café de Koe', description: 'Local brown café with board games and unpretentious vibes', type: 'restaurant', latitude: 52.3647, longitude: 4.8606, duration: '2 hours' },
    { name: 'Begijnhof', description: 'Secret medieval courtyard in the city center, peaceful oasis', type: 'landmark', latitude: 52.3689, longitude: 4.8889, duration: '45 min' },
    { name: 'EYE Film Museum', description: 'Striking architecture and free exhibitions across the IJ', type: 'landmark', latitude: 52.3844, longitude: 4.9003, duration: '2 hours' },
    { name: 'De School', description: 'Former technical school turned club, restaurant, and gym', type: 'activity', latitude: 52.3636, longitude: 4.8483, duration: '3 hours' },
    { name: 'Westerpark Sunday Market', description: 'Monthly market in the park with food, vintage, and music', type: 'activity', latitude: 52.3878, longitude: 4.8703, duration: '2 hours' },
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

// Generic trendy POIs for destinations without specific trendy data
function generateGenericTrendyPOIs(trip: FlashTripPackage): Omit<ItineraryStop, 'day' | 'id'>[] {
  const destination = DESTINATIONS.find(d => d.id === trip.destination.city.toLowerCase().replace(/\s+/g, '-'));
  const baseLat = destination?.latitude || 0;
  const baseLng = destination?.longitude || 0;

  return [
    {
      name: `${trip.destination.city} Coffee Culture`,
      description: 'Specialty coffee shops where locals start their day',
      type: 'restaurant',
      latitude: baseLat + (Math.random() - 0.5) * 0.02,
      longitude: baseLng + (Math.random() - 0.5) * 0.02,
      duration: '1 hour',
    },
    {
      name: 'Local Street Art Walk',
      description: 'Discover hidden murals and creative neighborhoods',
      type: 'activity',
      latitude: baseLat + (Math.random() - 0.5) * 0.03,
      longitude: baseLng + (Math.random() - 0.5) * 0.03,
      duration: '2 hours',
    },
    {
      name: 'Neighborhood Market',
      description: 'Where locals actually shop and eat, not tourists',
      type: 'activity',
      latitude: baseLat + (Math.random() - 0.5) * 0.02,
      longitude: baseLng + (Math.random() - 0.5) * 0.02,
      duration: '1.5 hours',
    },
    {
      name: 'Sunset Cocktail Spot',
      description: 'Rooftop or terrace bar popular with young locals',
      type: 'restaurant',
      latitude: baseLat + (Math.random() - 0.5) * 0.025,
      longitude: baseLng + (Math.random() - 0.5) * 0.025,
      duration: '2 hours',
    },
    {
      name: 'Up-and-Coming Neighborhood',
      description: 'The area that\'s becoming the next big thing',
      type: 'activity',
      latitude: baseLat + (Math.random() - 0.5) * 0.04,
      longitude: baseLng + (Math.random() - 0.5) * 0.04,
      duration: '3 hours',
    },
    {
      name: 'Hidden Garden or Park',
      description: 'Secret green space away from the crowds',
      type: 'activity',
      latitude: baseLat + (Math.random() - 0.5) * 0.03,
      longitude: baseLng + (Math.random() - 0.5) * 0.03,
      duration: '1.5 hours',
    },
    {
      name: 'Local Foodie Spot',
      description: 'The restaurant locals recommend to their friends',
      type: 'restaurant',
      latitude: baseLat + (Math.random() - 0.5) * 0.02,
      longitude: baseLng + (Math.random() - 0.5) * 0.02,
      duration: '2 hours',
    },
    {
      name: 'Alternative Cultural Space',
      description: 'Gallery, music venue, or creative hub off the beaten path',
      type: 'activity',
      latitude: baseLat + (Math.random() - 0.5) * 0.03,
      longitude: baseLng + (Math.random() - 0.5) * 0.03,
      duration: '2 hours',
    },
  ];
}

export function generateTrendyItinerary(trip: FlashTripPackage): ItineraryDay[] {
  const cityKey = trip.destination.city.toLowerCase().replace(/\s+/g, '');
  let pois = TRENDY_POIS[cityKey];

  // If no specific trendy POIs, generate generic ones
  if (!pois || pois.length === 0) {
    pois = generateGenericTrendyPOIs(trip);
  }

  const days: ItineraryDay[] = [];
  const numDays = trip.itinerary.days;
  const stopsPerDay = Math.ceil(pois.length / numDays);

  // Trendy day themes
  const trendyThemes = [
    'Neighborhood Discovery',
    'Local Foodie Trail',
    'Hidden Gems & Street Art',
    'Coffee & Creative Spaces',
    'Off the Beaten Path',
    'Sunset Spots & Nightlife',
    'Markets & Local Life',
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
      title: trendyThemes[(day - 1) % trendyThemes.length],
      stops,
    });
  }

  return days;
}

// ============================================
// NEW: Generate itinerary from real POI cache
// ============================================

export type SimplePathChoice = 'classic' | 'trendy' | 'foodie' | 'adventure' | 'cultural' | 'relaxation' | 'nightlife';

// Map our simplified path choices to detailed path types
function getPathTypesForChoice(choice: SimplePathChoice): ItineraryPathType[] {
  switch (choice) {
    case 'classic':
      return ['classic', 'cultural'];
    case 'trendy':
      return ['trendy', 'nightlife', 'foodie'];
    case 'foodie':
      return ['foodie', 'trendy'];
    case 'adventure':
      return ['adventure', 'classic'];
    case 'cultural':
      return ['cultural', 'classic'];
    case 'relaxation':
      return ['relaxation', 'cultural'];
    case 'nightlife':
      return ['nightlife', 'trendy', 'foodie'];
    default:
      return ['classic', 'cultural'];
  }
}

// Convert CachedPOI to ItineraryStop format
function poiToItineraryStop(poi: CachedPOI, day: number, stopIndex: number): ItineraryStop {
  const typeMap: Record<string, ItineraryStop['type']> = {
    landmark: 'landmark',
    restaurant: 'restaurant',
    cafe: 'restaurant',
    bar: 'restaurant',
    museum: 'landmark',
    park: 'activity',
    market: 'activity',
    activity: 'activity',
    nightclub: 'activity',
    viewpoint: 'landmark',
    neighborhood: 'activity',
  };

  return {
    id: `day${day}-stop${stopIndex + 1}`,
    name: poi.name,
    description: poi.description,
    type: typeMap[poi.category] || 'activity',
    latitude: poi.latitude,
    longitude: poi.longitude,
    duration: poi.suggestedDuration,
    imageUrl: poi.imageUrl,
    day,
    googleRating: poi.googleRating,
    googleReviewCount: poi.googleReviewCount,
    googlePrice: poi.googlePrice,
    address: poi.address,
    websiteUrl: poi.websiteUrl,
    googleMapsUrl: poi.googleMapsUrl,
    bestTimeOfDay: poi.bestTimeOfDay,
    category: poi.category,
  };
}

// Get balanced POI selection from cache
function getBalancedPOISelection(
  cache: DestinationPOICache,
  pathChoice: SimplePathChoice,
  totalStops: number
): CachedPOI[] {
  const pathTypes = getPathTypesForChoice(pathChoice);
  const primaryPath = pathTypes[0];
  const secondaryPaths = pathTypes.slice(1);

  const selected: CachedPOI[] = [];
  const seenIds = new Set<string>();

  // Get ~70% from primary path
  const primaryPOIs = cache.paths[primaryPath] || [];
  const primaryCount = Math.ceil(totalStops * 0.7);

  for (const poi of primaryPOIs.slice(0, primaryCount)) {
    if (!seenIds.has(poi.id)) {
      seenIds.add(poi.id);
      selected.push(poi);
    }
  }

  // Get remaining from secondary paths
  for (const pathType of secondaryPaths) {
    if (selected.length >= totalStops) break;

    const pathPOIs = cache.paths[pathType] || [];
    for (const poi of pathPOIs) {
      if (selected.length >= totalStops) break;
      if (!seenIds.has(poi.id)) {
        seenIds.add(poi.id);
        selected.push(poi);
      }
    }
  }

  // If still not enough, grab from any path
  if (selected.length < totalStops) {
    const allPathTypes: ItineraryPathType[] = ['classic', 'foodie', 'adventure', 'cultural', 'relaxation', 'nightlife', 'trendy'];
    for (const pathType of allPathTypes) {
      if (selected.length >= totalStops) break;

      const pathPOIs = cache.paths[pathType] || [];
      for (const poi of pathPOIs) {
        if (selected.length >= totalStops) break;
        if (!seenIds.has(poi.id)) {
          seenIds.add(poi.id);
          selected.push(poi);
        }
      }
    }
  }

  return selected;
}

// Organize stops by time of day for better itinerary flow
function organizeByTimeOfDay(pois: CachedPOI[]): CachedPOI[] {
  const timeOrder = ['morning', 'afternoon', 'evening', 'night', 'any'];
  return [...pois].sort((a, b) => {
    const aTime = a.bestTimeOfDay || 'any';
    const bTime = b.bestTimeOfDay || 'any';
    return timeOrder.indexOf(aTime) - timeOrder.indexOf(bTime);
  });
}

// Day themes based on path choice
const PATH_DAY_THEMES: Record<SimplePathChoice, string[]> = {
  classic: [
    'Arrival & Iconic Landmarks',
    'Must-See Monuments',
    'Historic Treasures',
    'Cultural Highlights',
    'Farewell Tour',
    'Hidden Classics',
    'Panoramic Views',
  ],
  trendy: [
    'Neighborhood Discovery',
    'Local Foodie Trail',
    'Hidden Gems & Street Art',
    'Coffee & Creative Spaces',
    'Off the Beaten Path',
    'Sunset Spots & Nightlife',
    'Markets & Local Life',
  ],
  foodie: [
    'Culinary Welcome',
    'Market Adventures',
    'Local Favorites',
    'Fine Dining & Wine',
    'Street Food Safari',
    'Sweet Treats & Coffee',
    'Farewell Feast',
  ],
  adventure: [
    'Arrival & Orientation',
    'Outdoor Exploration',
    'Active Adventures',
    'Nature & Views',
    'Adrenaline Day',
    'Scenic Routes',
    'Final Adventure',
  ],
  cultural: [
    'Museum Morning',
    'Art & Architecture',
    'Historic Sites',
    'Gallery Hopping',
    'Cultural Deep Dive',
    'Living History',
    'Artistic Farewell',
  ],
  relaxation: [
    'Peaceful Arrival',
    'Garden & Parks',
    'Spa & Wellness',
    'Scenic Strolls',
    'Quiet Corners',
    'Nature Retreat',
    'Serene Goodbye',
  ],
  nightlife: [
    'Evening Arrival',
    'Bar Hopping',
    'Live Music Night',
    'Rooftop Views',
    'Club Scene',
    'Late Night Eats',
    'Final Night Out',
  ],
};

/**
 * Generate an itinerary from real Google Places POI data
 * This is the main function to use when we have cached POI data
 *
 * Note: We cap the total POIs to 10-12 for a curated experience,
 * regardless of trip length. This keeps the explore view manageable
 * and focuses on highlights rather than filling every day.
 */
export function generateItineraryFromCache(
  cache: DestinationPOICache,
  numDays: number,
  pathChoice: SimplePathChoice,
  stopsPerDay: number = 4
): ItineraryDay[] {
  // Cap total stops to keep the itinerary curated and manageable
  // 10-12 POIs is ideal for exploration, not 56 for a 14-day trip
  const maxTotalStops = 12;
  const totalStops = Math.min(numDays * stopsPerDay, maxTotalStops);

  // Get balanced selection of POIs
  let selectedPOIs = getBalancedPOISelection(cache, pathChoice, totalStops);

  // Organize all POIs by time of day for a logical flow
  selectedPOIs = organizeByTimeOfDay(selectedPOIs);

  // Create a single "day" that contains all the curated stops
  // The explore view shows all POIs at once anyway, not day-by-day
  const days: ItineraryDay[] = [];
  const themes = PATH_DAY_THEMES[pathChoice] || PATH_DAY_THEMES.classic;

  // Put all stops in day 1 since explore view shows them all together
  const stops: ItineraryStop[] = selectedPOIs.map((poi, idx) =>
    poiToItineraryStop(poi, 1, idx)
  );

  days.push({
    day: 1,
    title: themes[0],
    stops,
  });

  return days;
}

/**
 * Generate itinerary - automatically uses cached POI data if available
 * Falls back to hardcoded data for destinations without cache
 */
export async function generateItineraryAuto(
  trip: FlashTripPackage,
  pathChoice: SimplePathChoice
): Promise<ItineraryDay[]> {
  const cityKey = trip.destination.city.toLowerCase().replace(/\s+/g, '-');

  // Try to load cached POI data
  try {
    const cacheModule = await import(`@/data/pois/${cityKey}.json`);
    const cache = cacheModule.default as DestinationPOICache;

    if (cache && cache.totalPOIs > 0) {
      console.log(`Using cached POI data for ${cityKey} (${cache.totalPOIs} POIs)`);
      return generateItineraryFromCache(cache, trip.itinerary.days, pathChoice);
    }
  } catch (error) {
    console.log(`No cached POI data for ${cityKey}, using fallback`);
  }

  // Fall back to hardcoded data
  if (pathChoice === 'trendy' || pathChoice === 'nightlife') {
    return generateTrendyItinerary(trip);
  }
  return generateSampleItinerary(trip);
}

// List of destinations with real POI data (410 cities - all destinations)
export const DESTINATIONS_WITH_POI_DATA = [
  // All destinations have cached POI data from Google Places
  'aarhus', 'abu-dhabi', 'addis-ababa', 'agra', 'albuquerque', 'alula', 'amalfi',
  'amsterdam', 'anchorage', 'antigua', 'antigua-guatemala', 'antwerp', 'arenal',
  'arequipa', 'aruba', 'asheville', 'aspen', 'atacama', 'athens', 'atlanta',
  'auckland', 'austin', 'azores', 'bahamas', 'bahrain', 'bali', 'banff', 'bangkok',
  'banos', 'barbados', 'barcelona', 'bariloche', 'basel', 'bath', 'beijing',
  'beirut', 'belfast', 'belgrade', 'belize', 'bergen', 'berlin', 'bhutan',
  'big-sur', 'bilbao', 'black-forest', 'bogota', 'bologna', 'bonaire', 'bora-bora',
  'boracay', 'bordeaux', 'boston', 'botswana', 'bratislava', 'brighton', 'bristol',
  'bruges', 'brussels', 'bucharest', 'budapest', 'buenos-aires', 'busan', 'cabo',
  'calgary', 'cambridge', 'canary-islands', 'cancun', 'cape-cod', 'cape-town',
  'cardiff', 'carmel', 'cartagena', 'caye-caulker', 'cayman-islands', 'chamonix',
  'chania', 'charleston', 'charlotte', 'chefchaouen', 'chiang-mai', 'chicago',
  'cinque-terre', 'cleveland', 'cologne', 'colonia', 'cook-islands', 'copenhagen',
  'cordoba', 'corfu', 'cork', 'corsica', 'costa-rica', 'cotswolds', 'cozumel',
  'crete', 'cuenca', 'curacao', 'da-nang', 'dallas', 'dead-sea', 'delhi', 'denver',
  'detroit', 'doha', 'dominican-republic', 'dresden', 'dubai', 'dublin', 'dubrovnik',
  'dusseldorf', 'easter-island', 'edinburgh', 'edmonton', 'egypt', 'essaouira',
  'fes', 'fiji', 'florence', 'florianopolis', 'frankfurt', 'galapagos', 'galway',
  'gdansk', 'geneva', 'ghana', 'ghent', 'glasgow', 'goa', 'gold-coast', 'gothenburg',
  'gran-canaria', 'granada', 'grand-canyon', 'graz', 'great-barrier-reef', 'grenada',
  'guadalajara', 'guadeloupe', 'guam', 'guanajuato', 'guilin', 'halifax', 'hamburg',
  'hanoi', 'hawaii', 'heidelberg', 'helsinki', 'hoi-an', 'hong-kong', 'houston',
  'hurghada', 'ibiza', 'iguazu-falls', 'indianapolis', 'innsbruck', 'israel',
  'jackson-hole', 'jaipur', 'jamaica', 'jasper', 'jeddah', 'jerusalem', 'johannesburg',
  'jordan', 'kansas-city', 'kathmandu', 'kefalonia', 'kelowna', 'kenya', 'key-west',
  'kochi', 'kotor', 'krakow', 'kruger', 'kuala-lumpur', 'kuwait', 'kyoto',
  'la-paz', 'lake-atitlan', 'lake-bled', 'lake-como', 'lake-district', 'lake-tahoe',
  'langkawi', 'lanzarote', 'lapland', 'las-vegas', 'leipzig', 'lille', 'lima',
  'limassol', 'lisbon', 'liverpool', 'ljubljana', 'lofoten', 'lombok', 'london',
  'los-angeles', 'luang-prabang', 'lucerne', 'luxembourg', 'luxor', 'lyon', 'madeira',
  'madrid', 'majorca', 'malaga', 'maldives', 'malmö', 'malta', 'manchester', 'manila',
  'manuel-antonio', 'marbella', 'marseille', 'martha-vineyard', 'martinique', 'maui',
  'mauritius', 'medellin', 'melbourne', 'memphis', 'mendoza', 'menorca', 'merida',
  'mexico-city', 'miami', 'milan', 'milford-sound', 'milwaukee', 'minneapolis',
  'moab', 'monaco', 'mont-saint-michel', 'monteverde', 'montevideo', 'montreal',
  'morocco', 'mostar', 'mumbai', 'munich', 'mykonos', 'namibia', 'nantes', 'nantucket',
  'napa-valley', 'naples', 'nashville', 'naxos', 'new-caledonia', 'new-orleans',
  'new-york', 'new-zealand', 'nha-trang', 'niagara-falls', 'nice', 'nuremberg',
  'oaxaca', 'oman', 'orlando', 'osaka', 'oslo', 'ottawa', 'oxford', 'palau', 'palawan',
  'palm-springs', 'panama', 'paphos', 'paris', 'park-city', 'paros', 'patagonia',
  'perth', 'peru', 'philadelphia', 'phoenix', 'phuket', 'pittsburgh', 'playa-del-carmen',
  'plovdiv', 'portland', 'portland-maine', 'porto', 'prague', 'prince-edward-island',
  'provence', 'puebla', 'puerto-madryn', 'puerto-rico', 'puerto-vallarta', 'puglia',
  'puno', 'punta-del-este', 'quebec-city', 'quito', 'raleigh', 'reunion', 'reykjavik',
  'rhodes', 'riga', 'rio', 'riyadh', 'roatan', 'rome', 'rotorua', 'rotterdam',
  'rwanda', 'sacred-valley', 'salar-de-uyuni', 'salt-lake-city', 'salta', 'salvador',
  'salzburg', 'samoa', 'san-antonio', 'san-diego', 'san-francisco', 'san-miguel',
  'san-sebastian', 'santa-barbara', 'santa-fe', 'santa-marta', 'santiago', 'santorini',
  'sao-paulo', 'sarajevo', 'sardinia', 'savannah', 'scottish-highlands', 'scottsdale',
  'seattle', 'sedona', 'senegal', 'seoul', 'seville', 'seychelles', 'shanghai',
  'sicily', 'siem-reap', 'singapore', 'sofia', 'sonoma', 'split', 'sri-lanka',
  'st-barts', 'st-johns', 'st-kitts', 'st-louis', 'st-lucia', 'stockholm', 'strasbourg',
  'stuttgart', 'swiss-alps', 'sydney', 'tahiti', 'taipei', 'tallinn', 'tamarindo',
  'tampa', 'tanzania', 'tasmania', 'tayrona', 'the-hague', 'thessaloniki', 'tirana',
  'todos-santos', 'tokyo', 'toledo', 'toronto', 'torres-del-paine', 'toulouse',
  'tromso', 'tucson', 'tulum', 'tunis', 'turin', 'turks-caicos', 'uganda', 'ushuaia',
  'vail', 'valencia', 'valparaiso', 'vancouver', 'vanuatu', 'venice', 'verona',
  'victoria-bc', 'victoria-falls', 'vienna', 'vietnam', 'vilnius', 'vina-del-mar',
  'virgin-islands', 'warsaw', 'washington-dc', 'wellington', 'whistler', 'wroclaw',
  'xian', 'yangon', 'yellowstone', 'yogyakarta', 'york', 'zagreb', 'zakynthos',
  'zanzibar', 'zermatt', 'zion', 'zurich',
];

export function hasRealPOIData(destinationId: string): boolean {
  return DESTINATIONS_WITH_POI_DATA.includes(destinationId.toLowerCase().replace(/\s+/g, '-'));
}
