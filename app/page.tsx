'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatContainer } from '@/components/chat/ChatContainer';

const EXAMPLE_PROMPTS = [
  "Plan a romantic week in Paris for two in March",
  "I want to explore Tokyo for 5 days next month",
  "Family beach vacation in Cancun during spring break",
  "Weekend getaway to London in February",
  "Adventure trip to New Zealand for 10 days",
];

export default function HomePage() {
  const router = useRouter();
  const [showChat, setShowChat] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showChat && chatRef.current) {
      chatRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showChat]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setShowChat(true);
    }
  };

  const handleExampleClick = (prompt: string) => {
    setInputValue(prompt);
    setShowChat(true);
  };

  if (showChat) {
    return (
      <div ref={chatRef} className="flex flex-col h-[calc(100vh-64px)]">
        <ChatContainer initialMessage={inputValue} />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            AI-Powered Trip Planning
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            One sentence.
            <br />
            <span className="text-blue-600">One complete trip.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-600 mb-10 max-w-xl mx-auto">
            Tell us where you want to go. We&apos;ll find the flights, book the hotel,
            and create a personalized day-by-day itinerary.
          </p>

          {/* Main Input */}
          <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto mb-8">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Where do you want to go?"
              className="w-full px-6 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all pr-36"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Plan Trip
            </button>
          </form>

          {/* Example Prompts */}
          <div className="flex flex-wrap justify-center gap-2">
            <span className="text-sm text-gray-500">Try:</span>
            {EXAMPLE_PROMPTS.slice(0, 3).map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleExampleClick(prompt)}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                &ldquo;{prompt}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            How it works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="1"
              title="Tell us your dream"
              description="Describe your ideal trip in natural language. Include dates, destinations, and any preferences."
            />
            <FeatureCard
              icon="2"
              title="We plan everything"
              description="Our AI searches flights and hotels, then creates a complete day-by-day itinerary tailored to you."
            />
            <FeatureCard
              icon="3"
              title="Refine and book"
              description="Swap out hotels or flights if you prefer. When you're happy, book the entire trip in one click."
            />
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            What you get
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <BenefitCard
              emoji="✈️"
              title="Round-trip Flights"
              description="Best options for your dates and budget"
            />
            <BenefitCard
              emoji="🏨"
              title="Curated Hotels"
              description="Hand-picked stays that match your style"
            />
            <BenefitCard
              emoji="📅"
              title="Daily Itinerary"
              description="Activities and dining for each day"
            />
            <BenefitCard
              emoji="💡"
              title="Local Tips"
              description="Insider advice for your destination"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to plan your next adventure?
          </h2>
          <p className="text-blue-100 mb-8">
            No account needed. Just tell us where you want to go.
          </p>
          <button
            onClick={() => {
              setInputValue('');
              setShowChat(true);
            }}
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors"
          >
            Start Planning
          </button>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function BenefitCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="text-3xl mb-3">{emoji}</div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
