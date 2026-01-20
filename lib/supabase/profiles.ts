import { createServiceRoleClient } from './server';
import type { Profile, UserPreferences } from '@/types/database';

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
