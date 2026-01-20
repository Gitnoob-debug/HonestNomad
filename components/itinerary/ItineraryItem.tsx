'use client';

import type { ItineraryItem as ItineraryItemType, ItineraryCategory } from '@/types/itinerary';

interface ItineraryItemProps {
  item: ItineraryItemType;
  onToggle: () => void;
}

const categoryIcons: Record<ItineraryCategory, string> = {
  transport: '🚃',
  activity: '📍',
  food: '🍽️',
  rest: '☕',
  checkin: '🏨',
  checkout: '👋',
};

const categoryColors: Record<ItineraryCategory, string> = {
  transport: 'border-l-blue-400',
  activity: 'border-l-green-400',
  food: 'border-l-orange-400',
  rest: 'border-l-purple-400',
  checkin: 'border-l-primary-400',
  checkout: 'border-l-gray-400',
};

export function ItineraryItem({ item, onToggle }: ItineraryItemProps) {
  return (
    <div
      className={`
        flex gap-3 p-3 rounded-lg border-l-4 bg-white shadow-sm
        ${categoryColors[item.category]}
        ${item.completed ? 'opacity-60' : ''}
      `}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`
          w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center
          ${
            item.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        {item.completed && (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-500">{item.time}</span>
          <span>{categoryIcons[item.category]}</span>
          <span
            className={`font-medium text-gray-900 ${
              item.completed ? 'line-through' : ''
            }`}
          >
            {item.activity}
          </span>
        </div>
        <div className="text-sm text-gray-500 mt-0.5">
          {item.location} • {item.duration}
          {item.costEstimate && ` • ${item.costEstimate}`}
        </div>
        {item.notes && (
          <p className="text-sm text-gray-600 mt-1 italic">{item.notes}</p>
        )}
        {item.bookingRequired && (
          <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
            Book in advance
          </span>
        )}
      </div>
    </div>
  );
}
