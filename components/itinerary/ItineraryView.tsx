'use client';

import { useState } from 'react';
import { DaySection } from './DaySection';
import { ItineraryExport } from './ItineraryExport';
import { HotelMap } from '@/components/map';
import type { Itinerary } from '@/types/itinerary';

interface ItineraryViewProps {
  itinerary: Itinerary;
  onItemToggle?: (dayIndex: number, itemId: string) => void;
}

export function ItineraryView({ itinerary, onItemToggle }: ItineraryViewProps) {
  const [expandedDay, setExpandedDay] = useState<number>(0);
  const [showMap, setShowMap] = useState(false);

  // Collect all locations for map
  const allLocations = itinerary.days.flatMap((day) =>
    day.items
      .filter((item) => item.coordinates)
      .map((item) => ({
        lat: item.coordinates!.lat,
        lng: item.coordinates!.lng,
        name: item.activity,
        type: item.category,
      }))
  );

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{itinerary.destination}</h2>
            <p className="opacity-90 mt-1">
              {itinerary.dates.start} - {itinerary.dates.end} ({itinerary.dates.nights} nights)
            </p>
            <p className="text-sm opacity-75 mt-1">
              {itinerary.hotel.name}, {itinerary.hotel.neighborhood}
            </p>
          </div>
          <ItineraryExport itinerary={itinerary} />
        </div>
      </div>

      {/* Map Toggle */}
      <div className="p-4 border-b">
        <button
          onClick={() => setShowMap(!showMap)}
          className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center gap-2"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showMap ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {showMap ? 'Hide Map' : 'Show All Locations on Map'}
        </button>
        {showMap && (
          <div className="mt-4">
            <HotelMap
              hotel={{
                lat: itinerary.hotel.coordinates.lat,
                lng: itinerary.hotel.coordinates.lng,
                name: itinerary.hotel.name,
              }}
              attractions={allLocations}
              className="h-80"
            />
          </div>
        )}
      </div>

      {/* Days */}
      <div className="divide-y">
        {itinerary.days.map((day, dayIndex) => (
          <DaySection
            key={day.date}
            day={day}
            isExpanded={expandedDay === dayIndex}
            onToggle={() =>
              setExpandedDay(expandedDay === dayIndex ? -1 : dayIndex)
            }
            onItemToggle={(itemId) => onItemToggle?.(dayIndex, itemId)}
          />
        ))}
      </div>

      {/* Tips Section */}
      <div className="p-6 bg-gray-50">
        <div className="grid md:grid-cols-2 gap-6">
          {itinerary.packingTips.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span>Packing Tips</span>
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {itinerary.packingTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary-600">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {itinerary.localTips.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Local Tips</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {itinerary.localTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary-600">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Info */}
      <div className="p-4 bg-red-50 text-sm">
        <h4 className="font-semibold text-red-800 mb-1">Emergency Info</h4>
        <p className="text-red-700">
          {itinerary.emergencyInfo.emergencyNumber}
          {itinerary.emergencyInfo.hospitalNearby && (
            <> • Hospital: {itinerary.emergencyInfo.hospitalNearby}</>
          )}
        </p>
      </div>
    </div>
  );
}
