import { useState, useEffect } from 'react';
import { BookOpen, Edit3, Trash2, PlusCircle, Quote, Sparkles } from 'lucide-react';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { Modal, AppButton, AppInput, AppTextarea, ConfirmDialog, useToast } from '@/components/ui';
import { getActiveDailyVerse, publishDailyVerse, updateDailyVerse, deactivateDailyVerse } from '@/services/dailyVerseService';
import type { DailyVerse } from '@/services/dailyVerseService';
import type { Profile } from '@/types';

interface DailyVerseCardProps {
  user: Profile;
}

export function DailyVerseCard({ user }: DailyVerseCardProps) {
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmDeactivateOpen, setIsConfirmDeactivateOpen] = useState(false);

  // Form states
  const [verseReference, setVerseReference] = useState('');
  const [verseText, setVerseText] = useState('');
  const [inspirationalMessage, setInspirationalMessage] = useState('');
  const toast = useToast();

  const loadActiveVerse = async () => {
    try {
      setIsLoading(true);
      const activeVerse = await getActiveDailyVerse();
      setVerse(activeVerse);
      if (activeVerse) {
        setVerseReference(activeVerse.verseReference);
        setVerseText(activeVerse.verseText);
        setInspirationalMessage(activeVerse.inspirationalMessage || '');
      } else {
        setVerseReference('');
        setVerseText('');
        setInspirationalMessage('');
      toast.success('Verset d?sactiv? avec succ?s.');
      }
    } catch (err) {
      console.error("Failed to load active daily verse:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadActiveVerse();
  }, []);

  const handleOpenPublishModal = () => {
    if (verse) {
      setVerseReference(verse.verseReference);
      setVerseText(verse.verseText);
      setInspirationalMessage(verse.inspirationalMessage || '');
    } else {
      setVerseReference('');
      setVerseText('');
      setInspirationalMessage('');
    }
    setIsModalOpen(true);
  };

  const handlePublishOrSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verseReference.trim() || !verseText.trim()) {
      toast.error('La r?f?rence biblique et le texte du verset sont obligatoires.');
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        verseReference: verseReference.trim(),
        verseText: verseText.trim(),
        inspirationalMessage: inspirationalMessage.trim() || undefined
      };

      if (verse) {
        // Edit existing active verse
        const updated = await updateDailyVerse(verse.id, payload, user);
        setVerse(updated);
      } else {
        // Publish new active verse
        const published = await publishDailyVerse(payload, user);
        setVerse(published);
      }

      toast.success(verse ? 'Verset modifi? avec succ?s.' : 'Verset publi? avec succ?s.');
      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error("Error saving daily verse:", err);
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = () => {
    if (!verse) return;
    setIsConfirmDeactivateOpen(true);
  };

  const confirmDeactivate = async () => {
    if (!verse) return;
    try {
      setIsLoading(true);
      await deactivateDailyVerse(verse.id, user);
      setVerse(null);
      setVerseReference('');
      setVerseText('');
      setInspirationalMessage('');
    } catch (err) {
      console.error("Error deactivating daily verse:", err);
      toast.error('D?sactivation impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  const isSuperAdmin = user.role === 'superadmin';

  if (isLoading) {
    return (
      <div className="animate-pulse bg-slate-50 border border-slate-100 rounded-2xl h-32 flex items-center justify-center text-xs text-slate-400">
        Chargement du focus spirituel...
      </div>
    );
  }

  // Hide the card if no active verse exists and user is not Super Admin
  if (!verse && !isSuperAdmin) {
    return null;
  }

  return (
    <>
      <SectionCard className="bg-gradient-to-br from-emerald-50/60 via-slate-50/50 to-teal-50/40 relative border border-slate-100 shadow-sm overflow-hidden p-5">
        {/* Subtle background Bible graphic */}
        <div className="absolute right-4 bottom-2 opacity-5 pointer-events-none">
          <BookOpen className="size-48 text-emerald-900" />
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            {/* Header and indicator */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                <BookOpen className="size-3" />
                Verset du jour
              </span>
              {verse && (
                <span className="text-[10px] text-slate-400 font-medium">
                  Publié aujourd'hui
                </span>
              )}
            </div>

            {verse ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Reference and verse text */}
                <div className="md:col-span-2 space-y-2 bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-emerald-100/50 shadow-sm relative">
                  <Quote className="absolute right-3 top-3 size-12 text-emerald-100 pointer-events-none" />
                  <p className="text-sm font-bold text-emerald-900">{verse.verseReference}</p>
                  <p className="text-slate-700 text-sm italic font-medium leading-relaxed">
                    « {verse.verseText} »
                  </p>
                </div>

                {/* Inspirational message */}
                {verse.inspirationalMessage && (
                  <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-teal-100/50 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 uppercase tracking-wider mb-2">
                      <Sparkles className="size-3.5 text-teal-600" />
                      Message Inspirant
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed font-medium">
                      {verse.inspirationalMessage}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2">
                <p className="text-sm font-medium text-slate-500">
                  Aucun verset du jour n'est actuellement publié.
                </p>
              </div>
            )}
          </div>

          {/* Super Admin Control Buttons */}
          {isSuperAdmin && (
            <div className="flex sm:flex-row md:flex-col gap-2 shrink-0 self-end md:self-start">
              <AppButton
                onClick={handleOpenPublishModal}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {verse ? <Edit3 className="size-3.5 mr-1.5" /> : <PlusCircle className="size-3.5 mr-1.5" />}
                {verse ? "Modifier" : "Publier un verset"}
              </AppButton>
              {verse && (
                <AppButton
                  onClick={handleDeactivate}
                  variant="secondary"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50 border-rose-100 font-bold"
                >
                  <Trash2 className="size-3.5 mr-1.5" />
                  Désactiver
                </AppButton>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      {/* Publish/Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={verse ? "Modifier le verset du jour" : "Publier un verset du jour"}
          className="max-w-xl"
        >
          <form onSubmit={handlePublishOrSave} className="space-y-4">

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Référence biblique *</label>
              <AppInput
                value={verseReference}
                onChange={(e) => setVerseReference(e.target.value)}
                placeholder="Ex : Philippiens 4:13"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Texte du verset *</label>
              <AppTextarea
                value={verseText}
                onChange={(e) => setVerseText(e.target.value)}
                placeholder="Ex : Je puis tout par celui qui me fortifie."
                rows={3}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Message inspirant (Optionnel)</label>
              <AppTextarea
                value={inspirationalMessage}
                onChange={(e) => setInspirationalMessage(e.target.value)}
                placeholder="Ex : Que cette parole vous fortifie tout au long de cette journée."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-y border-slate-100 text-xs">
              <span className="font-bold text-slate-700">Durée d'affichage</span>
              <span className="font-extrabold text-emerald-700 uppercase tracking-wider">24 heures</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <AppButton
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Annuler
              </AppButton>
              <AppButton
                type="submit"
                isLoading={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {verse ? "Enregistrer" : "Publier"}
              </AppButton>
            </div>
          </form>
        </Modal>
      )}
      <ConfirmDialog
        isOpen={isConfirmDeactivateOpen}
        title="Désactiver le focus spirituel"
        description="Voulez-vous vraiment désactiver le verset du jour ? Il ne sera plus visible sur les dashboards."
        confirmLabel="Désactiver"
        onCancel={() => setIsConfirmDeactivateOpen(false)}
        onConfirm={async () => {
          setIsConfirmDeactivateOpen(false);
          await confirmDeactivate();
        }}
      />
    </>
  );
}
