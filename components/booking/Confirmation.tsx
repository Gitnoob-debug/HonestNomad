'use client';

import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import type { BookingResult } from '@/types/hotel';

interface ConfirmationProps {
  booking: BookingResult;
  onGenerateItinerary?: () => void;
}

export function Confirmation({ booking, onGenerateItinerary }: ConfirmationProps) {
  return (
    <Card className="max-w-lg mx-auto text-center">
      {/* Success Icon */}
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Booking Confirmed!
      </h2>
      <p className="text-gray-600 mb-6">
        Your reservation has been successfully made.
      </p>

      {/* Booking Details */}
      <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Confirmation Number</p>
            <p className="font-mono font-semibold text-lg">
              {booking.bookingReference}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Hotel</p>
            <p className="font-medium">{booking.hotel.name}</p>
            <p className="text-sm text-gray-600">{booking.hotel.address}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Check-in</p>
              <p className="font-medium">{booking.checkIn}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Check-out</p>
              <p className="font-medium">{booking.checkOut}</p>
            </div>
          </div>

          <div className="pt-3 border-t">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Paid</span>
              <span className="font-bold text-lg">
                {booking.currency} {booking.totalAmount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {onGenerateItinerary && (
          <Button onClick={onGenerateItinerary} className="w-full">
            Generate Trip Itinerary
          </Button>
        )}

        <Link href="/bookings">
          <Button variant="secondary" className="w-full">
            View All Bookings
          </Button>
        </Link>

        <Link href="/">
          <Button variant="ghost" className="w-full">
            Plan Another Trip
          </Button>
        </Link>
      </div>

      <p className="text-sm text-gray-500 mt-6">
        A confirmation email has been sent to your email address.
      </p>
    </Card>
  );
}
