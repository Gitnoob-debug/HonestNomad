'use client';

import { useState } from 'react';
import type { HotelOption } from '@/lib/liteapi/types';
import type { MatchedDestination } from '@/types/location';

interface BookingSummaryProps {
  hotel: HotelOption;
  destination: MatchedDestination;
  checkin: string;
  checkout: string;
  guests: { adults: number; children: number[] };
  onCheckout: () => void;
  onBack: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function calculateNights(checkin: string, checkout: string): number {
  return Math.max(1, Math.round(
    (new Date(checkout).getTime() - new Date(checkin).getTime()) / (1000 * 60 * 60 * 24)
  ));
}

export function BookingSummary({
  hotel,
  destination,
  checkin,
  checkout,
  guests,
  onCheckout,
  onBack,
}: BookingSummaryProps) {
  const nights = calculateNights(checkin, checkout);
  const totalGuests = guests.adults + guests.children.length;
  const [showImportantInfo, setShowImportantInfo] = useState(false);

  // HD hero image — prefer photosHd[0], fall back to mainPhoto
  const heroImage = (hotel.photosHd && hotel.photosHd[0]) || hotel.mainPhoto || '/placeholder-hotel.jpg';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hotel hero */}
      <div className="relative rounded-2xl overflow-hidden mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          alt={hotel.name}
          className="w-full h-56 sm:h-72 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-yellow-400 text-sm">{'★'.repeat(hotel.stars)}</span>
            {hotel.rating > 0 && (
              <span className="bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded ml-1">
                {hotel.rating.toFixed(1)}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white">{hotel.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-white/80 text-sm">
              {destination.city}, {destination.country}
            </p>
            {hotel.chain && (
              <span className="text-white/50 text-xs">&middot; {hotel.chain}</span>
            )}
          </div>
        </div>
      </div>

      {/* Stay details card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <div className="p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Stay Details
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Check-in</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(checkin)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{hotel.checkinTime}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Check-out</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(checkout)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{hotel.checkoutTime}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Duration</p>
              <p className="text-sm font-medium text-gray-900">{nights} {nights === 1 ? 'night' : 'nights'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Guests</p>
              <p className="text-sm font-medium text-gray-900">
                {guests.adults} {guests.adults === 1 ? 'adult' : 'adults'}
                {guests.children.length > 0 && `, ${guests.children.length} ${guests.children.length === 1 ? 'child' : 'children'}`}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Room</p>
              <p className="text-sm font-medium text-gray-900">{hotel.roomName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Board</p>
              <p className="text-sm font-medium text-gray-900">{hotel.boardName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Room details card — only if we have enrichment data */}
      {hotel.roomDetails && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
          <div className="p-5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Room Details
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Room size */}
              {hotel.roomDetails.roomSizeSquare && hotel.roomDetails.roomSizeSquare > 0 && (
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-lg">📐</span>
                  <div>
                    <p className="text-xs text-gray-500">Room size</p>
                    <p className="text-sm font-medium text-gray-900">
                      {hotel.roomDetails.roomSizeSquare} {hotel.roomDetails.roomSizeUnit || 'sq ft'}
                    </p>
                  </div>
                </div>
              )}

              {/* Max occupancy */}
              {hotel.roomDetails.maxOccupancy && hotel.roomDetails.maxOccupancy > 0 && (
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-lg">👥</span>
                  <div>
                    <p className="text-xs text-gray-500">Max guests</p>
                    <p className="text-sm font-medium text-gray-900">
                      {hotel.roomDetails.maxOccupancy} {hotel.roomDetails.maxOccupancy === 1 ? 'guest' : 'guests'}
                    </p>
                  </div>
                </div>
              )}

              {/* Views */}
              {hotel.roomDetails.views && hotel.roomDetails.views.length > 0 && (
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-lg">🪟</span>
                  <div>
                    <p className="text-xs text-gray-500">View</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {hotel.roomDetails.views.join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Bed types */}
              {hotel.roomDetails.bedTypes && hotel.roomDetails.bedTypes.length > 0 && (
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg col-span-2 sm:col-span-1">
                  <span className="text-lg">🛏️</span>
                  <div>
                    <p className="text-xs text-gray-500">Bed</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {hotel.roomDetails.bedTypes.map(bt =>
                        `${bt.quantity > 1 ? bt.quantity + '× ' : ''}${bt.bedType}${bt.bedSize ? ` (${bt.bedSize})` : ''}`
                      ).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pricing card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <div className="p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Pricing
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                ${hotel.pricePerNight} &times; {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
              <span className="text-gray-900 font-medium">${hotel.totalPrice}</span>
            </div>

            {hotel.taxesIncluded && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Taxes & fees</span>
                <span className="text-green-600 text-xs font-medium">Included</span>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100 flex justify-between">
              <span className="text-base font-semibold text-gray-900">Total</span>
              <span className="text-base font-bold text-gray-900">${hotel.totalPrice} {hotel.currency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced cancellation policy */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <div className="p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Cancellation Policy
          </h3>
          <div className="flex items-start gap-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
              hotel.refundable
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {hotel.refundable ? '✓ Free Cancellation' : '✕ Non-Refundable'}
            </span>
            {hotel.cancelDeadline && (
              <p className="text-sm text-gray-600">{hotel.cancelDeadline}</p>
            )}
            {!hotel.refundable && !hotel.cancelDeadline && (
              <p className="text-sm text-gray-500">This rate cannot be cancelled or modified after booking.</p>
            )}
          </div>
        </div>
      </div>

      {/* Important hotel information — expandable */}
      {hotel.hotelImportantInformation && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
          <button
            onClick={() => setShowImportantInfo(!showImportantInfo)}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Important Information
            </h3>
            <span className="text-gray-400 text-sm">
              {showImportantInfo ? '▲' : '▼'}
            </span>
          </button>
          {showImportantInfo && (
            <div className="px-5 pb-5 -mt-2">
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {hotel.hotelImportantInformation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Guest reviews */}
      {hotel.reviews && hotel.reviews.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Guest Reviews
              </h3>
              {hotel.reviewsTotal && hotel.reviewsTotal > 0 && (
                <span className="text-xs text-gray-500">
                  {hotel.reviewsTotal.toLocaleString()} total reviews
                </span>
              )}
            </div>

            <div className="space-y-4">
              {hotel.reviews.map((review, idx) => (
                <div key={idx} className={idx > 0 ? 'pt-4 border-t border-gray-100' : ''}>
                  <div className="flex items-center gap-2 mb-2">
                    {/* Score badge */}
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      review.averageScore >= 8
                        ? 'bg-green-100 text-green-800'
                        : review.averageScore >= 6
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {review.averageScore.toFixed(1)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{review.name}</span>
                    {review.country && (
                      <span className="text-xs text-gray-400">{review.country}</span>
                    )}
                    {review.date && (
                      <span className="text-xs text-gray-400 ml-auto">{review.date}</span>
                    )}
                  </div>

                  {review.headline && (
                    <p className="text-sm font-medium text-gray-800 mb-1">{review.headline}</p>
                  )}

                  {review.pros && (
                    <p className="text-sm text-gray-600 mb-0.5">
                      <span className="text-green-600 font-medium">+</span> {review.pros}
                    </p>
                  )}
                  {review.cons && (
                    <p className="text-sm text-gray-600">
                      <span className="text-red-500 font-medium">&minus;</span> {review.cons}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onCheckout}
          className="w-full py-4 bg-primary-600 text-white text-lg font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
        >
          Checkout &mdash; ${hotel.totalPrice}
        </button>

        <button
          onClick={onBack}
          className="w-full py-3 text-gray-600 text-sm font-medium hover:text-gray-800 transition-colors"
        >
          &larr; Back to hotels
        </button>
      </div>
    </div>
  );
}
