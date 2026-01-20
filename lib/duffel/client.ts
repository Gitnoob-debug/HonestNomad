import { Duffel } from '@duffel/api';

// Lazy-load the Duffel client to avoid build-time errors
let _duffel: Duffel | null = null;

export function getDuffelClient(): Duffel {
  if (!_duffel) {
    if (!process.env.DUFFEL_ACCESS_TOKEN) {
      throw new Error('DUFFEL_ACCESS_TOKEN is required');
    }
    _duffel = new Duffel({
      token: process.env.DUFFEL_ACCESS_TOKEN,
    });
  }
  return _duffel;
}

// For backwards compatibility - getter that lazy-loads
export const duffel = new Proxy({} as Duffel, {
  get(_, prop) {
    return (getDuffelClient() as any)[prop];
  },
});

// Duffel Stays API is used for hotel bookings
// Documentation: https://duffel.com/docs/api/stays
