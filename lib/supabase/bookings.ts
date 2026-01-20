import { createServiceRoleClient } from './server';
import type { DbBooking, BookingStatus } from '@/types/database';
import type { CreateBookingParams, BookingListItem } from '@/types/booking';

export async function createBookingRecord(params: CreateBookingParams): Promise<DbBooking> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      conversationId: params.conversationId,
      duffelBookingId: params.duffelBookingId,
      duffelOrderId: params.duffelOrderId,
      hotelName: params.hotelName,
      hotelId: params.hotelId,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      roomType: params.roomType,
      guestName: params.guestName,
      guestEmail: params.guestEmail,
      guestPhone: params.guestPhone,
      totalAmount: params.totalAmount,
      currency: params.currency,
      commissionAmount: params.commissionAmount,
      status: 'confirmed' as BookingStatus,
      duffelResponse: params.duffelResponse,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create booking: ${error.message}`);
  }

  return data as DbBooking;
}

export async function getBooking(id: string): Promise<DbBooking | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get booking: ${error.message}`);
  }

  return data as DbBooking;
}

export async function getBookingByDuffelId(duffelBookingId: string): Promise<DbBooking | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('duffelBookingId', duffelBookingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get booking: ${error.message}`);
  }

  return data as DbBooking;
}

export async function updateBookingStatus(
  duffelBookingId: string,
  status: BookingStatus
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('duffelBookingId', duffelBookingId);

  if (error) {
    throw new Error(`Failed to update booking status: ${error.message}`);
  }
}

export async function getUserBookings(userId: string): Promise<BookingListItem[]> {
  const supabase = createServiceRoleClient();

  // Get conversations for this user
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('userId', userId);

  if (convError) {
    throw new Error(`Failed to get user conversations: ${convError.message}`);
  }

  if (!conversations || conversations.length === 0) {
    return [];
  }

  const conversationIds = conversations.map(c => c.id);

  const { data, error } = await supabase
    .from('bookings')
    .select('id, hotelName, checkIn, checkOut, totalAmount, currency, status, createdAt')
    .in('conversationId', conversationIds)
    .order('createdAt', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user bookings: ${error.message}`);
  }

  return data as BookingListItem[];
}

export async function getBookingsByEmail(email: string): Promise<BookingListItem[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('bookings')
    .select('id, hotelName, checkIn, checkOut, totalAmount, currency, status, createdAt')
    .eq('guestEmail', email)
    .order('createdAt', { ascending: false });

  if (error) {
    throw new Error(`Failed to get bookings by email: ${error.message}`);
  }

  return data as BookingListItem[];
}

export async function attachItineraryToBooking(
  bookingId: string,
  itinerary: any
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('bookings')
    .update({ itinerary })
    .eq('id', bookingId);

  if (error) {
    throw new Error(`Failed to attach itinerary: ${error.message}`);
  }
}
