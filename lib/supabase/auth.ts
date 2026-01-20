import { createClient } from './client';
import type { User, Session } from '@supabase/supabase-js';

export type AuthProvider = 'google' | 'facebook';

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: string | null;
}

export async function signUp(
  email: string,
  password: string,
  fullName?: string
): Promise<AuthResult> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { user: null, session: null, error: error.message };
  }

  return { user: data.user, session: data.session, error: null };
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, session: null, error: error.message };
  }

  return { user: data.user, session: data.session, error: null };
}

export async function signInWithProvider(provider: AuthProvider): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function signOut(): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function getSession(): Promise<Session | null> {
  const supabase = createClient();

  const { data } = await supabase.auth.getSession();

  return data.session;
}

export async function getUser(): Promise<User | null> {
  const supabase = createClient();

  const { data } = await supabase.auth.getUser();

  return data.user;
}

export async function resetPassword(email: string): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  const supabase = createClient();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);

  return subscription;
}
