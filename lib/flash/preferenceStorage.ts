/**
 * Supabase storage for revealed preferences
 *
 * Stores in user_preferences table as JSONB column
 */

import { createClient } from '@/lib/supabase/client';
import {
  RevealedPreferences,
  createEmptyPreferences,
} from './preferenceEngine';

const STORAGE_KEY = 'revealed_preferences';

/**
 * Load revealed preferences from Supabase
 */
export async function loadRevealedPreferences(userId: string): Promise<RevealedPreferences> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error loading revealed preferences:', error);
      return createEmptyPreferences();
    }

    const revealed = data?.preferences?.[STORAGE_KEY];
    if (!revealed) {
      return createEmptyPreferences();
    }

    // Validate and migrate if needed
    return migratePreferences(revealed);
  } catch (error) {
    console.error('Failed to load revealed preferences:', error);
    return createEmptyPreferences();
  }
}

/**
 * Save revealed preferences to Supabase
 */
export async function saveRevealedPreferences(
  userId: string,
  prefs: RevealedPreferences
): Promise<boolean> {
  try {
    const supabase = createClient();

    // First, get current preferences
    const { data: current } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .single();

    const currentPrefs = current?.preferences || {};

    // Merge with revealed preferences
    const updatedPrefs = {
      ...currentPrefs,
      [STORAGE_KEY]: prefs,
    };

    // Update
    const { error } = await supabase
      .from('profiles')
      .update({ preferences: updatedPrefs })
      .eq('id', userId);

    if (error) {
      console.error('Error saving revealed preferences:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to save revealed preferences:', error);
    return false;
  }
}

/**
 * Migrate preferences to latest version if needed
 */
function migratePreferences(prefs: any): RevealedPreferences {
  // If no version, it's v0 - create fresh
  if (!prefs.version) {
    console.log('Migrating revealed preferences from v0');
    return createEmptyPreferences();
  }

  // Current version - no migration needed
  if (prefs.version === 1) {
    return prefs as RevealedPreferences;
  }

  // Future migrations would go here
  // if (prefs.version === 1) { migrate to v2 }

  return prefs as RevealedPreferences;
}

/**
 * Clear all revealed preferences (reset)
 */
export async function clearRevealedPreferences(userId: string): Promise<boolean> {
  return saveRevealedPreferences(userId, createEmptyPreferences());
}
