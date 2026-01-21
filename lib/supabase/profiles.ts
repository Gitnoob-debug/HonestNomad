import { createServiceRoleClient } from './server';
import type { Profile, UserPreferences } from '@/types/database';
import type { FlashVacationPreferences, WizardStep, WIZARD_STEPS } from '@/types/flash';

export async function createProfile(
  userId: string,
  data?: Partial<Profile>
): Promise<Profile> {
  const supabase = createServiceRoleClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({
      userId,
      fullName: data?.fullName,
      email: data?.email,
      phone: data?.phone,
      preferences: data?.preferences || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create profile: ${error.message}`);
  }

  return profile as Profile;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('userId', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get profile: ${error.message}`);
  }

  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'userId' | 'createdAt'>>
): Promise<Profile> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq('userId', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return data as Profile;
}

export async function updatePreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<Profile> {
  const supabase = createServiceRoleClient();

  // Get current profile
  const current = await getProfile(userId);
  if (!current) {
    throw new Error('Profile not found');
  }

  const updatedPreferences = {
    ...current.preferences,
    ...preferences,
  };

  const { data, error } = await supabase
    .from('profiles')
    .update({
      preferences: updatedPreferences,
      updatedAt: new Date().toISOString(),
    })
    .eq('userId', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update preferences: ${error.message}`);
  }

  return data as Profile;
}

export async function getOrCreateProfile(
  userId: string,
  email?: string
): Promise<Profile> {
  const existing = await getProfile(userId);
  if (existing) {
    return existing;
  }

  return createProfile(userId, { email });
}

// Flash Vacation Preferences

export async function getFlashPreferences(
  userId: string
): Promise<{
  preferences: FlashVacationPreferences | null;
  profileComplete: boolean;
  missingSteps: WizardStep[];
}> {
  const profile = await getProfile(userId);

  if (!profile || !profile.preferences?.flashVacation) {
    return {
      preferences: null,
      profileComplete: false,
      missingSteps: ['travelers', 'homeBase', 'budget', 'accommodation', 'travelStyle', 'interests', 'restrictions', 'surpriseTolerance'],
    };
  }

  const flash = profile.preferences.flashVacation;
  const missingSteps = getMissingSteps(flash);

  return {
    preferences: flash,
    profileComplete: flash.profileCompleted && missingSteps.length === 0,
    missingSteps,
  };
}

export async function updateFlashPreferences(
  userId: string,
  updates: Partial<FlashVacationPreferences>
): Promise<FlashVacationPreferences> {
  const profile = await getProfile(userId);
  if (!profile) {
    throw new Error('Profile not found');
  }

  const currentFlash = profile.preferences?.flashVacation || {};
  const updatedFlash: FlashVacationPreferences = {
    ...currentFlash,
    ...updates,
  } as FlashVacationPreferences;

  // Check if all required steps are complete
  const missingSteps = getMissingSteps(updatedFlash);
  if (missingSteps.length === 0 && !updatedFlash.profileCompleted) {
    updatedFlash.profileCompleted = true;
    updatedFlash.profileCompletedAt = new Date().toISOString();
  }

  await updatePreferences(userId, {
    ...profile.preferences,
    flashVacation: updatedFlash,
  });

  return updatedFlash;
}

function getMissingSteps(flash: Partial<FlashVacationPreferences>): WizardStep[] {
  const missing: WizardStep[] = [];

  // Check travelers
  if (!flash.travelers || !flash.travelers.type || flash.travelers.adults < 1) {
    missing.push('travelers');
  }

  // Check home base
  if (!flash.homeBase || !flash.homeBase.airportCode) {
    missing.push('homeBase');
  }

  // Check budget
  if (!flash.budget || !flash.budget.perTripMax || flash.budget.perTripMax <= 0) {
    missing.push('budget');
  }

  // Check accommodation
  if (!flash.accommodation || flash.accommodation.minStars === undefined) {
    missing.push('accommodation');
  }

  // Check travel style
  if (!flash.travelStyle || flash.travelStyle.adventureRelaxation === undefined) {
    missing.push('travelStyle');
  }

  // Check interests (at least 1 primary)
  if (!flash.interests || !flash.interests.primary || flash.interests.primary.length === 0) {
    missing.push('interests');
  }

  // Restrictions are optional - don't mark as missing

  // Check surprise tolerance
  if (flash.surpriseTolerance === undefined) {
    missing.push('surpriseTolerance');
  }

  return missing;
}
