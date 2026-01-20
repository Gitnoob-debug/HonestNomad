import { createServiceRoleClient } from './server';
import type { BookingStatus, CreateBookingParams } from '@/types/booking';

export async function createBookingRecord(params: CreateBookingParams): Promise<any> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      conversation_id: params.conversationId,
      duffel_booking_id: params.duffelBookingId,
      duffel_order_id: params.duffelOrderId,
      hotel_name: params.hotelName,
      hotel_id: params.hotelId,
      check_in: params.checkIn,
      check_out: params.checkOut,
      room_type: params.roomType,
      guest_name: params.guestName,
      guest_email: params.guestEmail,
      guest_phone: params.guestPhone,
      total_amount: params.totalAmount,
      currency: params.currency,
      commission_amount: params.commissionAmount,
      status: 'confirmed',
      duffel_response: params.duffelResponse,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create booking: ${error.message}`);
  }

  return data;
}

export async function getBooking(id: string): Promise<any | null> {
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

  return data;
}

export async function getBookingByDuffelId(duffelBookingId: string): Promise<any | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('duffel_booking_id', duffelBookingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get booking: ${error.message}`);
  }

  return data;
}

export async function updateBookingStatus(
  duffelBookingId: string,
  status: BookingStatus
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('duffel_booking_id', duffelBookingId);

  if (error) {
    throw new Error(`Failed to update booking status: ${error.message}`);
  }
}

export async function getUserBookings(userId: string): Promise<any[]> {
  const supabase = createServiceRoleClient();

  // Get conversations for this user
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId);

  if (convError) {
    throw new Error(`Failed to get user conversations: ${convError.message}`);
  }

  if (!conversations || conversations.length === 0) {
    return [];
  }

  const conversationIds = conversations.map((c: { id: string }) => c.id);

  const { data, error } = await supabase
    .from('bookings')
    .select('id, hotel_name, check_in, check_out, total_amount, currency, status, created_at')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user bookings: ${error.message}`);
  }

  return data || [];
}

export async function getBookingsByEmail(email: string): Promise<any[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('bookings')
    .select('id, hotel_name, check_in, check_out, total_amount, currency, status, created_at')
    .eq('guest_email', email)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get bookings by email: ${error.message}`);
  }

  return data || [];
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
