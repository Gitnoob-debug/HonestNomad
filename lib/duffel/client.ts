import { Duffel } from '@duffel/api';

if (!process.env.DUFFEL_ACCESS_TOKEN) {
  throw new Error('DUFFEL_ACCESS_TOKEN is required');
}

export const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN,
});

// Duffel Stays API is used for hotel bookings
// Documentation: https://duffel.com/docs/api/stays
