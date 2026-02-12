import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-purple-50" />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Discover your perfect
            <br />
            <span className="text-primary-600">getaway</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Pick your vibe, swipe through curated destinations, and book your dream hotel — all in under 5 minutes.
          </p>

          <Link
            href="/flash"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white font-semibold text-lg rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200"
          >
            Start Exploring
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          <p className="mt-4 text-sm text-gray-500">
            No account needed to browse
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            How it works
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-xl mx-auto">
            Three simple steps to your next adventure
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                emoji: '🎯',
                title: 'Pick your vibe',
                description: 'Choose your travel dates, budget, and what kind of experience you want — beach, culture, adventure, foodie, or nightlife.',
              },
              {
                step: '2',
                emoji: '👆',
                title: 'Swipe destinations',
                description: 'Browse 16 curated destinations matched to your taste. Swipe right on the city that excites you most.',
              },
              {
                step: '3',
                emoji: '🏨',
                title: 'Book your stay',
                description: 'Explore POIs on an interactive map, pick your hotel, and get a personalized magic package with packing lists and insider tips.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
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

      {/* Features */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                500+ destinations. <br />Curated for you.
              </h2>
              <div className="space-y-4">
                {[
                  { icon: '🗺️', text: '500 handpicked destinations across 7 continents' },
                  { icon: '📍', text: '85,000+ points of interest with real photos' },
                  { icon: '🏨', text: 'Real-time hotel availability and pricing' },
                  { icon: '✨', text: 'AI-powered magic package with packing lists & tips' },
                  { icon: '🧠', text: 'Gets smarter with every swipe — learns your taste' },
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{feature.icon}</span>
                    <p className="text-gray-700">{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['paris', 'tokyo', 'bali', 'santorini'].map((city) => (
                <div key={city} className="aspect-square rounded-2xl overflow-hidden bg-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://nvhnrtssvdjiefsgilxg.supabase.co/storage/v1/object/public/destination-images/${city}/${city}-001.jpg`}
                    alt={city}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-primary-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to find your next adventure?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Start swiping — it's free to browse.
          </p>
          <Link
            href="/flash"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 font-semibold text-lg rounded-xl hover:bg-primary-50 transition-colors"
          >
            Get Started
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
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
