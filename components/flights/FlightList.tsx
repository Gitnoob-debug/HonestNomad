'use client';

import FlightCard from './FlightCard';
import type { NormalizedFlight } from '@/types/flight';

interface FlightListProps {
  flights: NormalizedFlight[];
  onSelectFlight?: (flight: NormalizedFlight) => void;
}

export default function FlightList({ flights, onSelectFlight }: FlightListProps) {
  if (flights.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No flights found. Try adjusting your search criteria.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{flights.length} flight{flights.length !== 1 ? 's' : ''} found</span>
        <span>Sorted by price</span>
      </div>
      <div className="space-y-3">
        {flights.map((flight) => (
          <FlightCard
            key={flight.id}
            flight={flight}
            onSelect={onSelectFlight}
          />
        ))}
      </div>
    </div>
  );
}
