import { supabase } from '@/lib/supabaseClient';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
}

export async function resetPasswordForEmail(email: string) {
  return supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: window.location.origin,
  });
}

export async function updateCurrentUserPassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

