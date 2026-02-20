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
        const errorBody = await response.json().catch(() => null);
        const msg = errorBody?.error || `Failed to generate magic package (${response.status})`;
        throw new Error(msg);
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
        <div className="space-y-4">
          {/* Two-column: Essentials + Must-Brings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Essentials */}
            <div>
              <h4 className={`text-xs font-bold ${t.sectionLabel} mb-2.5 uppercase tracking-wide flex items-center gap-1.5`}>
                <span className="text-green-500">{'\u2713'}</span>
                Essentials
              </h4>
              <div className="space-y-1">
                {data.packingList.essentials.map((item, i) => (
                  <div key={i} className={`flex items-start gap-2.5 text-xs ${t.text} p-1.5 rounded-md hover:${dark ? 'bg-white/5' : 'bg-gray-50'} transition-colors`}>
                    <span className="text-green-500 text-sm flex-shrink-0">{'\u2713'}</span>
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Must-Brings */}
            {data.mustBrings.length > 0 && (
              <div>
                <h4 className={`text-xs font-bold ${t.sectionLabel} mb-2.5 uppercase tracking-wide flex items-center gap-1.5`}>
                  <span className="text-amber-500">{'\u2B50'}</span>
                  Must-Brings
                </h4>
                <div className="space-y-2">
                  {data.mustBrings.map((item, i) => (
                    <div key={i} className={`${t.mustBringBg} rounded-lg p-2.5 border border-green-500/20`}>
                      <div className="flex items-start gap-2.5">
                        <div className={`w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0`}>
                          <span className={`text-[10px] font-bold ${t.mustBringNum}`}>{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${t.title} mb-0.5`}>{item.item}</p>
                          <p className={`text-[10px] ${t.textMuted} leading-relaxed`}>{item.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nice-to-Have as compact pills */}
          {data.packingList.niceToHave.length > 0 && (
            <div>
              <h4 className={`text-xs font-bold ${t.sectionLabel} mb-2.5 uppercase tracking-wide flex items-center gap-1.5`}>
                <span className="text-blue-400">{'\u25CB'}</span>
                Nice to Have
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.packingList.niceToHave.map((item, i) => (
                  <span key={i} className={`inline-flex items-center gap-1.5 ${t.niceToHaveBg} text-xs px-3 py-1.5 rounded-full border border-blue-500/15`}>
                    <span className="text-blue-400 text-[10px]">{'\u25CB'}</span>
                    <span className={t.text}>{item}</span>
                  </span>
                ))}
              </div>
              {data.niceToHaves.length > 0 && (
                <div className="mt-3 space-y-2">
                  {data.niceToHaves.map((item, i) => (
                    <div key={i} className={`${t.niceToHaveBg} rounded-lg p-2.5 border border-blue-500/10`}>
                      <div className="flex items-start gap-2">
                        <span className={`${t.niceToHaveNum} text-sm flex-shrink-0`}>{'\u25CB'}</span>
                        <div>
                          <span className={`text-xs font-medium ${t.title}`}>{item.item}</span>
                          <p className={`text-[10px] ${t.textMuted} mt-0.5`}>{item.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'travel',
      title: 'Airport & Travel Tips',
      emoji: '✈️',
      preview: data.travelTips.airport?.[0] || 'Airport, transport, money, and connectivity tips',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { title: 'At the Airport', emoji: '\uD83D\uDEEB', tips: data.travelTips.airport, color: 'text-blue-400' },
            { title: 'Getting Around', emoji: '\uD83D\uDE95', tips: data.travelTips.transport, color: 'text-green-400' },
            { title: 'Money & Payments', emoji: '\uD83D\uDCB0', tips: data.travelTips.money, color: 'text-amber-400' },
            { title: 'Staying Connected', emoji: '\uD83D\uDCF1', tips: data.travelTips.connectivity, color: 'text-purple-400' },
          ].map(({ title, emoji, tips, color }) => (
            <div key={title} className={`${t.card} rounded-lg p-3`}>
              <h4 className={`text-xs font-bold ${t.sectionLabel} mb-2.5 uppercase tracking-wide flex items-center gap-2`}>
                <span className={`text-base ${color}`}>{emoji}</span>
                {title}
              </h4>
              <div className="space-y-1.5">
                {tips?.map((tip, i) => (
                  <div key={i} className={`flex items-start gap-2 text-xs ${t.text} p-1 rounded hover:${dark ? 'bg-white/5' : 'bg-gray-50'} transition-colors`}>
                    <span className={`${color} text-sm flex-shrink-0 mt-0.5`}>{'\u2192'}</span>
                    <span className="leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
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
          {/* Day-by-day timeline */}
          {data.adventureGuide.dailySuggestions?.length > 0 && (
            <div>
              <h4 className={`text-xs font-bold ${t.sectionLabel} mb-3 uppercase tracking-wide flex items-center gap-2`}>
                <span className="text-base">{'\uD83D\uDCC5'}</span>
                Day-by-Day Guide
              </h4>
              <div className="space-y-3">
                {data.adventureGuide.dailySuggestions.map((day) => (
                  <div key={day.day} className={`border-l-4 ${t.borderAccent} pl-4 py-2`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center">
                        <span className={`text-xs font-bold ${t.title}`}>{day.day}</span>
                      </div>
                      <p className={`text-xs font-bold ${t.title}`}>{day.title}</p>
                    </div>
                    <ul className="space-y-1.5">
                      {day.tips.map((tip, i) => (
                        <li key={i} className={`text-xs ${t.dayTipText} flex items-start gap-2 leading-relaxed`}>
                          <span className="text-primary-400 flex-shrink-0 mt-0.5">{'\u2022'}</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3-column grid: Insider Tips / Hidden Gems / Safety */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.adventureGuide.insiderTips?.length > 0 && (
              <div className={`${t.card} rounded-lg p-3`}>
                <h4 className={`text-xs font-bold ${t.sectionLabel} mb-2.5 uppercase tracking-wide flex items-center gap-2`}>
                  <span className="text-base text-yellow-400">{'\uD83D\uDCA1'}</span>
                  Insider Tips
                </h4>
                <ul className="space-y-2">
                  {data.adventureGuide.insiderTips.slice(0, 3).map((tip, i) => (
                    <li key={i} className={`flex items-start gap-2 text-[11px] ${t.text} leading-relaxed`}>
                      <span className="text-yellow-400 flex-shrink-0 mt-0.5">{'\uD83D\uDCA1'}</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
                {data.adventureGuide.insiderTips.length > 3 && (
                  <p className={`text-[10px] ${t.textFaint} mt-2`}>+{data.adventureGuide.insiderTips.length - 3} more</p>
                )}
              </div>
            )}

            {data.adventureGuide.hiddenGems?.length > 0 && (
              <div className={`${t.card} rounded-lg p-3`}>
                <h4 className={`text-xs font-bold ${t.sectionLabel} mb-2.5 uppercase tracking-wide flex items-center gap-2`}>
                  <span className="text-base text-purple-400">{'\uD83D\uDC8E'}</span>
                  Hidden Gems
                </h4>
                <ul className="space-y-2">
                  {data.adventureGuide.hiddenGems.slice(0, 3).map((gem, i) => (
                    <li key={i} className={`flex items-start gap-2 text-[11px] ${t.text} leading-relaxed`}>
                      <span className="text-purple-400 flex-shrink-0 mt-0.5">{'\uD83D\uDC8E'}</span>
                      <span>{gem}</span>
                    </li>
                  ))}
                </ul>
                {data.adventureGuide.hiddenGems.length > 3 && (
                  <p className={`text-[10px] ${t.textFaint} mt-2`}>+{data.adventureGuide.hiddenGems.length - 3} more</p>
                )}
              </div>
            )}

            {data.adventureGuide.safetyTips?.length > 0 && (
              <div className={`${t.card} rounded-lg p-3`}>
                <h4 className={`text-xs font-bold ${t.sectionLabel} mb-2.5 uppercase tracking-wide flex items-center gap-2`}>
                  <span className="text-base text-red-400">{'\u26A0\uFE0F'}</span>
                  Safety Tips
                </h4>
                <ul className="space-y-2">
                  {data.adventureGuide.safetyTips.slice(0, 3).map((tip, i) => (
                    <li key={i} className={`flex items-start gap-2 text-[11px] ${t.text} leading-relaxed`}>
                      <span className="text-red-400 flex-shrink-0 mt-0.5">{'\u26A0\uFE0F'}</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
                {data.adventureGuide.safetyTips.length > 3 && (
                  <p className={`text-[10px] ${t.textFaint} mt-2`}>+{data.adventureGuide.safetyTips.length - 3} more</p>
                )}
              </div>
            )}
          </div>
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
