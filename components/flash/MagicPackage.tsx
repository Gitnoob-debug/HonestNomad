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

interface POIDetailProp {
  name: string;
  type: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  duration?: string;
  bestTimeOfDay?: string;
  distanceFromHotel?: number;
}

interface ClusterProp {
  label: string;
  poiNames: string[];
  walkFromHotel?: number;
}

interface HotelContextProp {
  name: string;
  stars?: number;
  pricePerNight?: number;
  totalPrice?: number;
  currency?: string;
  amenities?: string[];
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
  /** 'light' for white backgrounds (confirm page), 'dark' for dark theme (package step) */
  variant?: 'light' | 'dark';
  /** 'accordion' for stacked expandable sections, 'grid' for 3-card grid layout */
  layout?: 'accordion' | 'grid';
  /** Rich context for personalized AI output */
  pathType?: string;
  pathDescription?: string;
  poiDetails?: POIDetailProp[];
  favoritePOIs?: string[];
  clusters?: ClusterProp[];
  hotelContext?: HotelContextProp;
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
  variant = 'light',
  layout = 'accordion',
  pathType,
  pathDescription,
  poiDetails,
  favoritePOIs,
  clusters,
  hotelContext,
}: MagicPackageProps) {
  const [data, setData] = useState<MagicPackageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    layout === 'grid' ? new Set() : new Set(['packing'])
  );

  const dark = variant === 'dark';

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
          pathType,
          pathDescription,
          poiDetails,
          favoritePOIs,
          clusters,
          hotelContext,
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

  // Theme classes
  const t = {
    card: dark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100 shadow-sm',
    cardHover: dark ? 'hover:bg-white/8' : 'hover:bg-gray-50',
    loadingCard: dark ? 'bg-white/5 border border-white/10' : 'bg-white shadow-lg border border-gray-100',
    errorCard: dark ? 'bg-white/5 border border-red-500/20' : 'bg-white shadow-lg border border-red-100',
    title: dark ? 'text-white' : 'text-gray-900',
    subtitle: dark ? 'text-white/50' : 'text-gray-500',
    text: dark ? 'text-white/80' : 'text-gray-700',
    textMuted: dark ? 'text-white/50' : 'text-gray-600',
    textFaint: dark ? 'text-white/30' : 'text-gray-400',
    sectionLabel: dark ? 'text-white/60' : 'text-gray-700',
    chevron: dark ? 'text-white/30' : 'text-gray-400',
    divider: dark ? 'border-white/5' : 'border-gray-50',
    gradientOrb: dark ? 'from-purple-500/20 to-pink-500/20' : 'from-purple-100 to-pink-100',
    errorText: dark ? 'text-red-400' : 'text-red-600',
    mustBringBg: dark ? 'bg-green-500/10' : 'bg-green-50',
    mustBringNum: dark ? 'text-green-400' : 'text-green-600',
    niceToHaveBg: dark ? 'bg-blue-500/10' : 'bg-blue-50',
    niceToHaveNum: dark ? 'text-blue-400' : 'text-blue-600',
    borderAccent: dark ? 'border-primary-500/30' : 'border-primary-300',
    dayTipText: dark ? 'text-white/50' : 'text-gray-600',
    loadingText: dark ? 'text-white/60' : 'text-gray-600',
    iconBg: dark ? 'bg-white/10' : 'bg-gray-100',
  };

  if (loading) {
    return (
      <div className={`${t.loadingCard} rounded-2xl p-8`}>
        <div className="text-center">
          <div className={`w-16 h-16 bg-gradient-to-br ${t.gradientOrb} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <span className="text-3xl">✨</span>
          </div>
          <h3 className={`text-xl font-bold ${t.title} mb-2`}>
            Creating Your Magic Package
          </h3>
          <p className={`${t.loadingText} mb-6`}>
            Personalizing packing lists, travel tips, and insider guides for {destination}...
          </p>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${t.errorCard} rounded-2xl p-8`}>
        <div className="text-center">
          <p className={`${t.errorText} mb-4`}>{error}</p>
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

  // Build sections — 3 sections (packing + must-brings merged)
  const sections = [
    {
      id: 'packing',
      title: 'Packing & Must-Brings',
      emoji: '🧳',
      preview: data.packingList.essentials.slice(0, 2).join(', ') +
        (data.packingList.essentials.length > 2 ? ` and ${data.packingList.essentials.length - 2} more` : ''),
      content: (
        <div className="space-y-5">
          {/* Essentials */}
          <div>
            <h4 className={`text-sm font-semibold ${t.sectionLabel} mb-2 uppercase tracking-wide`}>Essentials</h4>
            <ul className="space-y-1.5">
              {data.packingList.essentials.map((item, i) => (
                <li key={i} className={`flex items-start gap-2 text-sm ${t.text}`}>
                  <span className="text-green-500 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Must-Brings (numbered with reasons) */}
          {data.mustBrings.length > 0 && (
            <div>
              <h4 className={`text-sm font-semibold ${t.sectionLabel} mb-2 uppercase tracking-wide`}>Must-Brings</h4>
              <div className="space-y-2">
                {data.mustBrings.map((item, i) => (
                  <div key={i} className={`flex items-start gap-3 p-2 ${t.mustBringBg} rounded-lg`}>
                    <span className={`${t.mustBringNum} font-bold text-sm mt-0.5`}>{i + 1}</span>
                    <div>
                      <span className={`text-sm font-medium ${t.title}`}>{item.item}</span>
                      <p className={`text-xs ${t.textMuted}`}>{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nice-to-Haves */}
          <div>
            <h4 className={`text-sm font-semibold ${t.sectionLabel} mb-2 uppercase tracking-wide`}>Nice to Have</h4>
            <ul className="space-y-1.5">
              {data.packingList.niceToHave.map((item, i) => (
                <li key={i} className={`flex items-start gap-2 text-sm ${t.textMuted}`}>
                  <span className={`${t.textFaint} mt-0.5`}>○</span>
                  {item}
                </li>
              ))}
            </ul>
            {data.niceToHaves.length > 0 && (
              <div className="mt-3 space-y-2">
                {data.niceToHaves.map((item, i) => (
                  <div key={i} className={`flex items-start gap-3 p-2 ${t.niceToHaveBg} rounded-lg`}>
                    <span className={`${t.niceToHaveNum} font-bold text-sm mt-0.5`}>{i + 1}</span>
                    <div>
                      <span className={`text-sm font-medium ${t.title}`}>{item.item}</span>
                      <p className={`text-xs ${t.textMuted}`}>{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'travel',
      title: 'Airport & Travel Tips',
      emoji: '✈️',
      preview: data.travelTips.airport?.[0] || 'Airport, transport, money, and connectivity tips',
      content: (
        <div className="space-y-4">
          {[
            { title: 'At the Airport', tips: data.travelTips.airport },
            { title: 'Getting Around', tips: data.travelTips.transport },
            { title: 'Money & Payments', tips: data.travelTips.money },
            { title: 'Staying Connected', tips: data.travelTips.connectivity },
          ].map(({ title, tips }) => (
            <div key={title}>
              <h4 className={`text-sm font-semibold ${t.sectionLabel} mb-2`}>{title}</h4>
              <ul className="space-y-1.5">
                {tips?.map((tip, i) => (
                  <li key={i} className={`flex items-start gap-2 text-sm ${t.text}`}>
                    <span className="text-primary-500 mt-0.5">{'\u2192'}</span>
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
      id: 'adventure',
      title: 'Adventure Guide',
      emoji: '🗺️',
      preview: data.adventureGuide.insiderTips?.[0] || 'Day-by-day guide, insider tips, and hidden gems',
      content: (
        <div className="space-y-4">
          {data.adventureGuide.dailySuggestions?.length > 0 && (
            <div>
              <h4 className={`text-sm font-semibold ${t.sectionLabel} mb-2 uppercase tracking-wide`}>Day-by-Day</h4>
              <div className="space-y-3">
                {data.adventureGuide.dailySuggestions.map((day) => (
                  <div key={day.day} className={`border-l-2 ${t.borderAccent} pl-3`}>
                    <p className={`text-sm font-medium ${t.title}`}>Day {day.day}: {day.title}</p>
                    <ul className="mt-1 space-y-0.5">
                      {day.tips.map((tip, i) => (
                        <li key={i} className={`text-xs ${t.dayTipText}`}>{'\u2022'} {tip}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.adventureGuide.insiderTips?.length > 0 && (
            <div>
              <h4 className={`text-sm font-semibold ${t.sectionLabel} mb-2 uppercase tracking-wide`}>Insider Tips</h4>
              <ul className="space-y-1.5">
                {data.adventureGuide.insiderTips.map((tip, i) => (
                  <li key={i} className={`flex items-start gap-2 text-sm ${t.text}`}>
                    <span className="text-yellow-500 mt-0.5">{'\uD83D\uDCA1'}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.adventureGuide.hiddenGems?.length > 0 && (
            <div>
              <h4 className={`text-sm font-semibold ${t.sectionLabel} mb-2 uppercase tracking-wide`}>Hidden Gems</h4>
              <ul className="space-y-1.5">
                {data.adventureGuide.hiddenGems.map((gem, i) => (
                  <li key={i} className={`flex items-start gap-2 text-sm ${t.text}`}>
                    <span className="text-purple-500 mt-0.5">{'\uD83D\uDC8E'}</span>
                    {gem}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.adventureGuide.safetyTips?.length > 0 && (
            <div>
              <h4 className={`text-sm font-semibold ${t.sectionLabel} mb-2 uppercase tracking-wide`}>Safety Tips</h4>
              <ul className="space-y-1.5">
                {data.adventureGuide.safetyTips.map((tip, i) => (
                  <li key={i} className={`flex items-start gap-2 text-sm ${t.text}`}>
                    <span className="text-red-500 mt-0.5">{'\u26A0\uFE0F'}</span>
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

  // ─── Grid Layout ───
  if (layout === 'grid') {
    return (
      <div className="space-y-3">
        {/* Card grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {sections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            return (
              <button
                key={section.id}
                onClick={() => toggleSection(section.id)}
                className={`${t.card} rounded-xl p-4 text-left transition-all ${
                  isExpanded ? 'ring-1 ring-primary-500/30' : ''
                } ${t.cardHover}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.iconBg}`}>
                    <span className="text-xl">{section.emoji}</span>
                  </div>
                  <h4 className={`font-semibold text-sm ${t.title}`}>{section.title}</h4>
                </div>
                <p className={`text-xs ${t.textMuted} line-clamp-2`}>
                  {section.preview}
                </p>
                <div className={`flex items-center gap-1 mt-3 text-xs ${t.textFaint}`}>
                  <span>{isExpanded ? 'Hide details' : 'View details'}</span>
                  <svg
                    className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        {/* Expanded content below grid */}
        {sections.map((section) => (
          expandedSections.has(section.id) && (
            <div key={`${section.id}-expanded`} className={`${t.card} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{section.emoji}</span>
                  <h4 className={`font-semibold ${t.title}`}>{section.title}</h4>
                </div>
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`${t.chevron} p-1 hover:opacity-70 transition-opacity`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {section.content}
            </div>
          )
        ))}
      </div>
    );
  }

  // ─── Accordion Layout (default) ───
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 bg-gradient-to-br ${t.gradientOrb} rounded-full flex items-center justify-center`}>
          <span className="text-xl">✨</span>
        </div>
        <div>
          <h3 className={`text-lg font-bold ${t.title}`}>Your Magic Package</h3>
          <p className={`text-sm ${t.subtitle}`}>Personalized for {destination}</p>
        </div>
      </div>

      {sections.map((section) => (
        <div
          key={section.id}
          className={`${t.card} rounded-xl overflow-hidden`}
        >
          <button
            onClick={() => toggleSection(section.id)}
            className={`w-full flex items-center justify-between p-4 ${t.cardHover} transition-colors`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{section.emoji}</span>
              <span className={`font-medium ${t.title}`}>{section.title}</span>
            </div>
            <svg
              className={`w-5 h-5 ${t.chevron} transition-transform ${
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
            <div className={`px-4 pb-4 border-t ${t.divider}`}>
              <div className="pt-3">{section.content}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
