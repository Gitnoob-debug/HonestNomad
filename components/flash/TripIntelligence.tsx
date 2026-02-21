'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui';
import type {
  TripIntelligence as TripIntelligenceData,
  PackingItem,
  MonthlyWeather,
  SafetyLevel,
  WaterSafety,
  CostLevel,
} from '@/types/destination-intelligence';

// ── Props ────────────────────────────────────────────────────────────

interface TripIntelligenceProps {
  destinationId: string;
  city: string;
  country: string;
  departureDate: string;
  returnDate: string;
  travelerType: string;
  pathType?: string;
  vibes: string[];
  variant?: 'light' | 'dark';
  layout?: 'accordion' | 'grid';
}

// ── Helpers ──────────────────────────────────────────────────────────

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function tempDisplay(c: number): string {
  return `${c}°C / ${Math.round(c * 9 / 5 + 32)}°F`;
}

function safetyLabel(level: SafetyLevel): { text: string; color: string } {
  switch (level) {
    case 'very-safe': return { text: 'Very Safe', color: 'text-green-400' };
    case 'safe': return { text: 'Safe', color: 'text-green-400' };
    case 'exercise-caution': return { text: 'Exercise Caution', color: 'text-amber-400' };
    case 'exercise-increased-caution': return { text: 'Exercise Increased Caution', color: 'text-red-400' };
    default: return { text: 'Safe', color: 'text-green-400' };
  }
}

function waterLabel(safety: WaterSafety): string {
  switch (safety) {
    case 'tap-safe': return 'Tap water is safe to drink';
    case 'bottled-recommended': return 'Bottled water recommended';
    case 'bottled-required': return 'Drink bottled water only';
    default: return 'Check locally';
  }
}

function costLabel(level: CostLevel): string {
  switch (level) {
    case 'budget': return 'Budget-friendly';
    case 'moderate': return 'Moderate costs';
    case 'expensive': return 'Expensive';
    case 'very-expensive': return 'Very expensive';
    default: return 'Moderate costs';
  }
}

// ── Component ────────────────────────────────────────────────────────

export function TripIntelligence({
  destinationId,
  city,
  country,
  departureDate,
  returnDate,
  travelerType,
  pathType,
  vibes,
  variant = 'light',
  layout = 'accordion',
}: TripIntelligenceProps) {
  const [data, setData] = useState<TripIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    layout === 'grid' ? new Set() : new Set(['packing'])
  );

  const dark = variant === 'dark';

  useEffect(() => {
    if (destinationId && country && departureDate) {
      loadIntelligence();
    }
  }, [destinationId, country, departureDate]);

  const loadIntelligence = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate nights
      const dep = new Date(departureDate);
      const ret = new Date(returnDate);
      const nights = Math.max(1, Math.round((ret.getTime() - dep.getTime()) / (1000 * 60 * 60 * 24)));

      const response = await fetch('/api/flash/trip-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationId,
          country,
          departureDate,
          returnDate,
          travelerType,
          pathType: pathType || 'classic',
          vibes,
          nights,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || `Failed to load trip prep (${response.status})`);
      }

      const result = await response.json();
      setData(result);
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

  // Theme classes — same pattern as MagicPackage
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
    gradientOrb: dark ? 'from-blue-500/20 to-green-500/20' : 'from-blue-100 to-green-100',
    errorText: dark ? 'text-red-400' : 'text-red-600',
    iconBg: dark ? 'bg-white/10' : 'bg-gray-100',
    essentialBg: dark ? 'bg-green-500/10' : 'bg-green-50',
    essentialText: dark ? 'text-green-400' : 'text-green-600',
    niceToHaveBg: dark ? 'bg-blue-500/10' : 'bg-blue-50',
    niceToHaveText: dark ? 'text-blue-400' : 'text-blue-600',
    factBg: dark ? 'bg-white/5' : 'bg-gray-50',
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className={`${t.loadingCard} rounded-2xl p-8`}>
        <div className="text-center">
          <div className={`w-16 h-16 bg-gradient-to-br ${t.gradientOrb} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <span className="text-3xl">🧭</span>
          </div>
          <h3 className={`text-xl font-bold ${t.title} mb-2`}>
            Preparing Your Trip Brief
          </h3>
          <p className={`${t.textMuted} mb-6`}>
            Loading destination facts for {city}...
          </p>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className={`${t.errorCard} rounded-2xl p-8`}>
        <div className="text-center">
          <p className={`${t.errorText} mb-4`}>{error}</p>
          <button
            onClick={loadIntelligence}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { destinationPrep: prep, packing } = data;
  const weather = prep.weather;
  const monthName = MONTH_NAMES[weather.month] || '';

  // ── Build sections ──
  const sections = [
    {
      id: 'packing',
      title: 'Packing & Essentials',
      emoji: '🧳',
      preview: packing.essentials.slice(0, 2).map(i => i.item).join(', ') +
        (packing.essentials.length > 2 ? ` +${packing.essentials.length - 2} more` : ''),
      content: (
        <div className="space-y-4">
          {/* Essentials */}
          <div>
            <h4 className={`text-xs font-bold ${t.sectionLabel} mb-2.5 uppercase tracking-wide flex items-center gap-1.5`}>
              <span className="text-green-500">{'\u2713'}</span>
              Essentials
            </h4>
            <div className="space-y-1">
              {packing.essentials.map((item: PackingItem, i: number) => (
                <div key={i} className={`flex items-start gap-2.5 text-xs ${t.text} p-1.5 rounded-md transition-colors`}>
                  <span className="text-green-500 text-sm flex-shrink-0">{'\u2713'}</span>
                  <div className="flex-1">
                    <span className="font-medium">{item.item}</span>
                    <span className={`${t.textMuted} ml-1`}>— {item.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nice to Have */}
          {packing.niceToHave.length > 0 && (
            <div>
              <h4 className={`text-xs font-bold ${t.sectionLabel} mb-2.5 uppercase tracking-wide flex items-center gap-1.5`}>
                <span className="text-blue-400">{'\u25CB'}</span>
                Nice to Have
              </h4>
              <div className="space-y-1">
                {packing.niceToHave.map((item: PackingItem, i: number) => (
                  <div key={i} className={`flex items-start gap-2.5 text-xs ${t.text} p-1.5 rounded-md transition-colors`}>
                    <span className="text-blue-400 text-sm flex-shrink-0">{'\u25CB'}</span>
                    <div className="flex-1">
                      <span className="font-medium">{item.item}</span>
                      <span className={`${t.textMuted} ml-1`}>— {item.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'destination',
      title: 'Destination Prep',
      emoji: '🌍',
      preview: `${monthName} in ${city}: ${weather.avgHighC}°C, ${prep.currency.code}, ${prep.languages[0] || 'local language'}`,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Weather card */}
          <div className={`${t.card} rounded-lg p-3`}>
            <h4 className={`text-xs font-bold ${t.sectionLabel} mb-2.5 uppercase tracking-wide flex items-center gap-2`}>
              <span className="text-base text-amber-400">☀️</span>
              {monthName} Weather
            </h4>
            <div className="space-y-1.5">
              <div className={`flex items-center gap-2 text-xs ${t.text}`}>
                <span className="text-amber-400">🌡️</span>
                <span>High: {tempDisplay(weather.avgHighC)}</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${t.text}`}>
                <span className="text-blue-400">🌡️</span>
                <span>Low: {tempDisplay(weather.avgLowC)}</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${t.text}`}>
                <span>🌧️</span>
                <span>Rain: {weather.rainProbability}</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${t.text}`}>
                <span>💧</span>
                <span>Humidity: {weather.humidity}</span>
              </div>
              <p className={`text-[11px] ${t.textMuted} mt-2 italic`}>{weather.description}</p>
            </div>
          </div>

          {/* Currency & Money */}
          <div className={`${t.card} rounded-lg p-3`}>
            <h4 className={`text-xs font-bold ${t.sectionLabel} mb-2.5 uppercase tracking-wide flex items-center gap-2`}>
              <span className="text-base text-green-400">💰</span>
              Currency & Money
            </h4>
            <div className="space-y-1.5">
              <div className={`flex items-center gap-2 text-xs ${t.text}`}>
                <span className="font-mono text-lg">{prep.currency.symbol}</span>
                <span>{prep.currency.name} ({prep.currency.code})</span>
              </div>
              <div className={`flex items-start gap-2 text-xs ${t.text}`}>
                <span>💡</span>
                <span>{prep.tippingNorm}</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${t.text}`}>
                <span>📊</span>
                <span>{costLabel(prep.costLevel)}</span>
              </div>
            </div>
          </div>

          {/* Transport & Safety */}
          <div className={`${t.card} rounded-lg p-3`}>
            <h4 className={`text-xs font-bold ${t.sectionLabel} mb-2.5 uppercase tracking-wide flex items-center gap-2`}>
              <span className="text-base text-blue-400">🚕</span>
              Transport & Safety
            </h4>
            <div className="space-y-1.5">
              <div className={`flex items-start gap-2 text-xs ${t.text}`}>
                <span>🚶</span>
                <span>{prep.transportAdvice}</span>
              </div>
              <div className={`flex items-center gap-2 text-xs`}>
                <span>🛡️</span>
                <span className={safetyLabel(prep.safetyLevel).color}>
                  {safetyLabel(prep.safetyLevel).text}
                </span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${t.text}`}>
                <span>🚗</span>
                <span>Drives on the {prep.drivingSide}</span>
              </div>
            </div>
          </div>

          {/* Essentials */}
          <div className={`${t.card} rounded-lg p-3`}>
            <h4 className={`text-xs font-bold ${t.sectionLabel} mb-2.5 uppercase tracking-wide flex items-center gap-2`}>
              <span className="text-base text-purple-400">⚡</span>
              Essentials
            </h4>
            <div className="space-y-1.5">
              <div className={`flex items-center gap-2 text-xs ${t.text}`}>
                <span>🔌</span>
                <span>{prep.plugTypes.join(', ')} — {prep.voltage}</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${t.text}`}>
                <span>🗣️</span>
                <span>{prep.languages.join(', ')}</span>
              </div>
              <div className={`flex items-start gap-2 text-xs ${t.text}`}>
                <span>🛂</span>
                <span>{prep.visaInfo}</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${t.text}`}>
                <span>💧</span>
                <span>{waterLabel(prep.waterSafety)}</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${t.text}`}>
                <span>🚨</span>
                <span>Emergency: {prep.emergencyNumber}</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${t.text}`}>
                <span>🕐</span>
                <span>{prep.timeZone}</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // ─── Grid Layout ───
  if (layout === 'grid') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
          <span className="text-xl">🧭</span>
        </div>
        <div>
          <h3 className={`text-lg font-bold ${t.title}`}>Trip Prep</h3>
          <p className={`text-sm ${t.subtitle}`}>Your {city} briefing</p>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.id} className={`${t.card} rounded-xl overflow-hidden`}>
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
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
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
