import { supabase } from '@/lib/supabaseClient';

export type UserCardStatus = 'active' | 'inactive' | 'lost' | 'expired' | 'revoked';
export type CardVerificationResult = 'valid' | 'invalid' | 'expired' | 'revoked' | 'inactive' | 'user_inactive';

export interface UserCard {
  id: string;
  userId: string;
  cardNumber: string;
  qrToken: string;
  status: UserCardStatus;
  issuedAt: string;
  expiresAt: string;
  createdBy?: string | null;
  revokedAt?: string | null;
  revokedBy?: string | null;
  revokedReason?: string | null;
}

export interface CardVerification {
  success: boolean;
  result: CardVerificationResult;
  message: string;
  card?: Pick<UserCard, 'id' | 'cardNumber' | 'status' | 'issuedAt' | 'expiresAt'>;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    avatarUrl?: string | null;
    branchName?: string | null;
    departments: string[];
  };
}

interface UserCardRow {
  id: string;
  user_id: string;
  card_number: string;
  qr_token: string;
  status: UserCardStatus;
  issued_at: string;
  expires_at: string;
  created_by?: string | null;
  revoked_at?: string | null;
  revoked_by?: string | null;
  revoked_reason?: string | null;
}

function mapUserCard(row: UserCardRow): UserCard {
  return {
    id: row.id,
    userId: row.user_id,
    cardNumber: row.card_number,
    qrToken: row.qr_token,
    status: row.status,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    createdBy: row.created_by,
    revokedAt: row.revoked_at,
    revokedBy: row.revoked_by,
    revokedReason: row.revoked_reason,
  };
}

function createSecureToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Vous devez être connecté pour gérer une carte.');
  return data.user.id;
}

export async function getUserCard(userId: string): Promise<UserCard | null> {
  const { data, error } = await supabase
    .from('user_cards')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapUserCard(data as UserCardRow) : null;
}

export async function createUserCard(userId: string): Promise<UserCard> {
  const existing = await getUserCard(userId);
  if (existing) return existing;

  const createdBy = await getCurrentUserId();
  const { data, error } = await supabase
    .from('user_cards')
    .insert({ user_id: userId, qr_token: createSecureToken(), created_by: createdBy })
    .select('*')
    .single();

  if (error) throw error;
  return mapUserCard(data as UserCardRow);
}

export async function regenerateUserCard(cardId: string): Promise<UserCard> {
  const { data, error } = await supabase
    .from('user_cards')
    .update({ qr_token: createSecureToken() })
    .eq('id', cardId)
    .select('*')
    .single();

  if (error) throw error;
  return mapUserCard(data as UserCardRow);
}

export async function revokeUserCard(cardId: string, reason: string, status: 'revoked' | 'inactive' | 'lost' = 'revoked'): Promise<UserCard> {
  const revokedBy = await getCurrentUserId();
  const { data, error } = await supabase
    .from('user_cards')
    .update({
      status,
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy,
      revoked_reason: reason.trim() || null,
    })
    .eq('id', cardId)
    .select('*')
    .single();

  if (error) throw error;
  return mapUserCard(data as UserCardRow);
}

export async function reactivateUserCard(cardId: string): Promise<UserCard> {
  const { data, error } = await supabase
    .from('user_cards')
    .update({ status: 'active', revoked_at: null, revoked_by: null, revoked_reason: null })
    .eq('id', cardId)
    .select('*')
    .single();

  if (error) throw error;
  return mapUserCard(data as UserCardRow);
}

export function extractQrToken(scannedText: string): string {
  const value = scannedText.trim();
  if (!value) return '';

  const verificationUrlMatch = value.match(/\/verify-card\/([^/?#]+)/i);
  if (verificationUrlMatch?.[1]) return decodeURIComponent(verificationUrlMatch[1]);

  return value.replace(/^USER_CARD:/i, '').trim();
}

const verificationMessages: Record<CardVerificationResult, string> = {
  valid: 'Carte vérifiée avec succès.',
  invalid: 'Carte inconnue ou QR code invalide.',
  expired: 'Cette carte est expirée.',
  revoked: 'Cette carte a été révoquée.',
  inactive: 'Cette carte a été désactivée.',
  user_inactive: 'L’utilisateur lié à cette carte est inactif.',
};

export async function verifyCardByToken(qrToken: string): Promise<CardVerification> {
  const normalizedToken = extractQrToken(qrToken);
  if (!normalizedToken) return { success: false, result: 'invalid', message: verificationMessages.invalid };

  const { data, error } = await supabase.rpc('verify_user_card', { p_qr_token: normalizedToken });
  if (error) throw error;

  const verification = data as Omit<CardVerification, 'success' | 'message'>;
  return {
    ...verification,
    success: verification.result === 'valid',
    message: verificationMessages[verification.result] || verificationMessages.invalid,
  };
}

export async function logCardScan({
  cardId,
  qrToken,
  result,
  notes,
}: {
  cardId: string | null;
  qrToken: string;
  result: CardVerificationResult;
  notes?: string;
}): Promise<void> {
  const scannedBy = await getCurrentUserId();
  const { error } = await supabase.from('card_scan_logs').insert({
    card_id: cardId,
    qr_token: extractQrToken(qrToken) || null,
    scanned_by: scannedBy,
    result,
    user_agent: navigator.userAgent,
    notes: notes || null,
  });

  if (error) throw error;
}