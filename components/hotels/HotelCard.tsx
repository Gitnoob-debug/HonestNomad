'use client';

import Image from 'next/image';
import { Button } from '@/components/ui';
import type { NormalizedHotel } from '@/types/hotel';

interface HotelCardProps {
  hotel: NormalizedHotel;
  index: number;
  onSelect: (id: string) => void;
}

export function HotelCard({ hotel, index, onSelect }: HotelCardProps) {
  const mainPhoto = hotel.photos[0]?.url || '/images/hotel-placeholder.jpg';

  return (
    <div className="card-hover overflow-hidden">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        <Image
          src={mainPhoto}
          alt={hotel.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded-lg text-sm font-medium">
          #{index + 1}
        </div>
        {hotel.rating.stars && (
          <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-lg text-sm">
            {'★'.repeat(hotel.rating.stars)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate">
              {hotel.name}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {hotel.location.address}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-gray-900">
              {hotel.pricing.currency} {hotel.pricing.nightlyRate.toFixed(0)}
            </p>
            <p className="text-xs text-gray-500">per night</p>
          </div>
        </div>

        {/* Rating */}
        {hotel.rating.reviewScore && (
          <div className="mt-3 flex items-center gap-2">
            <span className="bg-primary-600 text-white px-2 py-0.5 rounded text-sm font-medium">
              {hotel.rating.reviewScore.toFixed(1)}
            </span>
            <span className="text-sm text-gray-600">
              {hotel.rating.reviewCount} reviews
            </span>
          </div>
        )}

        {/* Amenities */}
        {hotel.amenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {hotel.amenities.slice(0, 4).map((amenity, i) => (
              <span
                key={i}
                className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600"
              >
                {amenity}
              </span>
            ))}
            {hotel.amenities.length > 4 && (
              <span className="text-xs text-gray-500">
                +{hotel.amenities.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Total: {hotel.pricing.currency} {hotel.pricing.totalAmount.toFixed(0)}
          </span>
          <Button onClick={() => onSelect(hotel.id)} size="sm">
            Book This
          </Button>
        </div>
      </div>
    </div>
  );
}
