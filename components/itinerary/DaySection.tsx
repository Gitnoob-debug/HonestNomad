'use client';

import { ItineraryItem } from './ItineraryItem';
import type { ItineraryDay } from '@/types/itinerary';

interface DaySectionProps {
  day: ItineraryDay;
  isExpanded: boolean;
  onToggle: () => void;
  onItemToggle: (itemId: string) => void;
}

export function DaySection({
  day,
  isExpanded,
  onToggle,
  onItemToggle,
}: DaySectionProps) {
  return (
    <div>
      {/* Day Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
            {day.dayNumber}
          </span>
          <div className="text-left">
            <div className="font-medium text-gray-900">{day.theme}</div>
            <div className="text-sm text-gray-500">
              {day.dayOfWeek}, {day.date}
            </div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Day Items */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {day.weatherNote && (
            <div className="bg-blue-50 text-blue-800 text-sm px-3 py-2 rounded-lg">
              {day.weatherNote}
            </div>
          )}
          {day.items.map((item) => (
            <ItineraryItem
              key={item.id}
              item={item}
              onToggle={() => onItemToggle(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
