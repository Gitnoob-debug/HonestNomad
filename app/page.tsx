import Link from 'next/link';

// Hero destination images — high-impact cities with reliable Supabase images
const HERO_DESTINATIONS = [
  { city: 'santorini', label: 'Santorini' },
  { city: 'tokyo', label: 'Tokyo' },
  { city: 'paris', label: 'Paris' },
  { city: 'bali', label: 'Bali' },
  { city: 'cape-town', label: 'Cape Town' },
  { city: 'barcelona', label: 'Barcelona' },
];

// Stats for social proof
const STATS = [
  { value: '500+', label: 'Destinations' },
  { value: '85k+', label: 'Curated POIs' },
  { value: '<5 min', label: 'To your trip' },
];

function getImageUrl(city: string, index: number = 1) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/destination-images/${city}/${city}-${String(index).padStart(3, '0')}.jpg`;
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ========== HERO ========== */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background image mosaic — 3 columns on desktop, fading at edges */}
        <div className="absolute inset-0">
          <div className="grid grid-cols-3 h-full">
            {HERO_DESTINATIONS.slice(0, 3).map((dest, i) => (
              <div key={dest.city} className="relative h-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageUrl(dest.city)}
                  alt=""
                  className="w-full h-full object-cover scale-105"
                  style={{
                    animationDelay: `${i * 2}s`,
                  }}
                  loading="eager"
                />
              </div>
            ))}
          </div>
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          {/* Bottom fade to white for section transition */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 sm:py-28 text-center w-full">
          <p className="text-primary-300 font-medium text-sm sm:text-base uppercase tracking-wider mb-4">
            Hotels + Experiences, Honestly Curated
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.1]">
            Your next adventure
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-500">
              starts with a swipe
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10">
            Pick your vibe, swipe through 500+ destinations, explore real itineraries on a map, and book your hotel — all in under 5 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/flash"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white font-semibold text-lg rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/30 hover:shadow-xl hover:-translate-y-0.5"
            >
              Start Exploring
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <span className="text-white/40 text-sm">
              Free to browse &middot; No account needed
            </span>
          </div>

          {/* Stats bar */}
          <div className="mt-16 flex items-center justify-center gap-8 sm:gap-16">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-xs sm:text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            How it works
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-xl mx-auto">
            Three steps. Under five minutes. Zero hassle.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                emoji: '🎯',
                title: 'Set your vibe',
                description: 'Pick your dates, who\'s going, what kind of trip you want, and your budget. That\'s all we need.',
              },
              {
                step: '2',
                emoji: '👆',
                title: 'Swipe destinations',
                description: '16 curated destinations matched to your taste. Swipe right on the one that excites you most.',
              },
              {
                step: '3',
                emoji: '🎁',
                title: 'Get your package',
                description: 'Explore POIs on a real map, pick your hotel, and receive a personalized adventure package with packing lists and insider tips.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">{item.emoji}</span>
                </div>
                <div className="text-sm font-medium text-primary-600 mb-1">Step {item.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== DESTINATION SHOWCASE ========== */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                500+ destinations.
                <br />
                <span className="text-primary-600">Curated for you.</span>
              </h2>
              <div className="space-y-4">
                {[
                  { icon: '🗺️', text: '500 handpicked destinations across 7 continents' },
                  { icon: '📍', text: '85,000+ points of interest with real photos' },
                  { icon: '🏨', text: 'Real-time hotel availability and pricing' },
                  { icon: '✨', text: 'AI-powered adventure package with packing lists & tips' },
                  { icon: '🧠', text: 'Gets smarter with every swipe — learns your taste' },
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{feature.icon}</span>
                    <p className="text-gray-700">{feature.text}</p>
                  </div>
                ))}
              </div>

              <Link
                href="/flash"
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Try it now
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Destination image grid */}
            <div className="grid grid-cols-2 gap-3">
              {HERO_DESTINATIONS.slice(0, 4).map((dest, i) => (
                <div key={dest.city} className="relative group aspect-square rounded-2xl overflow-hidden bg-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getImageUrl(dest.city, i + 1)}
                    alt={`${dest.label} destination`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="absolute bottom-3 left-3 text-white font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {dest.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== BOTTOM CTA ========== */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getImageUrl('bali', 2)}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready for your next adventure?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Start swiping — it takes less than a minute to find your perfect trip.
          </p>
          <Link
            href="/flash"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold text-lg rounded-xl hover:bg-gray-50 transition-all hover:-translate-y-0.5"
          >
            Get Started
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="py-8 border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">H</span>
            </div>
            <span className="text-sm text-gray-500">HonestNomad</span>
          </div>
          <p className="text-sm text-gray-400">
            Hotels + experiences, honestly curated.
          </p>
        </div>
      </footer>
    </main>
  );
}
