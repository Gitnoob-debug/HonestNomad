'use client';

import type { TripDay, TripActivity } from '@/types/trip';

interface TripItineraryProps {
  itinerary: TripDay[];
  destination: string;
}

export default function TripItinerary({ itinerary, destination }: TripItineraryProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const getActivityIcon = (type: TripActivity['type']) => {
    switch (type) {
      case 'arrival':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
      case 'departure':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      case 'check_in':
      case 'check_out':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'sightseeing':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'dining':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'activity':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'transfer':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getActivityColor = (type: TripActivity['type']) => {
    switch (type) {
      case 'arrival':
      case 'departure':
        return 'bg-blue-100 text-blue-600';
      case 'check_in':
      case 'check_out':
        return 'bg-purple-100 text-purple-600';
      case 'sightseeing':
        return 'bg-green-100 text-green-600';
      case 'dining':
        return 'bg-orange-100 text-orange-600';
      case 'activity':
        return 'bg-pink-100 text-pink-600';
      case 'transfer':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (itinerary.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
        No itinerary available yet. Complete your trip search to see a day-by-day plan.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Day-by-Day Itinerary
      </h3>

      {itinerary.map((day) => (
        <div key={day.date} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Day Header */}
          <div
            className={`px-4 py-3 ${
              day.isTravel ? 'bg-blue-50 border-b border-blue-100' : 'bg-gray-50 border-b border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900">Day {day.dayNumber}</span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-gray-600">{formatDate(day.date)}</span>
              </div>
              {day.isTravel && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  Travel Day
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-1">{day.location}</div>
          </div>

          {/* Activities */}
          <div className="p-4">
            <div className="space-y-3">
              {day.activities.map((activity, index) => (
                <div key={activity.id} className="flex gap-3">
                  {/* Time */}
                  <div className="w-16 flex-shrink-0 text-sm text-gray-500 pt-0.5">
                    {activity.time || '--:--'}
                  </div>

                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(
                        activity.type
                      )}`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    {index < day.activities.length - 1 && (
                      <div className="w-0.5 h-full min-h-[20px] bg-gray-200 mt-1"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-3">
                    <div className="font-medium text-gray-900">{activity.title}</div>
                    {activity.description && (
                      <div className="text-sm text-gray-600 mt-0.5">{activity.description}</div>
                    )}
                    {activity.location && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                        </svg>
                        {activity.location}
                      </div>
                    )}
                    {activity.duration && (
                      <div className="text-xs text-gray-500 mt-1">Duration: {activity.duration}</div>
                    )}
                    {activity.cost && (
                      <div className="text-xs text-gray-500 mt-1">
                        ~${activity.cost.amount} {activity.cost.currency}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {day.notes && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                {day.notes}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
