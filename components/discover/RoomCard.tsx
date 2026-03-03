'use client';

import { useState, useCallback } from 'react';
import type { RoomOption, RateOption } from '@/app/api/hotels/room-rates/route';

// ── RoomCard ──────────────────────────────────────────────────────────
// Displays a single room type with its photo carousel, details, and
// rate options (refundable/non-refundable, board types, pricing).

interface RoomCardProps {
  room: RoomOption;
  nights: number;
  isFirst?: boolean;
  onSelectRate: (room: RoomOption, rate: RateOption) => void;
}

// Board type icons
const BOARD_ICONS: Record<string, string> = {
  RO: '🚫🍽️',
  BB: '🥐',
  HB: '🍽️',
  FB: '🍽️🍽️',
  AI: '🌟',
};

function RefundBadge({ tag, deadline }: { tag: string; deadline?: string }) {
  if (tag === 'RFN') {
    return (
      <div className="flex items-center gap-1">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ Free cancellation
        </span>
        {deadline && (
          <span className="text-xs text-green-600">{deadline}</span>
        )}
      </div>
    );
  }
  if (tag === 'PRFN') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Partial refund
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      Non-refundable
    </span>
  );
}

function BoardBadge({ boardType, boardName }: { boardType: string; boardName: string }) {
  const icon = BOARD_ICONS[boardType] || '🍽️';
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
      {icon} {boardName}
    </span>
  );
}

export function RoomCard({ room, nights, isFirst, onSelectRate }: RoomCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const allPhotos = room.photos.length > 0 ? room.photos : room.photosStd;
  const hasCarousel = allPhotos.length > 1;

  const handlePhotoClick = useCallback(
    (e: React.MouseEvent) => {
      if (!hasCarousel) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const tapZone = (e.clientX - rect.left) / rect.width;
      if (tapZone < 0.35 && photoIndex > 0) {
        setPhotoIndex((prev) => prev - 1);
      } else if (tapZone > 0.65 && photoIndex < allPhotos.length - 1) {
        setPhotoIndex((prev) => prev + 1);
      }
    },
    [hasCarousel, photoIndex, allPhotos.length]
  );

  // Top amenities to show
  const topAmenities = room.amenities.slice(0, showAllAmenities ? room.amenities.length : 6);

  return (
    <div className={`bg-white rounded-xl border ${isFirst ? 'border-blue-200 ring-2 ring-blue-100' : 'border-gray-200'} overflow-hidden`}>
      {/* Room header */}
      <div className="flex flex-col sm:flex-row">
        {/* Photo section */}
        <div className="relative w-full sm:w-64 h-48 sm:h-auto flex-shrink-0 bg-gray-100">
          {allPhotos.length > 0 ? (
            <div
              className="relative w-full h-full min-h-[12rem] cursor-pointer"
              onClick={handlePhotoClick}
            >
              <img
                src={allPhotos[photoIndex]}
                alt={room.roomName}
                className="w-full h-full object-cover"
              />
              {hasCarousel && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                  {photoIndex + 1}/{allPhotos.length}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full min-h-[12rem] flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-4xl">🏨</span>
            </div>
          )}
          {isFirst && (
            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-lg">
              Best Value
            </div>
          )}
        </div>

        {/* Room info */}
        <div className="flex-1 p-4">
          <h3 className="text-lg font-semibold text-gray-900">{room.roomName}</h3>

          {/* Room details row */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
            {room.roomSizeSquare && (
              <span className="flex items-center gap-1">
                📐 {room.roomSizeSquare} {room.roomSizeUnit || 'sqm'}
              </span>
            )}
            <span className="flex items-center gap-1">
              👥 Sleeps {room.maxOccupancy}
            </span>
            {room.bedTypes.length > 0 && (
              <span className="flex items-center gap-1">
                🛏️ {room.bedTypes.map((bt) => `${bt.quantity}× ${bt.bedType}`).join(', ')}
              </span>
            )}
            {room.views.length > 0 && (
              <span className="flex items-center gap-1">
                🪟 {room.views.join(', ')}
              </span>
            )}
          </div>

          {/* Amenities */}
          {room.amenities.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1.5">
                {topAmenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                  >
                    {amenity}
                  </span>
                ))}
                {room.amenities.length > 6 && !showAllAmenities && (
                  <button
                    onClick={() => setShowAllAmenities(true)}
                    className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
                  >
                    +{room.amenities.length - 6} more
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rate options */}
      <div className="border-t border-gray-100">
        {room.rates.map((rate, idx) => (
          <div
            key={rate.rateId}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 ${
              idx > 0 ? 'border-t border-gray-50' : ''
            } hover:bg-gray-50 transition-colors`}
          >
            {/* Rate info */}
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <BoardBadge boardType={rate.boardType} boardName={rate.boardName} />
                <RefundBadge tag={rate.refundableTag} deadline={rate.cancelDeadline} />
              </div>
              {rate.remarks && (
                <p className="text-xs text-gray-500 line-clamp-1">{rate.remarks}</p>
              )}
            </div>

            {/* Pricing + CTA */}
            <div className="flex items-center gap-4 sm:flex-shrink-0">
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  ${Math.round(rate.pricePerNight)}
                  <span className="text-sm font-normal text-gray-500">/night</span>
                </div>
                <div className="text-xs text-gray-400">
                  ${Math.round(rate.totalPrice)} total · {nights} {nights === 1 ? 'night' : 'nights'}
                </div>
              </div>
              <button
                onClick={() => onSelectRate(room, rate)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                  isFirst && idx === 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                Choose room
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
