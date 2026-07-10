import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Printer, QrCode, RefreshCw, ShieldOff, ShieldCheck } from 'lucide-react';
import { AppButton, AppInput } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { UserIdCard, type CardHolder } from './UserIdCard';
import { createUserCard, getUserCard, reactivateUserCard, regenerateUserCard, revokeUserCard, type UserCard } from '@/services/userCard.service';
import type { ManagedUser } from '@/services/users.service';

interface UserCardModalProps { isOpen: boolean; onClose: () => void; user: ManagedUser | null; branchName?: string; departmentNames: string[]; }

export function UserCardModal({ isOpen, onClose, user, branchName, departmentNames }: UserCardModalProps) {
  const [card, setCard] = useState<UserCard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen || !user) return;
    let cancelled = false;
    setIsLoading(true); setError(null); setCard(null); setReason('');
    void getUserCard(user.id).then((loaded) => { if (!cancelled) setCard(loaded); }).catch((loadError: unknown) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Impossible de charger cette carte.');
    }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, user]);

  const holder = useMemo<CardHolder | null>(() => user ? ({ id: user.id, fullName: user.fullName, role: user.role, branchName, departments: departmentNames, avatarUrl: user.avatarUrl, phone: user.phone, email: user.email }) : null, [user, branchName, departmentNames]);
  const execute = async (operation: () => Promise<UserCard>) => {
    setIsSaving(true); setError(null);
    try { setCard(await operation()); } catch (operationError) { setError(operationError instanceof Error ? operationError.message : 'Opération impossible.'); } finally { setIsSaving(false); }
  };
  const handlePrint = () => requestAnimationFrame(() => requestAnimationFrame(() => window.print()));

  return <Modal isOpen={isOpen} onClose={onClose} title={user ? `Carte d’identification — ${user.fullName}` : 'Carte d’identification'} subtitle="Document officiel CECND" className="max-w-6xl id-card-modal">
    <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-5">
      <div>{card ? <span className={`rounded-full px-3 py-1 text-xs font-bold ${card.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>Carte {card.status === 'active' ? 'active' : card.status}</span> : <span className="text-sm text-slate-500">Aucune carte générée</span>}</div>
      <div className="flex flex-wrap gap-2">
        {!card && <AppButton size="sm" disabled={isLoading || isSaving || !user} onClick={() => user && void execute(() => createUserCard(user.id))}><QrCode className="size-4" /> Générer la carte</AppButton>}
        {card && <><AppButton size="sm" variant="secondary" disabled={isSaving} onClick={() => void execute(() => regenerateUserCard(card.id))}><RefreshCw className="size-4" /> Régénérer le QR</AppButton><AppButton size="sm" variant="secondary" onClick={handlePrint}><Printer className="size-4" /> Imprimer recto / verso</AppButton></>}
      </div>
    </div>
    {card?.status === 'active' && <div className="no-print flex gap-2 mb-4"><AppInput value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motif de désactivation (facultatif)" /><AppButton size="sm" variant="danger" disabled={isSaving} onClick={() => void execute(() => revokeUserCard(card.id, reason, 'inactive'))}><ShieldOff className="size-4" /> Désactiver</AppButton></div>}
    {card && card.status !== 'active' && <div className="no-print mb-4"><AppButton size="sm" disabled={isSaving} onClick={() => void execute(() => reactivateUserCard(card.id))}><ShieldCheck className="size-4" /> Réactiver la carte</AppButton></div>}
    {error && <p className="no-print mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"><AlertTriangle className="size-4" /> {error}</p>}
    {isLoading ? <p className="py-12 text-center text-sm text-slate-500">Chargement de la carte…</p> : card && holder ? <div className="id-card-print-area"><UserIdCard user={holder} card={card} /></div> : <div className="no-print rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Générez une carte pour afficher l’aperçu officiel et son QR code.</div>}
  </Modal>;
}