import type { DestinationImage } from '@/types/flash';

// Curated images for destinations - 5-10 images per destination showing major attractions
// These are Unsplash URLs for now; Phase 3 will batch download to static storage

export const DESTINATION_IMAGES: Record<string, DestinationImage[]> = {
  // PARIS - France
  paris: [
    { url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', caption: 'Eiffel Tower at sunset' },
    { url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', caption: 'Louvre Museum pyramid' },
    { url: 'https://images.unsplash.com/photo-1503917988258-f87a78e3c995?w=800', caption: 'Seine River view' },
    { url: 'https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?w=800', caption: 'Arc de Triomphe' },
    { url: 'https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?w=800', caption: 'Sacré-Cœur Basilica' },
    { url: 'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=800', caption: 'Champs-Élysées' },
    { url: 'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=800', caption: 'Notre-Dame Cathedral' },
  ],

  // ROME - Italy
  rome: [
    { url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', caption: 'Colosseum exterior' },
    { url: 'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800', caption: 'Trevi Fountain' },
    { url: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800', caption: 'Vatican City' },
    { url: 'https://images.unsplash.com/photo-1555992828-ca4dbe41d294?w=800', caption: 'Roman Forum' },
    { url: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800', caption: 'Spanish Steps' },
    { url: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800', caption: 'Pantheon' },
    { url: 'https://images.unsplash.com/photo-1569587112025-0d460e81a126?w=800', caption: 'Piazza Navona' },
  ],

  // BARCELONA - Spain
  barcelona: [
    { url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800', caption: 'La Sagrada Familia' },
    { url: 'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=800', caption: 'Park Güell mosaics' },
    { url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800', caption: 'Gothic Quarter streets' },
    { url: 'https://images.unsplash.com/photo-1464790719320-516ecd75af6c?w=800', caption: 'Barceloneta Beach' },
    { url: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800', caption: 'Casa Batlló' },
    { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', caption: 'La Rambla' },
  ],

  // AMSTERDAM - Netherlands
  amsterdam: [
    { url: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800', caption: 'Canal houses' },
    { url: 'https://images.unsplash.com/photo-1576924542622-772281b13aa8?w=800', caption: 'Rijksmuseum' },
    { url: 'https://images.unsplash.com/photo-1558618047-f4b511986f01?w=800', caption: 'Anne Frank House area' },
    { url: 'https://images.unsplash.com/photo-1605101100278-5d1deb2b6498?w=800', caption: 'Vondelpark' },
    { url: 'https://images.unsplash.com/photo-1512470876337-d62d6760e0c1?w=800', caption: 'Floating flower market' },
    { url: 'https://images.unsplash.com/photo-1459679749680-18eb1eb37418?w=800', caption: 'Bike along canals' },
  ],

  // LISBON - Portugal
  lisbon: [
    { url: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800', caption: 'Lisbon tram 28' },
    { url: 'https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=800', caption: 'Belém Tower' },
    { url: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800', caption: 'Alfama district' },
    { url: 'https://images.unsplash.com/photo-1573797397290-69f0a8372be7?w=800', caption: 'Praça do Comércio' },
    { url: 'https://images.unsplash.com/photo-1497993205521-a027c5f8c44e?w=800', caption: 'Jerónimos Monastery' },
    { url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800', caption: 'Miradouro viewpoint' },
  ],

  // LONDON - United Kingdom
  london: [
    { url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', caption: 'Tower Bridge' },
    { url: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800', caption: 'Big Ben & Parliament' },
    { url: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800', caption: 'Buckingham Palace' },
    { url: 'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=800', caption: 'London Eye' },
    { url: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800', caption: 'British Museum' },
    { url: 'https://images.unsplash.com/photo-1543832923-44667a44c860?w=800', caption: 'St. Paul\'s Cathedral' },
    { url: 'https://images.unsplash.com/photo-1520986606214-8b456906c813?w=800', caption: 'Covent Garden' },
  ],

  // SANTORINI - Greece
  santorini: [
    { url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800', caption: 'Oia blue domes' },
    { url: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800', caption: 'Santorini sunset' },
    { url: 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=800', caption: 'Caldera view' },
    { url: 'https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=800', caption: 'White-washed streets' },
    { url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800', caption: 'Red Beach' },
    { url: 'https://images.unsplash.com/photo-1580502304784-8985b7eb7260?w=800', caption: 'Fira town' },
  ],

  // PRAGUE - Czech Republic
  prague: [
    { url: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800', caption: 'Prague Castle' },
    { url: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800', caption: 'Charles Bridge' },
    { url: 'https://images.unsplash.com/photo-1458150945447-7fb764c11a92?w=800', caption: 'Old Town Square' },
    { url: 'https://images.unsplash.com/photo-1562624475-96c2bc08fab9?w=800', caption: 'Astronomical Clock' },
    { url: 'https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=800', caption: 'Dancing House' },
    { url: 'https://images.unsplash.com/photo-1574949054903-6587a75c3b0f?w=800', caption: 'Vltava River view' },
  ],

  // DUBROVNIK - Croatia
  dubrovnik: [
    { url: 'https://images.unsplash.com/photo-1555990538-1e6c2f3d8a2e?w=800', caption: 'Old Town walls' },
    { url: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800', caption: 'Stradun main street' },
    { url: 'https://images.unsplash.com/photo-1565624417207-f51d6a3fbbd3?w=800', caption: 'Adriatic coastline' },
    { url: 'https://images.unsplash.com/photo-1591984050851-a85e7b7373b0?w=800', caption: 'Fort Lovrijenac' },
    { url: 'https://images.unsplash.com/photo-1559590215-2d06f75c9ba9?w=800', caption: 'Cable car view' },
  ],

  // REYKJAVIK - Iceland
  reykjavik: [
    { url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800', caption: 'Northern Lights' },
    { url: 'https://images.unsplash.com/photo-1520769945061-0a448c463865?w=800', caption: 'Blue Lagoon' },
    { url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800', caption: 'Hallgrímskirkja church' },
    { url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800', caption: 'Gullfoss waterfall' },
    { url: 'https://images.unsplash.com/photo-1504284440814-0a2f67e1c4ef?w=800', caption: 'Geysir eruption' },
    { url: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=800', caption: 'Glacier lagoon' },
  ],

  // NEW YORK CITY - USA
  'new-york-city': [
    { url: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800', caption: 'Manhattan skyline' },
    { url: 'https://images.unsplash.com/photo-1492666673288-3c4b4576ad9a?w=800', caption: 'Times Square' },
    { url: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800', caption: 'Statue of Liberty' },
    { url: 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800', caption: 'Central Park' },
    { url: 'https://images.unsplash.com/photo-1522083165195-3424ed129620?w=800', caption: 'Brooklyn Bridge' },
    { url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800', caption: 'Empire State Building' },
    { url: 'https://images.unsplash.com/photo-1560426592-0db5c2ade14f?w=800', caption: 'Grand Central Terminal' },
  ],

  // LOS ANGELES - USA
  'los-angeles': [
    { url: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800', caption: 'Hollywood sign' },
    { url: 'https://images.unsplash.com/photo-1515896769750-31548aa180ed?w=800', caption: 'Santa Monica Pier' },
    { url: 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=800', caption: 'Venice Beach' },
    { url: 'https://images.unsplash.com/photo-1544413660-299165566b1d?w=800', caption: 'Griffith Observatory' },
    { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', caption: 'Downtown LA skyline' },
    { url: 'https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=800', caption: 'Beverly Hills' },
  ],

  // TOKYO - Japan
  tokyo: [
    { url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', caption: 'Tokyo Tower at night' },
    { url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800', caption: 'Shibuya Crossing' },
    { url: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800', caption: 'Senso-ji Temple' },
    { url: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800', caption: 'Cherry blossoms' },
    { url: 'https://images.unsplash.com/photo-1549693578-d683be217e58?w=800', caption: 'Shinjuku neon lights' },
    { url: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800', caption: 'Mt. Fuji view' },
  ],

  // SYDNEY - Australia
  sydney: [
    { url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800', caption: 'Opera House & Harbour Bridge' },
    { url: 'https://images.unsplash.com/photo-1524820197278-540916411e20?w=800', caption: 'Bondi Beach' },
    { url: 'https://images.unsplash.com/photo-1523428096881-5bd79d043006?w=800', caption: 'Harbour Bridge climb' },
    { url: 'https://images.unsplash.com/photo-1506374322094-6021fc3926f1?w=800', caption: 'Sydney skyline' },
    { url: 'https://images.unsplash.com/photo-1546268060-2592ff93ee24?w=800', caption: 'The Rocks district' },
  ],

  // BALI - Indonesia
  bali: [
    { url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', caption: 'Tegallalang rice terraces' },
    { url: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800', caption: 'Tanah Lot temple' },
    { url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800', caption: 'Ubud monkey forest' },
    { url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800', caption: 'Beachfront sunset' },
    { url: 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800', caption: 'Infinity pool views' },
    { url: 'https://images.unsplash.com/photo-1501179691627-eeaa65ea017c?w=800', caption: 'Uluwatu cliff temple' },
  ],

  // DUBAI - UAE
  dubai: [
    { url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', caption: 'Burj Khalifa' },
    { url: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800', caption: 'Dubai Marina' },
    { url: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800', caption: 'Palm Jumeirah' },
    { url: 'https://images.unsplash.com/photo-1597659840241-37e2b9c2f55f?w=800', caption: 'Dubai Mall' },
    { url: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=800', caption: 'Desert safari' },
    { url: 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=800', caption: 'Burj Al Arab' },
  ],

  // CAPE TOWN - South Africa
  'cape-town': [
    { url: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800', caption: 'Table Mountain' },
    { url: 'https://images.unsplash.com/photo-1591628001888-b252a204e0cc?w=800', caption: 'Cape Point' },
    { url: 'https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?w=800', caption: 'Bo-Kaap colorful houses' },
    { url: 'https://images.unsplash.com/photo-1552553302-9211bf7f7053?w=800', caption: 'V&A Waterfront' },
    { url: 'https://images.unsplash.com/photo-1581888227599-779811939961?w=800', caption: 'Camps Bay beach' },
  ],

  // MAUI - Hawaii
  maui: [
    { url: 'https://images.unsplash.com/photo-1542259009477-d625272157b7?w=800', caption: 'Road to Hana' },
    { url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', caption: 'Haleakala sunrise' },
    { url: 'https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=800', caption: 'Wailea Beach' },
    { url: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800', caption: 'Whale watching' },
    { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', caption: 'Snorkeling paradise' },
  ],

  // CANCUN - Mexico
  cancun: [
    { url: 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800', caption: 'Cancun beach aerial' },
    { url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800', caption: 'Chichen Itza pyramid' },
    { url: 'https://images.unsplash.com/photo-1504019347908-b45f9b0b8dd5?w=800', caption: 'Hotel Zone' },
    { url: 'https://images.unsplash.com/photo-1570737543098-0983d88f796d?w=800', caption: 'Cenote swimming' },
    { url: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800', caption: 'Tulum ruins' },
  ],

  // MALDIVES
  maldives: [
    { url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800', caption: 'Overwater bungalows' },
    { url: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800', caption: 'Crystal clear lagoon' },
    { url: 'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800', caption: 'Maldives beach' },
    { url: 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800', caption: 'Underwater restaurant' },
    { url: 'https://images.unsplash.com/photo-1509233725247-49e657c54213?w=800', caption: 'Sunset over atoll' },
  ],

  // MARRAKECH - Morocco
  marrakech: [
    { url: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800', caption: 'Jemaa el-Fnaa square' },
    { url: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800', caption: 'Majorelle Garden' },
    { url: 'https://images.unsplash.com/photo-1545041459-d3feb0a1aca2?w=800', caption: 'Medina souks' },
    { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', caption: 'Riad courtyard' },
    { url: 'https://images.unsplash.com/photo-1560095633-6803aba5789c?w=800', caption: 'Koutoubia Mosque' },
  ],

  // VIENNA - Austria
  vienna: [
    { url: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800', caption: 'Schönbrunn Palace' },
    { url: 'https://images.unsplash.com/photo-1519923041506-ee95ecb9c47a?w=800', caption: 'St. Stephen\'s Cathedral' },
    { url: 'https://images.unsplash.com/photo-1573599852326-2d4da0bbe613?w=800', caption: 'Belvedere Palace' },
    { url: 'https://images.unsplash.com/photo-1548592379-c6ef3a9eea89?w=800', caption: 'Vienna Opera House' },
    { url: 'https://images.unsplash.com/photo-1609856878074-cf31e21ccb6b?w=800', caption: 'Coffee house culture' },
  ],

  // FLORENCE - Italy
  florence: [
    { url: 'https://images.unsplash.com/photo-1543429257-3eb0b65d9c58?w=800', caption: 'Florence Duomo' },
    { url: 'https://images.unsplash.com/photo-1534359265607-b9fe86a3d52c?w=800', caption: 'Ponte Vecchio' },
    { url: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800', caption: 'Uffizi Gallery' },
    { url: 'https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=800', caption: 'Piazzale Michelangelo view' },
    { url: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800', caption: 'Palazzo Vecchio' },
  ],

  // MIAMI - USA
  miami: [
    { url: 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=800', caption: 'South Beach' },
    { url: 'https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=800', caption: 'Art Deco District' },
    { url: 'https://images.unsplash.com/photo-1589083130544-0d6a2926e519?w=800', caption: 'Miami skyline' },
    { url: 'https://images.unsplash.com/photo-1575379622912-cff37b4c1391?w=800', caption: 'Ocean Drive' },
    { url: 'https://images.unsplash.com/photo-1548097893-45d41b12d4d9?w=800', caption: 'Wynwood Walls' },
  ],

  // SINGAPORE
  singapore: [
    { url: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800', caption: 'Marina Bay Sands' },
    { url: 'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800', caption: 'Gardens by the Bay' },
    { url: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800', caption: 'Supertree Grove' },
    { url: 'https://images.unsplash.com/photo-1496939376851-89342e90adcd?w=800', caption: 'Clarke Quay' },
    { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', caption: 'Hawker food centers' },
  ],
};

// Helper function to get images for a destination
export function getDestinationImages(destinationId: string): DestinationImage[] {
  return DESTINATION_IMAGES[destinationId] || [];
}

// Check if destination has images
export function hasDestinationImages(destinationId: string): boolean {
  return destinationId in DESTINATION_IMAGES && DESTINATION_IMAGES[destinationId].length > 0;
}
