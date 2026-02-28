'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui';
import { findNearestAirport, type AirportInfo } from '@/lib/flash/airportCoords';
import { computeDistanceDefaults, getFallbackDefaults, type DistanceDefaults } from '@/lib/flash/distanceDefaults';
import type { FlashGenerateParams, BudgetTier, TravelerType, RoomConfig } from '@/types/flash';

interface FlashPlanInputProps {
  onGenerate: (params: FlashGenerateParams) => void;
  isLoading?: boolean;
}

// Vibes that map to POI path types
const VIBE_PRESETS = [
  { value: 'beach', label: 'Beach & Relax', emoji: '🏖️' },
  { value: 'city', label: 'Cool City Vibes', emoji: '🌆' },
  { value: 'food', label: 'Foodie Paradise', emoji: '🍷' },
  { value: 'adventure', label: 'Adventure', emoji: '🏔️' },
  { value: 'culture', label: 'History & Culture', emoji: '🏛️' },
  { value: 'nightlife', label: 'Nightlife', emoji: '🎉' },
];

// Region presets (inside More Options)
const REGION_PRESETS = [
  { value: 'europe', label: 'Europe', emoji: '🇪🇺' },
  { value: 'asia', label: 'Asia', emoji: '🌏' },
  { value: 'caribbean', label: 'Caribbean', emoji: '🌴' },
  { value: 'americas', label: 'Americas', emoji: '🌎' },
  { value: 'anywhere', label: 'Anywhere', emoji: '🌍' },
];

// Traveler type options
const TRAVELER_PRESETS: { value: TravelerType; label: string; emoji: string }[] = [
  { value: 'solo', label: 'Solo', emoji: '🧑' },
  { value: 'couple', label: 'Couple', emoji: '💑' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
];

// Default room configs by traveler type
const DEFAULT_ROOM_CONFIGS: Record<TravelerType, RoomConfig> = {
  solo: { adults: 1, children: 0, childAges: [] },
  couple: { adults: 2, children: 0, childAges: [] },
  family: { adults: 2, children: 1, childAges: [8] },
};

// Session storage keys
const TRAVELERS_STORAGE_KEY = 'flash_traveler_type';
const AIRPORT_STORAGE_KEY = 'flash_origin_airport';

// Default trip length in days (auto-fills checkout)
const DEFAULT_TRIP_NIGHTS = 5;

export function FlashPlanInput({ onGenerate, isLoading }: FlashPlanInputProps) {
  const [checkinDate, setCheckinDate] = useState('');
  const [checkoutDate, setCheckoutDate] = useState('');

  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [travelerType, setTravelerType] = useState<TravelerType>('couple');
  const [roomConfig, setRoomConfig] = useState<RoomConfig>(DEFAULT_ROOM_CONFIGS.couple);

  // Geolocation → nearest airport
  const [detectedAirport, setDetectedAirport] = useState<AirportInfo | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'detecting' | 'done' | 'denied'>('idle');

  // Track whether we've already applied smart defaults (to avoid re-applying on re-renders)
  const smartDefaultsApplied = useRef(false);
  // Track the distance tier for the hint text
  const [distanceHint, setDistanceHint] = useState<DistanceDefaults['tier'] | null>(null);

  // --- Defaults that live behind "More options" ---
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('deals');
  const [selectedRegion, setSelectedRegion] = useState<string>('anywhere');
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Load saved state from session storage
  useEffect(() => {
    try {
      const storedTraveler = sessionStorage.getItem(TRAVELERS_STORAGE_KEY);
      if (storedTraveler && ['solo', 'couple', 'family'].includes(storedTraveler)) {
        const type = storedTraveler as TravelerType;
        setTravelerType(type);
        // Load room config if stored, otherwise use default for type
        const storedRoom = sessionStorage.getItem('flash_room_config');
        if (storedRoom) {
          setRoomConfig(JSON.parse(storedRoom) as RoomConfig);
        } else {
          setRoomConfig(DEFAULT_ROOM_CONFIGS[type]);
        }
      } else if (storedTraveler === 'friends') {
        // Migrate legacy 'friends' → 'couple'
        setTravelerType('couple');
        setRoomConfig(DEFAULT_ROOM_CONFIGS.couple);
      }

      const storedAirport = sessionStorage.getItem(AIRPORT_STORAGE_KEY);
      if (storedAirport) {
        const airport = JSON.parse(storedAirport) as AirportInfo;
        setDetectedAirport(airport);
        setGeoStatus('done');
      }
    } catch {}
  }, []);

  // Auto-detect location on mount (silent, non-blocking)
  useEffect(() => {
    // Skip if we already have a cached airport
    if (geoStatus === 'done') return;

    // Check if geolocation is available
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }

    setGeoStatus('detecting');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const airport = findNearestAirport(position.coords.latitude, position.coords.longitude);
        setDetectedAirport(airport);
        setGeoStatus('done');
        try {
          sessionStorage.setItem(AIRPORT_STORAGE_KEY, JSON.stringify(airport));
        } catch {}
      },
      () => {
        // User denied or error — silently continue without airport
        setGeoStatus('denied');
      },
      { timeout: 8000, maximumAge: 600000 } // 8s timeout, cache for 10min
    );
  }, [geoStatus]);

  // Auto-fill dates with distance-based smart defaults
  useEffect(() => {
    // Only apply once, and only if user hasn't already picked dates
    if (smartDefaultsApplied.current || checkinDate) return;

    // Try to get destination context from the Discover flow
    let destLat: number | null = null;
    let destLng: number | null = null;
    try {
      const stored = sessionStorage.getItem('discover_destination');
      if (stored) {
        const dest = JSON.parse(stored);
        if (dest.latitude && dest.longitude) {
          destLat = dest.latitude;
          destLng = dest.longitude;
        }
      }
    } catch { /* ignore parse errors */ }

    if (destLat !== null && destLng !== null && detectedAirport) {
      // We know both user location and destination — compute distance-based defaults
      const defaults = computeDistanceDefaults(
        detectedAirport.lat,
        detectedAirport.lng,
        destLat,
        destLng
      );
      setCheckinDate(defaults.checkinDate);
      setCheckoutDate(defaults.checkoutDate);
      setDistanceHint(defaults.tier);
      smartDefaultsApplied.current = true;
    } else if (geoStatus === 'done' || geoStatus === 'denied') {
      // No destination context or no user location — use fallback
      const fallback = getFallbackDefaults();
      setCheckinDate(fallback.checkinDate);
      setCheckoutDate(fallback.checkoutDate);
      smartDefaultsApplied.current = true;
    }
  }, [detectedAirport, geoStatus, checkinDate]);

  // Save traveler type to session storage
  const handleTravelerChange = (type: TravelerType) => {
    setTravelerType(type);
    const newRoom = type === 'family' && travelerType === 'family'
      ? roomConfig // keep existing family config
      : DEFAULT_ROOM_CONFIGS[type];
    setRoomConfig(newRoom);
    try {
      sessionStorage.setItem(TRAVELERS_STORAGE_KEY, type);
      sessionStorage.setItem('flash_room_config', JSON.stringify(newRoom));
    } catch {}
  };

  // Update room config (for family configurator)
  const updateRoomConfig = (update: Partial<RoomConfig>) => {
    const updated = { ...roomConfig, ...update };
    // Keep childAges array in sync with children count
    if (update.children !== undefined) {
      if (update.children > roomConfig.children) {
        // Added a child — default age 8
        updated.childAges = [...roomConfig.childAges];
        while (updated.childAges.length < update.children) {
          updated.childAges.push(8);
        }
      } else if (update.children < roomConfig.children) {
        // Removed a child — trim from end
        updated.childAges = roomConfig.childAges.slice(0, update.children);
      }
    }
    setRoomConfig(updated);
    try {
      sessionStorage.setItem('flash_room_config', JSON.stringify(updated));
    } catch {}
  };

  const updateChildAge = (index: number, age: number) => {
    const newAges = [...roomConfig.childAges];
    newAges[index] = age;
    const updated = { ...roomConfig, childAges: newAges };
    setRoomConfig(updated);
    try {
      sessionStorage.setItem('flash_room_config', JSON.stringify(updated));
    } catch {}
  };

  // Calculate min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Calculate min checkout date (day after checkin)
  const minCheckoutDate = checkinDate
    ? new Date(new Date(checkinDate).getTime() + 86400000).toISOString().split('T')[0]
    : minDate;

  // When checkin changes, auto-set checkout to checkin + DEFAULT_TRIP_NIGHTS
  const handleCheckinChange = (value: string) => {
    setCheckinDate(value);

    // Auto-fill checkout if not yet set or if current checkout is before new checkin
    if (!checkoutDate || new Date(checkoutDate) <= new Date(value)) {
      const autoCheckout = new Date(new Date(value).getTime() + DEFAULT_TRIP_NIGHTS * 86400000);
      setCheckoutDate(autoCheckout.toISOString().split('T')[0]);
    }
  };

  const handleVibeToggle = (vibe: string) => {
    setSelectedVibes(prev =>
      prev.includes(vibe)
        ? prev.filter(v => v !== vibe)
        : prev.length < 3 ? [...prev, vibe] : prev
    );
  };

  const handleSubmit = () => {
    if (!checkinDate || !checkoutDate) return;

    // Save params to sessionStorage for the confirm page
    try {
      sessionStorage.setItem('flash_generate_params', JSON.stringify({
        departureDate: checkinDate,
        returnDate: checkoutDate,
      }));
    } catch {}

    onGenerate({
      departureDate: checkinDate,
      returnDate: checkoutDate,
      vibe: selectedVibes.length > 0 ? selectedVibes : undefined,
      region: selectedRegion !== 'anywhere' ? selectedRegion : undefined,
      budgetMode: budgetTier === 'budget' ? 'bargain' : budgetTier === 'extravagant' ? 'custom' : 'regular',
      customBudget: budgetTier === 'extravagant' ? 'no limit, luxury only' : undefined,
      travelers: travelerType,
      roomConfig: travelerType === 'family' ? roomConfig : DEFAULT_ROOM_CONFIGS[travelerType],
      originAirport: detectedAirport?.code || undefined,
    });
  };

  const isValid = checkinDate && checkoutDate && new Date(checkoutDate) > new Date(checkinDate);

  // Calculate trip duration
  const tripNights = checkinDate && checkoutDate
    ? Math.ceil((new Date(checkoutDate).getTime() - new Date(checkinDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Count active "More options" overrides for the badge
  const moreOptionsCount =
    (budgetTier !== 'deals' ? 1 : 0) +
    (selectedRegion !== 'anywhere' ? 1 : 0);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
      <div className="space-y-8">

        {/* ========== DATES SECTION ========== */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">When?</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-in
              </label>
              <input
                type="date"
                value={checkinDate}
                onChange={(e) => handleCheckinChange(e.target.value)}
                min={minDate}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-out
              </label>
              <input
                type="date"
                value={checkoutDate}
                onChange={(e) => setCheckoutDate(e.target.value)}
                min={minCheckoutDate}
                disabled={!checkinDate}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {tripNights > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              {tripNights}-night stay
              {distanceHint && (
                <span className="text-gray-400 ml-1">
                  {distanceHint === 'impulse' && '— quick weekend escape'}
                  {distanceHint === 'short_haul' && '— short trip, easy to plan'}
                  {distanceHint === 'medium_haul' && '— a couple weeks to get ready'}
                  {distanceHint === 'long_haul' && '— time to plan your adventure'}
                </span>
              )}
            </p>
          )}
        </div>

        {/* ========== TRAVELERS SECTION (compact inline) ========== */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Who&apos;s going?</h3>
          <div className="flex gap-2">
            {TRAVELER_PRESETS.map((t) => (
              <button
                key={t.value}
                onClick={() => handleTravelerChange(t.value)}
                className={`flex-1 py-2.5 px-2 rounded-xl text-center transition-all border-2 flex flex-col items-center gap-1 ${
                  travelerType === t.value
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <span className="text-xl">{t.emoji}</span>
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Family room configurator — inline expand */}
          {travelerType === 'family' && (
            <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 animate-in slide-in-from-top-2 duration-200">
              {/* Adults counter */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-800">Adults</span>
                  <span className="text-xs text-gray-500 ml-1.5">18+</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateRoomConfig({ adults: Math.max(1, roomConfig.adults - 1) })}
                    disabled={roomConfig.adults <= 1}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary-500 hover:text-primary-600 disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-600 transition-colors"
                  >
                    −
                  </button>
                  <span className="text-sm font-semibold w-4 text-center">{roomConfig.adults}</span>
                  <button
                    onClick={() => updateRoomConfig({ adults: Math.min(6, roomConfig.adults + 1) })}
                    disabled={roomConfig.adults >= 6}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary-500 hover:text-primary-600 disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-600 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Children counter */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-800">Children</span>
                  <span className="text-xs text-gray-500 ml-1.5">0–17</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateRoomConfig({ children: Math.max(0, roomConfig.children - 1) })}
                    disabled={roomConfig.children <= 0}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary-500 hover:text-primary-600 disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-600 transition-colors"
                  >
                    −
                  </button>
                  <span className="text-sm font-semibold w-4 text-center">{roomConfig.children}</span>
                  <button
                    onClick={() => updateRoomConfig({ children: Math.min(4, roomConfig.children + 1) })}
                    disabled={roomConfig.children >= 4}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary-500 hover:text-primary-600 disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-600 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Child age selectors */}
              {roomConfig.children > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Child ages (for hotel room search)</p>
                  <div className="flex flex-wrap gap-2">
                    {roomConfig.childAges.map((age, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500">Child {idx + 1}:</span>
                        <select
                          value={age}
                          onChange={(e) => updateChildAge(idx, parseInt(e.target.value))}
                          className="px-2 py-1 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          {Array.from({ length: 18 }, (_, i) => (
                            <option key={i} value={i}>
                              {i === 0 ? 'Under 1' : `${i} yr${i > 1 ? 's' : ''}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========== VIBE SECTION ========== */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">What vibe?</h3>
          <p className="text-xs text-gray-500 mb-4">Pick up to 3, or skip for a surprise mix</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {VIBE_PRESETS.map((vibe) => (
              <button
                key={vibe.value}
                onClick={() => handleVibeToggle(vibe.value)}
                className={`p-3 sm:p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-1.5 min-h-[64px] ${
                  selectedVibes.includes(vibe.value)
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="text-2xl">{vibe.emoji}</span>
                <span className="text-xs font-medium leading-tight">{vibe.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ========== MORE OPTIONS (COLLAPSIBLE) ========== */}
        <div>
          <button
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showMoreOptions ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            More options
            {moreOptionsCount > 0 && (
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                {moreOptionsCount} changed
              </span>
            )}
          </button>

          {showMoreOptions && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-6">
              {/* Budget */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Budget</h4>
                <div className="flex gap-2">
                  {[
                    { value: 'budget' as BudgetTier, label: 'Budget', emoji: '💰' },
                    { value: 'deals' as BudgetTier, label: 'Best Value', emoji: '🏷️' },
                    { value: 'extravagant' as BudgetTier, label: 'Luxury', emoji: '✨' },
                  ].map((b) => (
                    <button
                      key={b.value}
                      onClick={() => setBudgetTier(b.value)}
                      className={`flex-1 py-2.5 px-2 rounded-lg text-center transition-all border-2 flex flex-col items-center gap-1 ${
                        budgetTier === b.value
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <span className="text-lg">{b.emoji}</span>
                      <span className="text-xs font-medium">{b.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Region */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Region</h4>
                <div className="flex flex-wrap gap-2">
                  {REGION_PRESETS.map((region) => (
                    <button
                      key={region.value}
                      onClick={() => setSelectedRegion(region.value)}
                      className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all border-2 ${
                        selectedRegion === region.value
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <span className="mr-1">{region.emoji}</span>
                      {region.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========== GENERATE BUTTON ========== */}
        <div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            loading={isLoading}
            className="w-full py-4 text-lg"
          >
            {isLoading ? 'Finding trips...' : 'Find My Trips'}
          </Button>
          {!isValid && !isLoading && (
            <p className="text-sm text-amber-600 text-center mt-2">
              {!checkinDate ? '☝️ Pick your check-in date to get started' : !checkoutDate ? '☝️ Pick a check-out date' : 'Check-out must be after check-in'}
            </p>
          )}
        </div>

        {/* Subtle info line — airport detection + count */}
        <div className="text-center text-sm text-gray-500">
          <span>16 curated destinations matched to your taste</span>
          {detectedAirport && geoStatus === 'done' && (
            <span className="block text-xs text-gray-400 mt-1">
              Prioritizing destinations reachable from {detectedAirport.city}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
