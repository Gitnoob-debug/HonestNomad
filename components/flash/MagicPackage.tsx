'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui';

interface MagicPackageData {
  packingList: {
    essentials: string[];
    niceToHave: string[];
  };
  travelTips: {
    airport: string[];
    transport: string[];
    money: string[];
    connectivity: string[];
  };
  mustBrings: { item: string; reason: string }[];
  niceToHaves: { item: string; reason: string }[];
  adventureGuide: {
    dailySuggestions: { day: number; title: string; tips: string[] }[];
    insiderTips: string[];
    hiddenGems: string[];
    safetyTips: string[];
  };
}

interface MagicPackageProps {
  destination: string;
  country: string;
  departureDate: string;
  returnDate: string;
  travelerType: string;
  hotelName?: string;
  activities: string[];
  vibes: string[];
}

export function MagicPackage({
  destination,
  country,
  departureDate,
  returnDate,
  travelerType,
  hotelName,
  activities,
  vibes,
}: MagicPackageProps) {
  const [data, setData] = useState<MagicPackageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['packing']));

  useEffect(() => {
    generateMagicPackage();
  }, [destination]);

  const generateMagicPackage = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/flash/magic-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          country,
          departureDate,
          returnDate,
          travelerType,
          hotelName,
          activities,
          vibes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate magic package');
      }

      const result = await response.json();
      setData(result.magicPackage);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✨</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Creating Your Magic Package
          </h3>
          <p className="text-gray-600 mb-6">
            Personalizing packing lists, travel tips, and insider guides for {destination}...
          </p>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={generateMagicPackage}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const sections = [
    {
      id: 'packing',
      title: 'Packing List',
      emoji: '🧳',
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Essentials</h4>
            <ul className="space-y-1.5">
              {data.packingList.essentials.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Nice to Have</h4>
            <ul className="space-y-1.5">
              {data.packingList.niceToHave.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-gray-400 mt-0.5">○</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'travel',
      title: 'Airport & Travel Tips',
      emoji: '✈️',
      content: (
        <div className="space-y-4">
          {[
            { title: 'At the Airport', tips: data.travelTips.airport },
            { title: 'Getting Around', tips: data.travelTips.transport },
            { title: 'Money & Payments', tips: data.travelTips.money },
            { title: 'Staying Connected', tips: data.travelTips.connectivity },
          ].map(({ title, tips }) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
              <ul className="space-y-1.5">
                {tips?.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-primary-500 mt-0.5">→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'brings',
      title: 'Must-Brings & Nice-to-Haves',
      emoji: '🎒',
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">5 Must-Brings</h4>
            <div className="space-y-2">
              {data.mustBrings.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-2 bg-green-50 rounded-lg">
                  <span className="text-green-600 font-bold text-sm mt-0.5">{i + 1}</span>
                  <div>
                    <span className="text-sm font-medium text-gray-900">{item.item}</span>
                    <p className="text-xs text-gray-600">{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">5 Nice-to-Haves</h4>
            <div className="space-y-2">
              {data.niceToHaves.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-2 bg-blue-50 rounded-lg">
                  <span className="text-blue-600 font-bold text-sm mt-0.5">{i + 1}</span>
                  <div>
                    <span className="text-sm font-medium text-gray-900">{item.item}</span>
                    <p className="text-xs text-gray-600">{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'adventure',
      title: 'Adventure Guide',
      emoji: '🗺️',
      content: (
        <div className="space-y-4">
          {data.adventureGuide.dailySuggestions?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Day-by-Day</h4>
              <div className="space-y-3">
                {data.adventureGuide.dailySuggestions.map((day) => (
                  <div key={day.day} className="border-l-2 border-primary-300 pl-3">
                    <p className="text-sm font-medium text-gray-900">Day {day.day}: {day.title}</p>
                    <ul className="mt-1 space-y-0.5">
                      {day.tips.map((tip, i) => (
                        <li key={i} className="text-xs text-gray-600">• {tip}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.adventureGuide.insiderTips?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Insider Tips</h4>
              <ul className="space-y-1.5">
                {data.adventureGuide.insiderTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-yellow-500 mt-0.5">💡</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.adventureGuide.hiddenGems?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Hidden Gems</h4>
              <ul className="space-y-1.5">
                {data.adventureGuide.hiddenGems.map((gem, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-purple-500 mt-0.5">💎</span>
                    {gem}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.adventureGuide.safetyTips?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Safety Tips</h4>
              <ul className="space-y-1.5">
                {data.adventureGuide.safetyTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-500 mt-0.5">⚠️</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
          <span className="text-xl">✨</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Your Magic Package</h3>
          <p className="text-sm text-gray-500">Personalized for {destination}</p>
        </div>
      </div>

      {sections.map((section) => (
        <div
          key={section.id}
          className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm"
        >
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{section.emoji}</span>
              <span className="font-medium text-gray-900">{section.title}</span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.has(section.id) ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.has(section.id) && (
            <div className="px-4 pb-4 border-t border-gray-50">
              <div className="pt-3">{section.content}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
