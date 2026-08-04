import { AppButton } from '@/components/ui/AppButton';
import { Modal } from '@/components/ui/Modal';
import type { BeforeInstallPromptEvent } from '@/types/pwa';
import { Download, Share, Smartphone } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

const POSTPONE_KEY = 'cecnd-pwa-install-postponed-until';
const POSTPONE_DELAY_MS = 24 * 60 * 60 * 1000;

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as NavigatorWithStandalone).standalone === true;
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function canShowAgain() {
  const postponedUntil = Number(window.localStorage.getItem(POSTPONE_KEY) ?? 0);
  return Number.isNaN(postponedUntil) || Date.now() > postponedUntil;
}

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [installHelp, setInstallHelp] = useState('');
  const isIos = useMemo(() => isIosDevice(), []);

  useEffect(() => {
    const updateServiceWorker = registerSW({ immediate: true });
    updateServiceWorker();
  }, []);

  useEffect(() => {
    if (isStandalone() || !canShowAgain()) {
      return;
    }

    const openTimer = window.setTimeout(() => {
      setIsOpen(true);
    }, 500);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstallHelp('');
      setIsOpen(true);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsOpen(false);
      setInstallHelp('');
      window.localStorage.removeItem(POSTPONE_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.clearTimeout(openTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const postponeInstall = useCallback(() => {
    window.localStorage.setItem(POSTPONE_KEY, String(Date.now() + POSTPONE_DELAY_MS));
    setIsOpen(false);
  }, []);

  const installApp = useCallback(async () => {
    if (!installPrompt) {
      setInstallHelp(
        isIos
          ? 'Sur iPhone ou iPad, utilisez le bouton de partage du navigateur puis choisissez "Ajouter a l\'ecran d\'accueil".'
          : 'Le navigateur n\'a pas encore rendu le prompt disponible. Verifiez que vous ouvrez l\'app en HTTPS ou sur localhost, puis utilisez aussi l\'icone d\'installation dans la barre d\'adresse si elle apparait.',
      );
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (choice.outcome === 'accepted') {
      setIsOpen(false);
      setInstallHelp('');
      window.localStorage.removeItem(POSTPONE_KEY);
      return;
    }

    postponeInstall();
  }, [installPrompt, isIos, postponeInstall]);

  if (isStandalone()) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={postponeInstall} title="Installer CECND" subtitle="Acces rapide depuis votre appareil" className="max-w-md">
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <span className="mt-0.5 rounded-lg bg-slate-900 p-2 text-white">
            <Smartphone className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-slate-900">Gardez l'application sous la main.</p>
            <p className="mt-1 text-sm text-slate-600">
              L'installation ajoute CECND a l'ecran d'accueil et permet une ouverture plus rapide, comme une application native.
            </p>
          </div>
        </div>

        {(!installPrompt || installHelp) && (
          <div className="rounded-lg border border-sky-100 bg-sky-50 p-4 text-sm text-slate-700">
            {installHelp ? (
              <p>{installHelp}</p>
            ) : isIos ? (
              <p className="flex gap-2">
                <Share className="mt-0.5 size-4 shrink-0 text-sky-700" />
                Sur iPhone ou iPad, ouvrez le menu de partage puis choisissez "Ajouter a l'ecran d'accueil".
              </p>
            ) : (
              <p>Le bouton d'installation sera actif des que le navigateur confirme que l'application est installable.</p>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AppButton variant="secondary" onClick={postponeInstall}>
            Installer plus tard
          </AppButton>
          <AppButton onClick={installApp}>
            <Download className="size-4" />
            Installer
          </AppButton>
        </div>
      </div>
    </Modal>
  );
}
