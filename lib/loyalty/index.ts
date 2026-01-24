/**
 * Loyalty Program Integration
 * Handles automatic attachment of loyalty program numbers to flight bookings
 * and hotel loyalty reminders at check-in
 */

export * from './airlines';
export * from './hotels';

import type { FlightBookingPassenger, LoyaltyProgramAccount } from '@/types/flight';
import { findMatchingLoyaltyProgram, getLoyaltyProgramIata } from './airlines';

interface UserLoyaltyProgram {
  id: string;
  type: 'airline' | 'hotel';
  name: string;
  memberNumber: string;
}

/**
 * Attach matching loyalty programs to passengers for a flight booking
 * This automatically adds frequent flyer numbers so users earn miles
 */
export function attachLoyaltyProgramsToPassengers(
  passengers: FlightBookingPassenger[],
  userLoyaltyPrograms: UserLoyaltyProgram[] | undefined,
  flightAirlines: string[] // IATA codes of airlines on the itinerary
): FlightBookingPassenger[] {
  if (!userLoyaltyPrograms || userLoyaltyPrograms.length === 0) {
    return passengers;
  }

  // Filter to only airline programs
  const airlinePrograms = userLoyaltyPrograms.filter((p) => p.type === 'airline');
  if (airlinePrograms.length === 0) {
    return passengers;
  }

  // Find the best matching loyalty program for this flight
  const matchingProgram = findMatchingLoyaltyProgram(airlinePrograms, flightAirlines);

  if (!matchingProgram) {
    return passengers;
  }

  // Attach the loyalty program to all passengers
  // (In practice, different passengers might have different programs,
  // but for now we use the primary user's program for all)
  return passengers.map((passenger) => ({
    ...passenger,
    loyaltyProgramAccounts: [matchingProgram],
  }));
}

/**
 * Get all airline IATA codes from a user's loyalty programs
 */
export function getUserAirlineLoyaltyIataCodes(
  userLoyaltyPrograms: UserLoyaltyProgram[] | undefined
): string[] {
  if (!userLoyaltyPrograms) return [];

  const codes: string[] = [];
  for (const program of userLoyaltyPrograms) {
    if (program.type === 'airline') {
      const iata = getLoyaltyProgramIata(program.name);
      if (iata) {
        codes.push(iata);
      }
    }
  }
  return codes;
}

/**
 * Convert user's stored loyalty programs to the format needed for flight booking
 */
export function convertToLoyaltyProgramAccounts(
  userLoyaltyPrograms: UserLoyaltyProgram[] | undefined
): LoyaltyProgramAccount[] {
  if (!userLoyaltyPrograms) return [];

  const accounts: LoyaltyProgramAccount[] = [];
  for (const program of userLoyaltyPrograms) {
    if (program.type === 'airline') {
      const iata = getLoyaltyProgramIata(program.name);
      if (iata) {
        accounts.push({
          airlineIataCode: iata,
          accountNumber: program.memberNumber,
        });
      }
    }
  }
  return accounts;
}
