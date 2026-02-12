import { notFound } from 'next/navigation';
import { getBooking } from '@/lib/supabase/bookings';
import { Confirmation } from '@/components/booking/Confirmation';

interface BookingPageProps {
  params: { id: string };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const booking = await getBooking(params.id);

  if (!booking) {
    notFound();
  }

  // Transform to BookingResult format
  const bookingResult = {
    id: booking.id,
    bookingReference: booking.provider_booking_id || booking.id,
    status: booking.status as 'pending' | 'confirmed' | 'cancelled' | 'completed',
    hotel: {
      name: booking.hotel_name,
      address: '',
    },
    checkIn: booking.check_in,
    checkOut: booking.check_out,
    guests: [],
    totalAmount: booking.total_amount?.toString() || '0',
    currency: booking.currency,
    cancellationPolicy: {
      refundable: false,
    },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Confirmation booking={bookingResult} />
    </div>
  );
}
