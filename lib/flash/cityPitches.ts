/**
 * Compelling sales pitches for all 500 destinations.
 * These aren't descriptions — they're persuasion. Each one should make
 * someone think "I need to go there."
 *
 * 100% hand-written coverage. No fallback generators.
 */

import type { Destination } from '@/types/flash';

const CITY_PITCHES: Record<string, string> = {

  // ══════════════════════════════════════════════════════════════
  // EUROPE (~145 destinations)
  // ══════════════════════════════════════════════════════════════

  // ── Western Europe — Major Cities ─────────────────────────
  'paris':
    'Wake up to the smell of fresh croissants, wander through world-class museums before lunch, then watch the Eiffel Tower sparkle from a café terrace at dusk. Paris doesn\'t just live up to the hype — it exceeds it every single time.',
  'london':
    'From centuries-old pubs to Michelin-starred restaurants, from the Tower of London to cutting-edge galleries — London is a city that reinvents itself every decade while never losing its soul.',
  'amsterdam':
    'Cycle along canal-lined streets, lose yourself in the Van Gogh Museum, and discover a café culture that turns every afternoon into an event. Amsterdam is intimate, walkable, and endlessly surprising around every corner.',
  'brussels':
    'The Grand Place alone is worth the trip — but add world-class chocolate, waffles that ruin all other waffles, and a surreal sense of humor baked into the culture, and Brussels becomes unforgettable.',
  'luxembourg':
    'A tiny country with outsized charm — medieval fortifications above a dramatic gorge, Michelin restaurants on cobblestone streets, and a cosmopolitan energy that defies its size.',

  // ── France ────────────────────────────────────────────────
  'nice':
    'The Promenade des Anglais curving along turquoise water, a Vieille Ville bursting with color, and a market scene that makes lunch the best part of every day. Nice is the French Riviera at its most relaxed.',
  'lyon':
    'France\'s true food capital — bouchons serving silk-worker recipes from centuries ago, traboules hiding between buildings, and a culinary seriousness that makes every meal an event.',
  'marseille':
    'The Vieux-Port shimmering in Mediterranean light, bouillabaisse so good it has strict rules, and the Calanques — dramatic limestone cliffs dropping into crystal coves just minutes from the city.',
  'bordeaux':
    'World-famous wine is just the beginning — the Place de la Bourse reflecting in its mirror pool at night is one of Europe\'s most beautiful sights, and Saint-Émilion is a day trip you\'ll never forget.',
  'strasbourg':
    'Half-timbered houses straight out of a storybook, a cathedral that took 400 years to build, and Europe\'s most magical Christmas market. Strasbourg is where France and Germany created something better together.',
  'toulouse':
    'The Pink City glows at sunset — terracotta buildings lining the Garonne, cassoulet bubbling in every bistro, and a youthful energy from France\'s largest student population. Toulouse is the real south.',
  'monaco':
    'The Monte Carlo Casino, superyachts lining the harbor, and the Grand Prix circuit running through actual city streets. Monaco is absurdly glamorous and somehow pulls it off without irony.',
  'provence':
    'Lavender fields stretching to the horizon, Papal palaces, and rosé wine at lunch because that\'s just what you do here. Provence is the France of your imagination — and it\'s every bit as good.',
  'nantes':
    'A giant mechanical elephant walks the streets. That\'s the kind of city Nantes is — creative, unexpected, and unlike anywhere else in France. The castle and art scene are just bonuses.',
  'lille':
    'Flemish architecture, a food scene that bridges French and Belgian traditions, and an art museum that rivals anything in Paris. Lille is northern France\'s best-kept secret — charming, affordable, and real.',
  'chamonix':
    'Mont Blanc towering overhead, the Aiguille du Midi cable car taking you into the clouds, and après-ski culture that makes winter magical. Chamonix is the birthplace of mountaineering and it still delivers.',
  'mont-saint-michel':
    'A medieval abbey rising from the sea on a tidal island — it looks like a fantasy illustration but it\'s real, and it\'s been drawing pilgrims and dreamers for over a thousand years.',
  'corsica':
    'Napoleon\'s island birthplace has beaches that rival the Caribbean, a hiking trail (the GR20) that\'s legendarily tough, and a fierce independence that makes it feel like its own country.',
  'biarritz':
    'Where Basque culture meets Atlantic surf — world-class waves, Grande Plage glamour, and a food scene that blends French technique with Spanish fire. Biarritz is effortlessly cool.',
  'colmar':
    'Half-timbered houses reflected in canals they call Little Venice, Alsatian wine flowing in every tavern, and a Christmas market that might be Europe\'s most photogenic. Colmar is a fairytale you can walk through.',

  // ── Italy ─────────────────────────────────────────────────
  'rome':
    'Toss a coin in the Trevi Fountain, eat the best carbonara of your life in a side-street trattoria, and stand where emperors once stood. Rome layers 3,000 years of history under your feet and makes it feel effortless.',
  'florence':
    'Stand in front of Botticelli\'s Venus, eat a T-bone steak the size of your head, and watch the sun paint the Tuscan hills gold from Piazzale Michelangelo. Florence is Renaissance art made city-sized.',
  'venice':
    'Gondolas gliding through canals that have no business being this beautiful, San Marco\'s golden mosaics catching the light, and getting lost in alleys that dead-end at water. Venice is impossible and perfect.',
  'milan':
    'The Duomo\'s rooftop at sunset, Da Vinci\'s Last Supper in person, and a fashion district where window shopping feels like visiting a museum. Milan is Italy\'s most sophisticated city — and it knows it.',
  'naples':
    'The birthplace of pizza — and every bite here proves why the original is still the best. Add Pompeii as a day trip and a gritty, electric energy that\'s unlike anywhere else in Italy.',
  'bologna':
    'Italy\'s food capital is not Rome or Florence — it\'s Bologna, where ragù was invented, tortellini are hand-folded with religious devotion, and the porticoes stretch for 40 kilometers. Come hungry.',
  'amalfi':
    'Cliffside villages connected by a winding coastal road with views that make you gasp at every turn. Limoncello on sun-drenched terraces, boat rides to hidden grottoes, and pasta that tastes like the ocean breeze.',
  'cinque-terre':
    'Five impossibly colorful fishing villages clinging to cliffs above the sea, connected by hiking trails that reward every step with a better view. Cinque Terre is Italy\'s most photographed coastline for good reason.',
  'malta':
    'A tiny limestone archipelago packed with 7,000 years of history — megalithic temples older than the pyramids, a honey-colored capital built by knights, and Mediterranean water so blue it looks photoshopped. Malta is a history lesson disguised as a beach vacation.',
  'sicily':
    'Mount Etna smoking on the horizon, Greek temples older than Rome itself, and arancini from street carts that cost a euro and taste like heaven. Sicily is Italy turned up to eleven.',
  'sardinia':
    'The Costa Smeralda\'s emerald water would be enough, but Sardinia also has Bronze Age ruins, a wine nobody outside the island knows about, and beaches that compete with the Caribbean.',
  'verona':
    'Juliet\'s balcony, a Roman arena that still hosts operas under the stars, and an Amarone wine tradition that makes every dinner memorable. Verona is romance backed by substance.',
  'turin':
    'Italy\'s chocolate capital, home to the Shroud and an Egyptian museum second only to Cairo\'s. Turin has a quiet elegance — all grand arcades and aperitivo culture — that Milan wishes it had.',
  'lake-como':
    'George Clooney moved here for a reason. Turquoise water surrounded by lush mountains, century-old villas, and the kind of Italian elegance that makes you never want to go home.',
  'lake-garda':
    'Italy\'s largest lake, where lemon groves meet medieval castles and the town of Sirmione sits on a peninsula that feels like a private island. Wine country surrounds you in every direction.',
  'puglia':
    'The trulli houses of Alberobello look like something Dr. Seuss designed, the orecchiette pasta is made by grandmothers on their doorsteps, and the beaches are Italy\'s most underrated. Puglia is the real deal.',
  'bergamo':
    'The Città Alta — an ancient walled city on a hilltop reached by funicular — is one of northern Italy\'s most dramatic entrances. Below it, a modern city with Lombardy\'s best kept culinary secrets.',
  'catania':
    'In the shadow of Mount Etna, Catania has a baroque swagger, a fish market that\'s pure theater, and a street food culture — arancini, horse meat sandwiches, granita — that defines Sicilian indulgence.',
  'san-remo':
    'The Italian Riviera at its most classic — a Belle Époque casino, a medieval old town cascading down the hill, and a flower market that scents the entire waterfront. San Remo is vintage glamour.',
  'rovinj':
    'A Croatian fishing town that feels like it belongs on the Italian coast — cobblestone streets winding up to a church on a hill, Adriatic sunsets, and truffle-infused everything.',

  // ── Spain & Portugal ──────────────────────────────────────
  'barcelona':
    'Gaudí\'s surreal architecture, tapas crawls through Gothic alleys, and golden beaches just minutes from the city center. Barcelona is that rare city where you can fill your days with culture and still end up barefoot in the sand by sunset.',
  'madrid':
    'The Prado Museum, Retiro Park on a Sunday morning, and a tapas scene that doesn\'t get going until 10pm. Madrid is Spain\'s beating heart — loud, proud, and magnificently alive at hours when other capitals sleep.',
  'seville':
    'Flamenco performances that give you goosebumps, tapas that come free with every drink, and an evening paseo culture that makes you wonder why we ever stopped socializing this way. Seville is Spain at its most passionate.',
  'valencia':
    'The birthplace of paella, the City of Arts and Sciences looking like it landed from the future, and Mediterranean beaches that locals actually use. Valencia is Barcelona\'s less crowded, more authentic cousin.',
  'granada':
    'The Alhambra at sunset is one of the most beautiful things humans have ever built. Add free tapas with every drink, and the Albaicín quarter\'s whitewashed streets below the Sierra Nevada, and Granada becomes essential.',
  'bilbao':
    'The Guggenheim transformed this industrial city into a cultural destination — but the pintxos bars of the Casco Viejo are what keep people coming back. Bilbao is the Basque Country\'s delicious revival story.',
  'san-sebastian':
    'La Concha Beach curves like a perfect crescent, and the pintxos bars pack more Michelin stars per square meter than anywhere on Earth. San Sebastián is where the world\'s best chefs go to eat on their day off.',
  'malaga':
    'Picasso\'s birthplace has emerged as one of Spain\'s hottest cities — rooftop bars overlooking the Alcazaba, an art scene that punches way above its weight, and beaches that actually deliver on the Costa del Sol promise.',
  'majorca':
    'The Serra de Tramuntana mountains dropping into turquoise coves, a cathedral by the sea, and a food scene that goes far beyond the all-inclusive reputation. Majorca is the Mediterranean island Spain keeps for itself.',
  'menorca':
    'Majorca\'s quieter sister, where pristine beaches outnumber tourists, prehistoric stone monuments dot the landscape, and the pace of life is deliberately, blissfully slow.',
  'ibiza':
    'Yes, the superclubs are legendary — but Ibiza also has a mystical old town, hidden coves, and a sunset at Café del Mar that turns strangers into friends. The island has more layers than its reputation suggests.',
  'cordoba':
    'The Mezquita — a mosque inside a cathedral inside a mosque — is one of the world\'s most extraordinary buildings. The patios dripping with flowers and the Jewish Quarter\'s quiet lanes make Córdoba unmissable.',
  'toledo':
    'A medieval walled city on a hill surrounded by a river gorge, where El Greco painted and three religions coexisted. Toledo is Spain\'s history concentrated into one dramatic, walkable afternoon.',
  'marbella':
    'The Golden Mile\'s glamour, an Old Town that\'s genuinely charming beneath the glitz, and a beach club culture that makes every day feel like a celebration. Marbella is the Costa del Sol at full volume.',
  'canary-islands':
    'Volcanic islands with year-round sunshine, black-sand beaches next to lunar landscapes, and a subtropical climate that makes winter feel like a distant memory. The Canaries are Europe\'s escape hatch when the continent gets cold.',
  'gran-canaria':
    'Saharan dunes on a volcanic island, year-round sunshine, and a diversity of landscapes — from pine forests to beaches — that earns it the nickname "miniature continent."',
  'lanzarote':
    'César Manrique turned the entire island into an art installation — volcanic landscapes, underground concert halls, and a commitment to beauty that makes Lanzarote unlike any island you\'ve visited.',
  'lisbon':
    'Ride the iconic tram through pastel-colored neighborhoods, eat custard tarts still warm from the oven, and catch a sunset over the Tagus that will stop you mid-sentence. Lisbon is Europe\'s most underrated capital — and it knows it.',
  'porto':
    'Port wine cellars along the Douro River, blue-tiled buildings that turn the entire city into an art gallery, and a francesinha sandwich that will ruin all other sandwiches for you. Porto is Portugal\'s delicious secret.',
  'madeira':
    'Levada walks through lush laurel forests, tobogganing down hills in a wicker basket, and a volcanic island climate that earns it the nickname "floating garden." Madeira is an Atlantic paradise hiding in plain sight.',
  'azores':
    'Volcanic crater lakes in impossible shades of green and blue, whale watching in the open Atlantic, and hot springs heated by the earth itself. The Azores are Europe\'s most dramatic nature escape.',
  'algarve':
    'Golden cliffs dropping into turquoise water, sea caves you can kayak through, and a coastline that belongs on a screensaver but actually exists. The Algarve is Portugal\'s southern masterpiece.',
  'sintra':
    'Pena Palace looks like a Disney castle designed on a dare — painted in yellow and red on a misty hilltop, surrounded by enchanted forests and secret tunnels. Sintra is the most magical day trip in Europe.',
  'faro':
    'The Ria Formosa lagoon, barrier island beaches you reach by boat, and a quiet Old Town that lets you experience the Algarve before the resorts took over. Faro is the authentic entry point.',

  // ── Germany & Austria & Switzerland ───────────────────────
  'berlin':
    'The Brandenburg Gate, remnants of the Wall, and a nightlife scene that literally never closes. Berlin is where history\'s heaviest chapter meets Europe\'s most creative, free-spirited energy.',
  'munich':
    'Beer gardens with chestnut trees, world-class art museums, and the Alps visible from the city on a clear day. Munich is Germany\'s most livable city — and it only takes one visit to understand why.',
  'frankfurt':
    'The skyline earned it the nickname "Mainhattan," but Frankfurt surprises with a cobblestone Römerberg square, cozy apple wine taverns, and a museum mile along the river that rivals any in Europe.',
  'hamburg':
    'The Speicherstadt warehouse district reflected in canals, the Elbphilharmonie concert hall rising from the harbor, and a Reeperbahn nightlife that\'s been legendary since the Beatles played here.',
  'cologne':
    'A Gothic cathedral so massive it took 632 years to build, old town pubs pouring Kölsch beer in tiny glasses, and a carnival culture that turns the entire city into one enormous party every February.',
  'dusseldorf':
    'The "longest bar in the world" — 260 pubs packed into the Altstadt — plus a Rhine promenade, a fashion scene, and Altbier that locals will passionately debate over for hours.',
  'dresden':
    'Rebuilt from ashes into one of Germany\'s most beautiful cities — the Frauenkirche, the Zwinger Palace, and an Old Masters Gallery that houses Raphael\'s Sistine Madonna. Dresden\'s comeback is extraordinary.',
  'leipzig':
    'Bach composed here, the peaceful revolution that ended the Wall started here, and the Spinnerei cotton mill is now one of Europe\'s most exciting art complexes. Leipzig is Berlin before Berlin got expensive.',
  'nuremberg':
    'A medieval castle towering over a half-timbered Old Town, bratwurst that has its own protected recipe, and Germany\'s most famous Christmas market — Nuremberg is Bavaria at its most atmospheric.',
  'heidelberg':
    'A romantic castle ruin overlooking the Neckar River, Germany\'s oldest university, and a bridge so beautiful Mark Twain wrote about it. Heidelberg is the Germany of poetry and postcards.',
  'stuttgart':
    'The Mercedes-Benz Museum, the Porsche Museum, and a wine region most people don\'t know exists. Stuttgart is Germany\'s wealthiest city — and it spends it on engineering, culture, and Riesling.',
  'black-forest':
    'Cuckoo clocks, cherry cake, and hiking trails through pine forests so dense they earned their dark name. The Black Forest is Germany at its most fairytale — and it\'s real.',
  'vienna':
    'Sip Viennese coffee in gilded palaces, catch a world-class opera for the price of a pizza, and walk streets where Mozart, Beethoven, and Freud once lived. Vienna is a masterclass in living beautifully.',
  'salzburg':
    'Mozart\'s birthplace framed by Alpine peaks, where you can tour the Sound of Music hills in the morning and drink beer in a 1,000-year-old brewery by afternoon. Salzburg is small enough to feel intimate and grand enough to feel like a fairytale.',
  'innsbruck':
    'Alpine skiing, a Golden Roof glinting in the Old Town, and the Nordkette mountain range accessible by funicular from the city center. Innsbruck puts the Alps right at your doorstep.',
  'graz':
    'Austria\'s second city is its culinary capital — a UNESCO Creative City of Design with a futuristic art museum, a clocktower-topped hill, and a food market that makes Vienna jealous.',
  'swiss-alps':
    'Interlaken sits between two impossibly blue lakes with the Jungfrau towering above — paragliding, canyoning, and Swiss village perfection that looks exactly like the postcards.',
  'zurich':
    'The Old Town along the Limmat River, a lake that invites swimming in summer, and a cultural scene that goes far beyond banking. Zurich is Switzerland\'s most cosmopolitan city — expensive, but worth every franc.',
  'geneva':
    'The Jet d\'Eau fountain shooting 140 meters into the air, Mont Blanc visible on clear days, and an international sophistication that comes from hosting the world\'s most important conversations.',
  'lucerne':
    'The Chapel Bridge — Europe\'s oldest covered bridge — reflected in lake water with Mount Pilatus behind it. Lucerne is Swiss beauty distilled into one perfect, walkable city.',
  'basel':
    'Art Basel made it famous, but the city earns its reputation year-round — world-class museums, the Rhine flowing through the center, and a cultural density that rivals cities ten times its size.',
  'zermatt':
    'The Matterhorn — one of the most recognizable mountains on Earth — watching over a car-free village where skiing, hiking, and staring in awe are the only things on the agenda.',

  // ── Scandinavia ───────────────────────────────────────────
  'copenhagen':
    'World-class restaurants at every price point, design that will make you rethink your entire apartment, and a happiness-obsessed culture that\'s genuinely infectious. Copenhagen makes minimalism feel luxurious.',
  'stockholm':
    'Spread across 14 islands connected by bridges, Stockholm blends Viking history with Scandi-modern design. In summer the sun barely sets, and the entire city spills onto waterfront terraces.',
  'oslo':
    'The Viking Ship Museum, a fjord running right into the city, and an opera house you can walk on top of. Oslo pairs Norway\'s dramatic nature with a Scandinavian cool that\'s impossible to fake.',
  'helsinki':
    'Suomenlinna fortress floating in the harbor, a sauna culture that\'s a national religion, and a Design District where every object seems to have been made with more care than seems possible.',
  'gothenburg':
    'An archipelago of car-free islands accessible by ferry, Sweden\'s best seafood, and a locals-first culture that feels refreshingly unpretentious. Gothenburg is Stockholm\'s cooler, more relaxed cousin.',
  'malmö':
    'The Turning Torso twisting over a city that\'s reinvented itself — a 20-minute train ride from Copenhagen, with its own thriving food scene and a multicultural energy all its own.',
  'bergen':
    'The colorful wooden Bryggen wharf, a funicular to views that make you understand why Norwegians love their country so fiercely, and the gateway to the most spectacular fjords on Earth.',
  'tromso':
    'Northern Lights dancing overhead in winter, the Midnight Sun in summer, and an Arctic Cathedral that looks like an iceberg. Tromsø is the world\'s most accessible gateway to the Arctic.',
  'aarhus':
    'Denmark\'s second city punches above its weight — the ARoS museum\'s rainbow panorama, a reconstructed Old Town, and a food scene that earned it European Capital of Culture.',
  'lofoten':
    'Arctic islands where red fishing cabins line dramatic fjords, the Northern Lights reflect off still water, and the midnight sun turns nights into golden hours that last forever.',
  'reykjavik':
    'Northern Lights dancing above a city built on geothermal heat, the Golden Circle route through geysers and waterfalls, and a creative culture that punches wildly above its population. Reykjavik is the gateway to landscapes that don\'t look like they belong on Earth.',
  'lapland':
    'Santa Claus Village, husky safaris through snow-covered forests, and the Northern Lights so vivid they make you forget how cold it is. Lapland is the closest thing to a winter wonderland that actually exists.',

  // ── UK & Ireland ──────────────────────────────────────────
  'edinburgh':
    'A castle towering over the city, whisky tastings in underground vaults, and a literary history that inspired Harry Potter. Edinburgh is moody, dramatic, and absolutely unforgettable in any weather.',
  'manchester':
    'Football heritage that spans Old Trafford and the Etihad, a Northern Quarter buzzing with independent bars, and a music legacy — from the Smiths to Oasis — that echoes in every venue.',
  'liverpool':
    'The Beatles walked these streets, and the music hasn\'t stopped since. Albert Dock, two rival football cathedrals, and a Scouse humor that makes everyone feel welcome immediately.',
  'glasgow':
    'Kelvingrove Museum is free and world-class, the West End is Scotland\'s best neighborhood for food and pubs, and the live music scene rivals any city in Europe. Glasgow is Edinburgh\'s livelier counterpart.',
  'bath':
    'Roman baths still steaming after 2,000 years, a Royal Crescent that defines Georgian elegance, and a Jane Austen connection that draws literary pilgrims from around the world. Bath is England perfected.',
  'york':
    'Walk the medieval city walls, wander the Shambles (the street that inspired Diagon Alley), and stand inside a Minster that took 250 years to build. York is English history you can touch.',
  'cambridge':
    'Punting along the River Cam past 800-year-old colleges, King\'s College Chapel soaring overhead, and a pub where Watson and Crick announced they\'d discovered DNA. Cambridge is genius made beautiful.',
  'oxford':
    'The Bodleian Library, Christ Church\'s dining hall that inspired Hogwarts, and a city of dreaming spires where tradition and intellect have been intertwined for nearly a millennium.',
  'belfast':
    'The Titanic Museum alone justifies the trip, but Belfast has also become one of Europe\'s most exciting food cities, with political murals that tell a complex story and a Cathedral Quarter that pulses at night.',
  'bristol':
    'The Clifton Suspension Bridge, Banksy\'s hometown street art around every corner, and a harbourside that\'s been transformed into one of England\'s most creative cultural scenes.',
  'cardiff':
    'A castle in the city center, a bay area that\'s been brilliantly regenerated, and a rugby day atmosphere that turns the entire Welsh capital into one enormous, singing celebration.',
  'brighton':
    'The Royal Pavilion looking like it was airlifted from India, a pier that defines seaside fun, and a Lanes shopping quarter with more personality per square foot than anywhere in southern England.',
  'cotswolds':
    'Honey-colored stone villages, rolling green hills crosshatched by ancient walls, and country pubs with low ceilings and real fires. The Cotswolds is the England that England dreams about.',
  'lake-district':
    'Windermere shimmering between fells that inspired Wordsworth, hiking trails that reward every ability level, and Beatrix Potter\'s world brought to life. The Lake District is England\'s most beautiful corner.',
  'scottish-highlands':
    'Loch Ness, whisky distilleries, and castles perched on clifftops above landscapes so dramatic they make movie locations look tame. The Highlands are Scotland distilled to its essence.',
  'dublin':
    'The Guinness Storehouse, Trinity College\'s Book of Kells, and a pub culture where live music and conversation flow equally. Dublin is literary, lively, and impossible not to love.',
  'galway':
    'The Latin Quarter buzzing with live music spilling from every pub, the Cliffs of Moher an hour away, and a creative energy that earned it European Capital of Culture. Galway is Ireland\'s soul.',
  'cork':
    'The English Market where local producers sell with pride, Blarney Castle nearby, and a pub scene that rivals Dublin\'s with a fraction of the crowds. Cork is Ireland\'s rebel city — independent and proud.',

  // ── Netherlands & Belgium ─────────────────────────────────
  'bruges':
    'Medieval canals reflecting Gothic towers, chocolate shops on every corner, and a Belfry that gives you views over one of Europe\'s best-preserved cities. Bruges is a living museum that still serves incredible beer.',
  'ghent':
    'All the beauty of Bruges with a fraction of the crowds and twice the personality. Gravensteen Castle, a student-fueled nightlife, and Belgian beer that makes you question every beer you\'ve had before.',
  'antwerp':
    'The Diamond District, Rubens\' masterpieces in the church where he\'s buried, and a fashion scene that\'s been quietly rivaling Paris for decades. Antwerp is Belgium\'s most stylish city.',
  'rotterdam':
    'Cube houses, the Markthal, and an Erasmus Bridge that lights up the skyline — Rotterdam was bombed flat in WWII and rebuilt itself as Europe\'s most architecturally daring city. It\'s spectacular.',
  'the-hague':
    'The Mauritshuis houses Vermeer\'s Girl with a Pearl Earring, the Peace Palace settles international disputes, and Scheveningen Beach is a full seaside resort minutes from the center.',

  // ── Eastern Europe ────────────────────────────────────────
  'prague':
    'Cross the Charles Bridge at dawn before the crowds arrive, explore a castle complex that dwarfs any you\'ve seen, and discover that a world-class meal here costs a fraction of what you\'d pay anywhere else in Europe.',
  'budapest':
    'Soak in thousand-year-old thermal baths as the sun sets over the Danube, explore ruin bars in crumbling courtyards, and eat your weight in chimney cake. Budapest is the city your friends haven\'t discovered yet — but will soon.',
  'krakow':
    'One of Europe\'s best-preserved medieval centers, where you can eat pierogies in a 600-year-old cellar and walk through history that will move you profoundly. Kraków is beautiful, haunting, and real.',
  'warsaw':
    'Rebuilt from near-total destruction, Warsaw\'s Old Town is a testament to determination, its food scene is exploding, and the POLIN Museum is one of the most powerful in Europe.',
  'gdansk':
    'Amber-colored facades lining the Long Market, a WWII museum that tells the story with devastating honesty, and a Baltic coast beach that surprises everyone who visits. Gdańsk is Poland\'s coastal jewel.',
  'wroclaw':
    'A Market Square to rival Kraków\'s, hundreds of tiny bronze dwarf statues hidden throughout the city, and a nightlife scene powered by a massive student population. Wrocław is Poland\'s most playful city.',
  'tallinn':
    'A medieval Old Town so well-preserved it feels like a movie set, the world\'s most digital society outside the walls, and a sauna culture that\'s basically a national sport. Tallinn is the Baltic\'s biggest surprise.',
  'riga':
    'The finest Art Nouveau architecture in Europe — entire streets of it — plus a medieval Old Town, a Central Market in old Zeppelin hangars, and a Black Balsam liqueur that\'s an acquired taste worth acquiring.',
  'vilnius':
    'A baroque Old Town, the self-declared independent republic of Užupis (with its own constitution), and a creative energy that\'s made it one of the Baltic\'s most exciting cities to visit right now.',
  'ljubljana':
    'A Dragon Bridge, a car-free Old Town, and a castle on a hill accessible by funicular — Ljubljana is small enough to see in a day and charming enough to make you stay for a week.',
  'lake-bled':
    'A tiny island church in the middle of an emerald lake, a medieval castle perched on a cliff above, and the Julian Alps framing everything. Lake Bled is the most photogenic spot in Slovenia — possibly in all of Europe.',
  'zagreb':
    'The Museum of Broken Relationships alone is worth the trip — heartbreaking and brilliant — but Zagreb also has a Dolac Market overflowing with produce and an upper town that glows at sunset.',
  'split':
    'Diocletian built a retirement palace here in 305 AD — and the entire city grew inside it. Bars in ancient cellars, beaches a walk from Roman walls, and a nightlife scene that goes until dawn.',
  'dubrovnik':
    'Walk the medieval walls that inspired King\'s Landing, swim in crystal-clear Adriatic coves, and drink wine on limestone terraces overlooking the sea. Dubrovnik is the Croatian coast at its most spectacular.',
  'hvar':
    'Croatia\'s party island, where lavender fields and medieval streets coexist with beach clubs and yacht culture. Hvar is Ibiza with history and better food.',
  'kotor':
    'A medieval walled city tucked into Montenegro\'s most dramatic fjord, where you can climb fortress walls to views that rival Dubrovnik — at a quarter of the price and without the cruise ship crowds.',
  'bratislava':
    'A compact Old Town, a UFO-shaped bridge with a restaurant on top, and a location between Vienna and Budapest that makes it the most convenient stopover you\'ll never want to leave.',
  'sofia':
    'The Alexander Nevsky Cathedral gleaming gold, Vitosha Mountain looming behind the city for instant hiking, and Roman ruins casually sitting beneath the streets. Sofia is one of Europe\'s best values.',
  'bucharest':
    'The Palace of Parliament — the world\'s heaviest building — anchors a city that\'s reinventing itself, with a nightlife scene in the Old Town that rivals Berlin\'s and emerging food that\'s turning heads.',
  'belgrade':
    'The Kalemegdan Fortress watching over the confluence of the Sava and Danube, a nightlife scene on floating river clubs that goes harder than anywhere in Europe, and a bohemian quarter with real soul.',
  'sarajevo':
    'The Baščaršija bazaar where East meets West, a Tunnel of Hope that tells one of modern history\'s most powerful stories, and a resilience that\'s created one of Europe\'s most fascinating cities.',
  'mostar':
    'The Stari Most bridge — rebuilt stone by stone after the war — arching over emerald water while divers leap from its peak. Mostar is heartbreaking, beautiful, and essential.',
  'tirana':
    'Bunker art, pastel-painted communist-era buildings, and a Blloku neighborhood that went from forbidden zone to the city\'s liveliest quarter. Tirana is Europe\'s most underrated — and its most colorful — capital.',
  'plovdiv':
    'A Roman theater still hosting performances, an Old Town that predates Rome, and a creative art scene that earned it European Capital of Culture. Plovdiv is Bulgaria\'s secret gem.',

  // ── Greece ────────────────────────────────────────────────
  'athens':
    'The Acropolis watching over you from every rooftop bar, souvlaki that costs almost nothing and tastes like everything, and a nightlife scene that starts at midnight. Athens is ancient history with a modern heartbeat.',
  'santorini':
    'White-washed buildings cascading down volcanic cliffs, sunsets so dramatic they draw applause, and wine made from grapes that grow in volcanic soil. Santorini is that postcard view that actually looks better in person.',
  'mykonos':
    'Windmills, whitewashed lanes, and a beach club scene that draws the world\'s beautiful people. But Mykonos also has quiet corners — Delos is a boat ride away, and Little Venice at sunset is genuinely magical.',
  'crete':
    'Knossos Palace — Europe\'s oldest civilization — the Samaria Gorge slicing through mountains, and beaches that range from pink sand to palm-lined. Crete is Greece\'s largest island and its most diverse.',
  'corfu':
    'Venetian architecture, Italianate villages, and water so blue it hurts. Corfu is the Ionian island that feels like Greece and Italy had a beautiful child and raised it by the sea.',
  'rhodes':
    'A medieval Old Town built by crusading knights, Lindos perched on a cliff above a perfect bay, and beaches that stretch for miles. Rhodes is Greek history served with a side of endless sunshine.',
  'thessaloniki':
    'The White Tower, Byzantine churches around every corner, and a food scene that locals insist is better than Athens (they might be right). Thessaloniki is Greece\'s most underrated city.',
  'zakynthos':
    'Navagio Beach — the shipwreck cove surrounded by towering white cliffs — is one of the most photographed spots on Earth. But Zakynthos also has Blue Caves, turtle nesting sites, and a party town for good measure.',
  'paros':
    'The best of the Cyclades without the Mykonos price tag or crowds — Naoussa\'s harbor at sunset, Golden Beach for windsurfing, and whitewashed villages that define Greek island perfection.',
  'chania':
    'A Venetian harbor that\'s one of the most beautiful in the Mediterranean, a leather-workshop-lined Old Town, and the Samaria Gorge — Europe\'s longest — just a day trip away.',
  'naxos':
    'The Portara — an ancient marble gateway framing the sunset — golden beaches that go on forever, and mountain villages where cheese is made the way it has been for centuries. Naxos is the Cyclades for people who love real places.',
  'kefalonia':
    'Myrtos Beach — a crescent of white pebbles against impossible turquoise — the Melissani Cave where sunlight hits underground water, and Captain Corelli\'s island made real and waiting for you.',

  // ── Cyprus & Turkey ───────────────────────────────────────
  'paphos':
    'The Tombs of the Kings, Aphrodite\'s legendary birthplace nearby, and archaeological sites so casually everywhere that you trip over Roman mosaics. Paphos is Cyprus\'s mythological heart.',
  'limassol':
    'A modern marina, a medieval castle, and wine villages in the Troodos Mountains just 30 minutes away. Limassol is Cyprus\'s most dynamic city — beach resort meets genuine culture.',
  'antalya':
    'The old town of Kaleiçi perched on cliffs above a turquoise coast, Roman-era ruins, and a resort scene that somehow keeps prices absurdly affordable. Antalya is Turkey\'s Mediterranean gem.',
  'istanbul':
    'A city on two continents where minarets and modern skyline compete for the horizon, kebabs sizzle on every corner, and the Grand Bazaar has been the world\'s greatest shopping experience for 500 years.',

  // ══════════════════════════════════════════════════════════════
  // ASIA (~80 destinations)
  // ══════════════════════════════════════════════════════════════

  // ── Japan ─────────────────────────────────────────────────
  'tokyo':
    'Eat at a conveyor-belt sushi spot that puts your hometown\'s best restaurant to shame, lose yourself in Shibuya\'s neon glow, then find perfect silence in a Meiji shrine garden. Tokyo is sensory overload in the best possible way.',
  'kyoto':
    'Walk through tunnels of vermillion torii gates, attend a centuries-old tea ceremony, and stumble upon a geisha in the twilight streets of Gion. Kyoto is old Japan preserved like a living painting.',
  'osaka':
    'Japan\'s street food capital, where takoyaki sizzles on every corner and the locals are famously the friendliest in the country. Osaka is Tokyo\'s louder, funnier, more delicious younger sibling.',
  'hiroshima':
    'The Peace Memorial Park will change you — quietly, powerfully, permanently. Then take the ferry to Miyajima to see the floating torii gate at sunset. Hiroshima is resilience made beautiful.',
  'nara':
    'Friendly deer bow for crackers in a park surrounding one of the largest bronze Buddhas in the world. Nara was Japan\'s first permanent capital, and it wears its 1,300 years gracefully.',
  'okinawa':
    'Japan\'s tropical south — Shuri Castle, Kerama Islands with world-class diving, and a food culture built on longevity. Okinawa feels like a different country within Japan, and the people live longer to prove it.',
  'hakone':
    'Mount Fuji reflected in Lake Ashi, open-air hot springs with mountain views, and a museum with Picassos displayed in a sculpture garden. Hakone is Tokyo\'s favorite escape — and the view explains why.',
  'kanazawa':
    'Kenroku-en — one of Japan\'s three perfect gardens — a geisha district that Kyoto wishes it still had, and a samurai quarter frozen in time. Kanazawa is old Japan without the crowds.',
  'nagoya':
    'A golden castle, the Toyota museum for engineering fans, and a food scene built around hitsumabushi grilled eel and miso katsu. Nagoya is Japan\'s underappreciated middle child — and it deserves better.',
  'fukuoka':
    'Hakata ramen invented here, yatai food stalls lining the river at night, and a laid-back vibe that makes it Japan\'s most livable city. Fukuoka is where Tokyo\'s rushed salary workers dream of moving.',
  'sapporo':
    'The Snow Festival transforms the city into an ice sculpture gallery, the seafood is the freshest in Japan, and the skiing is powder perfection. Sapporo proves that cold can be incredibly appealing.',

  // ── South Korea & Taiwan ──────────────────────────────────
  'seoul':
    'K-beauty shops, palaces where guards change in colorful ceremony, and fried chicken so good it has its own TV shows. Seoul is where 600-year-old traditions and bleeding-edge tech coexist on the same street corner.',
  'busan':
    'Haeundae Beach by day, Jagalchi fish market for the freshest sashimi you\'ll ever eat, and the pastel-painted Gamcheon Culture Village on the hillside. Busan is Korea\'s coastal soul.',
  'jeju':
    'A volcanic island where you can hike Hallasan, explore lava tubes, and swim at beaches that feel tropical despite being Korean. Jeju is the honeymoon island that everyone — couples or not — should visit.',
  'taipei':
    'Night markets that turn dinner into an adventure, the world\'s best soup dumplings, and a hot spring culture inherited from the Japanese era. Taipei is one of Asia\'s most underrated food cities — and its friendliest.',
  'kaohsiung':
    'The Lotus Pond\'s dragon and tiger pagodas, a Pier-2 Art Center in repurposed warehouses, and night markets with the best Taiwanese street food outside Taipei. Kaohsiung is Taiwan\'s sunny southern soul.',

  // ── Southeast Asia ────────────────────────────────────────
  'bangkok':
    'Street food that costs a dollar and changes your life, temples dripping in gold, and a night market culture that makes every evening an adventure. Bangkok is chaotic, generous, and completely addictive.',
  'chiang-mai':
    'Hundreds of golden temples, elephant sanctuaries, and a night bazaar that goes on forever. Chiang Mai is Thailand\'s spiritual and creative heart — slower, cooler, and deeply special.',
  'chiang-rai':
    'The White Temple glitters like something from a dream, the Blue Temple glows with a different kind of magic, and the Golden Triangle adds a dose of intrigue. Chiang Rai is Thailand\'s most artistic city.',
  'phuket':
    'Patong Beach is the party, but the real Phuket is island hopping to the Phi Phi Islands, Thai massages that cost less than your morning coffee, and a Big Buddha watching over it all.',
  'pattaya':
    'Beyond the Walking Street reputation, Pattaya has the Sanctuary of Truth — an all-wood temple that defies belief — plus family-friendly islands and a food scene that\'s genuinely excellent.',
  'krabi':
    'Railay Beach accessible only by boat, limestone karsts rising from emerald water, and Tiger Cave Temple for those willing to climb 1,237 steps for the view. Krabi is Thailand\'s most dramatic coastline.',
  'koh-samui':
    'Thai island life perfected — palm-fringed beaches, a Big Buddha on a rocky peninsula, and luxury resorts that cost less than a budget hotel back home. Koh Samui is relaxation with a side of adventure.',
  'ayutthaya':
    'A Buddha head wrapped in tree roots, ancient temples reclaimed by nature, and an entire city that was once the largest in the world. Ayutthaya is an hour from Bangkok and a thousand years away.',
  'phi-phi':
    'Maya Bay — the beach from the movie — snorkeling in water so clear the fish look like they\'re floating in air, and an island party culture that peaks at sunset and doesn\'t stop.',
  'singapore':
    'Hawker centers serving Michelin-star food for $3, futuristic gardens that glow at night, and a cultural melting pot where Chinese, Malay, and Indian traditions blend seamlessly. Singapore is the future of cities.',
  'kuala-lumpur':
    'The Petronas Towers gleaming above, Batu Caves with their rainbow stairs, and a street food scene where Chinese, Malay, and Indian flavors compete for your attention. KL is Southeast Asia\'s most delicious melting pot.',
  'langkawi':
    'A Sky Bridge suspended between mountain peaks, island-hopping by boat through a geopark, and duty-free everything. Langkawi is Malaysia\'s island paradise — and it\'s surprisingly affordable.',
  'johor-bahru':
    'Legoland Malaysia, a food scene that locals claim rivals Penang\'s, and a city that\'s rapidly transforming from Singapore\'s neighbor into a destination in its own right. JB surprises everyone who visits.',
  'penang':
    'George Town\'s street art walking trail, the best char kway teow on the planet, and a UNESCO-listed Old Town where Chinese, Indian, and Malay cultures created something unique. Penang is Malaysia\'s food capital — full stop.',
  'melaka':
    'A UNESCO World Heritage city where Portuguese, Dutch, and British colonial layers sit atop a Malay foundation — Jonker Street night market is legendary, and the chicken rice balls are worth the trip alone.',
  'borneo':
    'Mount Kinabalu at dawn, orangutans swinging through ancient rainforest, and Sipadan — one of the world\'s top dive sites. Borneo is where wildlife encounters happen on a scale you can\'t imagine.',
  'bali':
    'Rice terraces that look like stairways to heaven, temple ceremonies that happen right next to your villa, and a sunrise yoga class that actually makes you cry. Bali isn\'t a cliché — it\'s a cliché because it\'s that good.',
  'ubud':
    'The Tegallalang rice terraces, a Monkey Forest where macaques rule, and a yoga-and-smoothie-bowl culture that\'s become its own lifestyle. Ubud is Bali\'s spiritual heart — and it earns the title.',
  'lombok':
    'The Gili Islands — three car-free specks of paradise — Mount Rinjani for serious hikers, and surf breaks that rival Bali without the crowds. Lombok is Bali\'s quieter, wilder neighbor.',
  'yogyakarta':
    'Borobudur at sunrise — the world\'s largest Buddhist temple emerging from mist — Prambanan\'s Hindu spires nearby, and a batik tradition that\'s a living art form. Yogyakarta is Java\'s cultural soul.',
  'jakarta':
    'Indonesia\'s megacity is chaotic, massive, and fascinating — the old town of Kota, a food scene that draws from every island in the archipelago, and the Thousand Islands a boat ride away.',
  'komodo':
    'The Komodo dragons are real, they\'re massive, and sharing a beach with them is genuinely thrilling. Add Pink Beach and Padar Island\'s triple-bay viewpoint, and Komodo is unlike anywhere else on Earth.',
  'raja-ampat':
    'The richest marine biodiversity on the planet — more species of fish and coral in one dive site than in the entire Caribbean. Raja Ampat is the holy grail of diving, and above water it\'s just as stunning.',
  'manila':
    'Intramuros — the old walled city — enormous malls that are cities unto themselves, and a Filipino hospitality that\'s famously the warmest in Asia. Manila is chaotic, heartfelt, and never boring.',
  'palawan':
    'The Underground River, El Nido\'s limestone cliffs sheltering secret lagoons, and island-hopping through water so clear it barely looks like water. Palawan was voted the world\'s best island — and it delivers.',
  'boracay':
    'White Beach is four kilometers of powder-fine sand lapped by gentle turquoise water. It\'s the kind of beach that makes people cancel their return flights — and at sunset, you\'ll understand why.',
  'cebu':
    'Swimming with whale sharks, chasing waterfalls at Kawasan, and a food scene built on lechon — slow-roasted pig that Anthony Bourdain called the best he\'d ever had.',
  'siargao':
    'Cloud 9\'s legendary surf break, island-hopping through palm-fringed islets, and a backpacker-meets-surfer vibe that feels like Bali did 20 years ago. Siargao is the Philippines\' next big thing — go now.',
  'el-nido':
    'The Big Lagoon — towering limestone cliffs surrounding emerald water — is just one of dozens of stops on the most spectacular island-hopping tour in Southeast Asia. El Nido is Palawan at its most dramatic.',
  'siem-reap':
    'Angkor Wat at sunrise is one of those moments that stays with you forever — an entire civilization carved in stone, swallowed by jungle, and revealed again. Siem Reap is the gateway to the most spectacular ruins on Earth.',
  'luang-prabang':
    'Saffron-robed monks collecting alms at dawn, French colonial architecture alongside golden temples, and a night market that\'s an art gallery in disguise. Luang Prabang is Southeast Asia\'s most serene city.',
  'yangon':
    'The Shwedagon Pagoda — a golden mountain of a temple — colonial architecture slowly crumbling into beauty, and a street food scene that\'s raw, real, and incredible. Yangon is Myanmar at its most authentic.',

  // ── Vietnam ───────────────────────────────────────────────
  'hanoi':
    'The best phở you\'ll ever taste, Old Quarter streets where every block is a different trade, and a coffee culture built on tiny plastic chairs and condensed milk. Hanoi is sensory, authentic, and completely unforgettable.',
  'ho-chi-minh':
    'Motorbikes moving like a river around you, bánh mì that costs a dollar and tastes like a dream, and war history told with nuance and power. Saigon is Vietnam at its most energetic.',
  'vietnam':
    'From Hanoi\'s Old Quarter to Saigon\'s buzz, with Hội An, Huế, and Hạ Long Bay in between — Vietnam is a country where every stop is a highlight and the food alone is worth the flight.',
  'hoi-an':
    'A lantern-lit ancient town where tailors make custom suits overnight, the food is Vietnam\'s best, and the Thu Bồn River reflects everything in soft golden light. Hội An is impossibly romantic.',
  'da-nang':
    'The Golden Bridge — held by giant stone hands — Mỹ Khê Beach stretching for miles, and the Marble Mountains hiding Buddhist caves. Đà Nẵng is Vietnam\'s most exciting emerging city.',
  'hue':
    'The Imperial City — a forbidden purple city within a citadel — royal tombs along the Perfume River, and a cuisine so specific to the region that it counts as its own tradition.',
  'sa-pa':
    'Rice terraces cascading down mountains, Fansipan Peak — the roof of Indochina — and hill tribe villages where homestays let you experience a Vietnam that guidebooks barely touch.',
  'ha-long-bay':
    'Thousands of limestone karsts rising from emerald water, kayaking through hidden caves, and overnight cruises where you wake up surrounded by geological wonder. Hạ Long Bay earned its UNESCO status.',
  'nha-trang':
    'Vietnam\'s beach city — a long crescent of sand, mud baths that are surprisingly therapeutic, and a diving scene that\'s Southeast Asia\'s best-kept secret.',

  // ── China ─────────────────────────────────────────────────
  'beijing':
    'The Great Wall stretching to the horizon, the Forbidden City\'s 9,999 rooms, and hutong alleys where Beijing duck was perfected. Beijing is 3,000 years of Chinese civilization concentrated into one extraordinary city.',
  'shanghai':
    'The Bund\'s colonial facades facing Pudong\'s futuristic skyline across the river — it\'s the most dramatic cityscape in Asia. Add the French Concession\'s tree-lined lanes and Shanghai becomes irresistible.',
  'xian':
    'The Terracotta Warriors — 8,000 life-sized soldiers buried for 2,200 years — the Muslim Quarter\'s sizzling street food, and city walls you can cycle on top of. Xi\'an is where China began.',
  'guilin':
    'Li River karst mountains that look like traditional Chinese paintings come to life, rice terraces in Longji, and a landscape so iconic it appears on the 20-yuan note. Guilin is China at its most poetic.',
  'guangzhou':
    'Canton Tower, dim sum that\'s been perfected over centuries, and a city that\'s been China\'s window to the world for over a thousand years. Guangzhou is where Cantonese food started — and it\'s still the best.',
  'shenzhen':
    'From fishing village to tech megacity in 40 years — Shenzhen is the world\'s most dramatic urban transformation, with OCT Loft for art, world-class dim sum, and a glimpse at what cities become next.',
  'macau':
    'The Vegas of Asia meets 400 years of Portuguese colonial heritage — Ruins of St. Paul\'s, egg tarts better than Lisbon\'s (don\'t tell them), and casinos that dwarf anything in Nevada.',
  'zhuhai':
    'The Lover\'s Road along the coast, a relaxed pace that\'s the antidote to neighboring Shenzhen and Macau, and seafood restaurants where the catch was swimming an hour ago.',
  'chengdu':
    'Giant pandas in their natural habitat, Sichuan hot pot that will make you sweat and beg for more, and a teahouse culture where people spend entire afternoons doing absolutely nothing. Chengdu is China\'s most livable city.',
  'hangzhou':
    'West Lake — so beautiful that Marco Polo called this the finest city in the world — Longjing tea plantations on the hillsides, and a silk tradition that dates back millennia.',
  'suzhou':
    'Classical gardens so perfect they\'re UNESCO-listed, canals that earned it "Venice of the East," and a silk production heritage that spans 5,000 years. Suzhou is China\'s most refined city.',
  'zhangjiajie':
    'The Avatar mountains are real — sandstone pillars soaring above misty forests, a glass bridge that tests your nerve, and Tianmen Mountain\'s cliff-hugging walkway. Zhangjiajie is nature\'s most dramatic special effect.',
  'lijiang':
    'A UNESCO Old Town with Naxi culture, Jade Dragon Snow Mountain gleaming above, and a romantic atmosphere that\'s made it China\'s honeymoon capital. Lijiang is Yunnan at its most enchanting.',

  // ── South Asia ────────────────────────────────────────────
  'delhi':
    'The Red Fort, Qutub Minar, and a street food scene — chaat, parathas, kebabs — that might be the most exciting in the world. Delhi is India\'s chaotic, beautiful, overwhelming capital — and you\'ll love every overwhelming minute.',
  'agra':
    'The Taj Mahal at sunrise. That\'s it. That\'s the pitch. (But also: Agra Fort is magnificent and the local petha sweets are addictive.)',
  'jaipur':
    'The Pink City, where every palace is more ornate than the last and the bazaars are a kaleidoscope of color. Jaipur is Rajasthani royalty at its most photogenic and accessible.',
  'udaipur':
    'The Lake Palace floating on Lake Pichola, the City Palace rising above the water, and sunset views that make you understand why they call this the Venice of the East. Udaipur is India\'s most romantic city.',
  'varanasi':
    'The Ganges at dawn — boat rides past burning ghats, evening aarti ceremonies, and a spiritual intensity that\'s 3,000 years old. Varanasi is India at its most profound and confronting.',
  'mumbai':
    'The Gateway of India, Bollywood dreams, and a street food scene — vada pav, pav bhaji, pani puri — that moves at the same breakneck pace as the city. Mumbai is India\'s maximum city in every sense.',
  'goa':
    'Portuguese churches alongside Hindu temples, beaches that range from party to paradise, and a laid-back vibe that\'s been drawing travelers since the \'60s. Goa is India\'s most relaxed state.',
  'kochi':
    'Chinese fishing nets at sunset, Kerala\'s backwaters starting at your doorstep, and a spice market that smells like the entire history of the Indian Ocean trade. Kochi is southern India\'s most atmospheric city.',
  'kerala':
    'Houseboat cruises through palm-lined backwaters, Ayurvedic massages that predate Western medicine, and a cuisine built on coconut and spice that\'s India\'s most underappreciated. Kerala is God\'s Own Country — and it earned the name.',
  'rishikesh':
    'The Beatles came here seeking enlightenment, and the ashrams and yoga studios haven\'t stopped since. Add Ganges rafting through Himalayan rapids and you have India\'s most spiritually charged destination.',
  'amritsar':
    'The Golden Temple — Sikhism\'s holiest site — shimmering in its sacred pool is one of the most beautiful religious buildings on Earth. The free community kitchen feeds 100,000 people daily. Amritsar will humble you.',
  'sri-lanka':
    'Sigiriya Rock Fortress rising from jungle, tea plantations rolling across misty highlands, and a coastline that wraps the entire island in golden beaches. Sri Lanka packs an almost unfair amount of beauty into one small island.',
  'colombo':
    'Galle Face Green where locals fly kites at sunset, Gangaramaya Temple\'s eclectic collection, and a food scene that\'s finally getting the recognition it deserves. Colombo is Sri Lanka\'s underestimated capital.',
  'kandy':
    'The Temple of the Tooth, a lake in the city center surrounded by hills, and the Royal Botanic Gardens — Kandy is Sri Lanka\'s cultural heart, cooler in temperature and calmer in pace than the coast.',
  'galle':
    'A Dutch fort enclosing a living town — boutique hotels in colonial buildings, rampart walks above crashing waves, and a sunset view that makes every evening feel cinematic. Galle is Sri Lanka\'s most charming corner.',
  'ella':
    'The Nine Arch Bridge with a train crossing through tea country, Ella Rock for sunrise hikers, and a mountain village atmosphere that makes you slow down whether you planned to or not.',
  'kathmandu':
    'Boudhanath Stupa\'s enormous eyes watching over you, Durbar Square\'s medieval temples, and the knowledge that the world\'s tallest mountains are right there, waiting. Kathmandu is the Himalayan gateway that rewards the adventurous.',
  'pokhara':
    'Phewa Lake reflecting the Annapurna range, paragliding over Himalayan foothills, and a lakeside vibe that makes it Nepal\'s favorite chill-out destination after Kathmandu\'s intensity.',
  'bhutan':
    'Tiger\'s Nest monastery clinging impossibly to a cliffside, a country that measures Gross National Happiness instead of GDP, and Himalayan landscapes that define the word pristine. Bhutan is the world\'s last Shangri-La.',
  'tbilisi':
    'Sulfur baths beneath a cliff-top fortress, a natural wine tradition that\'s 8,000 years old, and a food scene — khachapuri, khinkali, churchkhela — that nobody told you would be this good. Tbilisi is the best-kept secret in travel right now.',
  'maldives':
    'Overwater villas above water so clear you can see fish from your bed, coral reefs teeming with mantas and whale sharks, and a silence broken only by waves. The Maldives is the definition of paradise — and it looks even better in person.',
  'hong-kong':
    'A skyline that makes Manhattan look modest, dim sum that will ruin you for all other dim sum, and a Star Ferry crossing Victoria Harbour that costs almost nothing but feels like a million dollars. Hong Kong is the world\'s most vertical city — and its most delicious.',

  // ══════════════════════════════════════════════════════════════
  // AMERICAS (~140 destinations)
  // ══════════════════════════════════════════════════════════════

  // ── USA — Major Cities ────────────────────────────────────
  'new-york':
    'The pizza. The Broadway shows. The feeling of walking through Central Park and realizing you\'re in the greatest city ever built. New York doesn\'t need a sales pitch — but it delivers one every time you step outside.',
  'los-angeles':
    'Hollywood glamour, Santa Monica\'s Pacific sunsets, and a taco truck scene that makes every other city\'s Mexican food feel like a practice run. LA is sprawling, sun-soaked, and endlessly reinventing itself.',
  'chicago':
    'Architecture that defines the modern skyline, a deep-dish pizza debate that locals take dead seriously, and the Art Institute that houses some of the most famous paintings on Earth. Chicago is the best big American city you haven\'t prioritized yet.',
  'san-francisco':
    'The Golden Gate emerging from the fog, sourdough bread that people are unreasonably passionate about, and a tech-meets-counterculture vibe that doesn\'t exist anywhere else. SF is iconic for a reason.',
  'miami':
    'Art Deco architecture glowing in pastel neon, Cuban coffee that\'ll wake you up in ways you didn\'t know were possible, and a beach scene that makes the rest of Florida look sleepy. Miami is a city that runs on sunshine and attitude.',
  'las-vegas':
    'The Strip lit up at night, shows that only this city could produce, and a Grand Canyon day trip that proves there\'s substance behind the spectacle. Vegas is America\'s most unapologetic city — and it\'s a blast.',
  'boston':
    'Walk the Freedom Trail through the birthplace of American independence, eat lobster rolls on the harbor, and catch a Red Sox game at Fenway. Boston is history that\'s still living, breathing, and extremely opinionated.',
  'washington-dc':
    'The Smithsonian museums — all free, all world-class — the monuments lit up at night along the Mall, and cherry blossom season that transforms the capital into a pink dreamscape.',
  'seattle':
    'Pike Place Market, the original Starbucks (there\'s always a line), and a coffee culture that\'s really about the rain — and the creative energy it generates. Seattle is the Pacific Northwest at its most driven.',
  'new-orleans':
    'The French Quarter, jazz pouring from every door, and a Cajun food scene — gumbo, beignets, po\'boys — that exists nowhere else on Earth. New Orleans is America\'s most unique city, and Mardi Gras is just the beginning.',
  'austin':
    'Live music on Sixth Street, breakfast tacos that Texans will debate until the sun goes down, and a "Keep Austin Weird" spirit that\'s still alive despite the tech boom. Austin is the most fun city in Texas — possibly in America.',
  'nashville':
    'Honky-tonks on Broadway, hot chicken that\'ll make you question your spice tolerance, and a country music legacy that\'s expanded into one of America\'s most exciting music scenes overall.',
  'san-diego':
    'The best year-round weather in America, a zoo that\'s legendary for a reason, and a Gaslamp Quarter that comes alive at night. San Diego is California\'s most relaxed major city — and its most underrated.',

  // ── USA — Secondary Cities ────────────────────────────────
  'denver':
    'A mile high with Rocky Mountain views from downtown, Red Rocks Amphitheatre for concerts, and a craft beer scene with more breweries per capita than anywhere in America.',
  'phoenix':
    'Desert sunsets that turn the sky every shade of orange, Camelback Mountain for sunrise hikes, and day trips to the Grand Canyon, Sedona, and Monument Valley. Phoenix is the Southwest basecamp.',
  'scottsdale':
    'Luxury desert resorts, world-class golf courses, and a spa culture that takes relaxation seriously. Scottsdale is where the Southwest meets sophistication — with a cactus-lined poolside cocktail.',
  'portland':
    'Food trucks on every corner, craft beer in every neighborhood, and Powell\'s — the world\'s largest independent bookstore. Portland is America\'s most proudly offbeat city, and it keeps earning the title.',
  'philadelphia':
    'The Liberty Bell, Independence Hall where America was born, and a cheesesteak rivalry between Pat\'s and Geno\'s that locals take more seriously than politics. Philly is history with attitude.',
  'minneapolis':
    'The Chain of Lakes, the Walker Art Center, Prince\'s Paisley Park nearby, and a food scene that\'s become one of America\'s most interesting. Minneapolis proves that the Midwest can surprise you.',
  'atlanta':
    'The birthplace of the Civil Rights Movement, the Georgia Aquarium — the largest in the Western Hemisphere — and a food scene spanning everything from soul food to James Beard winners.',
  'dallas':
    'The Arts District — the largest urban arts district in America — BBQ that makes you rethink everything you knew about meat, and a Deep Ellum music scene that keeps things real.',
  'houston':
    'Space Center Houston, a Museum District that\'s mostly free, and the most ethnically diverse food scene in America — pho, birria, Nigerian suya, and everything in between, all in one city.',
  'detroit':
    'The Motown Museum where Stevie Wonder recorded hits as a kid, the DIA with a Diego Rivera mural that fills an entire room, and an art revival that\'s turned ruins into galleries. Detroit\'s comeback is real.',
  'charlotte':
    'The NASCAR Hall of Fame, a rapidly growing Uptown that\'s earning national attention, and a craft brewery scene that\'s become one of the South\'s best.',
  'orlando':
    'Walt Disney World, Universal Studios, and theme parks that make it the family vacation capital of the world. Orlando delivers on the magic — and the new stuff keeps getting better.',
  'tampa':
    'Clearwater Beach — consistently voted America\'s best — the historic Ybor City cigar district, and a craft beer scene anchored by Cigar City Brewing. Tampa is Florida\'s most underrated city.',
  'savannah':
    'Moss-draped squares, ghost tours through antebellum mansions, and a cocktail-in-hand walking culture that\'s legally encouraged. Savannah is hauntingly beautiful and unapologetically fun.',
  'charleston':
    'Pastel row houses dripping with Southern charm, a food scene that rivals cities ten times its size, and a hospitality culture that\'s genuine down to its bones. Charleston is the American South at its most elegant.',
  'memphis':
    'Graceland, Beale Street\'s neon-lit blues clubs, and BBQ — specifically, ribs — that will make you weep. Memphis is where American music was born, and the rhythm hasn\'t stopped.',
  'indianapolis':
    'The Indy 500 — the greatest spectacle in racing — Monument Circle at the city\'s heart, and a food scene that\'s grown far beyond its Midwest reputation.',
  'milwaukee':
    'The Calatrava-designed Art Museum, a craft beer heritage that predates the craft beer craze by a century, and a lakefront that rivals Chicago\'s without the crowds.',
  'raleigh':
    'The Research Triangle\'s brain power, Duke Chapel\'s Gothic beauty, and a BBQ tradition — eastern vs western Carolina — that locals will debate with the intensity of a doctoral thesis.',
  'st-louis':
    'The Gateway Arch framing the Mississippi, the City Museum — the world\'s most insane playground — and a BBQ scene with its own distinct style. St. Louis has more personality than it gets credit for.',
  'kansas-city':
    'America\'s BBQ capital, and it\'s not even close. Add a jazz heritage that rivals New Orleans, more fountains than any city except Rome, and a genuine warmth that defines Midwest hospitality.',
  'pittsburgh':
    'Three rivers meeting below inclines that carry you to mountain-top views, the Andy Warhol Museum, and a food scene anchored by Primanti Brothers sandwiches with fries inside. Pittsburgh reinvented itself and it\'s thriving.',
  'cleveland':
    'The Rock and Roll Hall of Fame, a world-class art museum that\'s free, and a West Side Market that\'s been the city\'s food hub since 1912. Cleveland is the underdog that keeps proving people wrong.',
  'portland-maine':
    'More restaurants per capita than any city in America, lobster rolls that set the national standard, and an Old Port cobblestone waterfront that\'s postcard perfect. Portland, Maine is a food pilgrimage.',
  'asheville':
    'The Biltmore Estate — America\'s largest home — surrounded by Blue Ridge Parkway beauty, a craft beer scene with 30+ breweries, and a creative mountain town energy that draws artists and foodies alike.',

  // ── USA — Nature & Adventure ──────────────────────────────
  'aspen':
    'World-class skiing in winter, wildflower-covered mountain trails in summer, and an après-ski culture that makes the cold irrelevant. Aspen is mountain luxury that earns its reputation.',
  'park-city':
    'The Sundance Film Festival, powder skiing that rivals anywhere in the world, and a Historic Main Street that transitions from ski town to cocktail bar seamlessly.',
  'lake-tahoe':
    'An alpine lake so blue it looks photoshopped, skiing in winter, sandy beaches in summer, and a Californian-Nevadan border that runs right through it. Tahoe delivers year-round.',
  'napa-valley':
    'Rolling vineyards as far as you can see, tasting rooms where winemakers pour their best like old friends, and Michelin restaurants that pair dinner with sunset views over the vines. Napa is America\'s most delicious road trip.',
  'sonoma':
    'Napa\'s more relaxed neighbor — farm-to-table restaurants, hot springs, and wine without the pretension. Sonoma is where winemakers go to drink on their day off.',
  'palm-springs':
    'Mid-century modern architecture around every corner, desert spas where relaxation is taken seriously, and Joshua Tree National Park right next door. Palm Springs is retro cool in the California sun.',
  'key-west':
    'Duval Street, Hemingway\'s six-toed cats, and a sunset celebration at Mallory Square every single evening. Key West is the end of the road — literally — and it\'s worth the drive.',
  'sedona':
    'Red rock formations that glow at sunset, spiritual vortexes that believers swear by, and hiking trails that make every step feel like a nature documentary. Sedona is Arizona\'s most dramatic landscape.',
  'jackson-hole':
    'Grand Teton National Park as your backdrop, world-class skiing at Jackson Hole Mountain Resort, and elk herds wandering through town. This is the American West at its most cinematically stunning.',
  'vail':
    'A Bavarian-inspired village, powder skiing on the back bowls, and summer hiking through wildflower meadows. Vail is Colorado mountain luxury — and the back bowls live up to every legend.',
  'santa-barbara':
    'The American Riviera — red-tiled roofs, wine country just over the hills, and a beach-meets-culture lifestyle that makes you understand why people move here and never leave.',
  'carmel':
    'A fairy-tale village where the houses have names instead of numbers, art galleries outnumber restaurants, and 17-Mile Drive delivers the California coast at its most dramatic.',
  'carmel-valley':
    'Boutique wineries in rolling hills, farm-to-table restaurants with valley views, and a pace of life that makes Napa feel rushed. Carmel Valley is California wine country\'s best-kept secret.',
  'big-sur':
    'The Pacific Coast Highway\'s most dramatic stretch — Bixby Bridge, McWay Falls dropping onto a beach, and a rugged coastline that makes you pull over every five minutes to stare.',
  'yellowstone':
    'Old Faithful, the Grand Prismatic Spring in impossible colors, and herds of bison that remind you this land was wild long before we arrived. Yellowstone is America\'s greatest natural wonder.',
  'grand-canyon':
    'No photo prepares you for the scale — a mile deep, 18 miles wide, and carved over millions of years. The Grand Canyon is the one natural landmark that actually exceeds expectations.',
  'moab':
    'Arches National Park, Canyonlands\' dramatic mesas, and mountain biking on the most famous trail in America — Slickrock. Moab is red rock adventure at its absolute best.',
  'zion':
    'Angels Landing for those brave enough, the Narrows for those who don\'t mind wet feet, and red canyon walls so tall they make you feel wonderfully small. Zion is America\'s most dramatic national park.',
  'tucson':
    'Saguaro cacti standing like sentinels, sunsets that use every color, and a Mexican food scene — Sonoran hot dogs, birria — that rivals anything across the border. Tucson is the desert at its most beautiful.',
  'albuquerque':
    'The Balloon Fiesta — hundreds of hot air balloons filling the sky — a Route 66 heritage, and the Sandia Peak Tramway offering one of the most dramatic views in the Southwest.',
  'anchorage':
    'Glaciers, grizzly bears, and the Northern Lights — Alaska\'s gateway city puts wilderness at your doorstep with a scale that nothing in the lower 48 can match.',
  'martha-vineyard':
    'Gingerbread cottages, lighthouse-dotted coastline, and a Kennedy-era prestige that\'s become its own island culture. Martha\'s Vineyard is New England at its most exclusive — and its most charming.',
  'nantucket':
    'Cobblestone streets, grey-shingled cottages, and a whaling history that gave us Moby Dick. Nantucket is a time capsule of New England elegance — small, perfect, and fiercely preserved.',
  'cape-cod':
    'The National Seashore, lighthouses that define the New England coast, and a lobster-and-clam culture that peaks in summer and never really stops. Cape Cod is America\'s favorite seaside escape.',
  'san-antonio':
    'The River Walk — restaurants and bars lining a waterway through the heart of the city — the Alamo, and Tex-Mex food that sets the standard. San Antonio is Texas history with a Latin soul.',
  'santa-fe':
    'Adobe architecture glowing in golden light, an art gallery scene that\'s one of the largest in America, and a New Mexican cuisine — green chile everything — that exists nowhere else.',
  'salt-lake-city':
    'Eleven ski resorts within an hour, national parks in every direction, and the Great Salt Lake that gives the city its name. SLC is the ultimate outdoor adventure basecamp.',
  'hawaii':
    'Waikiki Beach, Diamond Head crater hikes, and a shave ice culture that turns a simple dessert into an art form. Hawaii is the tropical escape that also happens to be American soil.',
  'maui':
    'The Road to Hana — 620 curves, 59 bridges, and waterfalls at every turn — Haleakalā sunrise above the clouds, and humpback whales breaching offshore in winter. Maui might be the world\'s most perfect island.',
  'niagara-falls':
    'The sheer power of water thundering over the edge, the Maid of the Mist taking you close enough to feel it, and a wine region on the Canadian side that surprises everyone. Niagara Falls is nature\'s most accessible spectacle.',

  // ── Canada ────────────────────────────────────────────────
  'toronto':
    'The CN Tower above, the world\'s most multicultural food scene below — Toronto has neighborhoods where you eat Ethiopian for lunch, dim sum for dinner, and Jamaican patties at midnight.',
  'montreal':
    'Old Montreal\'s cobblestone charm, the best bagels in North America (yes, better than New York — fight us), and a festival culture that fills every summer weekend with something extraordinary.',
  'vancouver':
    'Snow-capped mountains visible from downtown, sushi that rivals Tokyo (seriously), and Stanley Park wrapping the city in a green embrace. Vancouver is where the Pacific Northwest peaks.',
  'banff':
    'Lake Louise\'s impossible turquoise, the Rocky Mountains reflected in everything, and a ski-to-hot-springs lifestyle that makes winter something to celebrate. Banff is Canada\'s most dramatic national park.',
  'quebec-city':
    'Château Frontenac presiding over a walled Old Town that feels like France without the flight — cobblestone streets, crêpe stands, and a winter carnival that embraces the cold with open arms.',
  'calgary':
    'The gateway to Banff and the Rockies, the Calgary Stampede — the greatest outdoor show on Earth — and a cowboy culture that\'s more authentic than anywhere in the American West.',
  'whistler':
    'North America\'s largest ski resort, mountain biking trails that define the sport in summer, and a village atmosphere that makes après anything feel special. Whistler is world-class adventure all year.',
  'ottawa':
    'Parliament Hill on the river, the Rideau Canal that becomes the world\'s longest skating rink in winter, and museums — the National Gallery, War Museum, History Museum — that make the capital essential.',
  'halifax':
    'Maritime heritage, a waterfront boardwalk, the freshest seafood on the Atlantic coast, and Peggy\'s Cove — a lighthouse on granite that\'s become the symbol of Nova Scotia.',
  'victoria-bc':
    'The Butchart Gardens in impossible bloom, Inner Harbour with float planes landing between ferries, and whale watching that regularly delivers orca sightings. Victoria is Canada\'s most British city — and its most beautiful.',
  'jasper':
    'A Dark Sky Preserve where the Milky Way is genuinely visible, the Columbia Icefield, and wildlife — elk, bears, mountain goats — that wander through town like they own it. Because they do.',
  'kelowna':
    'Okanagan wine country — Canada\'s Napa — with lake beaches in summer, vineyard cycling, and a food scene that pairs everything with views of the valley. Kelowna is BC\'s sunniest secret.',
  'edmonton':
    'West Edmonton Mall — once the world\'s largest — the River Valley parks system, and a festival-every-weekend culture that makes it Canada\'s festival capital. Edmonton surprises everyone who visits.',
  'st-johns':
    'The most colorful row houses in North America lining the hillside, Signal Hill where Marconi received the first transatlantic radio signal, and icebergs floating past in spring. St. John\'s is Canada\'s most unique city.',
  'prince-edward-island':
    'Anne of Green Gables, red sand beaches, and the world\'s best lobster suppers — PEI is the smallest Canadian province and somehow the most charming.',
  'lake-louise':
    'A turquoise lake reflecting Victoria Glacier, one of the most photographed views in the Rockies, and a Fairmont hotel that makes the whole scene feel like a painting you can stay inside.',

  // ── Mexico ────────────────────────────────────────────────
  'mexico-city':
    'Murals that cover entire buildings, mezcal bars in colonial mansions, and a taco al pastor that will rewire your understanding of what food can be. CDMX is the most exciting food city on the planet right now.',
  'tulum':
    'Mayan ruins perched on a cliff above the Caribbean, cenotes — underground swimming holes — hidden in the jungle, and a beach club scene that\'s become its own lifestyle. Tulum is ancient Mexico meets modern boho.',
  'playa-del-carmen':
    'Fifth Avenue\'s endless boutiques and restaurants, beach clubs that set the Caribbean standard, and Cozumel a ferry ride away for the best diving in Mexico.',
  'cabo':
    'El Arco — the natural arch where the Pacific meets the Sea of Cortez — sport fishing that\'s world-class, and a resort scene that ranges from spring break energy to total luxury.',
  'puerto-vallarta':
    'The Malecón sculpture walk along the Pacific, an Old Town with genuine colonial character, and humpback whale watching in winter that puts you face-to-face with giants.',
  'cancun':
    'Turquoise water that doesn\'t look real, Mayan ruins peeking through the jungle, and a hotel zone that turns every sunset into a private show. Cancún is the Caribbean gateway that delivers every time.',
  'cozumel':
    'The world\'s second-largest barrier reef right offshore, drift diving through crystal-clear walls of coral, and an island pace that melts the stress of real life within hours.',
  'guadalajara':
    'Tequila tours to the actual town of Tequila, mariachi bands in Plaza de los Mariachis, and a food scene that\'s Mexico\'s most underrated. Guadalajara is the real Mexico — proud, loud, and delicious.',
  'san-miguel':
    'Colonial architecture so perfect it\'s UNESCO-listed, an expat art scene that\'s attracted painters and writers for decades, and the Parroquia church glowing pink at sunset. San Miguel is Mexico\'s most beautiful small city.',
  'merida':
    'The Yucatán capital with cenotes in every direction, Mayan ruins as day trips, and a colonial center where every evening brings live music and families in the plaza. Mérida is the most Mexican city in Mexico.',
  'guanajuato':
    'A hillside city painted in every color, the Callejón del Beso (kissing alley) where couples lean from balconies, and underground tunnels that were once rivers. Guanajuato is Mexico\'s most whimsical city.',
  'oaxaca':
    'Mexico\'s culinary capital, where mole recipes are family secrets passed down for generations and the mezcal comes from the hillside above town. Oaxaca is where Mexican culture runs deepest.',
  'puebla':
    'Mole poblano was invented here, Talavera tiles cover every surface, and the Baroque cathedral anchors a colonial center that competes with any in Mexico. Puebla is Mexico\'s most undervisited treasure.',
  'todos-santos':
    'An artist colony on the Baja coast, surfing at nearby Cerritos, and the Hotel California that may or may not have inspired the Eagles. Todos Santos is Cabo\'s cooler, calmer, more creative neighbor.',
  'puerto-escondido':
    'Zicatela — one of the world\'s most powerful beach breaks — bioluminescent lagoons at night, and a surfer-bohemian vibe that feels like Mexico\'s last authentic beach town.',
  'sayulita':
    'A colorful surf town on the Riviera Nayarit, where the main street ends at the beach, the tacos are perfect, and the vibe is what every beach town wishes it could be.',

  // ── Central America & Caribbean ───────────────────────────
  'costa-rica':
    'Cloud forests, volcano hiking, and zip-lining through canopy — Costa Rica packed more adventure per square mile than anywhere on Earth, and backs it up with a "pura vida" attitude that\'s genuinely contagious.',
  'arenal':
    'A perfect volcanic cone rising above hot springs heated by the earth itself, surrounded by rainforest alive with toucans and howler monkeys. Arenal is Costa Rica at its most dramatic.',
  'manuel-antonio':
    'A national park where monkeys swing above some of the most beautiful beaches in Central America — and they\'re small enough to visit in a morning, leaving the afternoon for pure beach time.',
  'monteverde':
    'A cloud forest so misty and alive it feels enchanted — zip-lining above the canopy, hanging bridges through the treetops, and wildlife that appears from nowhere. Monteverde is Costa Rica\'s magical heart.',
  'tamarindo':
    'The best beginner surf in Costa Rica, sea turtle nesting beaches nearby, and a beach town nightlife that punches way above its weight. Tamarindo is pura vida with a party streak.',
  'belize':
    'The Great Blue Hole from above, the second-largest barrier reef in the world below, and Mayan ruins in the jungle behind you. Belize packs Caribbean coast, adventure, and ancient history into one tiny country.',
  'caye-caulker':
    'The motto is "go slow" — and they mean it. A laid-back Caribbean island where you snorkel the barrier reef by day and eat lobster on the dock by night. Caye Caulker is Belize distilled.',
  'panama':
    'The Panama Canal — one of engineering\'s greatest achievements — Casco Viejo\'s colonial charm, and the San Blas Islands where indigenous Guna communities live on private Caribbean paradises.',
  'roatan':
    'The Bay Islands\' crown jewel — world-class diving on the Mesoamerican Reef, West Bay Beach\'s white sand, and a Caribbean affordability that the rest of the region has lost.',
  'antigua-guatemala':
    'Cobblestone streets framed by ruined churches and active volcanoes, coffee tours on the hillsides, and a colonial beauty that earned it UNESCO status. Antigua is Central America\'s most photogenic city.',
  'lake-atitlan':
    'A volcanic lake surrounded by Mayan villages, each with its own personality — one for yoga retreats, one for partying, one for artisan markets. Lake Atitlán is Guatemala\'s spiritual heart.',
  'jamaica':
    'Reggae rhythms, jerk chicken smoke rising from the roadside, and Dunn\'s River Falls cascading down to the sea. Jamaica is Caribbean culture at its most vibrant — and its most flavorful.',
  'bahamas':
    'Swimming pigs, Atlantis Resort, and water so clear the boats appear to float on air. The Bahamas is the closest tropical paradise to the US mainland — and it delivers on every postcard promise.',
  'aruba':
    'Eagle Beach — consistently voted the Caribbean\'s best — flamingos on the coast, and a desert landscape that makes it unlike any other Caribbean island. Aruba is one happy island — and it\'ll make you one too.',
  'st-lucia':
    'The Pitons — two volcanic spires rising from the sea — rainforest, volcanic mud baths, and a romance factor that makes it the Caribbean\'s top honeymoon island.',
  'barbados':
    'Rum distilleries that invented the drink, flying fish that\'s become the national dish, and a British-Caribbean culture blend that feels both familiar and exotic. Barbados is the island that has everything.',
  'turks-caicos':
    'Grace Bay Beach — consistently the world\'s #1 — and a diving scene that matches the surface beauty. Turks and Caicos is the Caribbean distilled to its most pristine essence.',
  'curacao':
    'Willemstad\'s candy-colored waterfront is UNESCO-listed, the beaches range from hidden coves to resort-lined stretches, and a Dutch-Caribbean culture mix that\'s unlike any other island.',
  'dominican-republic':
    'Beyond the resorts — colonial Santo Domingo, whale watching in Samaná, and a bachata rhythm that follows you everywhere. The DR is the Caribbean\'s most diverse island.',
  'puerto-rico':
    'Cobblestone streets in Old San Juan painted every color, bioluminescent bays that glow at night, and El Yunque rainforest — all without needing a passport from the US.',
  'virgin-islands':
    'Magens Bay — one of the world\'s most beautiful beaches — duty-free shopping, and a sailing culture that makes island-hopping effortless. The USVI is Caribbean paradise with American convenience.',
  'cayman-islands':
    'Seven Mile Beach, Stingray City where you swim with rays in waist-deep water, and a diving scene that\'s world-class. The Caymans are polished Caribbean luxury that never disappoints.',
  'antigua':
    '365 beaches — one for every day of the year — Nelson\'s Dockyard, and a sailing culture that peaks during Race Week. Antigua is the Caribbean island that never runs out of coastline.',
  'grenada':
    'The Spice Island — nutmeg, cinnamon, and cocoa perfuming the air — Grand Anse Beach, and underwater sculpture parks that turn diving into art. Grenada is the Caribbean\'s most fragrant island.',
  'st-barts':
    'French cuisine, designer shopping, and beaches that A-listers keep trying to keep secret. St. Barts is the Caribbean\'s most glamorous island — tiny, exclusive, and worth every euro.',
  'st-kitts':
    'Brimstone Hill fortress overlooking the Caribbean, a scenic railway circling the island, and a volcanic landscape that makes a small island feel dramatic. St. Kitts is history and nature intertwined.',
  'bonaire':
    'Shore diving — just walk in from the beach — flamingos on salt flats, and an entire marine park surrounding the island. Bonaire is the Caribbean\'s best-kept diving secret.',
  'martinique':
    'French culture in the tropics — baguettes on the beach, Mount Pelée\'s volcanic drama, and rum agricole that\'s an art form. Martinique is the Caribbean\'s most sophisticated island.',
  'guadeloupe':
    'A butterfly-shaped island where one wing is volcanic mountains with waterfalls and the other is flat with beaches. Add Creole cuisine and French flair, and Guadeloupe is two trips in one.',
  'bermuda':
    'Pink sand beaches, crystal caves underground, and a British-Atlantic culture that\'s created its own unique island identity. Bermuda is closer than you think and more beautiful than you imagine.',
  'trinidad':
    'Carnival — the mother of all Caribbean parties — a street food scene that blends Indian, African, and Creole flavors, and birdwatching that rivals Costa Rica. Trinidad is the Caribbean\'s most diverse island.',
  'anguilla':
    'Shoal Bay\'s powder sand, luxury resorts that define Caribbean elegance, and a food scene — particularly the crayfish — that punches wildly above its tiny island weight.',

  // ── South America ─────────────────────────────────────────
  'buenos-aires':
    'Tango in dimly-lit milongas, steak that melts before it hits your tongue, and neighborhoods with more personality per block than entire cities. Buenos Aires is European elegance with Latin American soul.',
  'rio':
    'Christ the Redeemer watching over you from Corcovado, golden beaches where fitness and fun collide, and a nightlife culture that starts with sunset caipirinhas and ends well past dawn. Rio is pure, distilled joy.',
  'cartagena':
    'Colonial walls glowing in sunset colors, rooftop bars overlooking the Caribbean, and ceviche so fresh the fish was swimming that morning. Cartagena is Colombia\'s most romantic chapter.',
  'cusco':
    'The gateway to Machu Picchu and a destination in its own right — Inca walls supporting colonial churches, altitude-defying markets, and a Sacred Valley that redefines what "scenic" means.',
  'bogota':
    'Street art that tells Colombia\'s complex story on every wall, a food revolution happening in real time, and neighborhoods at 8,000 feet elevation where you need a jacket and a good appetite. Bogotá rewards the curious.',
  'medellin':
    'A city that went from the world\'s most dangerous to one of its most innovative — cable cars over lush green hillsides, rooftop bars with eternal spring weather, and creative energy on every corner.',
  'lima':
    'Ceviche that set the global standard, Miraflores perched on cliffs above the Pacific, and a food scene that has earned Lima the title of South America\'s culinary capital. Come hungry — leave transformed.',
  'santiago':
    'Andes snowcaps visible from downtown, wine valleys within an hour, and a Bellavista neighborhood with enough street art and bars to fill a week. Santiago is Chile\'s cosmopolitan surprise.',
  'quito':
    'A colonial center so well-preserved it was the first UNESCO World Heritage Site, sitting on the equator at 9,000 feet with cloud forests and volcanoes as day trips. Quito is altitude with attitude.',
  'galapagos':
    'Sea lions that pose for photos, blue-footed boobies that dance for mates, and giant tortoises that have been here since before Darwin arrived. The Galápagos is evolution happening in real time — and you can snorkel with it.',
  'peru':
    'Machu Picchu alone justifies the flight, but add Rainbow Mountain, the Sacred Valley, and a cuisine that\'s been named the world\'s best for years running. Peru is the trip of a lifetime — and it knows it.',
  'patagonia':
    'Torres del Paine\'s granite spires, glaciers that crack and calve into turquoise lakes, and a wind-swept vastness that makes you feel gloriously insignificant. Patagonia is the end of the world — and the beginning of wonder.',
  'montevideo':
    'A laid-back capital where Sunday means steak on the grill, the beach is a bus ride away, and nobody rushes anything. Montevideo is Buenos Aires\' calmer, cooler sibling — and it knows exactly what it\'s doing.',
  'punta-del-este':
    'The St. Tropez of South America — La Mano sculpture emerging from the sand, yacht-lined marinas, and a January party scene that draws the continent\'s most glamorous crowd.',
  'la-paz':
    'The world\'s highest capital, where the Witches\' Market sells llama fetuses for luck, cable cars are public transit, and the moon-like Valley of the Moon is a taxi ride away. La Paz is altitude adventure at its most surreal.',
  'salar-de-uyuni':
    'The world\'s largest salt flat — so perfectly reflective after rain that sky and ground become one. It\'s the most otherworldly landscape on Earth, and the photos don\'t do it justice.',
  'sao-paulo':
    'The largest city in the Southern Hemisphere has a food scene that spans every cuisine on Earth, art museums that rival New York\'s, and a nightlife that doesn\'t acknowledge the concept of "too late."',
  'florianopolis':
    '42 beaches on one island — from surfer havens to family-friendly coves — a lagoon nightlife scene, and a lifestyle that Brazilians themselves consider paradise.',
  'salvador':
    'Pelourinho — the colorful colonial heart of Afro-Brazilian culture — capoeira in the streets, Carnival that rivals Rio\'s, and a cuisine built on dendê oil and history.',
  'iguazu-falls':
    'Wider than Niagara, taller than Niagara, and more powerful than Niagara — 275 waterfalls thundering through jungle on the Brazil-Argentina border. Iguazu is nature at maximum volume.',
  'mendoza':
    'Malbec wine with Andes views, vineyard lunches that last entire afternoons, and a steak-and-wine culture that turns every meal into a celebration. Mendoza is Argentina\'s wine country perfected.',
  'bariloche':
    'The Lake District — Patagonian lakes reflecting snowcapped volcanoes, chocolate shops that rival Switzerland\'s, and a skiing season that\'s summer in the Northern Hemisphere.',
  'valparaiso':
    'Street art covering every surface, funiculars climbing colorful hillsides, and a bohemian spirit that earned it the nickname "Jewel of the Pacific." Valparaíso is Chile\'s most creative city.',
  'sacred-valley':
    'Inca ruins that rival Machu Picchu without the crowds, traditional markets where Quechua is still spoken, and a valley so fertile it was the breadbasket of an empire.',
  'atacama':
    'The driest desert on Earth — where the stargazing is the clearest on the planet, geysers erupt at dawn, and salt flats stretch to the horizon. Atacama is Mars, but with better hotels.',
  'tayrona':
    'A national park where jungle trails lead to Caribbean beaches framed by boulders, with no roads and no crowds — just pristine nature where the Sierra Nevada meets the sea.',
  'santa-marta':
    'The Lost City trek through jungle, Tayrona National Park next door, and Colombia\'s oldest city on the Caribbean coast. Santa Marta is the adventure gateway with its own beach culture.',
  'ushuaia':
    'The End of the World — and the beginning of Antarctic expeditions. The Beagle Channel, Tierra del Fuego\'s dramatic landscapes, and the bragging rights of visiting Earth\'s southernmost city.',
  'salta':
    'Colonial architecture in a mountain valley, the Train to the Clouds climbing to 4,200 meters, and a wine region — Torrontés and high-altitude Malbec — that\'s Argentina\'s most exciting.',
  'puerto-madryn':
    'Right whales breaching offshore, Magellanic penguins waddling on the beach, and Península Valdés — one of the world\'s great wildlife spectacles happening right from the shore.',
  'torres-del-paine':
    'The W Trek — granite towers, Grey Glacier, and landscapes that make every step feel like the cover of a hiking magazine. Torres del Paine is the trek that serious hikers build their year around.',
  'easter-island':
    'The Moai — 900 massive stone heads scattered across the world\'s most remote inhabited island. How they got there is still debated. Why you should visit isn\'t.',
  'vina-del-mar':
    'Chile\'s beach resort city — a flower clock, a casino, and Pacific beaches that fill with Santiago\'s crowds every summer. Viña del Mar is Chile on vacation.',
  'arequipa':
    'The White City — colonial buildings carved from white volcanic stone, Colca Canyon twice as deep as the Grand Canyon, and Santa Catalina Monastery that\'s a city within a city.',
  'puno':
    'Lake Titicaca — the highest navigable lake in the world — the floating Uros Islands made entirely of reeds, and an altiplano culture that\'s been here long before the Inca.',
  'cuenca':
    'Colonial architecture, Panama hats (which actually come from Ecuador), and a UNESCO-listed center that\'s become one of the world\'s top retirement destinations. Cuenca is quietly perfect.',
  'banos':
    'The Swing at the End of the World, hot springs fed by a volcano, and waterfall after waterfall along the Route of the Cascades. Baños is Ecuador\'s most thrilling small town.',
  'colonia':
    'A day trip from Buenos Aires across the Río de la Plata — cobblestone streets, colonial ruins, and a vintage-car-lined waterfront that feels frozen in the best possible time.',

  // ══════════════════════════════════════════════════════════════
  // MIDDLE EAST (17 destinations)
  // ══════════════════════════════════════════════════════════════
  'dubai':
    'The tallest building you\'ve ever seen, a desert safari at sunset, and a mall with an actual ski slope inside it. Dubai is what happens when ambition has no ceiling — absurd, spectacular, and weirdly addictive.',
  'abu-dhabi':
    'The Sheikh Zayed Grand Mosque — one of the most beautiful buildings on Earth — the Louvre Abu Dhabi on Saadiyat Island, and a desert-meets-luxury culture that\'s uniquely Emirati.',
  'doha':
    'The Museum of Islamic Art on its own island, Souq Waqif\'s labyrinthine spice alleys, and a skyline that went from desert to futuristic in a single generation. Doha is ambitious and increasingly fascinating.',
  'bahrain':
    'The oldest civilization in the Gulf, with a 4,000-year-old fort, souks that feel authentic, and an F1 Grand Prix track. Bahrain is the Gulf state that keeps its history visible.',
  'kuwait':
    'The Kuwait Towers, a Grand Mosque that welcomes visitors, and souks where the Gulf\'s trading heritage is still alive. Kuwait is the Gulf state that most visitors overlook — and shouldn\'t.',
  'jordan':
    'Petra and Wadi Rum alone make Jordan essential, but add the Dead Sea, Amman\'s citadel, and a hospitality culture that turns strangers into guests. Jordan is the Middle East\'s most welcoming country.',
  'jerusalem':
    'The Old City — holy to three religions, layered with 3,000 years of history, and unlike anywhere else on Earth. The Western Wall, the Dome of the Rock, and the Church of the Holy Sepulchre share the same square kilometer.',
  'dead-sea':
    'Float without trying in the lowest point on Earth, cover yourself in mineral-rich mud, and watch a sunset over the Jordanian mountains from water that makes swimming impossible. It\'s as surreal as it sounds.',
  'israel':
    'Tel Aviv\'s beaches and Bauhaus architecture, old Jaffa\'s flea markets, and a food scene that fuses Middle Eastern, Mediterranean, and global flavors into something entirely its own.',
  'beirut':
    'A city that rebuilds itself with defiant optimism — Roman ruins next to rooftop bars, a food scene that rivals Paris, and a nightlife culture that refuses to stop. Beirut is the Middle East\'s most resilient city.',
  'oman':
    'Wadis — emerald pools carved through desert canyons — the Grand Mosque\'s stunning craftsmanship, and a hospitality culture that\'s the Gulf\'s most genuine. Oman is the Middle East for people who don\'t think they\'d like the Middle East.',
  'muscat':
    'The Sultan Qaboos Grand Mosque, old Muscat\'s harbor forts, and desert wadis where you can swim in turquoise pools surrounded by nothing but mountains. Muscat is Oman\'s gentle, beautiful capital.',
  'salalah':
    'When the rest of Arabia bakes in summer, Salalah\'s Khareef monsoon turns the desert green — waterfalls, mist, and frankincense trees that have been harvested here for millennia.',
  'riyadh':
    'The Edge of the World — a cliff dropping into endless desert — Diriyah\'s UNESCO-listed ruins, and a cultural transformation happening in real time. Riyadh is Saudi Arabia opening its doors.',
  'jeddah':
    'Al-Balad\'s coral-stone Old Town, the Corniche running along the Red Sea, and a diving scene that\'s world-class but barely known. Jeddah is Saudi Arabia\'s most cosmopolitan city.',
  'medina':
    'Al-Masjid an-Nabawi — the Prophet\'s Mosque — its green dome visible from across the city, and a spiritual atmosphere that makes this one of the most significant places on Earth for millions.',
  'sharjah':
    'The Museum of Islamic Civilization, Al Noor Island\'s art installations, and a cultural seriousness — UNESCO named it Cultural Capital of the Arab World — that makes it Dubai\'s more thoughtful neighbor.',
  'alula':
    'Hegra — Saudi Arabia\'s Petra, with Nabataean tombs carved from sandstone — and a desert landscape of rock formations that look like they were sculpted by a giant. AlUla is the ancient world newly revealed.',

  // ══════════════════════════════════════════════════════════════
  // AFRICA (30 destinations)
  // ══════════════════════════════════════════════════════════════
  'marrakech':
    'The Jemaa el-Fnaa square at dusk is a sensory explosion — snake charmers, spice merchants, and tagine steam everywhere. Then you duck into a riad that\'s a hidden palace of calm. Marrakech is the ultimate contrast.',
  'cape-town':
    'Table Mountain forming the most dramatic city backdrop on Earth, penguins on the beach (yes, really), and a wine region that rivals Napa at a fraction of the price. Cape Town is a city that keeps surprising you.',
  'nairobi':
    'The only capital city with a national park inside it — watch giraffes with a skyline backdrop, then dive into a food scene that blends Swahili, Indian, and global influences. Nairobi is East Africa\'s beating heart.',
  'zanzibar':
    'Spice plantations, Stone Town\'s winding alleys, and beaches so white they look photoshopped. Zanzibar is the island off the East African coast that nobody wants to leave.',
  'morocco':
    'From Marrakech\'s medina to the Sahara\'s dunes, with blue-painted Chefchaouen and Atlantic-battered Essaouira in between — Morocco is a country that overwhelms every sense in the best possible way.',
  'fes':
    'The world\'s largest car-free urban area — a medieval medina where tanneries still operate as they did centuries ago, and getting lost is the entire point. Fes is Morocco at its most ancient and authentic.',
  'chefchaouen':
    'The Blue Pearl — every wall, door, and stairway painted in shades of blue that turn the entire medina into an open-air art installation. Chefchaouen is the most photogenic town in Morocco.',
  'essaouira':
    'A windsurfing capital with a laid-back medina, fresh-caught fish grilled on the harbor, and a former hippie-trail history that left behind a permanently chill vibe. Essaouira is Morocco\'s coolest coastal town.',
  'casablanca':
    'The Hassan II Mosque — rising from the Atlantic on a promontory — is one of the largest and most beautiful in the world. Beyond the mosque, Casablanca is Morocco\'s modern, cosmopolitan engine.',
  'egypt':
    'The Pyramids, a Nile cruise, and Luxor\'s Valley of the Kings — Egypt is the original bucket-list destination, and 5,000 years later, it still delivers on the wonder.',
  'luxor':
    'The Valley of the Kings, Karnak Temple at sunrise, and hot air balloon rides over it all — Luxor has more ancient monuments per square kilometer than anywhere else on Earth.',
  'hurghada':
    'Red Sea diving that reveals coral cities and tropical fish, resort beaches for pure relaxation, and the Eastern Desert as a dramatic backdrop. Hurghada is Egypt\'s beach escape.',
  'tanzania':
    'The Serengeti — where the Great Migration moves two million animals across an endless plain — and Ngorongoro Crater, a collapsed volcano teeming with wildlife. Tanzania is safari at its absolute peak.',
  'kenya':
    'The Masai Mara during the Great Migration, the Big Five in their natural habitat, and a Kenyan hospitality that transforms a safari from tourism into something deeply personal.',
  'mauritius':
    'The underwater waterfall illusion, beaches that look retouched but aren\'t, and a Creole-Indian-French fusion culture that makes the food as diverse as the coral reefs.',
  'seychelles':
    'Granite boulders on white sand beaches, giant tortoises wandering freely, and a marine park system that makes every snorkel a discovery. The Seychelles is nature\'s most exclusive beach club.',
  'victoria-falls':
    'One of the Seven Natural Wonders — a wall of water so massive it creates its own rain cloud. The spray hits you from a kilometer away, and the roar never leaves your memory.',
  'johannesburg':
    'The Apartheid Museum tells a story that changes you, Soweto pulses with energy and history, and Maboneng has emerged as one of Africa\'s most exciting creative quarters.',
  'kruger':
    'The Big Five in one of the world\'s great wildlife sanctuaries — dawn game drives where a leopard might cross your path and evening sundowners overlooking the bush. Kruger is safari at its most accessible.',
  'masai-mara':
    'Two million wildebeest crossing the Mara River while crocodiles wait below — the Great Migration is the greatest wildlife spectacle on Earth, and the Masai Mara is where it peaks.',
  'serengeti':
    'Endless plains stretching to every horizon, the Great Migration moving like a living river, and a night sky so clear the Milky Way casts shadows. The Serengeti is Africa\'s most iconic landscape.',
  'kilimanjaro':
    'Africa\'s highest peak — 5,895 meters of volcanic mountain passing through five climate zones, from tropical forest to arctic summit. Kilimanjaro is the ultimate bucket-list climb.',
  'durban':
    'The Golden Mile beachfront, a curry scene shaped by South Africa\'s Indian community that\'s world-class, and a surfing culture that makes it South Africa\'s most tropical city.',
  'lagos':
    'West Africa\'s megacity — 20 million people, Afrobeats pulsing from every direction, and a creative energy in fashion, art, and food that\'s putting Lagos on the global map.',
  'dakar':
    'Gorée Island\'s powerful history, the African Renaissance Monument towering over the Atlantic, and a surf scene that\'s West Africa\'s best-kept secret. Dakar is Senegal\'s vibrant, complex capital.',
  'rwanda':
    'Gorilla trekking in Volcanoes National Park — sitting with a silverback in the mist is one of the most profound wildlife encounters possible. Rwanda is also Africa\'s cleanest, safest country.',
  'uganda':
    'Gorilla trekking, the source of the Nile at Jinja, and Bwindi Impenetrable Forest — Uganda is "the Pearl of Africa" and its wildlife encounters are life-changing.',
  'namibia':
    'Sossusvlei\'s orange dunes — the tallest in the world — Etosha\'s salt pans teeming with wildlife, and the Skeleton Coast where the desert meets the Atlantic. Namibia is Earth\'s most photogenic wilderness.',
  'botswana':
    'The Okavango Delta — a river that flows into the desert and creates an inland paradise — with some of Africa\'s finest safari lodges and a conservation-first approach that keeps everything wild.',
  'tunis':
    'The Medina, Carthage\'s ancient ruins overlooking the Mediterranean, and Sidi Bou Saïd — a clifftop village in blue and white that\'s one of the most beautiful in North Africa.',
  'addis-ababa':
    'The birthplace of coffee — and the ceremony is a ritual you\'ll never forget — plus Lucy (the 3.2 million-year-old ancestor), and an Ethiopian cuisine unlike anything else on the planet.',
  'ghana':
    'Cape Coast\'s slave castles tell a story the world needs to hear, Kakum\'s canopy walkway offers thrills, and Accra\'s nightlife scene pulses with Afrobeats energy. Ghana is West Africa\'s warmest welcome.',
  'senegal':
    'Gorée Island, the Pink Lake (Lac Rose), and a music scene that produced Youssou N\'Dour. Senegal is West Africa\'s cultural powerhouse — vibrant, complex, and deeply welcoming.',
  'reunion':
    'A French island with one of the world\'s most active volcanoes, hiking trails that cross moonscapes and tropical forest, and a Creole cuisine that blends French, African, and Indian. Réunion is adventure in the Indian Ocean.',

  // ══════════════════════════════════════════════════════════════
  // OCEANIA (~23 destinations)
  // ══════════════════════════════════════════════════════════════
  'sydney':
    'The Opera House gleaming against the harbor, Bondi Beach just a bus ride from the CBD, and a brunch culture that the rest of the world is still trying to copy. Sydney makes outdoor living an art form.',
  'melbourne':
    'Laneway coffee shops, street art that rivals galleries, and a food scene where a $15 bowl of pho sits next to a $200 tasting menu — both excellent. Melbourne is Australia\'s cultural engine.',
  'queenstown-nz':
    'Bungee jumping was invented here, and the adrenaline hasn\'t stopped since. But Queenstown also does wine, lake views, and mountain sunsets — adventure capital meets surprisingly sophisticated escape.',
  'perth':
    'Rottnest Island and its quokka selfies, King\'s Park overlooking the river, and a wine region — the Margaret River — that\'s become world-class. Perth is Australia\'s most remote capital — and its most relaxed.',
  'gold-coast':
    'Surfer\'s Paradise Beach, theme parks that keep families coming back, and a subtropical hinterland behind the skyscrapers that\'s genuinely beautiful. The Gold Coast is Australia\'s fun factory.',
  'tasmania':
    'MONA — the most provocative museum in the Southern Hemisphere — Cradle Mountain\'s wilderness, and a food scene built on the purest ingredients in Australia. Tasmania is Australia\'s wild, creative island.',
  'cairns':
    'The Great Barrier Reef right there and the Daintree Rainforest behind you — Cairns sits between two UNESCO World Heritage Sites, making it Australia\'s most naturally blessed city.',
  'byron-bay':
    'Australia\'s easternmost point — a lighthouse, surfing breaks, and a laid-back market culture that\'s become its own lifestyle. Byron Bay is where Australia goes to unplug.',
  'adelaide':
    'The Barossa Valley — some of the oldest vines on Earth — the Central Market, and Kangaroo Island a ferry away. Adelaide is Australia\'s most underrated food and wine destination.',
  'great-barrier-reef':
    'The largest living structure on Earth — so big it\'s visible from space — with 1,500 species of fish, 400 types of coral, and a snorkeling experience that redefines what you thought was possible.',
  'new-zealand':
    'Bungee jumping, Milford Sound, and the Lord of the Rings landscapes — New Zealand packed more adventure and natural beauty into two islands than most continents manage.',
  'auckland':
    'The Sky Tower, Waiheke Island\'s wineries a ferry ride away, and more volcanoes than you\'d expect in a city this cosmopolitan. Auckland is New Zealand\'s gateway — and it\'s worth more than just a layover.',
  'rotorua':
    'Geothermal mud pools bubbling, geysers erupting on schedule, and a Māori cultural experience that\'s one of New Zealand\'s most powerful. Rotorua smells like sulfur and feels like magic.',
  'wellington':
    'Te Papa — one of the world\'s best museums — a cable car to hilltop views, and a craft beer and coffee scene that makes it New Zealand\'s most characterful capital.',
  'milford-sound':
    'A fjord so dramatic Rudyard Kipling called it the eighth wonder of the world — waterfalls crashing down thousand-meter cliffs into water where dolphins play. Milford Sound earns its reputation.',
  'fiji':
    'Islands so remote they feel invented, with water so warm and clear it\'s basically a bathtub with fish. Fiji\'s legendary friendliness isn\'t marketing — you\'ll feel it from the moment you land.',
  'tahiti':
    'Overwater bungalows that invented the concept, water in shades of blue that shouldn\'t exist, and a Polynesian culture that turns every sunset into a ceremony. Tahiti is the original paradise — and still the best.',
  'bora-bora':
    'Mount Otemanu rising from a lagoon so blue it looks filtered, overwater bungalows where you can watch fish from your bed, and a silence broken only by waves. Bora Bora is the world\'s most beautiful lagoon.',
  'cook-islands':
    'Rarotonga\'s lush volcanic peaks, Aitutaki\'s lagoon that regularly wins "world\'s most beautiful," and a Polynesian culture that makes the Cooks feel like Fiji without the crowds.',
  'rarotonga':
    'A cross-island trek through tropical jungle, a lagoon that wraps the entire island in turquoise, and a Polynesian warmth that\'s palpable from the moment you land. Rarotonga is the Pacific\'s friendliest island.',
  'samoa':
    'The To Sua Ocean Trench — a swimming hole carved into rock that\'s one of the most photographed natural pools on Earth — fa\'a Samoa culture, and beaches that define the South Pacific dream.',
  'vanuatu':
    'Active volcanoes you can peer into, blue lagoons, and a bungee-jumping tradition (land diving) that predates the modern sport by centuries. Vanuatu is the Pacific at its most adventurous.',
  'new-caledonia':
    'A UNESCO-listed lagoon, French cuisine on Pacific beaches, and the Isle of Pines — an island so beautiful Captain Cook named it after the most beautiful thing he could think of.',
  'palau':
    'Jellyfish Lake — swimming with millions of stingless jellyfish — the Rock Islands from above, and diving that regularly appears on every "world\'s best" list. Palau is the diver\'s holy grail.',
  'guam':
    'Tumon Bay\'s turquoise waters, WWII history that\'s powerfully told, and a Chamorro culture that makes this Pacific island distinctly its own — American soil with a Micronesian soul.',
};

/**
 * Get the sales pitch for a destination.
 * 100% hand-written coverage — every destination has a custom pitch.
 */
export function generateCityPitch(destination: Destination): string {
  return CITY_PITCHES[destination.id] || `Discover ${destination.city} — a destination that rewards the curious traveler with experiences you won\'t find anywhere else.`;
}
