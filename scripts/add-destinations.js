// Script to add missing destinations to reach 500 total
// These are popular tourism destinations not currently in the list

const newDestinations = [
  // ASIA - Major missing destinations
  // Japan
  { id: 'hiroshima', city: 'Hiroshima', country: 'Japan', airportCode: 'HIJ', region: 'asia', vibes: ['history', 'culture', 'city'], bestMonths: [3, 4, 5, 10, 11], averageCost: 2800, highlights: ['Peace Memorial Park', 'Itsukushima Shrine', 'Hiroshima Castle', 'Miyajima Island'], latitude: 34.3853, longitude: 132.4553 },
  { id: 'nara', city: 'Nara', country: 'Japan', airportCode: 'KIX', region: 'asia', vibes: ['culture', 'nature', 'history'], bestMonths: [3, 4, 5, 10, 11], averageCost: 2500, highlights: ['Todai-ji Temple', 'Nara Park deer', 'Kasuga Grand Shrine', 'Isuien Garden'], latitude: 34.6851, longitude: 135.8048 },
  { id: 'okinawa', city: 'Okinawa', country: 'Japan', airportCode: 'OKA', region: 'asia', vibes: ['beach', 'relaxation', 'culture', 'nature'], bestMonths: [4, 5, 6, 10, 11], averageCost: 3000, highlights: ['Shuri Castle', 'Kerama Islands', 'Churaumi Aquarium', 'Okinawan cuisine'], latitude: 26.2124, longitude: 127.6809 },
  { id: 'hakone', city: 'Hakone', country: 'Japan', airportCode: 'HND', region: 'asia', vibes: ['nature', 'relaxation', 'culture'], bestMonths: [4, 5, 10, 11], averageCost: 3200, highlights: ['Mount Fuji views', 'Hot springs', 'Open-Air Museum', 'Lake Ashi'], latitude: 35.2324, longitude: 139.1069 },
  { id: 'kanazawa', city: 'Kanazawa', country: 'Japan', airportCode: 'KMQ', region: 'asia', vibes: ['culture', 'history', 'food'], bestMonths: [4, 5, 10, 11], averageCost: 2600, highlights: ['Kenroku-en Garden', 'Geisha districts', 'Kanazawa Castle', 'Fresh seafood'], latitude: 36.5944, longitude: 136.6256 },
  { id: 'nagoya', city: 'Nagoya', country: 'Japan', airportCode: 'NGO', region: 'asia', vibes: ['city', 'culture', 'food'], bestMonths: [3, 4, 5, 10, 11], averageCost: 2400, highlights: ['Nagoya Castle', 'Toyota Museum', 'Atsuta Shrine', 'Hitsumabushi eel'], latitude: 35.1815, longitude: 136.9066 },

  // Thailand
  { id: 'krabi', city: 'Krabi', country: 'Thailand', airportCode: 'KBV', region: 'asia', vibes: ['beach', 'adventure', 'nature', 'relaxation'], bestMonths: [11, 12, 1, 2, 3, 4], averageCost: 1800, highlights: ['Railay Beach', 'Phi Phi Islands', 'Tiger Cave Temple', 'Rock climbing'], latitude: 8.0863, longitude: 98.9063 },
  { id: 'koh-samui', city: 'Koh Samui', country: 'Thailand', airportCode: 'USM', region: 'asia', vibes: ['beach', 'relaxation', 'nightlife', 'luxury'], bestMonths: [12, 1, 2, 3, 4], averageCost: 2200, highlights: ['Chaweng Beach', 'Big Buddha', 'Ang Thong Marine Park', 'Thai spas'], latitude: 9.5120, longitude: 100.0136 },
  { id: 'chiang-rai', city: 'Chiang Rai', country: 'Thailand', airportCode: 'CEI', region: 'asia', vibes: ['culture', 'nature', 'adventure'], bestMonths: [11, 12, 1, 2], averageCost: 1400, highlights: ['White Temple', 'Blue Temple', 'Golden Triangle', 'Hill tribe villages'], latitude: 19.9105, longitude: 99.8406 },
  { id: 'ayutthaya', city: 'Ayutthaya', country: 'Thailand', airportCode: 'BKK', region: 'asia', vibes: ['history', 'culture'], bestMonths: [11, 12, 1, 2], averageCost: 1200, highlights: ['Ancient ruins', 'Wat Mahathat', 'Ayutthaya Historical Park', 'Boat tours'], latitude: 14.3692, longitude: 100.5877 },

  // Vietnam
  { id: 'ho-chi-minh', city: 'Ho Chi Minh City', country: 'Vietnam', airportCode: 'SGN', region: 'asia', vibes: ['city', 'food', 'history', 'nightlife'], bestMonths: [12, 1, 2, 3, 4], averageCost: 1500, highlights: ['Cu Chi Tunnels', 'War Remnants Museum', 'Ben Thanh Market', 'Street food'], latitude: 10.8231, longitude: 106.6297 },
  { id: 'hue', city: 'Hue', country: 'Vietnam', airportCode: 'HUI', region: 'asia', vibes: ['history', 'culture', 'food'], bestMonths: [1, 2, 3, 4], averageCost: 1200, highlights: ['Imperial City', 'Royal Tombs', 'Perfume River', 'Hue cuisine'], latitude: 16.4637, longitude: 107.5909 },
  { id: 'sa-pa', city: 'Sa Pa', country: 'Vietnam', airportCode: 'HAN', region: 'asia', vibes: ['nature', 'adventure', 'culture'], bestMonths: [3, 4, 5, 9, 10], averageCost: 1100, highlights: ['Rice terraces', 'Fansipan Peak', 'Hill tribes', 'Trekking'], latitude: 22.3364, longitude: 103.8438 },
  { id: 'ha-long-bay', city: 'Ha Long Bay', country: 'Vietnam', airportCode: 'VDO', region: 'asia', vibes: ['nature', 'adventure', 'relaxation'], bestMonths: [3, 4, 5, 9, 10, 11], averageCost: 1400, highlights: ['Limestone karsts', 'Cruise boats', 'Kayaking', 'Sung Sot Cave'], latitude: 20.9101, longitude: 107.1839 },

  // Indonesia
  { id: 'jakarta', city: 'Jakarta', country: 'Indonesia', airportCode: 'CGK', region: 'asia', vibes: ['city', 'food', 'culture'], bestMonths: [5, 6, 7, 8, 9], averageCost: 1600, highlights: ['Old Town', 'National Monument', 'Thousand Islands', 'Indonesian cuisine'], latitude: -6.2088, longitude: 106.8456 },
  { id: 'komodo', city: 'Komodo', country: 'Indonesia', airportCode: 'LBJ', region: 'asia', vibes: ['nature', 'adventure', 'beach'], bestMonths: [4, 5, 6, 7, 8, 9], averageCost: 2000, highlights: ['Komodo dragons', 'Pink Beach', 'Padar Island', 'Diving'], latitude: -8.5500, longitude: 119.4833 },
  { id: 'raja-ampat', city: 'Raja Ampat', country: 'Indonesia', airportCode: 'SOQ', region: 'asia', vibes: ['nature', 'adventure', 'beach', 'relaxation'], bestMonths: [10, 11, 12, 1, 2, 3, 4], averageCost: 3500, highlights: ['World-class diving', 'Marine biodiversity', 'Wayag Islands', 'Remote paradise'], latitude: -0.5000, longitude: 130.5000 },

  // Philippines
  { id: 'cebu', city: 'Cebu', country: 'Philippines', airportCode: 'CEB', region: 'asia', vibes: ['beach', 'adventure', 'city', 'history'], bestMonths: [1, 2, 3, 4, 5], averageCost: 1600, highlights: ['Whale sharks', 'Kawasan Falls', 'Historical sites', 'Island hopping'], latitude: 10.3157, longitude: 123.8854 },
  { id: 'siargao', city: 'Siargao', country: 'Philippines', airportCode: 'IAO', region: 'asia', vibes: ['beach', 'adventure', 'relaxation', 'nature'], bestMonths: [3, 4, 5, 9, 10, 11], averageCost: 1400, highlights: ['Cloud 9 surfing', 'Island hopping', 'Sugba Lagoon', 'Laid-back vibes'], latitude: 9.8500, longitude: 126.0500 },
  { id: 'el-nido', city: 'El Nido', country: 'Philippines', airportCode: 'USU', region: 'asia', vibes: ['beach', 'nature', 'adventure', 'relaxation'], bestMonths: [11, 12, 1, 2, 3, 4, 5], averageCost: 1800, highlights: ['Big Lagoon', 'Island hopping', 'Limestone cliffs', 'Hidden beaches'], latitude: 11.1955, longitude: 119.4090 },

  // Malaysia
  { id: 'penang', city: 'Penang', country: 'Malaysia', airportCode: 'PEN', region: 'asia', vibes: ['food', 'culture', 'city', 'beach'], bestMonths: [12, 1, 2], averageCost: 1400, highlights: ['George Town', 'Street art', 'Penang food', 'Kek Lok Si Temple'], latitude: 5.4164, longitude: 100.3327 },
  { id: 'melaka', city: 'Melaka', country: 'Malaysia', airportCode: 'KUL', region: 'asia', vibes: ['history', 'culture', 'food'], bestMonths: [1, 2, 6, 7, 8], averageCost: 1200, highlights: ['Dutch Square', 'Jonker Street', 'A Famosa', 'Peranakan heritage'], latitude: 2.1896, longitude: 102.2501 },
  { id: 'borneo', city: 'Kota Kinabalu', country: 'Malaysia', airportCode: 'BKI', region: 'asia', vibes: ['nature', 'adventure', 'wildlife'], bestMonths: [1, 2, 3, 4, 5], averageCost: 1800, highlights: ['Mount Kinabalu', 'Orangutans', 'Sipadan diving', 'Rainforest'], latitude: 5.9804, longitude: 116.0735 },

  // India
  { id: 'udaipur', city: 'Udaipur', country: 'India', airportCode: 'UDR', region: 'asia', vibes: ['romance', 'culture', 'history', 'luxury'], bestMonths: [10, 11, 12, 1, 2, 3], averageCost: 1400, highlights: ['Lake Palace', 'City Palace', 'Lake Pichola', 'Romantic sunsets'], latitude: 24.5854, longitude: 73.7125 },
  { id: 'varanasi', city: 'Varanasi', country: 'India', airportCode: 'VNS', region: 'asia', vibes: ['culture', 'spirituality', 'history'], bestMonths: [10, 11, 12, 2, 3], averageCost: 1000, highlights: ['Ganges ghats', 'Evening aarti', 'Ancient temples', 'Spiritual experience'], latitude: 25.3176, longitude: 82.9739 },
  { id: 'kerala', city: 'Kochi', country: 'India', airportCode: 'COK', region: 'asia', vibes: ['nature', 'relaxation', 'culture', 'food'], bestMonths: [10, 11, 12, 1, 2], averageCost: 1200, highlights: ['Backwaters', 'Ayurveda', 'Fort Kochi', 'Tea plantations'], latitude: 9.9312, longitude: 76.2673 },
  { id: 'rishikesh', city: 'Rishikesh', country: 'India', airportCode: 'DED', region: 'asia', vibes: ['spirituality', 'adventure', 'nature', 'relaxation'], bestMonths: [2, 3, 4, 5, 9, 10, 11], averageCost: 900, highlights: ['Yoga capital', 'Ganges rafting', 'Beatles Ashram', 'Laxman Jhula'], latitude: 30.0869, longitude: 78.2676 },
  { id: 'amritsar', city: 'Amritsar', country: 'India', airportCode: 'ATQ', region: 'asia', vibes: ['spirituality', 'culture', 'history', 'food'], bestMonths: [10, 11, 2, 3], averageCost: 800, highlights: ['Golden Temple', 'Wagah Border', 'Jallianwala Bagh', 'Punjabi food'], latitude: 31.6340, longitude: 74.8723 },

  // China
  { id: 'chengdu', city: 'Chengdu', country: 'China', airportCode: 'CTU', region: 'asia', vibes: ['culture', 'food', 'nature', 'city'], bestMonths: [3, 4, 5, 9, 10], averageCost: 1600, highlights: ['Giant pandas', 'Sichuan cuisine', 'Leshan Buddha', 'Teahouses'], latitude: 30.5728, longitude: 104.0668 },
  { id: 'hangzhou', city: 'Hangzhou', country: 'China', airportCode: 'HGH', region: 'asia', vibes: ['nature', 'culture', 'relaxation'], bestMonths: [3, 4, 5, 9, 10, 11], averageCost: 1500, highlights: ['West Lake', 'Tea plantations', 'Lingyin Temple', 'Ancient water towns'], latitude: 30.2741, longitude: 120.1551 },
  { id: 'suzhou', city: 'Suzhou', country: 'China', airportCode: 'PVG', region: 'asia', vibes: ['culture', 'history', 'relaxation'], bestMonths: [3, 4, 5, 9, 10], averageCost: 1400, highlights: ['Classical gardens', 'Silk production', 'Canals', 'Tiger Hill'], latitude: 31.2989, longitude: 120.5853 },
  { id: 'zhangjiajie', city: 'Zhangjiajie', country: 'China', airportCode: 'DYG', region: 'asia', vibes: ['nature', 'adventure'], bestMonths: [4, 5, 9, 10], averageCost: 1300, highlights: ['Avatar Mountains', 'Glass bridge', 'Tianmen Mountain', 'National Forest Park'], latitude: 29.1169, longitude: 110.4794 },
  { id: 'lijiang', city: 'Lijiang', country: 'China', airportCode: 'LJG', region: 'asia', vibes: ['culture', 'nature', 'history', 'romance'], bestMonths: [3, 4, 5, 9, 10], averageCost: 1200, highlights: ['Old Town', 'Jade Dragon Snow Mountain', 'Naxi culture', 'Tiger Leaping Gorge'], latitude: 26.8722, longitude: 100.2259 },

  // South Korea
  { id: 'jeju', city: 'Jeju', country: 'South Korea', airportCode: 'CJU', region: 'asia', vibes: ['nature', 'beach', 'relaxation', 'adventure'], bestMonths: [4, 5, 6, 9, 10], averageCost: 1800, highlights: ['Hallasan', 'Lava tubes', 'Beaches', 'Haenyeo divers'], latitude: 33.4996, longitude: 126.5312 },

  // Taiwan
  { id: 'kaohsiung', city: 'Kaohsiung', country: 'Taiwan', airportCode: 'KHH', region: 'asia', vibes: ['city', 'culture', 'food'], bestMonths: [10, 11, 12, 1, 2, 3, 4], averageCost: 1400, highlights: ['Lotus Pond', 'Pier-2 Art Center', 'Night markets', 'Cijin Island'], latitude: 22.6273, longitude: 120.3014 },

  // Nepal
  { id: 'pokhara', city: 'Pokhara', country: 'Nepal', airportCode: 'PKR', region: 'asia', vibes: ['nature', 'adventure', 'relaxation'], bestMonths: [10, 11, 3, 4], averageCost: 900, highlights: ['Phewa Lake', 'Annapurna views', 'Paragliding', 'Trekking base'], latitude: 28.2096, longitude: 83.9856 },

  // Sri Lanka
  { id: 'colombo', city: 'Colombo', country: 'Sri Lanka', airportCode: 'CMB', region: 'asia', vibes: ['city', 'culture', 'food'], bestMonths: [1, 2, 3, 4], averageCost: 1200, highlights: ['Galle Face', 'Gangaramaya Temple', 'Pettah Market', 'Colonial architecture'], latitude: 6.9271, longitude: 79.8612 },
  { id: 'kandy', city: 'Kandy', country: 'Sri Lanka', airportCode: 'CMB', region: 'asia', vibes: ['culture', 'nature', 'spirituality'], bestMonths: [1, 2, 3, 4], averageCost: 1100, highlights: ['Temple of Tooth', 'Kandy Lake', 'Royal Botanic Gardens', 'Cultural shows'], latitude: 7.2906, longitude: 80.6337 },
  { id: 'galle', city: 'Galle', country: 'Sri Lanka', airportCode: 'CMB', region: 'asia', vibes: ['history', 'beach', 'culture'], bestMonths: [12, 1, 2, 3, 4], averageCost: 1300, highlights: ['Galle Fort', 'Dutch architecture', 'Beaches', 'Whale watching'], latitude: 6.0535, longitude: 80.2210 },
  { id: 'ella', city: 'Ella', country: 'Sri Lanka', airportCode: 'CMB', region: 'asia', vibes: ['nature', 'adventure', 'relaxation'], bestMonths: [1, 2, 3, 4], averageCost: 900, highlights: ['Nine Arch Bridge', 'Ella Rock', 'Tea country', 'Train journeys'], latitude: 6.8667, longitude: 81.0466 },

  // AFRICA - Missing major destinations
  { id: 'marrakech', city: 'Marrakech', country: 'Morocco', airportCode: 'RAK', region: 'africa', vibes: ['culture', 'food', 'shopping', 'history'], bestMonths: [3, 4, 5, 10, 11], averageCost: 1600, highlights: ['Jemaa el-Fnaa', 'Majorelle Garden', 'Medina souks', 'Riads'], latitude: 31.6295, longitude: -7.9811 },
  { id: 'casablanca', city: 'Casablanca', country: 'Morocco', airportCode: 'CMN', region: 'africa', vibes: ['city', 'culture', 'history'], bestMonths: [3, 4, 5, 9, 10, 11], averageCost: 1400, highlights: ['Hassan II Mosque', 'Old Medina', 'Corniche', 'Art Deco architecture'], latitude: 33.5731, longitude: -7.5898 },
  { id: 'nairobi', city: 'Nairobi', country: 'Kenya', airportCode: 'NBO', region: 'africa', vibes: ['wildlife', 'nature', 'city', 'adventure'], bestMonths: [1, 2, 6, 7, 8, 9], averageCost: 2200, highlights: ['Nairobi National Park', 'Elephant orphanage', 'Giraffe Centre', 'Safari gateway'], latitude: -1.2921, longitude: 36.8219 },
  { id: 'masai-mara', city: 'Masai Mara', country: 'Kenya', airportCode: 'NBO', region: 'africa', vibes: ['wildlife', 'nature', 'adventure', 'luxury'], bestMonths: [7, 8, 9, 10], averageCost: 4500, highlights: ['Great Migration', 'Big Five', 'Hot air balloons', 'Maasai culture'], latitude: -1.4833, longitude: 35.0167 },
  { id: 'serengeti', city: 'Serengeti', country: 'Tanzania', airportCode: 'JRO', region: 'africa', vibes: ['wildlife', 'nature', 'adventure', 'luxury'], bestMonths: [6, 7, 8, 9, 1, 2], averageCost: 4500, highlights: ['Great Migration', 'Big Five', 'Endless plains', 'Safari lodges'], latitude: -2.3333, longitude: 34.8333 },
  { id: 'kilimanjaro', city: 'Kilimanjaro', country: 'Tanzania', airportCode: 'JRO', region: 'africa', vibes: ['adventure', 'nature'], bestMonths: [1, 2, 7, 8, 9], averageCost: 3500, highlights: ['Summit Africa\'s highest peak', 'Trekking routes', 'Unique ecosystems', 'Achievement of a lifetime'], latitude: -3.0674, longitude: 37.3556 },
  { id: 'durban', city: 'Durban', country: 'South Africa', airportCode: 'DUR', region: 'africa', vibes: ['beach', 'city', 'culture', 'food'], bestMonths: [4, 5, 9, 10], averageCost: 1400, highlights: ['Golden Mile', 'uShaka Marine World', 'Indian cuisine', 'Zulu culture'], latitude: -29.8587, longitude: 31.0218 },
  { id: 'lagos', city: 'Lagos', country: 'Nigeria', airportCode: 'LOS', region: 'africa', vibes: ['city', 'nightlife', 'culture', 'food'], bestMonths: [11, 12, 1, 2, 3], averageCost: 1800, highlights: ['Lekki', 'Lagos Island', 'Afrobeats scene', 'Nigerian cuisine'], latitude: 6.5244, longitude: 3.3792 },
  { id: 'dakar', city: 'Dakar', country: 'Senegal', airportCode: 'DSS', region: 'africa', vibes: ['culture', 'beach', 'city', 'food'], bestMonths: [11, 12, 1, 2, 3, 4, 5], averageCost: 1500, highlights: ['Goree Island', 'African Renaissance Monument', 'Surfing', 'Senegalese cuisine'], latitude: 14.7167, longitude: -17.4677 },

  // MIDDLE EAST - Additional
  { id: 'muscat', city: 'Muscat', country: 'Oman', airportCode: 'MCT', region: 'middle_east', vibes: ['culture', 'nature', 'history', 'beach'], bestMonths: [10, 11, 12, 1, 2, 3], averageCost: 2200, highlights: ['Sultan Qaboos Grand Mosque', 'Old Muscat', 'Wadis', 'Coastal beauty'], latitude: 23.5880, longitude: 58.3829 },
  { id: 'salalah', city: 'Salalah', country: 'Oman', airportCode: 'SLL', region: 'middle_east', vibes: ['nature', 'culture', 'beach'], bestMonths: [6, 7, 8, 9, 10], averageCost: 1800, highlights: ['Khareef monsoon', 'Frankincense', 'Beaches', 'Green mountains'], latitude: 17.0151, longitude: 54.0924 },

  // EUROPE - A few more popular ones
  { id: 'bergamo', city: 'Bergamo', country: 'Italy', airportCode: 'BGY', region: 'europe', vibes: ['culture', 'history', 'food'], bestMonths: [4, 5, 6, 9, 10], averageCost: 1800, highlights: ['Città Alta', 'Venetian walls', 'Lombardy cuisine', 'Day trips to Milan'], latitude: 45.6983, longitude: 9.6773 },
  { id: 'catania', city: 'Catania', country: 'Italy', airportCode: 'CTA', region: 'europe', vibes: ['culture', 'food', 'nature', 'beach'], bestMonths: [4, 5, 6, 9, 10], averageCost: 1600, highlights: ['Mount Etna', 'Baroque architecture', 'Fish market', 'Sicilian cuisine'], latitude: 37.5079, longitude: 15.0830 },
  { id: 'biarritz', city: 'Biarritz', country: 'France', airportCode: 'BIQ', region: 'europe', vibes: ['beach', 'food', 'relaxation', 'adventure'], bestMonths: [6, 7, 8, 9], averageCost: 2400, highlights: ['Surfing', 'Grande Plage', 'Basque cuisine', 'Elegant architecture'], latitude: 43.4832, longitude: -1.5586 },
  { id: 'san-remo', city: 'San Remo', country: 'Italy', airportCode: 'NCE', region: 'europe', vibes: ['beach', 'relaxation', 'food'], bestMonths: [5, 6, 9, 10], averageCost: 2000, highlights: ['Italian Riviera', 'Casino', 'Old town', 'Music festival'], latitude: 43.8159, longitude: 7.7764 },
  { id: 'algarve', city: 'Algarve', country: 'Portugal', airportCode: 'FAO', region: 'europe', vibes: ['beach', 'relaxation', 'golf', 'food'], bestMonths: [5, 6, 7, 8, 9, 10], averageCost: 1800, highlights: ['Stunning cliffs', 'Golden beaches', 'Golf courses', 'Seafood'], latitude: 37.0179, longitude: -7.9304 },
  { id: 'sintra', city: 'Sintra', country: 'Portugal', airportCode: 'LIS', region: 'europe', vibes: ['history', 'culture', 'nature', 'romance'], bestMonths: [4, 5, 6, 9, 10], averageCost: 1600, highlights: ['Pena Palace', 'Quinta da Regaleira', 'Moorish Castle', 'Magical forests'], latitude: 38.7980, longitude: -9.3880 },
  { id: 'faro', city: 'Faro', country: 'Portugal', airportCode: 'FAO', region: 'europe', vibes: ['culture', 'beach', 'nature'], bestMonths: [5, 6, 7, 8, 9, 10], averageCost: 1400, highlights: ['Ria Formosa', 'Old Town', 'Island beaches', 'Algarve gateway'], latitude: 37.0194, longitude: -7.9322 },
  { id: 'lake-garda', city: 'Lake Garda', country: 'Italy', airportCode: 'VRN', region: 'europe', vibes: ['nature', 'relaxation', 'food', 'romance'], bestMonths: [5, 6, 7, 8, 9], averageCost: 2200, highlights: ['Lakeside towns', 'Sirmione', 'Wine country', 'Water sports'], latitude: 45.6500, longitude: 10.6833 },
  { id: 'rovinj', city: 'Rovinj', country: 'Croatia', airportCode: 'PUY', region: 'europe', vibes: ['beach', 'culture', 'romance', 'food'], bestMonths: [5, 6, 7, 8, 9], averageCost: 1800, highlights: ['Old Town', 'Adriatic beaches', 'Truffle cuisine', 'Island hopping'], latitude: 45.0812, longitude: 13.6387 },
  { id: 'hvar', city: 'Hvar', country: 'Croatia', airportCode: 'SPU', region: 'europe', vibes: ['beach', 'nightlife', 'relaxation', 'luxury'], bestMonths: [6, 7, 8, 9], averageCost: 2400, highlights: ['Party island', 'Lavender fields', 'Beaches', 'Historic town'], latitude: 43.1729, longitude: 16.4411 },

  // AMERICAS - More comprehensive
  { id: 'cusco', city: 'Cusco', country: 'Peru', airportCode: 'CUZ', region: 'americas', vibes: ['history', 'culture', 'adventure'], bestMonths: [4, 5, 9, 10], averageCost: 1800, highlights: ['Machu Picchu', 'Inca history', 'Plaza de Armas', 'Altitude!'], latitude: -13.5320, longitude: -71.9675 },
  { id: 'puerto-escondido', city: 'Puerto Escondido', country: 'Mexico', airportCode: 'PXM', region: 'americas', vibes: ['beach', 'adventure', 'relaxation', 'nature'], bestMonths: [11, 12, 1, 2, 3, 4], averageCost: 1400, highlights: ['World-class surfing', 'Zicatela Beach', 'Bioluminescence', 'Laid-back vibes'], latitude: 15.8720, longitude: -97.0767 },
  { id: 'sayulita', city: 'Sayulita', country: 'Mexico', airportCode: 'PVR', region: 'americas', vibes: ['beach', 'adventure', 'relaxation', 'food'], bestMonths: [11, 12, 1, 2, 3, 4], averageCost: 1600, highlights: ['Surfing', 'Beach town vibes', 'Mexican cuisine', 'Art galleries'], latitude: 20.8694, longitude: -105.4406 },
  { id: 'lake-louise', city: 'Lake Louise', country: 'Canada', airportCode: 'YYC', region: 'americas', vibes: ['nature', 'adventure', 'relaxation', 'luxury'], bestMonths: [6, 7, 8, 9, 12, 1, 2], averageCost: 3500, highlights: ['Turquoise lake', 'Rockies', 'Skiing', 'Hiking'], latitude: 51.4254, longitude: -116.1773 },
  { id: 'carmel-valley', city: 'Carmel-by-the-Sea', country: 'United States', airportCode: 'MRY', region: 'americas', vibes: ['relaxation', 'nature', 'food', 'romance'], bestMonths: [4, 5, 6, 9, 10], averageCost: 3000, highlights: ['Fairy-tale village', '17-Mile Drive', 'Wine tasting', 'Big Sur nearby'], latitude: 36.5552, longitude: -121.9233 },

  // OCEANIA - More Pacific islands
  { id: 'queenstown-nz', city: 'Queenstown', country: 'New Zealand', airportCode: 'ZQN', region: 'oceania', vibes: ['adventure', 'nature', 'luxury'], bestMonths: [12, 1, 2, 3, 6, 7, 8], averageCost: 3500, highlights: ['Bungee jumping', 'Skiing', 'Milford Sound', 'Adventure capital'], latitude: -45.0312, longitude: 168.6626 },
  { id: 'byron-bay', city: 'Byron Bay', country: 'Australia', airportCode: 'BNE', region: 'oceania', vibes: ['beach', 'relaxation', 'nature', 'wellness'], bestMonths: [3, 4, 5, 9, 10, 11], averageCost: 2200, highlights: ['Lighthouse', 'Surfing', 'Markets', 'Bohemian vibes'], latitude: -28.6474, longitude: 153.6020 },
  { id: 'cairns', city: 'Cairns', country: 'Australia', airportCode: 'CNS', region: 'oceania', vibes: ['nature', 'adventure', 'beach'], bestMonths: [5, 6, 7, 8, 9, 10], averageCost: 2400, highlights: ['Great Barrier Reef', 'Daintree Rainforest', 'Diving', 'Tropical gateway'], latitude: -16.9186, longitude: 145.7781 },
  { id: 'adelaide', city: 'Adelaide', country: 'Australia', airportCode: 'ADL', region: 'oceania', vibes: ['food', 'wine', 'culture', 'nature'], bestMonths: [3, 4, 5, 9, 10, 11], averageCost: 2000, highlights: ['Barossa Valley', 'Central Market', 'Kangaroo Island', 'Festival city'], latitude: -34.9285, longitude: 138.6007 },
  { id: 'rarotonga', city: 'Rarotonga', country: 'Cook Islands', airportCode: 'RAR', region: 'oceania', vibes: ['beach', 'relaxation', 'nature'], bestMonths: [4, 5, 6, 7, 8, 9, 10], averageCost: 2800, highlights: ['Lagoon', 'Cross-island trek', 'Polynesian culture', 'Snorkeling'], latitude: -21.2367, longitude: -159.7777 },

  // CARIBBEAN - A few more
  { id: 'bermuda', city: 'Bermuda', country: 'Bermuda', airportCode: 'BDA', region: 'caribbean', vibes: ['beach', 'relaxation', 'luxury', 'golf'], bestMonths: [5, 6, 7, 8, 9, 10], averageCost: 4000, highlights: ['Pink sand beaches', 'Crystal caves', 'Golf', 'British charm'], latitude: 32.3078, longitude: -64.7505 },
  { id: 'trinidad', city: 'Port of Spain', country: 'Trinidad and Tobago', airportCode: 'POS', region: 'caribbean', vibes: ['culture', 'food', 'nightlife', 'nature'], bestMonths: [1, 2, 3, 4], averageCost: 1800, highlights: ['Carnival', 'Street food', 'Birdwatching', 'Doubles'], latitude: 10.6918, longitude: -61.2225 },
  { id: 'anguilla', city: 'Anguilla', country: 'Anguilla', airportCode: 'AXA', region: 'caribbean', vibes: ['beach', 'luxury', 'relaxation'], bestMonths: [12, 1, 2, 3, 4], averageCost: 5000, highlights: ['Shoal Bay', 'Luxury resorts', 'Caribbean food', '33 beaches'], latitude: 18.2206, longitude: -63.0686 },

  // 3 more to hit 500
  { id: 'colmar', city: 'Colmar', country: 'France', airportCode: 'BSL', region: 'europe', vibes: ['culture', 'romance', 'food', 'history'], bestMonths: [4, 5, 6, 9, 10, 12], averageCost: 1800, highlights: ['Little Venice', 'Half-timbered houses', 'Alsatian wine', 'Christmas markets'], latitude: 48.0794, longitude: 7.3558 },
  { id: 'ubud', city: 'Ubud', country: 'Indonesia', airportCode: 'DPS', region: 'asia', vibes: ['culture', 'spirituality', 'nature', 'relaxation'], bestMonths: [4, 5, 6, 7, 8, 9], averageCost: 1600, highlights: ['Tegallalang rice terraces', 'Monkey Forest', 'Yoga retreats', 'Art galleries'], latitude: -8.5069, longitude: 115.2625 },
  { id: 'phi-phi', city: 'Phi Phi Islands', country: 'Thailand', airportCode: 'HKT', region: 'asia', vibes: ['beach', 'adventure', 'nightlife', 'nature'], bestMonths: [11, 12, 1, 2, 3, 4], averageCost: 1500, highlights: ['Maya Bay', 'Snorkeling', 'Island life', 'Party scene'], latitude: 7.7407, longitude: 98.7784 },
];

// Output as TypeScript format
console.log('// ============================================');
console.log('// NEW DESTINATIONS - Add these to destinations.ts');
console.log('// ============================================');

for (const d of newDestinations) {
  console.log(`  {`);
  console.log(`    id: '${d.id}',`);
  console.log(`    city: '${d.city}',`);
  console.log(`    country: '${d.country}',`);
  console.log(`    airportCode: '${d.airportCode}',`);
  console.log(`    region: '${d.region}',`);
  console.log(`    vibes: [${d.vibes.map(v => `'${v}'`).join(', ')}],`);
  console.log(`    bestMonths: [${d.bestMonths.join(', ')}],`);
  console.log(`    averageCost: ${d.averageCost},`);
  console.log(`    highlights: [${d.highlights.map(h => `'${h}'`).join(', ')}],`);
  console.log(`    imageUrl: 'https://images.unsplash.com/photo-placeholder?w=800',`);
  console.log(`    latitude: ${d.latitude},`);
  console.log(`    longitude: ${d.longitude},`);
  console.log(`  },`);
}

console.log(`\n// Total new destinations: ${newDestinations.length}`);
console.log(`// New total will be: 423 + ${newDestinations.length} = ${423 + newDestinations.length}`);
