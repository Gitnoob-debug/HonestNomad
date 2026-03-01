// Walk/drive time formatter for hotel distance display
// Pure client-side math — no API calls needed

const WALK_SPEED_M_PER_MIN = 80; // ~4.8 km/h average walking
const DRIVE_SPEED_M_PER_MIN = 500; // ~30 km/h urban driving
const WALK_THRESHOLD_MIN = 20; // above this, switch to drive estimate

export interface TravelTimeInfo {
  /** e.g. "4 min walk to your spot" or "12 min drive" */
  label: string;
  /** Raw minutes */
  minutes: number;
  /** 'walk' | 'drive' */
  mode: 'walk' | 'drive';
  /** Emoji prefix */
  emoji: string;
}

export function formatTravelTime(distanceMeters: number | undefined): TravelTimeInfo | null {
  if (!distanceMeters || distanceMeters <= 0) return null;

  const walkMinutes = Math.round(distanceMeters / WALK_SPEED_M_PER_MIN);

  if (walkMinutes <= WALK_THRESHOLD_MIN) {
    return {
      label: `${Math.max(1, walkMinutes)} min walk to your spot`,
      minutes: Math.max(1, walkMinutes),
      mode: 'walk',
      emoji: '🚶',
    };
  }

  const driveMinutes = Math.max(1, Math.round(distanceMeters / DRIVE_SPEED_M_PER_MIN));
  return {
    label: `${driveMinutes} min drive`,
    minutes: driveMinutes,
    mode: 'drive',
    emoji: '🚗',
  };
}
