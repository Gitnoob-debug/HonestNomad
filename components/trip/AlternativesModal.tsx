'use client';

import { useState } from 'react';
import type { NormalizedFlight } from '@/types/flight';
import type { NormalizedHotel } from '@/types/hotel';

interface AlternativesModalProps {
  type: 'flight' | 'hotel';
  alternatives: NormalizedFlight[] | NormalizedHotel[];
  currentId?: string;
  onSelect: (item: NormalizedFlight | NormalizedHotel) => void;
  onClose: () => void;
}

export function AlternativesModal({
  type,
  alternatives,
  currentId,
  onSelect,
  onClose,
}: AlternativesModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConfirm = () => {
    const selected = alternatives.find((alt) => alt.id === selectedId);
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {type === 'flight' ? 'Choose a Different Flight' : 'Choose a Different Hotel'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] p-6 space-y-4">
          {type === 'flight' ? (
            // Flight alternatives
            (alternatives as NormalizedFlight[]).map((flight) => (
              <FlightOption
                key={flight.id}
                flight={flight}
                isSelected={selectedId === flight.id}
                isCurrent={currentId === flight.id}
                onSelect={() => setSelectedId(flight.id)}
              />
            ))
          ) : (
            // Hotel alternatives
            (alternatives as NormalizedHotel[]).map((hotel) => (
              <HotelOption
                key={hotel.id}
                hotel={hotel}
                isSelected={selectedId === hotel.id}
                isCurrent={currentId === hotel.id}
                onSelect={() => setSelectedId(hotel.id)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId || selectedId === currentId}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}

function FlightOption({
  flight,
  isSelected,
  isCurrent,
  onSelect,
}: {
  flight: NormalizedFlight;
  isSelected: boolean;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  const outbound = flight.slices[0];
  const returnSlice = flight.slices[1];

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : isCurrent
          ? 'border-green-300 bg-green-50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Airline and route */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-gray-900">
              {flight.airlines[0]?.name || 'Airline'}
            </span>
            {isCurrent && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Current selection
              </span>
            )}
          </div>

          {/* Outbound */}
          <div className="text-sm text-gray-600 mb-1">
            <span className="font-medium">{outbound?.origin}</span>
            <span className="mx-2">→</span>
            <span className="font-medium">{outbound?.destination}</span>
            <span className="mx-2">•</span>
            <span>{outbound?.stops === 0 ? 'Direct' : `${outbound?.stops} stop(s)`}</span>
            <span className="mx-2">•</span>
            <span>{outbound?.duration}</span>
          </div>

          {/* Return */}
          {returnSlice && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{returnSlice.origin}</span>
              <span className="mx-2">→</span>
              <span className="font-medium">{returnSlice.destination}</span>
              <span className="mx-2">•</span>
              <span>{returnSlice.stops === 0 ? 'Direct' : `${returnSlice.stops} stop(s)`}</span>
              <span className="mx-2">•</span>
              <span>{returnSlice.duration}</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="text-right ml-4">
          <div className="text-xl font-bold text-gray-900">
            ${flight.pricing.totalAmount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">
            ${flight.pricing.perPassenger}/person
          </div>
        </div>
      </div>

      {/* Selection indicator */}
      <div className="mt-3 flex items-center gap-2">
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
          }`}
        >
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <span className={`text-sm ${isSelected ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
          {isSelected ? 'Selected' : 'Select this flight'}
        </span>
      </div>
    </button>
  );
}

function HotelOption({
  hotel,
  isSelected,
  isCurrent,
  onSelect,
}: {
  hotel: NormalizedHotel;
  isSelected: boolean;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : isCurrent
          ? 'border-green-300 bg-green-50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      <div className="flex gap-4">
        {/* Image */}
        {hotel.photos[0]?.url && (
          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={hotel.photos[0].url}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="font-semibold text-gray-900 truncate">
                {hotel.name}
              </h3>
              {hotel.rating.stars && (
                <div className="flex items-center gap-1 mt-0.5">
                  {Array.from({ length: hotel.rating.stars }).map((_, i) => (
                    <span key={i} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
              )}
            </div>
            {isCurrent && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">
                Current
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 truncate">
            {hotel.location?.city}
          </p>

          {hotel.rating.reviewScore && (
            <div className="mt-1 flex items-center gap-1">
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                {hotel.rating.reviewScore}
              </span>
              {hotel.rating.reviewCount && (
                <span className="text-xs text-gray-500">
                  {hotel.rating.reviewCount} reviews
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="text-right flex-shrink-0">
          <div className="text-xl font-bold text-gray-900">
            ${hotel.pricing.nightlyRate}
          </div>
          <div className="text-sm text-gray-500">/night</div>
        </div>
      </div>

      {/* Selection indicator */}
      <div className="mt-3 flex items-center gap-2">
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
          }`}
        >
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <span className={`text-sm ${isSelected ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
          {isSelected ? 'Selected' : 'Select this hotel'}
        </span>
      </div>
    </button>
  );
}

export default AlternativesModal;
