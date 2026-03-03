import { NextRequest, NextResponse } from 'next/server';
import { getHotelRates, getHotelDetails } from '@/lib/liteapi/client';
import type { LiteAPIRoomType, LiteAPIRate, LiteAPIRoom } from '@/lib/liteapi/types';

// ── Room Rates API ──────────────────────────────────────────────────
// Fetches all room types + rates for a specific hotel.
// Merges rate data (pricing, cancellation) with room details (photos, size, amenities).
// Returns a clean, display-ready structure for the room selection page.

export interface RoomOption {
  // Identity
  roomTypeId: string;
  offerId: string;
  roomName: string;
  roomDescription: string;

  // Room details (from hotel details)
  roomSizeSquare?: number;
  roomSizeUnit?: string;
  maxOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  bedTypes: Array<{ bedType: string; bedSize: string; quantity: number }>;
  views: string[];
  amenities: string[];
  photos: string[];      // HD room photos
  photosStd: string[];   // Standard room photos

  // Rate options for this room
  rates: RateOption[];
}

export interface RateOption {
  rateId: string;
  name: string;                          // e.g., "Non-refundable"
  boardType: string;                     // "RO", "BB", "HB", "FB", "AI"
  boardName: string;                     // "Room Only", "Breakfast Included"
  refundableTag: 'RFN' | 'NRFN' | 'PRFN';
  cancelDeadline?: string;               // "Free cancellation before May 29"
  totalPrice: number;
  pricePerNight: number;
  currency: string;
  taxesAndFees: Array<{ description: string; amount: number; included: boolean }>;
  remarks: string;
  paymentTypes: string[];
}

export interface RoomRatesResponse {
  hotelId: string;
  hotelName: string;
  rooms: RoomOption[];
  expiresAt: number;                     // Timestamp when rates expire
  checkin: string;
  checkout: string;
  nights: number;
}

// Board type display names
const BOARD_NAMES: Record<string, string> = {
  RO: 'Room Only',
  BB: 'Breakfast Included',
  HB: 'Half Board',
  FB: 'Full Board',
  AI: 'All Inclusive',
};

function formatCancelDeadline(cancelPolicyInfos: any[]): string | undefined {
  if (!cancelPolicyInfos || cancelPolicyInfos.length === 0) return undefined;

  // Find the earliest free cancellation deadline
  for (const policy of cancelPolicyInfos) {
    if (policy.amount === 0 && policy.cancelTime) {
      const date = new Date(policy.cancelTime);
      const formatted = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      return `Free cancellation before ${formatted}`;
    }
  }
  return undefined;
}

function calculateNights(checkin: string, checkout: string): number {
  const start = new Date(checkin);
  const end = new Date(checkout);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hotelId, hotelName, checkin, checkout, adults = 2, children = [] } = body;

    if (!hotelId || !checkin || !checkout) {
      return NextResponse.json(
        { error: 'Missing required fields: hotelId, checkin, checkout' },
        { status: 400 }
      );
    }

    const nights = calculateNights(checkin, checkout);

    // Fetch rates + hotel details in parallel
    const [ratesResponse, hotelDetails] = await Promise.all([
      getHotelRates(
        [hotelId],
        checkin,
        checkout,
        [{ adults, ...(children.length > 0 ? { children } : {}) }]
      ).catch((err) => {
        console.error('[room-rates] Failed to fetch rates:', err);
        return null;
      }),
      getHotelDetails(hotelId).catch((err) => {
        console.error('[room-rates] Failed to fetch details:', err);
        return null;
      }),
    ]);

    // Build room details lookup from hotel details
    const roomDetailsMap = new Map<string, LiteAPIRoom>();
    if (hotelDetails?.rooms) {
      for (const room of hotelDetails.rooms) {
        // Map by room name (lowercase) since roomTypeId and room.id may not match
        roomDetailsMap.set(room.roomName.toLowerCase().trim(), room);
      }
    }

    // If no rates returned, return empty but valid response
    if (!ratesResponse?.data?.[0]?.roomTypes?.length) {
      return NextResponse.json({
        hotelId,
        hotelName: hotelName || 'Hotel',
        rooms: [],
        expiresAt: Date.now() + 30 * 60 * 1000,
        checkin,
        checkout,
        nights,
      } satisfies RoomRatesResponse);
    }

    const hotelRates = ratesResponse.data[0];
    const expiresAt = Date.now() + (hotelRates.et || 1800) * 1000;

    // Group room types and merge with room details
    const rooms: RoomOption[] = [];

    for (const roomType of hotelRates.roomTypes) {
      // Try to match room details by name
      const roomNameKey = (roomType.rates[0]?.name || '').toLowerCase().trim();
      // Also try the roomTypeId as a fallback key
      let matchedRoom: LiteAPIRoom | undefined;

      // Try matching by iterating room details and finding best match
      const entries = Array.from(roomDetailsMap.entries());
      for (let i = 0; i < entries.length; i++) {
        const [name, room] = entries[i];
        if (roomNameKey.includes(name) || name.includes(roomNameKey)) {
          matchedRoom = room;
          break;
        }
      }
      // Fallback: use first room if available
      if (!matchedRoom && roomDetailsMap.size > 0) {
        matchedRoom = Array.from(roomDetailsMap.values())[0];
      }

      // Build rate options
      const rateOptions: RateOption[] = roomType.rates.map((rate: LiteAPIRate) => {
        const totalAmount = rate.retailRate?.total?.[0]?.amount || 0;
        const currency = rate.retailRate?.total?.[0]?.currency || 'USD';

        return {
          rateId: rate.rateId,
          name: rate.name || 'Standard Rate',
          boardType: rate.boardType || 'RO',
          boardName: rate.boardName || BOARD_NAMES[rate.boardType] || 'Room Only',
          refundableTag: rate.cancellationPolicies?.refundableTag || 'NRFN',
          cancelDeadline: formatCancelDeadline(rate.cancellationPolicies?.cancelPolicyInfos),
          totalPrice: totalAmount,
          pricePerNight: Math.round((totalAmount / nights) * 100) / 100,
          currency,
          taxesAndFees: (rate.retailRate?.taxesAndFees || []).map((tax) => ({
            description: tax.description,
            amount: tax.amount,
            included: tax.included,
          })),
          remarks: rate.remarks || '',
          paymentTypes: rate.paymentTypes || [],
        };
      });

      // Sort rates: refundable first, then by price
      rateOptions.sort((a, b) => {
        // Refundable before non-refundable
        const refA = a.refundableTag === 'RFN' ? 0 : a.refundableTag === 'PRFN' ? 1 : 2;
        const refB = b.refundableTag === 'RFN' ? 0 : b.refundableTag === 'PRFN' ? 1 : 2;
        if (refA !== refB) return refA - refB;
        // Then by price
        return a.totalPrice - b.totalPrice;
      });

      // Derive a display name for the room
      const displayName = matchedRoom?.roomName
        || rateOptions[0]?.name
        || `Room ${rooms.length + 1}`;

      rooms.push({
        roomTypeId: roomType.roomTypeId,
        offerId: roomType.offerId,
        roomName: displayName,
        roomDescription: matchedRoom?.description || '',
        roomSizeSquare: matchedRoom?.roomSizeSquare,
        roomSizeUnit: matchedRoom?.roomSizeUnit || 'sqm',
        maxOccupancy: matchedRoom?.maxOccupancy || rateOptions[0]?.name ? 2 : 2,
        maxAdults: matchedRoom?.maxAdults || 2,
        maxChildren: matchedRoom?.maxChildren || 0,
        bedTypes: (matchedRoom?.bedTypes || []).map((bt) => ({
          bedType: bt.bedType,
          bedSize: bt.bedSize,
          quantity: bt.quantity,
        })),
        views: (matchedRoom?.views || []).map((v) => v.view),
        amenities: (matchedRoom?.roomAmenities || [])
          .sort((a, b) => a.sort - b.sort)
          .map((a) => a.name)
          .slice(0, 15),
        photos: (matchedRoom?.photos || [])
          .filter((p) => p.hd_url)
          .map((p) => p.hd_url),
        photosStd: (matchedRoom?.photos || [])
          .filter((p) => p.url)
          .map((p) => p.url),
        rates: rateOptions,
      });
    }

    // Sort rooms: rooms with more rate options first, then by cheapest rate
    rooms.sort((a, b) => {
      const cheapA = a.rates[0]?.totalPrice || Infinity;
      const cheapB = b.rates[0]?.totalPrice || Infinity;
      return cheapA - cheapB;
    });

    const response: RoomRatesResponse = {
      hotelId,
      hotelName: hotelName || hotelDetails?.name || 'Hotel',
      rooms,
      expiresAt,
      checkin,
      checkout,
      nights,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[room-rates] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room rates' },
      { status: 500 }
    );
  }
}
