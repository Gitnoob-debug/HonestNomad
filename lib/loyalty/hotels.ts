/**
 * Hotel Loyalty Program Mappings
 * Maps loyalty program names to hotel chain identifiers for check-in reminders
 */

// Map of loyalty program names to hotel chain keywords
// These keywords are used to match against hotel names
export const HOTEL_LOYALTY_PROGRAMS: Record<string, {
  keywords: string[];  // Keywords to match in hotel name
  programName: string; // Display name
}> = {
  'Marriott Bonvoy': {
    keywords: ['marriott', 'sheraton', 'westin', 'w hotel', 'ritz-carlton', 'ritz carlton', 'st. regis', 'st regis', 'courtyard', 'fairfield', 'residence inn', 'springhill', 'aloft', 'element', 'moxy', 'ac hotel', 'le meridien', 'renaissance', 'autograph', 'tribute'],
    programName: 'Marriott Bonvoy',
  },
  'Hilton Honors': {
    keywords: ['hilton', 'doubletree', 'embassy suites', 'hampton', 'homewood suites', 'home2', 'tru by hilton', 'curio', 'tapestry', 'canopy', 'signia', 'waldorf', 'conrad', 'lxr'],
    programName: 'Hilton Honors',
  },
  'IHG One Rewards': {
    keywords: ['ihg', 'intercontinental', 'crowne plaza', 'holiday inn', 'indigo', 'kimpton', 'even hotels', 'staybridge', 'candlewood', 'avid', 'atwell', 'vignette', 'regent'],
    programName: 'IHG One Rewards',
  },
  'World of Hyatt': {
    keywords: ['hyatt', 'park hyatt', 'grand hyatt', 'andaz', 'thompson', 'alila', 'destination', 'caption', 'hyatt place', 'hyatt house', 'hyatt centric'],
    programName: 'World of Hyatt',
  },
  'Wyndham Rewards': {
    keywords: ['wyndham', 'ramada', 'days inn', 'super 8', 'la quinta', 'wingate', 'baymont', 'microtel', 'hawthorn', 'trademark', 'tryp', 'dolce'],
    programName: 'Wyndham Rewards',
  },
  'Choice Privileges': {
    keywords: ['choice', 'comfort inn', 'comfort suites', 'quality inn', 'sleep inn', 'clarion', 'econo lodge', 'rodeway', 'ascend', 'cambria', 'woodspring'],
    programName: 'Choice Privileges',
  },
  'Best Western Rewards': {
    keywords: ['best western', 'surestay', 'vib', 'glo', 'aiden', 'sadie'],
    programName: 'Best Western Rewards',
  },
  'Accor Live Limitless': {
    keywords: ['accor', 'sofitel', 'pullman', 'mgallery', 'novotel', 'mercure', 'ibis', 'adagio', 'swissotel', 'fairmont', 'raffles', 'banyan tree', 'movenpick', 'mantis', '25hours', 'tribe'],
    programName: 'Accor Live Limitless',
  },
  'Radisson Rewards': {
    keywords: ['radisson', 'country inn', 'park inn', 'park plaza'],
    programName: 'Radisson Rewards',
  },
};

/**
 * Find matching hotel loyalty program for a hotel name
 * Returns the user's loyalty program info if they have one that matches the hotel
 */
export function findMatchingHotelLoyalty(
  hotelName: string,
  userLoyaltyPrograms: Array<{ type: string; name: string; memberNumber: string }> | undefined
): { programName: string; memberNumber: string } | null {
  if (!userLoyaltyPrograms || userLoyaltyPrograms.length === 0) {
    return null;
  }

  const hotelNameLower = hotelName.toLowerCase();

  // Filter to only hotel programs
  const hotelPrograms = userLoyaltyPrograms.filter(p => p.type === 'hotel');

  for (const userProgram of hotelPrograms) {
    const programConfig = HOTEL_LOYALTY_PROGRAMS[userProgram.name];
    if (!programConfig) continue;

    // Check if any keyword matches the hotel name
    const matches = programConfig.keywords.some(keyword =>
      hotelNameLower.includes(keyword.toLowerCase())
    );

    if (matches) {
      return {
        programName: programConfig.programName,
        memberNumber: userProgram.memberNumber,
      };
    }
  }

  return null;
}

/**
 * Get all hotel chain keywords for a loyalty program
 */
export function getHotelChainKeywords(programName: string): string[] {
  return HOTEL_LOYALTY_PROGRAMS[programName]?.keywords || [];
}
