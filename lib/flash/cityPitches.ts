/**
 * Compelling sales pitches for destinations
 * These aren't descriptions — they're persuasion. Each one should make
 * someone think "I need to go there."
 */

import type { Destination } from '@/types/flash';

/**
 * Hand-written pitches for major destinations.
 * Each is 2-3 sentences that sell the *feeling* of being there.
 */
const CITY_PITCHES: Record<string, string> = {
  // ── EUROPE ──────────────────────────────────────────────
  'paris':
    'Wake up to the smell of fresh croissants, wander through world-class museums before lunch, then watch the Eiffel Tower sparkle from a café terrace at dusk. Paris doesn\'t just live up to the hype — it exceeds it every single time.',
  'rome':
    'Toss a coin in the Trevi Fountain, eat the best carbonara of your life in a side-street trattoria, and stand where emperors once stood. Rome layers 3,000 years of history under your feet and makes it feel effortless.',
  'barcelona':
    'Gaudí\'s surreal architecture, tapas crawls through Gothic alleys, and golden beaches just minutes from the city center. Barcelona is that rare city where you can fill your days with culture and still end up barefoot in the sand by sunset.',
  'amsterdam':
    'Cycle along canal-lined streets, lose yourself in the Van Gogh Museum, and discover a café culture that turns every afternoon into an event. Amsterdam is intimate, walkable, and endlessly surprising around every corner.',
  'london':
    'From centuries-old pubs to Michelin-starred restaurants, from the Tower of London to cutting-edge galleries — London is a city that reinvents itself every decade while never losing its soul.',
  'lisbon':
    'Ride the iconic tram through pastel-colored neighborhoods, eat custard tarts still warm from the oven, and catch a sunset over the Tagus that will stop you mid-sentence. Lisbon is Europe\'s most underrated capital — and it knows it.',
  'prague':
    'Cross the Charles Bridge at dawn before the crowds arrive, explore a castle complex that dwarfs any you\'ve seen, and discover that a world-class meal here costs a fraction of what you\'d pay anywhere else in Europe.',
  'vienna':
    'Sip Viennese coffee in gilded palaces, catch a world-class opera for the price of a pizza, and walk streets where Mozart, Beethoven, and Freud once lived. Vienna is a masterclass in living beautifully.',
  'budapest':
    'Soak in thousand-year-old thermal baths as the sun sets over the Danube, explore ruin bars in crumbling courtyards, and eat your weight in chimney cake. Budapest is the city your friends haven\'t discovered yet — but will soon.',
  'florence':
    'Stand in front of Botticelli\'s Venus, eat a T-bone steak the size of your head, and watch the sun paint the Tuscan hills gold from Piazzale Michelangelo. Florence is Renaissance art made city-sized.',
  'copenhagen':
    'World-class restaurants at every price point, design that will make you rethink your entire apartment, and a happiness-obsessed culture that\'s genuinely infectious. Copenhagen makes minimalism feel luxurious.',
  'santorini':
    'White-washed buildings cascading down volcanic cliffs, sunsets so dramatic they draw applause, and wine made from grapes that grow in volcanic soil. Santorini is that postcard view that actually looks better in person.',
  'dubrovnik':
    'Walk the medieval walls that inspired King\'s Landing, swim in crystal-clear Adriatic coves, and drink wine on limestone terraces overlooking the sea. Dubrovnik is the Croatian coast at its most spectacular.',
  'edinburgh':
    'A castle towering over the city, whisky tastings in underground vaults, and a literary history that inspired Harry Potter. Edinburgh is moody, dramatic, and absolutely unforgettable in any weather.',
  'seville':
    'Flamenco performances that give you goosebumps, tapas that come free with every drink, and an evening paseo culture that makes you wonder why we ever stopped socializing this way. Seville is Spain at its most passionate.',
  'porto':
    'Port wine cellars along the Douro River, blue-tiled buildings that turn the entire city into an art gallery, and a francesinha sandwich that will ruin all other sandwiches for you. Porto is Portugal\'s delicious secret.',
  'stockholm':
    'Spread across 14 islands connected by bridges, Stockholm blends Viking history with Scandi-modern design. In summer the sun barely sets, and the entire city spills onto waterfront terraces.',
  'amalfi':
    'Cliffside villages connected by a winding coastal road with views that make you gasp at every turn. Limoncello on sun-drenched terraces, boat rides to hidden grottoes, and pasta that tastes like the ocean breeze.',
  'munich':
    'Beer gardens with chestnut trees, world-class art museums, and the Alps visible from the city on a clear day. Munich is Germany\'s most livable city — and it only takes one visit to understand why.',
  'athens':
    'The Acropolis watching over you from every rooftop bar, souvlaki that costs almost nothing and tastes like everything, and a nightlife scene that starts at midnight. Athens is ancient history with a modern heartbeat.',
  'krakow':
    'One of Europe\'s best-preserved medieval centers, where you can eat pierogies in a 600-year-old cellar and walk through history that will move you profoundly. Krakow is beautiful, haunting, and real.',

  // ── ASIA ──────────────────────────────────────────────
  'tokyo':
    'Eat at a conveyor-belt sushi spot that puts your hometown\'s best restaurant to shame, lose yourself in Shibuya\'s neon glow, then find perfect silence in a Meiji shrine garden. Tokyo is sensory overload in the best possible way.',
  'bangkok':
    'Street food that costs a dollar and changes your life, temples dripping in gold, and a night market culture that makes every evening an adventure. Bangkok is chaotic, generous, and completely addictive.',
  'bali':
    'Rice terraces that look like stairways to heaven, temple ceremonies that happen right next to your villa, and a sunrise yoga class that actually makes you cry. Bali isn\'t a cliché — it\'s a cliché because it\'s that good.',
  'singapore':
    'Hawker centers serving Michelin-star food for $3, futuristic gardens that glow at night, and a cultural melting pot where Chinese, Malay, and Indian traditions blend seamlessly. Singapore is the future of cities.',
  'kyoto':
    'Walk through tunnels of vermillion torii gates, attend a centuries-old tea ceremony, and stumble upon a geisha in the twilight streets of Gion. Kyoto is old Japan preserved like a living painting.',
  'hong-kong':
    'Dim sum carts rolling through morning restaurants, a skyline that competes with Manhattan, and a Star Ferry ride that costs pennies and delivers a million-dollar view. Hong Kong packs more into one square mile than most countries.',
  'hanoi':
    'The best phở you\'ll ever taste, Old Quarter streets where every block is a different trade, and a coffee culture built on tiny plastic chairs and condensed milk. Hanoi is sensory, authentic, and completely unforgettable.',
  'seoul':
    'K-beauty shops, palaces where guards change in colorful ceremony, and fried chicken so good it has its own TV shows. Seoul is where 600-year-old traditions and bleeding-edge tech coexist on the same street corner.',
  'osaka':
    'Japan\'s street food capital, where takoyaki sizzles on every corner and the locals are famously the friendliest in the country. Osaka is Tokyo\'s louder, funnier, more delicious younger sibling.',
  'chiang-mai':
    'Hundreds of golden temples, elephant sanctuaries, and a night bazaar that goes on forever. Chiang Mai is Thailand\'s spiritual and creative heart — slower, cooler, and deeply special.',
  'ho-chi-minh-city':
    'Motorbikes moving like a river around you, bánh mì that costs a dollar and tastes like a dream, and war history that\'s told with nuance and power. Saigon is Vietnam at its most energetic.',
  'jaipur':
    'The Pink City, where every palace is more ornate than the last and the bazaars are a kaleidoscope of color. Jaipur is Rajasthani royalty at its most photogenic and accessible.',

  // ── AMERICAS ──────────────────────────────────────────
  'new-york':
    'The pizza. The Broadway shows. The feeling of walking through Central Park and realizing you\'re in the greatest city ever built. New York doesn\'t need a sales pitch — but it delivers one every time you step outside.',
  'mexico-city':
    'Murals that cover entire buildings, mezcal bars in colonial mansions, and a taco al pastor that will rewire your understanding of what food can be. CDMX is the most exciting food city on the planet right now.',
  'buenos-aires':
    'Tango in dimly-lit milongas, steak that melts before it hits your tongue, and neighborhoods with more personality per block than entire cities. Buenos Aires is European elegance with Latin American soul.',
  'rio':
    'Christ the Redeemer watching over you from Corcovado, golden beaches where fitness and fun collide, and a nightlife culture that starts with sunset caipirinhas and ends well past dawn. Rio is pure, distilled joy.',
  'cartagena':
    'Colonial walls glowing in sunset colors, rooftop bars overlooking the Caribbean, and ceviche so fresh the fish was swimming that morning. Cartagena is Colombia\'s most romantic chapter.',
  'cusco':
    'The gateway to Machu Picchu and a destination in its own right — Inca walls supporting colonial churches, altitude-defying markets, and a Sacred Valley that redefines what \'scenic\' means.',
  'havana':
    'Classic cars cruising past crumbling-yet-gorgeous architecture, salsa pouring out of every doorway, and mojitos made the way Hemingway drank them. Havana is frozen in time and full of life.',
  'oaxaca':
    'Mexico\'s culinary capital, where mole recipes are family secrets passed down for generations and the mezcal comes from the hillside above town. Oaxaca is where Mexican culture runs deepest.',
  'san-francisco':
    'The Golden Gate emerging from the fog, sourdough bread that people are unreasonably passionate about, and a tech-meets-counterculture vibe that doesn\'t exist anywhere else. SF is iconic for a reason.',
  'vancouver':
    'Snow-capped mountains visible from downtown, sushi that rivals Tokyo (seriously), and Stanley Park wrapping the city in a green embrace. Vancouver is where the Pacific Northwest peaks.',
  'miami':
    'Art Deco architecture glowing in pastel neon, Cuban coffee that\'ll wake you up in ways you didn\'t know were possible, and a beach scene that makes the rest of Florida look sleepy. Miami is a city that runs on sunshine and attitude.',

  // ── MIDDLE EAST & AFRICA ────────────────────────────
  'dubai':
    'The tallest building you\'ve ever seen, a desert safari at sunset, and a mall with an actual ski slope inside it. Dubai is what happens when ambition has no ceiling — absurd, spectacular, and weirdly addictive.',
  'marrakech':
    'The Jemaa el-Fnaa square at dusk is a sensory explosion — snake charmers, spice merchants, and tagine steam everywhere. Then you duck into a riad that\'s a hidden palace of calm. Marrakech is the ultimate contrast.',
  'istanbul':
    'A city on two continents where minarets and modern skyline compete for the horizon, kebabs sizzle on every corner, and the Grand Bazaar has been the world\'s greatest shopping experience for 500 years.',
  'cairo':
    'The Pyramids of Giza are right there — not in the desert distance, but bordering the city, casually sitting next to a Pizza Hut. Cairo is 5,000 years of civilization layered on top of itself, chaotic and awe-inspiring.',
  'cape-town':
    'Table Mountain forming the most dramatic city backdrop on Earth, penguins on the beach (yes, really), and a wine region that rivals Napa at a fraction of the price. Cape Town is a city that keeps surprising you.',
  'nairobi':
    'The only capital city with a national park inside it — watch giraffes with a skyline backdrop, then dive into a food scene that blends Swahili, Indian, and global influences. Nairobi is East Africa\'s beating heart.',
  'zanzibar':
    'Spice plantations, Stone Town\'s winding alleys, and beaches so white they look photoshopped. Zanzibar is the island off the East African coast that nobody wants to leave.',

  // ── OCEANIA ──────────────────────────────────────────
  'sydney':
    'The Opera House gleaming against the harbor, Bondi Beach just a bus ride from the CBD, and a brunch culture that the rest of the world is still trying to copy. Sydney makes outdoor living an art form.',
  'queenstown':
    'Bungee jumping was invented here, and the adrenaline hasn\'t stopped since. But Queenstown also does wine, lake views, and mountain sunsets — adventure capital meets surprisingly sophisticated escape.',
  'melbourne':
    'Laneway coffee shops, street art that rivals galleries, and a food scene where a $15 bowl of pho sits next to a $200 tasting menu — both excellent. Melbourne is Australia\'s cultural engine.',

  // ── CARIBBEAN ──────────────────────────────────────
  'cancun':
    'Turquoise water that doesn\'t look real, Mayan ruins peeking through the jungle, and a hotel zone that turns every sunset into a private show. Cancún is the Caribbean gateway that delivers every time.',
  'punta-cana':
    'All-inclusive resorts lining coconut palm beaches, warm water that feels like a bath, and a merengue soundtrack that makes every moment feel like vacation. Punta Cana exists specifically to make you relax.',
  'san-juan':
    'Cobblestone streets in Old San Juan painted every color imaginable, rum cocktails with 500 years of history behind them, and no passport needed from the US. Puerto Rico is the easiest tropical escape with the deepest culture.',

  // ── ADDITIONAL POPULAR CITIES ────────────────────────
  'reykjavik':
    'Northern lights dancing overhead, geothermal hot springs surrounded by volcanic rock, and whale watching right from the harbor. Reykjavik is the gateway to a landscape that looks like another planet.',
  'maldives':
    'Overwater bungalows, water so clear you can watch fish from your bed, and the kind of silence that cities make you forget exists. The Maldives is the world\'s most famous escape — and it\'s earned every bit of it.',
  'tbilisi':
    'Crumbling Art Nouveau mansions next to ultra-modern glass architecture, a wine tradition that\'s 8,000 years old, and a food scene that\'s one of the world\'s best-kept secrets. Tbilisi is the coolest city nobody you know has visited.',
  'medellín':
    'A city that went from the world\'s most dangerous to one of its most innovative. Cable cars over lush green hillsides, rooftop bars with eternal spring weather, and a creative energy that\'s palpable on every corner.',
  'bogota':
    'Street art that tells Colombia\'s complex story on every wall, a food revolution happening in real time, and neighborhoods at 8,000 feet elevation where you need a jacket and a good appetite. Bogotá rewards the curious.',
  'petra':
    'Walk through a narrow canyon and watch a 2,000-year-old temple carved from rose-red rock slowly reveal itself. It\'s one of the few places on Earth that genuinely takes your breath away — and then it gets better.',
};

/**
 * Vibe-based pitch templates for cities without hand-written pitches.
 * The generator picks the most relevant template based on the destination's vibes.
 */
const VIBE_PITCH_TEMPLATES: Record<string, (city: string, country: string, highlights: string[]) => string> = {
  beach: (city, country, hl) =>
    `${city}'s coastline is the kind of place where you kick off your shoes on day one and don't put them back on until you leave. ${hl[0] ? `Think ${hl[0].toLowerCase()}, ` : ''}crystal-clear water, and the kind of relaxation that actually works.`,
  romance: (city, country, hl) =>
    `Every sunset in ${city} feels like it was staged for just the two of you. ${hl[0] ? `${hl[0]}, ` : ''}intimate restaurants, and streets made for wandering hand-in-hand — this is what romantic getaways are supposed to feel like.`,
  culture: (city, country, hl) =>
    `${city} is where you go to feel genuinely enriched. ${hl.slice(0, 2).join(', ')} — every corner rewards curiosity, and you'll leave understanding ${country} in a way guidebooks can't teach.`,
  food: (city, country, hl) =>
    `Come hungry — ${city} takes eating seriously. From street stalls to restaurants that treat every plate like art, the food scene here isn't just good, it's a reason to book the trip all by itself.`,
  history: (city, country, hl) =>
    `Centuries of history layer every street in ${city}. ${hl[0] || 'Ancient landmarks'} and ${(hl[1] || 'fascinating stories').toLowerCase()} — this is a place where the past feels alive and present.`,
  nightlife: (city, country, hl) =>
    `When the sun goes down, ${city} wakes up. Rooftop bars, live music venues, and a nightlife culture that keeps going until the rest of the world is having breakfast. Bring your energy.`,
  adventure: (city, country, hl) =>
    `${city} is where your comfort zone goes to get tested — in the best way. ${hl[0] || 'Breathtaking landscapes'}, outdoor thrills, and the kind of stories you'll still be telling years from now.`,
  nature: (city, country, hl) =>
    `The natural landscape around ${city} is the kind that makes you put your phone down and just look. ${hl[0] || 'Stunning scenery'}, clean air, and moments of genuine awe that you can't Instagram properly.`,
  city: (city, country, hl) =>
    `${city} has the kind of energy that only great cities generate — that feeling of possibility the moment you step outside. ${hl[0] ? `${hl[0]}, ` : ''}local spots that surprise you, and a rhythm you'll sync with fast.`,
  luxury: (city, country, hl) =>
    `${city} does luxury without pretension. World-class hotels, dining that justifies the price, and an elegance that comes from ${country}'s long tradition of doing things beautifully.`,
  relaxation: (city, country, hl) =>
    `${city} is purpose-built for unwinding. The pace is slower here, the scenery does the heavy lifting, and by day two you won't remember what you were stressed about. This is actual rest.`,
  family: (city, country, hl) =>
    `${city} is one of those places the whole family will love — enough adventure to keep the kids thrilled and enough beauty to keep the adults happy. ${hl[0] ? `${hl[0]} is ` : 'Highlights are '}just the beginning.`,
};

/**
 * Generate a compelling sales pitch for a destination.
 * Hand-written for major cities, intelligently generated for the rest.
 */
export function generateCityPitch(destination: Destination): string {
  // Hand-written pitch takes priority
  const handWritten = CITY_PITCHES[destination.id];
  if (handWritten) return handWritten;

  // Generate from vibes + highlights
  // Pick the most "interesting" vibe (not generic ones like 'city')
  const vibeOrder = ['food', 'adventure', 'beach', 'romance', 'nightlife', 'culture', 'history', 'nature', 'luxury', 'relaxation', 'family', 'city'];
  const bestVibe = vibeOrder.find(v => destination.vibes.includes(v as any)) || 'city';
  const templateFn = VIBE_PITCH_TEMPLATES[bestVibe] || VIBE_PITCH_TEMPLATES.city;

  return templateFn(destination.city, destination.country, destination.highlights);
}
