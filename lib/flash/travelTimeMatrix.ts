/**
 * Travel Time Matrix
 *
 * Provides estimated total travel time from a user's home airport to any destination.
 * Uses static data — no live API calls.
 *
 * Components:
 * 1. Flight time estimate (based on region-to-region lookup using great-circle distance bands)
 * 2. Ground transfer time (from destination airport to actual destination)
 *    - Most destinations: 20-45 min (taxi/train from their own airport)
 *    - Remote destinations: uses hubAirports.ts transfer info
 */

import { REMOTE_DESTINATION_TRANSFERS, formatTransferTime } from './hubAirports';
import type { Destination } from '@/types/flash';

// ============================================
// TYPES
// ============================================

export interface TravelTimeEstimate {
  /** Total estimated hours door-to-door (flight + ground) */
  totalHours: number;
  /** Flight portion in hours */
  flightHours: number;
  /** Ground transfer in minutes (airport to destination) */
  groundMinutes: number;
  /** Type of ground transfer */
  groundType: 'taxi' | 'drive' | 'train' | 'ferry' | 'connecting_flight' | 'bus';
  /** Human-readable summary */
  summary: string;
  /** Optional note about the journey */
  note?: string;
  /** Whether this is a rough estimate (all of them are, but some more than others) */
  isRoughEstimate: boolean;
}

// ============================================
// REGION-TO-REGION FLIGHT TIME BANDS
// ============================================

// Simplified region groupings for flight time estimation
type FlightRegion =
  | 'north_america_east'
  | 'north_america_west'
  | 'north_america_central'
  | 'caribbean'
  | 'central_america'
  | 'south_america_north'
  | 'south_america_south'
  | 'western_europe'
  | 'eastern_europe'
  | 'northern_europe'
  | 'southern_europe'
  | 'middle_east'
  | 'south_asia'
  | 'southeast_asia'
  | 'east_asia'
  | 'oceania'
  | 'east_africa'
  | 'west_africa'
  | 'southern_africa'
  | 'north_africa';

// Map airport codes to flight regions
const AIRPORT_TO_FLIGHT_REGION: Record<string, FlightRegion> = {
  // North America - East
  JFK: 'north_america_east', EWR: 'north_america_east', LGA: 'north_america_east',
  BOS: 'north_america_east', PHL: 'north_america_east', DCA: 'north_america_east',
  IAD: 'north_america_east', BWI: 'north_america_east', ATL: 'north_america_east',
  MIA: 'north_america_east', FLL: 'north_america_east', MCO: 'north_america_east',
  TPA: 'north_america_east', CLT: 'north_america_east', RDU: 'north_america_east',
  PIT: 'north_america_east', CLE: 'north_america_east', DTW: 'north_america_east',
  BUF: 'north_america_east', YYZ: 'north_america_east', YUL: 'north_america_east',
  YOW: 'north_america_east', YHZ: 'north_america_east', YQB: 'north_america_east',
  BNA: 'north_america_east', MEM: 'north_america_east', IND: 'north_america_east',
  MKE: 'north_america_east', SDF: 'north_america_east', SAV: 'north_america_east',
  CHS: 'north_america_east', EYW: 'north_america_east', ACK: 'north_america_east',
  MVY: 'north_america_east', PBI: 'north_america_east', JAX: 'north_america_east',
  STL: 'north_america_east',

  // North America - Central
  ORD: 'north_america_central', MSP: 'north_america_central',
  DFW: 'north_america_central', IAH: 'north_america_central',
  SAT: 'north_america_central', AUS: 'north_america_central',
  OKC: 'north_america_central', MCI: 'north_america_central',
  MSY: 'north_america_central', SLC: 'north_america_central',
  DEN: 'north_america_central', ABQ: 'north_america_central',
  ELP: 'north_america_central', YYC: 'north_america_central',
  YEG: 'north_america_central',

  // North America - West
  LAX: 'north_america_west', SFO: 'north_america_west', SAN: 'north_america_west',
  SEA: 'north_america_west', PDX: 'north_america_west', LAS: 'north_america_west',
  PHX: 'north_america_west', SJC: 'north_america_west', OAK: 'north_america_west',
  SMF: 'north_america_west', YVR: 'north_america_west', ANC: 'north_america_west',
  HNL: 'north_america_west', OGG: 'north_america_west', PSP: 'north_america_west',
  SBA: 'north_america_west', MRY: 'north_america_west', STS: 'north_america_west',
  BOI: 'north_america_west', RNO: 'north_america_west', TUS: 'north_america_west',
  ASE: 'north_america_west', JAC: 'north_america_west', YYJ: 'north_america_west',
  YLW: 'north_america_west',

  // Caribbean
  SJU: 'caribbean', NAS: 'caribbean', PUJ: 'caribbean', SDQ: 'caribbean',
  MBJ: 'caribbean', KIN: 'caribbean', AUA: 'caribbean', CUR: 'caribbean',
  BON: 'caribbean', SXM: 'caribbean', PLS: 'caribbean', GCM: 'caribbean',
  SBH: 'caribbean', UVF: 'caribbean', SKB: 'caribbean', GND: 'caribbean',
  PTP: 'caribbean', FDF: 'caribbean', RTB: 'caribbean', BZE: 'caribbean',
  TZA: 'caribbean', STT: 'caribbean', STX: 'caribbean',

  // Central America
  MEX: 'central_america', CUN: 'central_america', GDL: 'central_america',
  SJO: 'central_america', PTY: 'central_america', GUA: 'central_america',
  PVR: 'central_america', SJD: 'central_america', OAX: 'central_america',
  MID: 'central_america', BJX: 'central_america', ZIH: 'central_america',
  LIR: 'central_america', SAL: 'central_america',

  // South America - North
  BOG: 'south_america_north', MDE: 'south_america_north', CTG: 'south_america_north',
  CLO: 'south_america_north', UIO: 'south_america_north', GYE: 'south_america_north',
  LIM: 'south_america_north', CUZ: 'south_america_north', GIG: 'south_america_north',
  GRU: 'south_america_north', CCS: 'south_america_north', SSA: 'south_america_north',
  FLN: 'south_america_north', GPS: 'south_america_north',

  // South America - South
  EZE: 'south_america_south', SCL: 'south_america_south', MVD: 'south_america_south',
  MDZ: 'south_america_south', IGR: 'south_america_south', BRC: 'south_america_south',
  USH: 'south_america_south', PUQ: 'south_america_south', AEP: 'south_america_south',
  SLA: 'south_america_south', PMC: 'south_america_south', PDP: 'south_america_south',
  LPB: 'south_america_south', VVI: 'south_america_south', UYU: 'south_america_south',

  // Western Europe
  LHR: 'western_europe', LGW: 'western_europe', STN: 'western_europe',
  CDG: 'western_europe', ORY: 'western_europe', AMS: 'western_europe',
  FRA: 'western_europe', MUC: 'western_europe', ZRH: 'western_europe',
  BRU: 'western_europe', DUS: 'western_europe', HAM: 'western_europe',
  BER: 'western_europe', CGN: 'western_europe', STR: 'western_europe',
  NUE: 'western_europe', LEJ: 'western_europe', DRS: 'western_europe',
  GVA: 'western_europe', BSL: 'western_europe', LUX: 'western_europe',
  DUB: 'western_europe', SNN: 'western_europe', BHX: 'western_europe',
  MAN: 'western_europe', EDI: 'western_europe', GLA: 'western_europe',
  BRS: 'western_europe', CWL: 'western_europe', BFS: 'western_europe',
  LPL: 'western_europe', INV: 'western_europe', SOU: 'western_europe',
  BHD: 'western_europe', ORK: 'western_europe', KNO: 'western_europe',
  INN: 'western_europe', SZG: 'western_europe', GRZ: 'western_europe',
  VIE: 'western_europe', HAJ: 'western_europe', BRE: 'western_europe',

  // Southern Europe
  BCN: 'southern_europe', MAD: 'southern_europe', AGP: 'southern_europe',
  VLC: 'southern_europe', SVQ: 'southern_europe', BIO: 'southern_europe',
  IBZ: 'southern_europe', PMI: 'southern_europe', TFS: 'southern_europe',
  LPA: 'southern_europe', ACE: 'southern_europe', FUE: 'southern_europe',
  FCO: 'southern_europe', MXP: 'southern_europe', VCE: 'southern_europe',
  NAP: 'southern_europe', FLR: 'southern_europe', BLQ: 'southern_europe',
  CTA: 'southern_europe', PMO: 'southern_europe', TRN: 'southern_europe',
  BGY: 'southern_europe', PSA: 'southern_europe', VRN: 'southern_europe',
  OLB: 'southern_europe', CAG: 'southern_europe',
  LIS: 'southern_europe', OPO: 'southern_europe', FAO: 'southern_europe',
  FNC: 'southern_europe', PDL: 'southern_europe',
  ATH: 'southern_europe', SKG: 'southern_europe', JMK: 'southern_europe',
  JTR: 'southern_europe', HER: 'southern_europe', RHO: 'southern_europe',
  EFL: 'southern_europe', CFU: 'southern_europe', CHQ: 'southern_europe',
  ZTH: 'southern_europe', PXO: 'southern_europe', JNX: 'southern_europe',
  MCM: 'southern_europe', NCE: 'southern_europe', MRS: 'southern_europe',
  TLS: 'southern_europe', BOD: 'southern_europe', NTE: 'southern_europe',
  LYS: 'southern_europe', SXB: 'southern_europe', AJA: 'southern_europe',
  MLH: 'southern_europe', LIL: 'southern_europe',
  MLA: 'southern_europe', PFO: 'southern_europe', LCA: 'southern_europe',

  // Northern Europe
  CPH: 'northern_europe', ARN: 'northern_europe', GOT: 'northern_europe',
  OSL: 'northern_europe', BGO: 'northern_europe', TOS: 'northern_europe',
  TRD: 'northern_europe', HEL: 'northern_europe', RVN: 'northern_europe',
  KEF: 'northern_europe', MMA: 'northern_europe', AAR: 'northern_europe',
  SVG: 'northern_europe', LYR: 'northern_europe', BOO: 'northern_europe',

  // Eastern Europe
  WAW: 'eastern_europe', KRK: 'eastern_europe', GDN: 'eastern_europe',
  WRO: 'eastern_europe', PRG: 'eastern_europe', BUD: 'eastern_europe',
  OTP: 'eastern_europe', SOF: 'eastern_europe', PDV: 'eastern_europe',
  BEG: 'eastern_europe', ZAG: 'eastern_europe', SPU: 'eastern_europe',
  DBV: 'eastern_europe', LJU: 'eastern_europe', TIA: 'eastern_europe',
  SJJ: 'eastern_europe', OMO: 'eastern_europe', RIX: 'eastern_europe',
  TLL: 'eastern_europe', VNO: 'eastern_europe', BTS: 'eastern_europe',
  KSC: 'eastern_europe', PLQ: 'eastern_europe',
  IST: 'eastern_europe', AYT: 'eastern_europe',

  // Middle East
  DXB: 'middle_east', AUH: 'middle_east', DOH: 'middle_east',
  BAH: 'middle_east', KWI: 'middle_east', MCT: 'middle_east',
  SLL: 'middle_east', RUH: 'middle_east', JED: 'middle_east',
  MED: 'middle_east', ALA: 'middle_east',
  TLV: 'middle_east', AMM: 'middle_east', BEY: 'middle_east',
  AQJ: 'middle_east',

  // South Asia
  DEL: 'south_asia', BOM: 'south_asia', BLR: 'south_asia',
  MAA: 'south_asia', CCU: 'south_asia', COK: 'south_asia',
  GOI: 'south_asia', JAI: 'south_asia', AMD: 'south_asia',
  ATQ: 'south_asia', UDR: 'south_asia',
  KTM: 'south_asia', PKR: 'south_asia',
  CMB: 'south_asia', HRI: 'south_asia',
  PBH: 'south_asia',

  // Southeast Asia
  SIN: 'southeast_asia', BKK: 'southeast_asia', DMK: 'southeast_asia',
  KUL: 'southeast_asia', PEN: 'southeast_asia', LGK: 'southeast_asia',
  CGK: 'southeast_asia', DPS: 'southeast_asia', JOG: 'southeast_asia',
  MNL: 'southeast_asia', CEB: 'southeast_asia', PPS: 'southeast_asia',
  HAN: 'southeast_asia', SGN: 'southeast_asia', DAD: 'southeast_asia',
  CXR: 'southeast_asia', HUI: 'southeast_asia',
  CNX: 'southeast_asia', HKT: 'southeast_asia', USM: 'southeast_asia',
  KBV: 'southeast_asia', REP: 'southeast_asia', LPQ: 'southeast_asia',
  RGN: 'southeast_asia', BWN: 'southeast_asia', VTE: 'southeast_asia',
  BKI: 'southeast_asia', JHB: 'southeast_asia',

  // East Asia
  NRT: 'east_asia', HND: 'east_asia', KIX: 'east_asia',
  ICN: 'east_asia', GMP: 'east_asia', CJU: 'east_asia',
  PUS: 'east_asia',
  PEK: 'east_asia', PVG: 'east_asia', CAN: 'east_asia',
  SZX: 'east_asia', CTU: 'east_asia', HGH: 'east_asia',
  XIY: 'east_asia', KWL: 'east_asia', NKG: 'east_asia',
  SHE: 'east_asia', WUH: 'east_asia', CSX: 'east_asia',
  DLC: 'east_asia', LJG: 'east_asia',
  HKG: 'east_asia', MFM: 'east_asia',
  TPE: 'east_asia', KHH: 'east_asia',
  ULN: 'east_asia',
  NGO: 'east_asia', FUK: 'east_asia', CTS: 'east_asia',
  OKA: 'east_asia', HIJ: 'east_asia', KMJ: 'east_asia',

  // Oceania
  SYD: 'oceania', MEL: 'oceania', BNE: 'oceania',
  PER: 'oceania', ADL: 'oceania', CNS: 'oceania',
  OOL: 'oceania', HBA: 'oceania', LST: 'oceania',
  AKL: 'oceania', ZQN: 'oceania', WLG: 'oceania',
  CHC: 'oceania', ROT: 'oceania',
  NAN: 'oceania', APW: 'oceania', RAR: 'oceania',
  PPT: 'oceania', BOB: 'oceania', NOU: 'oceania',
  VLI: 'oceania', ROR: 'oceania', GUM: 'oceania',

  // East Africa
  NBO: 'east_africa', DAR: 'east_africa', ADD: 'east_africa',
  EBB: 'east_africa', KGL: 'east_africa', ZNZ: 'east_africa',
  JRO: 'east_africa', SEZ: 'east_africa', MRU: 'east_africa',
  RUN: 'east_africa',

  // West Africa
  ACC: 'west_africa', DSS: 'west_africa', LOS: 'west_africa',
  ABV: 'west_africa', CMN: 'west_africa', RAK: 'west_africa',
  FEZ: 'west_africa', ESU: 'west_africa', TNG: 'west_africa',
  TUN: 'west_africa',

  // Southern Africa
  JNB: 'southern_africa', CPT: 'southern_africa', DUR: 'southern_africa',
  WDH: 'southern_africa', VFA: 'southern_africa', LVI: 'southern_africa',
  MQP: 'southern_africa', HRE: 'southern_africa',

  // North Africa
  CAI: 'north_africa', LXR: 'north_africa', HRG: 'north_africa',
  SSH: 'north_africa', ALG: 'north_africa',
};

// Average flight hours between region pairs (direct flight time only)
// These are rough estimates — real flights may vary significantly
const REGION_FLIGHT_HOURS: Partial<Record<FlightRegion, Partial<Record<FlightRegion, number>>>> = {
  north_america_east: {
    north_america_east: 2,
    north_america_central: 3,
    north_america_west: 5,
    caribbean: 3,
    central_america: 4,
    south_america_north: 6,
    south_america_south: 10,
    western_europe: 7,
    southern_europe: 8,
    northern_europe: 8,
    eastern_europe: 9,
    middle_east: 11,
    south_asia: 14,
    southeast_asia: 17,
    east_asia: 14,
    oceania: 20,
    east_africa: 15,
    west_africa: 8,
    southern_africa: 16,
    north_africa: 10,
  },
  north_america_central: {
    north_america_east: 3,
    north_america_central: 2,
    north_america_west: 3.5,
    caribbean: 4,
    central_america: 3.5,
    south_america_north: 6,
    south_america_south: 10,
    western_europe: 9,
    southern_europe: 10,
    northern_europe: 9,
    eastern_europe: 10,
    middle_east: 13,
    south_asia: 15,
    southeast_asia: 17,
    east_asia: 13,
    oceania: 18,
    east_africa: 16,
    west_africa: 10,
    southern_africa: 17,
    north_africa: 11,
  },
  north_america_west: {
    north_america_east: 5,
    north_america_central: 3.5,
    north_america_west: 2,
    caribbean: 6,
    central_america: 5,
    south_america_north: 8,
    south_america_south: 12,
    western_europe: 10,
    southern_europe: 11,
    northern_europe: 10,
    eastern_europe: 11,
    middle_east: 15,
    south_asia: 16,
    southeast_asia: 16,
    east_asia: 11,
    oceania: 13,
    east_africa: 18,
    west_africa: 12,
    southern_africa: 18,
    north_africa: 12,
  },
  caribbean: {
    north_america_east: 3,
    north_america_central: 4,
    north_america_west: 6,
    caribbean: 1.5,
    central_america: 3,
    south_america_north: 4,
    south_america_south: 9,
    western_europe: 8,
    southern_europe: 9,
    northern_europe: 9,
    eastern_europe: 10,
    middle_east: 13,
    south_asia: 16,
    southeast_asia: 19,
    east_asia: 16,
    oceania: 20,
    east_africa: 14,
    west_africa: 8,
    southern_africa: 15,
    north_africa: 10,
  },
  central_america: {
    north_america_east: 4,
    north_america_central: 3.5,
    north_america_west: 5,
    caribbean: 3,
    central_america: 2,
    south_america_north: 4,
    south_america_south: 9,
    western_europe: 10,
    southern_europe: 11,
    northern_europe: 11,
    eastern_europe: 12,
    middle_east: 15,
    south_asia: 17,
    southeast_asia: 19,
    east_asia: 14,
    oceania: 18,
    east_africa: 16,
    west_africa: 10,
    southern_africa: 17,
    north_africa: 12,
  },
  south_america_north: {
    north_america_east: 6,
    north_america_central: 6,
    north_america_west: 8,
    caribbean: 4,
    central_america: 4,
    south_america_north: 3,
    south_america_south: 5,
    western_europe: 10,
    southern_europe: 11,
    northern_europe: 12,
    eastern_europe: 12,
    middle_east: 14,
    south_asia: 17,
    southeast_asia: 20,
    east_asia: 18,
    oceania: 18,
    east_africa: 14,
    west_africa: 8,
    southern_africa: 12,
    north_africa: 11,
  },
  south_america_south: {
    north_america_east: 10,
    north_america_central: 10,
    north_america_west: 12,
    caribbean: 9,
    central_america: 9,
    south_america_north: 5,
    south_america_south: 3,
    western_europe: 12,
    southern_europe: 13,
    northern_europe: 14,
    eastern_europe: 14,
    middle_east: 16,
    south_asia: 18,
    southeast_asia: 22,
    east_asia: 20,
    oceania: 14,
    east_africa: 14,
    west_africa: 10,
    southern_africa: 10,
    north_africa: 13,
  },
  western_europe: {
    north_america_east: 7,
    north_america_central: 9,
    north_america_west: 10,
    caribbean: 8,
    central_america: 10,
    south_america_north: 10,
    south_america_south: 12,
    western_europe: 1.5,
    southern_europe: 2,
    northern_europe: 2,
    eastern_europe: 2.5,
    middle_east: 5,
    south_asia: 8,
    southeast_asia: 11,
    east_asia: 10,
    oceania: 20,
    east_africa: 8,
    west_africa: 5,
    southern_africa: 11,
    north_africa: 3,
  },
  southern_europe: {
    north_america_east: 8,
    north_america_central: 10,
    north_america_west: 11,
    caribbean: 9,
    central_america: 11,
    south_america_north: 11,
    south_america_south: 13,
    western_europe: 2,
    southern_europe: 1.5,
    northern_europe: 3,
    eastern_europe: 2,
    middle_east: 4.5,
    south_asia: 7,
    southeast_asia: 10,
    east_asia: 11,
    oceania: 20,
    east_africa: 7,
    west_africa: 4,
    southern_africa: 10,
    north_africa: 2.5,
  },
  northern_europe: {
    north_america_east: 8,
    north_america_central: 9,
    north_america_west: 10,
    caribbean: 9,
    central_america: 11,
    south_america_north: 12,
    south_america_south: 14,
    western_europe: 2,
    southern_europe: 3,
    northern_europe: 1.5,
    eastern_europe: 2,
    middle_east: 6,
    south_asia: 9,
    southeast_asia: 11,
    east_asia: 10,
    oceania: 21,
    east_africa: 9,
    west_africa: 6,
    southern_africa: 12,
    north_africa: 4,
  },
  eastern_europe: {
    north_america_east: 9,
    north_america_central: 10,
    north_america_west: 11,
    caribbean: 10,
    central_america: 12,
    south_america_north: 12,
    south_america_south: 14,
    western_europe: 2.5,
    southern_europe: 2,
    northern_europe: 2,
    eastern_europe: 1.5,
    middle_east: 4,
    south_asia: 7,
    southeast_asia: 9,
    east_asia: 9,
    oceania: 19,
    east_africa: 7,
    west_africa: 6,
    southern_africa: 10,
    north_africa: 3,
  },
  middle_east: {
    north_america_east: 11,
    north_america_central: 13,
    north_america_west: 15,
    caribbean: 13,
    central_america: 15,
    south_america_north: 14,
    south_america_south: 16,
    western_europe: 5,
    southern_europe: 4.5,
    northern_europe: 6,
    eastern_europe: 4,
    middle_east: 2,
    south_asia: 4,
    southeast_asia: 7,
    east_asia: 9,
    oceania: 14,
    east_africa: 5,
    west_africa: 7,
    southern_africa: 8,
    north_africa: 4,
  },
  south_asia: {
    north_america_east: 14,
    north_america_central: 15,
    north_america_west: 16,
    caribbean: 16,
    central_america: 17,
    south_america_north: 17,
    south_america_south: 18,
    western_europe: 8,
    southern_europe: 7,
    northern_europe: 9,
    eastern_europe: 7,
    middle_east: 4,
    south_asia: 2,
    southeast_asia: 4,
    east_asia: 7,
    oceania: 12,
    east_africa: 6,
    west_africa: 9,
    southern_africa: 9,
    north_africa: 6,
  },
  southeast_asia: {
    north_america_east: 17,
    north_america_central: 17,
    north_america_west: 16,
    caribbean: 19,
    central_america: 19,
    south_america_north: 20,
    south_america_south: 22,
    western_europe: 11,
    southern_europe: 10,
    northern_europe: 11,
    eastern_europe: 9,
    middle_east: 7,
    south_asia: 4,
    southeast_asia: 2,
    east_asia: 5,
    oceania: 8,
    east_africa: 9,
    west_africa: 13,
    southern_africa: 11,
    north_africa: 10,
  },
  east_asia: {
    north_america_east: 14,
    north_america_central: 13,
    north_america_west: 11,
    caribbean: 16,
    central_america: 14,
    south_america_north: 18,
    south_america_south: 20,
    western_europe: 10,
    southern_europe: 11,
    northern_europe: 10,
    eastern_europe: 9,
    middle_east: 9,
    south_asia: 7,
    southeast_asia: 5,
    east_asia: 2.5,
    oceania: 10,
    east_africa: 12,
    west_africa: 14,
    southern_africa: 14,
    north_africa: 11,
  },
  oceania: {
    north_america_east: 20,
    north_america_central: 18,
    north_america_west: 13,
    caribbean: 20,
    central_america: 18,
    south_america_north: 18,
    south_america_south: 14,
    western_europe: 20,
    southern_europe: 20,
    northern_europe: 21,
    eastern_europe: 19,
    middle_east: 14,
    south_asia: 12,
    southeast_asia: 8,
    east_asia: 10,
    oceania: 3,
    east_africa: 14,
    west_africa: 18,
    southern_africa: 12,
    north_africa: 18,
  },
  east_africa: {
    north_america_east: 15,
    north_america_central: 16,
    north_america_west: 18,
    caribbean: 14,
    central_america: 16,
    south_america_north: 14,
    south_america_south: 14,
    western_europe: 8,
    southern_europe: 7,
    northern_europe: 9,
    eastern_europe: 7,
    middle_east: 5,
    south_asia: 6,
    southeast_asia: 9,
    east_asia: 12,
    oceania: 14,
    east_africa: 2,
    west_africa: 6,
    southern_africa: 4,
    north_africa: 5,
  },
  west_africa: {
    north_america_east: 8,
    north_america_central: 10,
    north_america_west: 12,
    caribbean: 8,
    central_america: 10,
    south_america_north: 8,
    south_america_south: 10,
    western_europe: 5,
    southern_europe: 4,
    northern_europe: 6,
    eastern_europe: 6,
    middle_east: 7,
    south_asia: 9,
    southeast_asia: 13,
    east_asia: 14,
    oceania: 18,
    east_africa: 6,
    west_africa: 2,
    southern_africa: 8,
    north_africa: 3,
  },
  southern_africa: {
    north_america_east: 16,
    north_america_central: 17,
    north_america_west: 18,
    caribbean: 15,
    central_america: 17,
    south_america_north: 12,
    south_america_south: 10,
    western_europe: 11,
    southern_europe: 10,
    northern_europe: 12,
    eastern_europe: 10,
    middle_east: 8,
    south_asia: 9,
    southeast_asia: 11,
    east_asia: 14,
    oceania: 12,
    east_africa: 4,
    west_africa: 8,
    southern_africa: 2,
    north_africa: 8,
  },
  north_africa: {
    north_america_east: 10,
    north_america_central: 11,
    north_america_west: 12,
    caribbean: 10,
    central_america: 12,
    south_america_north: 11,
    south_america_south: 13,
    western_europe: 3,
    southern_europe: 2.5,
    northern_europe: 4,
    eastern_europe: 3,
    middle_east: 4,
    south_asia: 6,
    southeast_asia: 10,
    east_asia: 11,
    oceania: 18,
    east_africa: 5,
    west_africa: 3,
    southern_africa: 8,
    north_africa: 1.5,
  },
};

// ============================================
// DEFAULT GROUND TRANSFER TIMES
// ============================================

// Default taxi/transit time from airport to city center (minutes)
// Used when destination is NOT in the remote transfer list
const DEFAULT_GROUND_TRANSFER_MINUTES = 30;

// ============================================
// PUBLIC API
// ============================================

/**
 * Get the flight region for an airport code.
 * Falls back to guessing from the destination region field.
 */
function getFlightRegion(airportCode: string, destinationRegion?: string): FlightRegion | null {
  const region = AIRPORT_TO_FLIGHT_REGION[airportCode];
  if (region) return region;

  // Fallback: map destination.region to a flight region
  if (destinationRegion) {
    const regionMap: Record<string, FlightRegion> = {
      europe: 'western_europe',
      asia: 'southeast_asia',
      americas: 'north_america_east',
      africa: 'east_africa',
      oceania: 'oceania',
      middle_east: 'middle_east',
      caribbean: 'caribbean',
    };
    return regionMap[destinationRegion] || null;
  }

  return null;
}

/**
 * Look up the average flight hours between two flight regions.
 */
function getFlightHoursBetweenRegions(from: FlightRegion, to: FlightRegion): number {
  // Try direct lookup
  const direct = REGION_FLIGHT_HOURS[from]?.[to];
  if (direct !== undefined) return direct;

  // Try reverse lookup (matrix is mostly symmetric)
  const reverse = REGION_FLIGHT_HOURS[to]?.[from];
  if (reverse !== undefined) return reverse;

  // Fallback: rough estimate based on common sense
  return 10; // Long-haul default
}

/**
 * Estimate total travel time from a home airport to a destination.
 *
 * @param homeAirportCode - User's home airport IATA code (e.g., 'JFK')
 * @param destination - The destination object
 * @returns Travel time estimate, or null if can't estimate
 */
export function estimateTravelTime(
  homeAirportCode: string,
  destination: Pick<Destination, 'id' | 'airportCode' | 'region'>
): TravelTimeEstimate | null {
  const homeRegion = getFlightRegion(homeAirportCode);
  const destRegion = getFlightRegion(destination.airportCode, destination.region);

  if (!homeRegion || !destRegion) {
    return null;
  }

  const flightHours = getFlightHoursBetweenRegions(homeRegion, destRegion);

  // Check if destination has remote transfer
  const remoteTransfer = REMOTE_DESTINATION_TRANSFERS[destination.id];

  let groundMinutes: number;
  let groundType: TravelTimeEstimate['groundType'];
  let note: string | undefined;

  if (remoteTransfer) {
    groundMinutes = remoteTransfer.groundTransferMinutes;
    groundType = remoteTransfer.transferType === 'connecting_flight'
      ? 'connecting_flight'
      : remoteTransfer.transferType;
    note = remoteTransfer.transferNote;
  } else {
    groundMinutes = DEFAULT_GROUND_TRANSFER_MINUTES;
    groundType = 'taxi';
  }

  const totalHours = flightHours + (groundMinutes / 60);

  return {
    totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
    flightHours,
    groundMinutes,
    groundType,
    summary: formatTravelTimeSummary(flightHours, groundMinutes, groundType),
    note,
    isRoughEstimate: true,
  };
}

/**
 * Format a human-readable travel time summary.
 */
function formatTravelTimeSummary(
  flightHours: number,
  groundMinutes: number,
  groundType: TravelTimeEstimate['groundType']
): string {
  const flightStr = flightHours <= 1
    ? '~1hr flight'
    : `~${Math.round(flightHours)}hr flight`;

  if (groundType === 'taxi' && groundMinutes <= 45) {
    // Standard airport → city, don't bother mentioning
    return flightStr;
  }

  const groundStr = formatTransferTime(groundMinutes);
  const groundLabel = {
    taxi: 'taxi',
    drive: 'drive',
    train: 'train',
    ferry: 'ferry',
    connecting_flight: 'connecting flight',
    bus: 'bus',
  }[groundType];

  return `${flightStr} + ${groundStr} ${groundLabel}`;
}

/**
 * Format travel time for display on cards (short format).
 * e.g., "7h", "14h", "20h+"
 */
export function formatTravelTimeShort(estimate: TravelTimeEstimate): string {
  const hours = Math.round(estimate.totalHours);
  if (hours <= 1) return '~1h';
  if (hours >= 20) return '20h+';
  return `~${hours}h`;
}

/**
 * Get a travel time category for filtering/sorting.
 */
export type TravelTimeCategory = 'short' | 'medium' | 'long' | 'ultra_long';

export function getTravelTimeCategory(estimate: TravelTimeEstimate): TravelTimeCategory {
  if (estimate.totalHours <= 4) return 'short';
  if (estimate.totalHours <= 9) return 'medium';
  if (estimate.totalHours <= 15) return 'long';
  return 'ultra_long';
}
