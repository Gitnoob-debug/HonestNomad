'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui';
import type { NormalizedHotel } from '@/types/hotel';

interface HotelDetailsProps {
  hotel: NormalizedHotel;
  onBook: () => void;
  onClose: () => void;
}

export function HotelDetails({ hotel, onBook, onClose }: HotelDetailsProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const photos = hotel.photos.length > 0 ? hotel.photos : [{ url: '/images/hotel-placeholder.jpg', caption: null }];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Photo Gallery */}
          <div className="relative h-64 md:h-96 bg-gray-200">
            <Image
              src={photos[currentPhotoIndex].url}
              alt={photos[currentPhotoIndex].caption || hotel.name}
              fill
              className="object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/90 p-2 rounded-full hover:bg-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full hover:bg-white"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPhotoIndex((i) => (i + 1) % photos.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full hover:bg-white"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPhotoIndex(i)}
                      className={`w-2 h-2 rounded-full ${i === currentPhotoIndex ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{hotel.name}</h2>
                <p className="text-gray-600">{hotel.location.address}, {hotel.location.city}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {hotel.pricing.currency} {hotel.pricing.nightlyRate.toFixed(0)}
                </p>
                <p className="text-sm text-gray-500">per night</p>
              </div>
            </div>

            {/* Rating */}
            <div className="mt-4 flex items-center gap-3">
              {hotel.rating.stars && (
                <span className="text-yellow-500">{'★'.repeat(hotel.rating.stars)}</span>
              )}
              {hotel.rating.reviewScore && (
                <span className="bg-primary-600 text-white px-2 py-1 rounded text-sm font-medium">
                  {hotel.rating.reviewScore.toFixed(1)}
                </span>
              )}
              {hotel.rating.reviewCount && (
                <span className="text-sm text-gray-600">{hotel.rating.reviewCount} reviews</span>
              )}
            </div>

            {/* Description */}
            {hotel.description && (
              <p className="mt-4 text-gray-700">{hotel.description}</p>
            )}

            {/* Amenities */}
            {hotel.amenities.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {hotel.amenities.map((amenity, i) => (
                    <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total for stay</span>
                <span className="text-xl font-bold text-gray-900">
                  {hotel.pricing.currency} {hotel.pricing.totalAmount.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Action */}
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button onClick={onBook} className="flex-1">
                Book This Hotel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
