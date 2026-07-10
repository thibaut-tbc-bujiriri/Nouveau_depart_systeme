import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CheckCircle2, Play, Power, ScanLine, XCircle, AlertTriangle, RefreshCw, Mail, Phone, Shield, CreditCard, Info, Keyboard } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AppButton, AppInput } from '@/components/ui';
import { PageHeader } from '@/components/common';
import { extractQrToken, logCardScan, verifyCardByToken, type CardVerification } from '@/services/userCard.service';
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
      setError('QR code illisible ou format de token invalide.');
      return;
    }
    resolvingRef.current = true;
    setError(null);
    try {
      const verification = await verifyCardByToken(token);
      setResult(verification);
      
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
          : 'Erreur lors de la vérification Supabase.'
      );
    } finally {
      resolvingRef.current = false;
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

  // Mask function for card numbers
  const getMaskedCardNumber = (cardNumber?: string) => {
    if (!cardNumber) return '';
    if (cardNumber.length <= 8) return cardNumber;
    const first = cardNumber.slice(0, 4);
    const last = cardNumber.slice(-4);
    return `${first} •••• ${last}`;
  };

  // Details for deactivation warning
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
          subtitle: 'Cette carte n\'existe pas ou le code QR est invalide. Les informations complètes ne sont pas accessibles.'
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
    <div className="space-y-6">
      <PageHeader 
        title="Scanner cartes" 
        description="Scannez le QR code d’une carte utilisateur pour vérifier son authenticité et afficher les informations du titulaire." 
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Scanner Panel + Manual Input Panel */}
        <div className="space-y-6 lg:col-span-5">
          {/* Panel 1: Scanner la carte */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <div className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-600">
                <Camera className="size-5" />
              </div>
              <div className="text-left">
                <h2 className="text-base font-bold text-slate-800">Scanner la carte</h2>
                <p className="text-xs text-slate-500">Placez la carte devant la caméra</p>
              </div>
            </div>

            {/* Camera Viewport Area */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-200/60 flex flex-col items-center justify-center text-center p-4 min-h-[250px] mt-4">
              {/* HTML5 QR Code Container */}
              <div 
                id={readerId} 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  cameraState === 'scanning' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />

              {/* Viewport Corner Markers [ ] */}
              <div className="absolute inset-4 pointer-events-none border-teal-500/80 z-20">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-teal-400 rounded-tl" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-teal-400 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-teal-400 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-teal-400 rounded-br" />
              </div>

              {/* Inactive State Overlay */}
              {cameraState === 'inactive' && (
                <div className="space-y-2 text-slate-400 z-10">
                  <Camera className="mx-auto size-8 text-slate-500 opacity-60" />
                  <p className="font-semibold text-sm text-slate-200">La caméra est prête</p>
                  <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
                    Positionnez la carte pour commencer
                  </p>
                </div>
              )}

              {/* Starting State Overlay */}
              {cameraState === 'starting' && (
                <div className="space-y-3 text-slate-400 z-10">
                  <RefreshCw className="mx-auto size-8 animate-spin text-teal-400" />
                  <p className="text-sm font-semibold text-slate-300">Initialisation de la caméra...</p>
                </div>
              )}

              {/* Error State Overlay */}
              {cameraState === 'error' && (
                <div className="space-y-3 text-rose-500 z-10 px-4">
                  <AlertTriangle className="mx-auto size-10" />
                  <div>
                    <p className="font-bold text-sm text-rose-400">Erreur caméra</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-3">
                      {cameraErrorDetail || "Impossible d'accéder à la caméra. Vérifiez vos autorisations."}
                    </p>
                  </div>
                </div>
              )}

              {/* Scanning Active Overlay Indicator (only shown while scanning) */}
              {cameraState === 'scanning' && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none z-10">
                  <div className="w-[160px] h-[160px] relative">
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-teal-400 shadow-md shadow-teal-400 animate-bounce" style={{ animationDuration: '2.5s' }} />
                  </div>
                  <span className="mt-8 text-xs font-semibold text-white bg-slate-950/80 px-3 py-1 rounded-full backdrop-blur-sm tracking-wider uppercase">
                    Scan en cours...
                  </span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="mt-5 flex flex-wrap gap-3">
              <AppButton 
                onClick={() => void startScanner()}
                disabled={cameraState === 'starting' || cameraState === 'scanning'}
                className="flex-1 bg-teal-600 text-white hover:bg-teal-700 animate-none"
              >
                <Play className="size-4 mr-1.5" />
                Démarrer le scan
              </AppButton>
              <AppButton 
                variant="ghost"
                onClick={() => void stopScanner()}
                disabled={!isScanning}
                className="flex-1 border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 hover:text-rose-700"
              >
                <Power className="size-4 mr-1.5 text-rose-500" />
                Arrêter le scan
              </AppButton>
            </div>

            {/* Scanner connection state */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className={`size-2 rounded-full ${cameraState === 'scanning' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-350'}`} />
              <span>{cameraState === 'scanning' ? 'Scanner connecté' : 'Scanner hors ligne'}</span>
            </div>
          </section>

          {/* Panel 2: Vérification Manuelle */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-slate-800 flex items-center gap-2">
              <Keyboard className="size-5 text-teal-600" />
              Vérification manuelle
            </h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <AppInput 
                value={manualToken} 
                onChange={(event) => setManualToken(event.target.value)} 
                placeholder="USER_CARD:abc123... ou token" 
                className="flex-1"
                disabled={resolvingRef.current}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualToken.trim()) {
                    void resolveToken(manualToken, 'Vérification manuelle');
                  }
                }}
              />
              <AppButton 
                disabled={!manualToken.trim() || resolvingRef.current} 
                onClick={() => void resolveToken(manualToken, 'Vérification manuelle')}
                isLoading={resolvingRef.current}
                className="shrink-0 bg-slate-900 hover:bg-slate-800"
              >
                Vérifier
              </AppButton>
            </div>
          </section>
        </div>

        {/* Right Column: Result Panel */}
        <div className="lg:col-span-7">
          <section className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-start min-h-[400px]">
            <h2 className="mb-5 text-base font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 text-left">
              <Shield className="size-5 text-teal-600" />
              Résultat de la vérification
            </h2>

            {/* Error Message */}
            {error && (
              <div className="mb-5 flex gap-3 rounded-xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-800 text-left">
                <XCircle className="size-5 shrink-0 text-rose-500 mt-0.5" />
                <div>
                  <h4 className="font-bold">Erreur de scan</h4>
                  <p className="mt-0.5 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* No result and no error */}
            {!result && !error && (
              <div className="my-auto py-20 text-center text-slate-400 flex flex-col items-center justify-center">
                <div className="grid size-16 place-items-center rounded-2xl bg-slate-50 text-slate-400 mb-4 border border-dashed border-slate-200">
                  <ScanLine className="size-8" />
                </div>
                <h3 className="font-semibold text-slate-700">En attente d'une carte</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Scannez un QR code à l'aide de la caméra ou saisissez le token manuellement ci-contre pour afficher les informations de vérification.
                </p>
              </div>
            )}

            {/* Verification Result Display */}
            {result && (
              <div className="flex-grow flex flex-col justify-between">
                {/* ACTIVE CARD PATH: DISPLAY FULL INFORMATION */}
                {isValid && result.user && result.card ? (
                  <div className="space-y-6 text-left">
                    {/* Status Banner */}
                    <div className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
                      <CheckCircle2 className="size-6 shrink-0 text-emerald-500" />
                      <div>
                        <h3 className="font-bold text-base leading-none">Carte vérifiée avec succès</h3>
                        <p className="mt-1 font-medium">{result.message}</p>
                      </div>
                    </div>

                    {/* User profile summary */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50/50 border border-slate-100 p-4 rounded-xl">
                      {/* Avatar */}
                      <div className="size-20 rounded-full overflow-hidden border border-slate-200/80 bg-slate-100 flex items-center justify-center shrink-0">
                        {result.user.avatarUrl ? (
                          <img 
                            src={result.user.avatarUrl} 
                            alt={result.user.fullName} 
                            className="size-full object-cover" 
                          />
                        ) : (
                          <div className="grid size-full place-items-center bg-slate-800 text-2xl font-bold text-white uppercase">
                            {result.user.fullName.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('') || '?'}
                          </div>
                        )}
                      </div>

                      {/* Header details */}
                      <div className="text-center sm:text-left">
                        <h3 className="text-lg font-bold text-slate-900">{result.user.fullName}</h3>
                        <p className="text-sm font-semibold text-teal-600 mt-0.5">
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
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                                userStatusStyles[result.user.status]?.bg || 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              Utilisateur : {userStatusStyles[result.user.status]?.label || result.user.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metadata details list */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-100 p-3.5 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Coordonnées</span>
                        <div className="space-y-1.5 text-sm text-slate-700">
                          <p className="flex items-center gap-2 truncate">
                            <Mail className="size-4 text-slate-400 shrink-0" />
                            <span className="truncate">{result.user.email}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="size-4 text-slate-400 shrink-0" />
                            <span>{result.user.phone || 'Non renseigné'}</span>
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
                            <span className="text-sm text-slate-500 italic">Aucun département</span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-100 p-3.5 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Informations Carte</span>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-xs text-slate-400 block">N° de carte</span>
                            <span className="font-semibold text-slate-800 font-mono">{result.card.cardNumber}</span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 block">Statut Carte</span>
                            <span 
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold border ${
                                cardStatusStyles[result.card.status]?.bg || 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              {cardStatusStyles[result.card.status]?.label || result.card.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-100 p-3.5 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Validité & Cycle</span>
                        <div className="grid grid-cols-2 gap-2 text-sm">
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
                  /* DEACTIVATED OR EXPIRED CARD PATH: SECURE / PRIVACY MODE (mockup 3 style) */
                  <div className="flex-grow flex flex-col justify-start text-center space-y-6">
                    {/* Big alert icon */}
                    <div className="mx-auto grid size-20 place-items-center rounded-full bg-rose-50 text-rose-500 border border-rose-100/60 mt-4 shadow-sm">
                      <AlertTriangle className="size-10 text-rose-600" />
                    </div>

                    {/* Bold Warning State Title */}
                    <div>
                      <h3 className="text-2xl font-bold text-rose-600 leading-tight">
                        {deactivationInfo.title}
                      </h3>
                      <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 font-medium">
                        {deactivationInfo.subtitle}
                      </p>
                    </div>

                    {/* Limited details card snippet (if user is resolved) */}
                    {result.user && result.card && (
                      <div className="w-full max-w-md mx-auto rounded-2xl border border-slate-100 bg-slate-50/50 p-4 flex items-center gap-4 text-left mt-2">
                        {/* Photo */}
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

                        {/* Name and role */}
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-base truncate">{result.user.fullName}</h4>
                          <p className="text-xs font-semibold text-teal-600 mt-0.5">
                            {getRoleLabel(result.user.role)}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5 font-mono">
                            <CreditCard className="size-3.5 text-slate-400" />
                            <span>Carte n° {getMaskedCardNumber(result.card.cardNumber)}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom info banner (always shown) */}
                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
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