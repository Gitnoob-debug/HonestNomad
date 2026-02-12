/**
 * Loyalty Program Integration
 * Handles hotel loyalty reminders at check-in
 * Flight loyalty attachment removed (flights feature removed)
 */

export * from './airlines';
export * from './hotels';

import { getLoyaltyProgramIata } from './airlines';

interface UserLoyaltyProgram {
  id: string;
  type: 'airline' | 'hotel';
  name: string;
  memberNumber: string;
}

interface LoyaltyProgramAccount {
  airlineIataCode: string;
  accountNumber: string;
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
 * Convert user's stored loyalty programs to the format needed for booking
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
