'use client';

import { useState, useEffect, useRef } from 'react';
import { HomeBase } from '@/types/flash';

interface HomeBaseStepProps {
  data: Partial<HomeBase>;
  onChange: (data: Partial<HomeBase>) => void;
}

// Common airports for quick selection
const POPULAR_AIRPORTS = [
  { code: 'JFK', city: 'New York', country: 'United States' },
  { code: 'LAX', city: 'Los Angeles', country: 'United States' },
  { code: 'ORD', city: 'Chicago', country: 'United States' },
  { code: 'LHR', city: 'London', country: 'United Kingdom' },
  { code: 'CDG', city: 'Paris', country: 'France' },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany' },
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'DXB', city: 'Dubai', country: 'United Arab Emirates' },
  { code: 'SIN', city: 'Singapore', country: 'Singapore' },
  { code: 'HND', city: 'Tokyo', country: 'Japan' },
  { code: 'SYD', city: 'Sydney', country: 'Australia' },
  { code: 'YYZ', city: 'Toronto', country: 'Canada' },
];

// Extended airport list for search
const ALL_AIRPORTS = [
  ...POPULAR_AIRPORTS,
  { code: 'SFO', city: 'San Francisco', country: 'United States' },
  { code: 'SEA', city: 'Seattle', country: 'United States' },
  { code: 'BOS', city: 'Boston', country: 'United States' },
  { code: 'MIA', city: 'Miami', country: 'United States' },
  { code: 'DFW', city: 'Dallas', country: 'United States' },
  { code: 'DEN', city: 'Denver', country: 'United States' },
  { code: 'ATL', city: 'Atlanta', country: 'United States' },
  { code: 'PHX', city: 'Phoenix', country: 'United States' },
  { code: 'IAH', city: 'Houston', country: 'United States' },
  { code: 'LGW', city: 'London Gatwick', country: 'United Kingdom' },
  { code: 'MAN', city: 'Manchester', country: 'United Kingdom' },
  { code: 'EDI', city: 'Edinburgh', country: 'United Kingdom' },
  { code: 'ORY', city: 'Paris Orly', country: 'France' },
  { code: 'MUC', city: 'Munich', country: 'Germany' },
  { code: 'BCN', city: 'Barcelona', country: 'Spain' },
  { code: 'MAD', city: 'Madrid', country: 'Spain' },
  { code: 'FCO', city: 'Rome', country: 'Italy' },
  { code: 'MXP', city: 'Milan', country: 'Italy' },
  { code: 'ZRH', city: 'Zurich', country: 'Switzerland' },
  { code: 'VIE', city: 'Vienna', country: 'Austria' },
  { code: 'CPH', city: 'Copenhagen', country: 'Denmark' },
  { code: 'ARN', city: 'Stockholm', country: 'Sweden' },
  { code: 'OSL', city: 'Oslo', country: 'Norway' },
  { code: 'HEL', city: 'Helsinki', country: 'Finland' },
  { code: 'DUB', city: 'Dublin', country: 'Ireland' },
  { code: 'LIS', city: 'Lisbon', country: 'Portugal' },
  { code: 'ATH', city: 'Athens', country: 'Greece' },
  { code: 'IST', city: 'Istanbul', country: 'Turkey' },
  { code: 'TLV', city: 'Tel Aviv', country: 'Israel' },
  { code: 'CAI', city: 'Cairo', country: 'Egypt' },
  { code: 'JNB', city: 'Johannesburg', country: 'South Africa' },
  { code: 'NRT', city: 'Tokyo Narita', country: 'Japan' },
  { code: 'ICN', city: 'Seoul', country: 'South Korea' },
  { code: 'HKG', city: 'Hong Kong', country: 'Hong Kong' },
  { code: 'BKK', city: 'Bangkok', country: 'Thailand' },
  { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia' },
  { code: 'DEL', city: 'New Delhi', country: 'India' },
  { code: 'BOM', city: 'Mumbai', country: 'India' },
  { code: 'PEK', city: 'Beijing', country: 'China' },
  { code: 'PVG', city: 'Shanghai', country: 'China' },
  { code: 'MEL', city: 'Melbourne', country: 'Australia' },
  { code: 'AKL', city: 'Auckland', country: 'New Zealand' },
  { code: 'GRU', city: 'Sao Paulo', country: 'Brazil' },
  { code: 'MEX', city: 'Mexico City', country: 'Mexico' },
  { code: 'EZE', city: 'Buenos Aires', country: 'Argentina' },
  { code: 'SCL', city: 'Santiago', country: 'Chile' },
  { code: 'BOG', city: 'Bogota', country: 'Colombia' },
];

export function HomeBaseStep({ data, onChange }: HomeBaseStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<typeof ALL_AIRPORTS>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const query = searchQuery.toLowerCase();
      const results = ALL_AIRPORTS.filter(
        (airport) =>
          airport.code.toLowerCase().includes(query) ||
          airport.city.toLowerCase().includes(query) ||
          airport.country.toLowerCase().includes(query)
      ).slice(0, 8);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const selectAirport = (airport: typeof ALL_AIRPORTS[0]) => {
    onChange({
      airportCode: airport.code,
      city: airport.city,
      country: airport.country,
    });
    setSearchQuery('');
    setIsSearching(false);
  };

  const clearSelection = () => {
    onChange({
      airportCode: '',
      city: '',
      country: '',
    });
    setSearchQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search for your home airport
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearching(true);
            }}
            onFocus={() => setIsSearching(true)}
            placeholder="Type city or airport code..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {/* Search results dropdown */}
          {isSearching && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-auto">
              {searchResults.map((airport) => (
                <button
                  key={airport.code}
                  onClick={() => selectAirport(airport)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                >
                  <span className="font-mono text-sm font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded">
                    {airport.code}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{airport.city}</p>
                    <p className="text-sm text-gray-500">{airport.country}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected airport */}
      {data.airportCode && (
        <div className="p-4 bg-primary-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✈️</span>
            <div>
              <p className="font-semibold text-gray-900">
                {data.city} ({data.airportCode})
              </p>
              <p className="text-sm text-gray-600">{data.country}</p>
            </div>
          </div>
          <button
            onClick={clearSelection}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Popular airports */}
      {!data.airportCode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Or select a popular airport
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {POPULAR_AIRPORTS.map((airport) => (
              <button
                key={airport.code}
                onClick={() => selectAirport(airport)}
                className="p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 text-left transition-colors"
              >
                <p className="font-mono text-xs font-semibold text-primary-600">{airport.code}</p>
                <p className="text-sm font-medium text-gray-900 truncate">{airport.city}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Helper text */}
      <p className="text-sm text-gray-500">
        This will be your default departure point. You can always change it when planning trips.
      </p>
    </div>
  );
}
