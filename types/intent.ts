export interface ParsedIntent {
  intent: IntentType;
  message: string;
  extractedParams: ExtractedParams;
  missingRequired: string[];
  readyToSearch: boolean;
  selectedHotelId?: string;
  action: IntentAction;
}

export type IntentType =
  | 'search'
  | 'clarify'
  | 'select'
  | 'book'
  | 'plan_trip'
  | 'info'
  | 'other';

export type IntentAction =
  | 'search'
  | 'show_results'
  | 'ask_clarification'
  | 'collect_guest_info'
  | 'confirm_booking'
  | 'generate_itinerary'
  | null;

export interface ExtractedParams {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  preferences?: string[];
  neighborhood?: string;
  travelerType?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationContext {
  stage?: string;
  preferences?: ExtractedParams;
  lastSearchResultsCount?: number;
  selectedHotelId?: string;
}
