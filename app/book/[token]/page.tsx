'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { HotelOption } from '@/lib/liteapi/types';
import type { MatchedDestination } from '@/types/location';

// ── Standalone Checkout Page ──────────────────────────────────────
// /book/[token] — Hydrates from Supabase booking session
// instead of sessionStorage. Works as a standalone landing page
// for the OpenClaw agent flow.
//
// This page is completely SEPARATE from the existing Discover checkout.
// It shares NO components with the existing flow to ensure isolation.

interface SessionData {
  hotel: HotelOption;
  destination: MatchedDestination;
  checkin: string;
  checkout: string;
  guests: { adults: number; children: number[] };
  landmarkLat: number;
  landmarkLng: number;
  source: string;
  expiresAt: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
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

export default function BookingPage() {
  const params = useParams();
  const token = params.token as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [marking, setMarking] = useState(false);

  // Fetch session data from API
  useEffect(() => {
    if (!token) {
      setError('Invalid booking link');
      setLoading(false);
      return;
    }

    async function fetchSession() {
      try {
        const res = await fetch(`/api/openclaw/session?token=${encodeURIComponent(token)}`);

        if (res.status === 404) {
          setError('This booking link has expired or has already been used. Please request a new one from your travel agent.');
          setLoading(false);
          return;
        }

        if (!res.ok) {
          setError('Something went wrong loading your booking. Please try again.');
          setLoading(false);
          return;
        }

        const data = await res.json();
        setSession(data);
      } catch {
        setError('Unable to connect. Please check your internet connection and try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [token]);

  // Handle checkout click
  const handleCheckout = async () => {
    if (!session || marking) return;

    setMarking(true);

    // Mark session as used
    try {
      await fetch('/api/openclaw/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch {
      // Non-critical — proceed to payment modal anyway
    }

    setMarking(false);
    setShowPaymentModal(true);
  };

  // ── Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading your booking...</p>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────
  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Booking Link Issue
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'This booking link is no longer valid.'}
          </p>
          <a
            href="/discover"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Discover Destinations
          </a>
        </div>
      </div>
    );
  }

  const { hotel, destination, checkin, checkout, guests } = session;
  const nights = calculateNights(checkin, checkout);
  const heroImage = hotel.photosHd?.[0] || hotel.mainPhoto || '';
  const totalGuests = guests.adults + guests.children.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ── Trust header ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-blue-600">HonestNomad</span>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-gray-500">Secure Checkout</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>SSL Secured</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* ── Hotel Hero ─────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden mb-6 shadow-lg">
          {heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImage}
              alt={hotel.name}
              className="w-full h-56 sm:h-72 object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-yellow-400 text-sm">{'★'.repeat(hotel.stars)}</span>
              {hotel.rating > 0 && (
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  {hotel.rating.toFixed(1)}
                </span>
              )}
              {hotel.reviewCount > 0 && (
                <span className="text-white/60 text-xs">
                  ({hotel.reviewCount.toLocaleString()} reviews)
                </span>
              )}
              {hotel.chain && (
                <span className="text-white/50 text-xs ml-1">{hotel.chain}</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{hotel.name}</h1>
            <p className="text-white/80 text-sm mt-0.5">
              {destination.city}, {destination.country}
            </p>
          </div>
        </div>

        {/* ── Trip Summary Card ───────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <div className="p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Your Trip
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Check-in</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(checkin)}</p>
                {hotel.checkinTime && (
                  <p className="text-xs text-gray-400 mt-0.5">from {hotel.checkinTime}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Check-out</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(checkout)}</p>
                {hotel.checkoutTime && (
                  <p className="text-xs text-gray-400 mt-0.5">by {hotel.checkoutTime}</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-sm font-medium text-gray-900">{nights} {nights === 1 ? 'night' : 'nights'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Guests</p>
                <p className="text-sm font-medium text-gray-900">
                  {guests.adults} {guests.adults === 1 ? 'adult' : 'adults'}
                  {guests.children.length > 0 && `, ${guests.children.length} child`}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Room</p>
                <p className="text-sm font-medium text-gray-900 truncate">{hotel.roomName || 'Standard'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Room Details (if enriched) ──────────────────────────── */}
        {hotel.roomDetails && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
            <div className="p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Room Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hotel.roomDetails.roomSizeSquare && hotel.roomDetails.roomSizeSquare > 0 && (
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-lg">📐</span>
                    <div>
                      <p className="text-xs text-gray-500">Size</p>
                      <p className="text-sm font-medium text-gray-900">
                        {hotel.roomDetails.roomSizeSquare} {hotel.roomDetails.roomSizeUnit || 'sq ft'}
                      </p>
                    </div>
                  </div>
                )}
                {hotel.roomDetails.maxOccupancy && hotel.roomDetails.maxOccupancy > 0 && (
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-lg">👥</span>
                    <div>
                      <p className="text-xs text-gray-500">Max guests</p>
                      <p className="text-sm font-medium text-gray-900">{hotel.roomDetails.maxOccupancy}</p>
                    </div>
                  </div>
                )}
                {hotel.roomDetails.views && hotel.roomDetails.views.length > 0 && (
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-lg">🪟</span>
                    <div>
                      <p className="text-xs text-gray-500">View</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{hotel.roomDetails.views.join(', ')}</p>
                    </div>
                  </div>
                )}
                {hotel.roomDetails.bedTypes && hotel.roomDetails.bedTypes.length > 0 && (
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg col-span-2 sm:col-span-1">
                    <span className="text-lg">🛏️</span>
                    <div>
                      <p className="text-xs text-gray-500">Bed</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {hotel.roomDetails.bedTypes.map(bt =>
                          `${bt.quantity > 1 ? bt.quantity + '× ' : ''}${bt.bedType}`
                        ).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Pricing Card ───────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <div className="p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Pricing
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  ${hotel.pricePerNight} × {nights} {nights === 1 ? 'night' : 'nights'}
                </span>
                <span className="text-gray-900 font-medium">${hotel.totalPrice}</span>
              </div>
              {hotel.boardName && hotel.boardName !== 'Room Only' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Includes</span>
                  <span className="text-gray-700 text-xs">{hotel.boardName}</span>
                </div>
              )}
              {hotel.taxesIncluded && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taxes & fees</span>
                  <span className="text-green-600 text-xs font-medium">Included</span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-100 flex justify-between">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">${hotel.totalPrice} {hotel.currency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Cancellation Policy ─────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <div className="p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Cancellation
            </h2>
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
                <p className="text-sm text-gray-500">This rate cannot be cancelled after booking.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Guest Reviews ──────────────────────────────────────── */}
        {hotel.reviews && hotel.reviews.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Guest Reviews
                </h2>
                {hotel.reviewsTotal && hotel.reviewsTotal > 0 && (
                  <span className="text-xs text-gray-500">
                    {hotel.reviewsTotal.toLocaleString()} total
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {hotel.reviews.slice(0, 3).map((review, idx) => (
                  <div key={idx} className={idx > 0 ? 'pt-3 border-t border-gray-100' : ''}>
                    <div className="flex items-center gap-2 mb-1.5">
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
                    </div>
                    {review.pros && (
                      <p className="text-sm text-gray-600">
                        <span className="text-green-600 font-medium">+</span> {review.pros}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Amenities ──────────────────────────────────────────── */}
        {hotel.amenities && hotel.amenities.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Amenities
              </h2>
              <div className="flex flex-wrap gap-2">
                {hotel.amenities.slice(0, 12).map((amenity, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CTA Button ─────────────────────────────────────────── */}
        <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-6">
          <button
            onClick={handleCheckout}
            disabled={marking}
            className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {marking ? 'Processing...' : `Proceed to Payment — $${hotel.totalPrice}`}
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">
            Secure payment powered by NUITEE_PAY. Your card details are never stored.
          </p>
        </div>
      </div>

      {/* ── Payment Placeholder Modal ──────────────────────────── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPaymentModal(false)}
          />
          <div className="relative bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl text-center">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Payment Coming Soon!
            </h2>
            <p className="text-gray-600 mb-4">
              We&apos;re integrating secure payment processing with our hotel partners.
              Real bookings will be available shortly.
            </p>
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-700 font-medium">
                {hotel.name}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {destination.city}, {destination.country} · ${hotel.totalPrice} total · {nights} nights
              </p>
            </div>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-gray-50 border-t border-gray-100 mt-8">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-gray-400">
            HonestNomad · Hotels booked through our secure partner LiteAPI
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Questions? Contact support@honestnomad.com
          </p>
        </div>
      </footer>
    </div>
  );
}
