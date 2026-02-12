import { createServiceRoleClient } from './server';
import type { BookingStatus, CreateBookingParams } from '@/types/booking';

export async function createBookingRecord(params: CreateBookingParams): Promise<any> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      provider_booking_id: params.providerBookingId,
      provider_order_id: params.providerOrderId,
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
      provider_response: params.providerResponse,
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

export async function getBookingByProviderId(providerBookingId: string): Promise<any | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('provider_booking_id', providerBookingId)
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
  providerBookingId: string,
  status: BookingStatus
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('provider_booking_id', providerBookingId);

  if (error) {
    throw new Error(`Failed to update booking status: ${error.message}`);
  }
}

export async function getUserBookings(userId: string): Promise<any[]> {
  const supabase = createServiceRoleClient();

  // Get bookings for this user by email or direct user_id
  // Since we no longer have conversations, query bookings by user profile email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('user_id', userId)
    .single();

  if (!profile?.email) {
    return [];
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('id, hotel_name, check_in, check_out, total_amount, currency, status, created_at')
    .eq('guest_email', profile.email)
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
