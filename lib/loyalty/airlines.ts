/**
 * Airline Loyalty Program Mappings
 * Maps loyalty program names to airline IATA codes for automatic point accrual
 */

// Map of loyalty program names to their airline IATA codes
export const LOYALTY_PROGRAM_TO_IATA: Record<string, string> = {
  // US Airlines
  'American Airlines AAdvantage': 'AA',
  'United MileagePlus': 'UA',
  'Delta SkyMiles': 'DL',
  'Southwest Rapid Rewards': 'WN',
  'JetBlue TrueBlue': 'B6',
  'Alaska Airlines Mileage Plan': 'AS',

  // European Airlines
  'British Airways Executive Club': 'BA',
  'Air France Flying Blue': 'AF',
  'Lufthansa Miles & More': 'LH',

  // Middle East Airlines
  'Emirates Skywards': 'EK',
  'Qatar Airways Privilege Club': 'QR',

  // Asian Airlines
  'Singapore Airlines KrisFlyer': 'SQ',
};

// Reverse mapping: IATA code to program name
export const IATA_TO_LOYALTY_PROGRAM: Record<string, string> = Object.fromEntries(
  Object.entries(LOYALTY_PROGRAM_TO_IATA).map(([name, code]) => [code, name])
);

// Alliance partnerships - airlines that share frequent flyer benefits
export const AIRLINE_ALLIANCES: Record<string, { name: string; members: string[] }> = {
  oneworld: {
    name: 'oneworld',
    members: ['AA', 'BA', 'QR', 'AS', 'IB', 'JL', 'MH', 'QF', 'RJ', 'S7', 'UL'],
  },
  starAlliance: {
    name: 'Star Alliance',
    members: ['UA', 'LH', 'SQ', 'AC', 'NH', 'SK', 'TG', 'TP', 'TK', 'OS', 'LO'],
  },
  skyTeam: {
    name: 'SkyTeam',
    members: ['DL', 'AF', 'KL', 'AM', 'AZ', 'CI', 'CZ', 'GA', 'KE', 'MU', 'OK', 'SU', 'VN'],
  },
};

/**
 * Get the airline IATA code for a loyalty program name
 */
export function getLoyaltyProgramIata(programName: string): string | null {
  return LOYALTY_PROGRAM_TO_IATA[programName] || null;
}

/**
 * Check if a loyalty program can earn miles on a given airline
 * (either same airline or alliance partner)
 */
export function canEarnMilesOnAirline(
  loyaltyProgramIata: string,
  flightAirlineIata: string
): boolean {
  // Same airline - always earns
  if (loyaltyProgramIata === flightAirlineIata) {
    return true;
  }

  // Check alliance partnerships
  for (const alliance of Object.values(AIRLINE_ALLIANCES)) {
    const hasLoyalty = alliance.members.includes(loyaltyProgramIata);
    const hasAirline = alliance.members.includes(flightAirlineIata);
    if (hasLoyalty && hasAirline) {
      return true;
    }
  }

  return false;
}

/**
 * Find the best matching loyalty program for a flight
 * Returns the loyalty account that should be used for this flight
 */
export function findMatchingLoyaltyProgram(
  userLoyaltyPrograms: Array<{ name: string; memberNumber: string }>,
  flightAirlines: string[] // IATA codes of airlines on the itinerary
): { airlineIataCode: string; accountNumber: string } | null {
  if (!userLoyaltyPrograms || userLoyaltyPrograms.length === 0) {
    return null;
  }

  // First, try to find an exact airline match
  for (const program of userLoyaltyPrograms) {
    const programIata = getLoyaltyProgramIata(program.name);
    if (programIata && flightAirlines.includes(programIata)) {
      return {
        airlineIataCode: programIata,
        accountNumber: program.memberNumber,
      };
    }
  }

  // Second, try to find an alliance partner match
  for (const program of userLoyaltyPrograms) {
    const programIata = getLoyaltyProgramIata(program.name);
    if (programIata) {
      for (const airlineIata of flightAirlines) {
        if (canEarnMilesOnAirline(programIata, airlineIata)) {
          return {
            airlineIataCode: programIata,
            accountNumber: program.memberNumber,
          };
        }
      }
    }
  }

  return null;
}
