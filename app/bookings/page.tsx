import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserBookings } from '@/lib/supabase/bookings';
import { Card, Button } from '@/components/ui';
import { format } from 'date-fns';
import DraftTripsSection from '@/components/bookings/DraftTripsSection';

export default async function BookingsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const bookings = await getUserBookings(user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

      {/* Unfinished Flash Trips (client-side from localStorage) */}
      <DraftTripsSection />

      {bookings.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No bookings yet
          </h2>
          <p className="text-gray-600 mb-6">
            Start planning your next adventure!
          </p>
          <Link href="/flash">
            <Button>Plan a Trip</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Link key={booking.id} href={`/booking/${booking.id}`}>
              <Card hover className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {booking.hotel_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {format(new Date(booking.check_in), 'MMM d')} -{' '}
                    {format(new Date(booking.check_out), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {booking.currency} {booking.total_amount}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
