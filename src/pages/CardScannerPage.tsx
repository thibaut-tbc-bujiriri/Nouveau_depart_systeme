import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CheckCircle2, Play, Power, ScanLine, XCircle, AlertTriangle, RefreshCw, Mail, Phone, Shield, CreditCard, Info, Keyboard } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AppButton, AppInput } from '@/components/ui';
import { PageHeader } from '@/components/common';
import { extractQrToken, logCardScan, verifyCardByTokenOrNumber, type CardVerification } from '@/services/userCard.service';
import { roleLabels } from '@/lib/permissions';
import type { Role } from '@/types';

const readerId = 'cecnd-card-qr-reader';

const cardStatusStyles: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', text: 'text-emerald-700', label: 'Active' },
  inactive: { bg: 'bg-slate-50 border-slate-200 text-slate-700', text: 'text-slate-700', label: 'Inactive' },
  lost: { bg: 'bg-amber-50 border-amber-200 text-amber-700', text: 'text-amber-700', label: 'Perdue' },
  expired: { bg: 'bg-rose-50 border-rose-200 text-rose-700', text: 'text-rose-700', label: 'Expirée' },
  revoked: { bg: 'bg-rose-100 border-rose-300 text-rose-800', text: 'text-rose-800', label: 'Révoquée' },
};

const userStatusStyles: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', text: 'text-emerald-700', label: 'Actif' },
  inactive: { bg: 'bg-rose-50 border-rose-200 text-rose-700', text: 'text-rose-700', label: 'Inactif' },
};

export function CardScannerPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const resolvingRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraState, setCameraState] = useState<'inactive' | 'starting' | 'scanning' | 'error'>('inactive');
  const [isResolving, setIsResolving] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [result, setResult] = useState<CardVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraErrorDetail, setCameraErrorDetail] = useState<string | null>(null);

  const stopScanner = async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.stop();
    } catch (e) {
      console.warn('Error stopping scanner:', e);
    }
    try {
      scannerRef.current.clear();
    } catch (e) {
      console.warn('Error clearing scanner container:', e);
    }
    scannerRef.current = null;
    setIsScanning(false);
    setCameraState('inactive');
  };

  const resolveToken = async (rawToken: string, notes: string) => {
    if (resolvingRef.current) return;
    const token = extractQrToken(rawToken);
    if (!token) {
      setError('QR code illisible ou format invalide.');
      return;
    }
    resolvingRef.current = true;
    setIsResolving(true);
    setError(null);
    try {
      const verification = await verifyCardByTokenOrNumber(token);
      setResult(verification);

      // Reset input field on manual verification
      setManualToken('');

      try {
        await logCardScan({
          cardId: verification.card?.id ?? null,
          qrToken: token,
          result: verification.result,
          notes,
        });
      } catch (logError) {
        console.error('Failed to write card scan log:', logError);
      }

      if (scannerRef.current) {
        await stopScanner();
      }
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : 'Erreur lors de la vérification.'
      );
    } finally {
      resolvingRef.current = false;
      setIsResolving(false);
    }
  };

  const startScanner = async () => {
    setError(null);
    setResult(null);
    setCameraErrorDetail(null);
    setCameraState('starting');
    setIsScanning(true);

    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(readerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (width, height) => {
              const min = Math.min(width, height);
              const size = Math.floor(min * 0.75);
              return { width: size, height: size };
            }
          },
          (decodedText) => {
            void resolveToken(decodedText, 'Scan caméra');
          },
          () => undefined
        );
        setCameraState('scanning');
      } catch (cameraError) {
        console.error('Camera initialization failed:', cameraError);
        scannerRef.current = null;
        setIsScanning(false);
        setCameraState('error');
        setCameraErrorDetail(
          cameraError instanceof Error
            ? cameraError.message
            : 'Veuillez vérifier les permissions de caméra du navigateur.'
        );
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        void stopScanner();
      }
    };
  }, []);

  const isValid = result?.result === 'valid';

  const getRoleLabel = (role: string) => {
    return roleLabels[role as Role] || role;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMaskedCardNumber = (cardNumber?: string) => {
    if (!cardNumber) return '';
    if (cardNumber.length <= 8) return cardNumber;
    const first = cardNumber.slice(0, 4);
    const last = cardNumber.slice(-4);
    return `${first} •••• ${last}`;
  };

  const getDeactivationDetails = () => {
    if (!result) return { title: 'Carte désactivée', subtitle: 'Cette carte a été désactivée.' };
    switch (result.result) {
      case 'expired':
        return {
          title: 'Carte expirée',
          subtitle: 'Cette carte est expirée. Les informations complètes ne sont pas accessibles.'
        };
      case 'user_inactive':
        return {
          title: 'Utilisateur inactif',
          subtitle: 'Le compte utilisateur lié à cette carte est inactif. Les informations complètes ne sont pas accessibles.'
        };
      case 'invalid':
        return {
          title: 'Carte inconnue',
          subtitle: 'Cette carte n\'existe pas ou le code de vérification est invalide.'
        };
      case 'revoked':
      case 'inactive':
      default:
        return {
          title: 'Carte désactivée',
          subtitle: 'Cette carte a été désactivée. Les informations complètes ne sont pas accessibles.'
        };
    }
  };

  const deactivationInfo = getDeactivationDetails();

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      <PageHeader
        title="Scanner cartes"
        description="Scannez le QR code d’une carte ou saisissez le numéro de carte pour vérifier son authenticité et afficher les informations du titulaire."
      />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-12">
        {/* Left Column: Scanner Panel + Manual Input Panel */}
        <div className="space-y-4 sm:space-y-6 lg:col-span-5">
          {/* Panel 1: Scanner la carte */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <div className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-600 shrink-0">
                <Camera className="size-5" />
              </div>
              <div className="text-left min-w-0">
                <h2 className="text-base font-bold text-slate-800 truncate">Scanner la carte</h2>
                <p className="text-xs text-slate-500 truncate">Placez la carte devant la caméra</p>
              </div>
            </div>

            {/* Camera Viewport Area */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-200/60 flex flex-col items-center justify-center text-center p-3 sm:p-4 min-h-[200px] sm:min-h-[250px] mt-4">
              <div
                id={readerId}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${cameraState === 'scanning' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
              />

              <div className="absolute inset-4 pointer-events-none border-teal-500/80 z-20">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-teal-400 rounded-tl" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-teal-400 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-teal-400 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-teal-400 rounded-br" />
              </div>

              {cameraState === 'inactive' && (
                <div className="space-y-2 text-slate-400 z-10 px-2">
                  <Camera className="mx-auto size-7 sm:size-8 text-slate-500 opacity-60" />
                  <p className="font-semibold text-xs sm:text-sm text-slate-200">La caméra est prête</p>
                  <p className="text-[11px] sm:text-xs text-slate-500 max-w-[200px] mx-auto">
                    Positionnez la carte pour commencer
                  </p>
                </div>
              )}

              {cameraState === 'starting' && (
                <div className="space-y-3 text-slate-400 z-10">
                  <RefreshCw className="mx-auto size-8 animate-spin text-teal-400" />
                  <p className="text-xs sm:text-sm font-semibold text-slate-300">Initialisation de la caméra...</p>
                </div>
              )}

              {cameraState === 'error' && (
                <div className="space-y-3 text-rose-500 z-10 px-3">
                  <AlertTriangle className="mx-auto size-8 sm:size-10" />
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-rose-400">Erreur caméra</p>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-1 line-clamp-3">
                      {cameraErrorDetail || "Impossible d'accéder à la caméra."}
                    </p>
                  </div>
                </div>
              )}

              {cameraState === 'scanning' && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none z-10">
                  <div className="w-[140px] sm:w-[160px] h-[140px] sm:h-[160px] relative">
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-teal-400 shadow-md shadow-teal-400 animate-bounce" style={{ animationDuration: '2.5s' }} />
                  </div>
                  <span className="mt-6 text-[10px] sm:text-xs font-semibold text-white bg-slate-950/80 px-3 py-1 rounded-full backdrop-blur-sm tracking-wider uppercase">
                    Scan en cours...
                  </span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row gap-2.5">
              <AppButton
                onClick={() => void startScanner()}
                disabled={cameraState === 'starting' || cameraState === 'scanning'}
                className="w-full sm:flex-1 bg-teal-600 text-white hover:bg-teal-700"
              >
                <Play className="size-4 mr-1.5" />
                Démarrer le scan
              </AppButton>
              <AppButton
                variant="ghost"
                onClick={() => void stopScanner()}
                disabled={!isScanning}
                className="w-full sm:flex-1 border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 hover:text-rose-700"
              >
                <Power className="size-4 mr-1.5 text-rose-500" />
                Arrêter le scan
              </AppButton>
            </div>

            <div className="mt-3 sm:mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className={`size-2 rounded-full ${cameraState === 'scanning' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-350'}`} />
              <span>{cameraState === 'scanning' ? 'Scanner connecté' : 'Scanner hors ligne'}</span>
            </div>
          </section>

          {/* Panel 2: Vérification Manuelle */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-slate-800 flex items-center gap-2">
              <Keyboard className="size-5 text-teal-600 shrink-0" />
              <span>Vérification manuelle</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <AppInput
                value={manualToken}
                onChange={(event) => setManualToken(event.target.value)}
                placeholder="Ex: N° de carte ou token"
                className="w-full flex-1"
                disabled={isResolving}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualToken.trim()) {
                    void resolveToken(manualToken, 'Vérification manuelle');
                  }
                }}
              />
              <AppButton
                disabled={!manualToken.trim() || isResolving}
                onClick={() => void resolveToken(manualToken, 'Vérification manuelle')}
                isLoading={isResolving}
                className="w-full sm:w-auto shrink-0 bg-slate-900 hover:bg-slate-800"
              >
                Vérifier
              </AppButton>
            </div>
          </section>
        </div>

        {/* Right Column: Result Panel */}
        <div className="lg:col-span-7">
          <section className="h-full rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col justify-start min-h-[350px] sm:min-h-[400px]">
            <h2 className="mb-4 sm:mb-5 text-base font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 text-left">
              <Shield className="size-5 text-teal-600 shrink-0" />
              <span>Résultat de la vérification</span>
            </h2>

            {error && (
              <div className="mb-5 flex gap-3 rounded-xl bg-rose-50 border border-rose-100 p-3.5 sm:p-4 text-xs sm:text-sm text-rose-800 text-left">
                <XCircle className="size-5 shrink-0 text-rose-500 mt-0.5" />
                <div>
                  <h4 className="font-bold">Erreur de vérification</h4>
                  <p className="mt-0.5 font-medium">{error}</p>
                </div>
              </div>
            )}

            {!result && !error && (
              <div className="my-auto py-12 sm:py-20 text-center text-slate-400 flex flex-col items-center justify-center px-2">
                <div className="grid size-14 sm:size-16 place-items-center rounded-2xl bg-slate-50 text-slate-400 mb-4 border border-dashed border-slate-200">
                  <ScanLine className="size-7 sm:size-8" />
                </div>
              </div>
            )}

            {result && (
              <div className="flex-grow flex flex-col justify-between space-y-4">
                {isValid && result.user && result.card ? (
                  <div className="space-y-4 sm:space-y-6 text-left">
                    {/* Status Banner */}
                    <div className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3.5 sm:p-4 text-xs sm:text-sm text-emerald-900">
                      <CheckCircle2 className="size-5 sm:size-6 shrink-0 text-emerald-500 mt-0.5 sm:mt-0" />
                      <div>
                        <h3 className="font-bold text-sm sm:text-base leading-none">Carte vérifiée avec succès</h3>
                        <p className="mt-1 font-medium text-xs sm:text-sm">{result.message}</p>
                      </div>
                    </div>

                    {/* User profile summary */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-slate-50/50 border border-slate-100 p-4 rounded-xl text-center sm:text-left">
                      <div className="size-16 sm:size-20 rounded-full overflow-hidden border border-slate-200/80 bg-slate-100 flex items-center justify-center shrink-0">
                        {result.user.avatarUrl ? (
                          <img
                            src={result.user.avatarUrl}
                            alt={result.user.fullName}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="grid size-full place-items-center bg-slate-800 text-xl sm:text-2xl font-bold text-white uppercase">
                            {result.user.fullName.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('') || '?'}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{result.user.fullName}</h3>
                        <p className="text-xs sm:text-sm font-semibold text-teal-600 mt-0.5">
                          {getRoleLabel(result.user.role)}
                        </p>
                        <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-1.5">
                          {result.user.branchName && (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100">
                              {result.user.branchName}
                            </span>
                          )}
                          {result.user.status && (
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${userStatusStyles[result.user.status]?.bg || 'bg-slate-50 border-slate-200 text-slate-600'
                                }`}
                            >
                              Utilisateur : {userStatusStyles[result.user.status]?.label || result.user.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metadata details list */}
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-100 p-3.5 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Coordonnées</span>
                        <div className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                          <p className="flex items-center gap-2 truncate">
                            <Mail className="size-4 text-slate-400 shrink-0" />
                            <span className="truncate">{result.user.email}</span>
                          </p>
                          <p className="flex items-center gap-2 truncate">
                            <Phone className="size-4 text-slate-400 shrink-0" />
                            <span className="truncate">{result.user.phone || 'Non renseigné'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-100 p-3.5 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Département(s)</span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {result.user.departments && result.user.departments.length > 0 ? (
                            result.user.departments.map((dept, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-100"
                              >
                                {dept}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs sm:text-sm text-slate-500 italic">Aucun département</span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-100 p-3.5 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Informations Carte</span>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-xs sm:text-sm">
                          <div>
                            <span className="text-xs text-slate-400 block">N° de carte</span>
                            <span className="font-semibold text-slate-800 font-mono truncate block">{result.card.cardNumber}</span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 block">Statut Carte</span>
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold border mt-0.5 ${cardStatusStyles[result.card.status]?.bg || 'bg-slate-50 border-slate-200 text-slate-600'
                                }`}
                            >
                              {cardStatusStyles[result.card.status]?.label || result.card.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-100 p-3.5 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Validité & Cycle</span>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-xs sm:text-sm">
                          <div>
                            <span className="text-xs text-slate-400 block">Émise le</span>
                            <span className="font-semibold text-slate-800">{formatDate(result.card.issuedAt)}</span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 block">Expire le</span>
                            <span className="font-semibold text-slate-800">
                              {formatDate(result.card.expiresAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col justify-start text-center space-y-4 sm:space-y-6">
                    <div className="mx-auto grid size-16 sm:size-20 place-items-center rounded-full bg-rose-50 text-rose-500 border border-rose-100/60 mt-2 sm:mt-4 shadow-sm">
                      <AlertTriangle className="size-8 sm:size-10 text-rose-600" />
                    </div>

                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-rose-600 leading-tight">
                        {deactivationInfo.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 font-medium px-2">
                        {deactivationInfo.subtitle}
                      </p>
                    </div>

                    {result.user && result.card && (
                      <div className="w-full max-w-md mx-auto rounded-2xl border border-slate-100 bg-slate-50/50 p-4 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left mt-2">
                        <div className="size-14 rounded-full overflow-hidden border border-slate-200/80 bg-slate-100 flex items-center justify-center shrink-0">
                          {result.user.avatarUrl ? (
                            <img
                              src={result.user.avatarUrl}
                              alt={result.user.fullName}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="grid size-full place-items-center bg-slate-800 text-lg font-bold text-white uppercase">
                              {result.user.fullName.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('') || '?'}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-base truncate">{result.user.fullName}</h4>
                          <p className="text-xs font-semibold text-teal-600 mt-0.5">
                            {getRoleLabel(result.user.role)}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 mt-1.5 font-mono">
                            <CreditCard className="size-3.5 text-slate-400" />
                            <span>Carte n° {getMaskedCardNumber(result.card.cardNumber)}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-auto pt-4 sm:pt-6 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Info className="size-4 shrink-0 text-slate-400" />
                  <span>Pour plus d'informations, contactez l'administration.</span>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}