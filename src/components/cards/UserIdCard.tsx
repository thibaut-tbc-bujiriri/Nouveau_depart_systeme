import { QRCodeSVG } from 'qrcode.react';
import { Calendar, CreditCard, MapPin, ShieldCheck, Mail, Phone, Globe, User, Shield, AlertTriangle } from 'lucide-react';
import logoUrl from '@/assets/ecdn_logo.png';
import type { UserCard } from '@/services/userCard.service';
import './user-id-card.css';

export interface CardHolder {
  id: string;
  fullName: string;
  role: string;
  branchName?: string | null;
  departments?: string[];
  avatarUrl?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface UserIdCardProps {
  user: CardHolder;
  card: UserCard;
}

const roleLabels: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrateur',
  department_manager: 'Responsable département',
  department_member: 'Membre département',
};

const statusLabels: Record<UserCard['status'], string> = {
  active: 'Actif',
  inactive: 'Inactif',
  lost: 'Perdu',
  expired: 'Expiré',
  revoked: 'Révoqué',
};

const formatDate = (value: string) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(value)
  );
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';

export function UserIdCard({ user, card }: UserIdCardProps) {
  const isSuperAdmin = user.role === 'superadmin';
  const isAdmin = user.role === 'admin';
  
  const departmentText = user.departments?.filter(Boolean).join(', ') || 'Non affecté';
  const qrValue = `USER_CARD:${card.qrToken}`;
  const roleLabel = roleLabels[user.role] || user.role;

  return (
    <div className="user-id-card-pair">
      {/* FRONT OF THE CARD */}
      <section className="user-id-card user-id-card--front" aria-label={`Recto de la carte de ${user.fullName}`}>
        {/* Top Wave Banner */}
        <div className="id-card-header-banner">
          <div className="id-card-logo-container">
            <img src={logoUrl} alt="CECND Logo" className="id-card-logo-img" />
          </div>
          <p className="id-card-org-subtitle">COMMUNAUTÉ DES ÉGLISES CHRÉTIENNES POUR LE NOUVEAU DÉPART</p>
          <h1 className="id-card-org-title">CECND</h1>
          <div className="id-card-type-tag">
            <span>Carte d'identification utilisateur</span>
          </div>
        </div>

        {/* User Profile Info Section */}
        <div className="id-card-profile-section">
          {/* Photo */}
          <div className="id-card-photo-wrapper">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="id-card-photo-img" />
            ) : (
              <span className="id-card-initials">{initials(user.fullName)}</span>
            )}
          </div>

          {/* Name and Badge */}
          <div className="id-card-name-wrapper">
            <h2 className="id-card-user-name">{user.fullName}</h2>
            
            <div className="id-card-badges">
              {/* Role Badge */}
              <span className="id-card-badge-role">
                <User size={10} className="inline mr-1 shrink-0" />
                {roleLabel}
              </span>
              
              {/* ACCÈS GLOBAL (Super Admin) Badge */}
              {isSuperAdmin && (
                <span className="id-card-badge-access bg-teal-600 text-white">
                  <Globe size={10} className="inline mr-1 shrink-0" />
                  ACCÈS GLOBAL
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details and QR Code Area Split */}
        <div className="id-card-bottom-grid">
          {/* Details list */}
          <div className="id-card-info-list">
            {/* Extension: hide if superadmin */}
            {!isSuperAdmin && user.branchName && (
              <div className="id-card-info-item">
                <div className="id-card-icon bg-cyan-100 text-cyan-800">
                  <MapPin size={10} />
                </div>
                <div className="id-card-text">
                  <span className="id-card-label">Extension :</span>
                  <span className="id-card-value font-bold">{user.branchName}</span>
                </div>
              </div>
            )}

            {/* Department: hide if superadmin or admin */}
            {!isSuperAdmin && !isAdmin && user.departments && user.departments.length > 0 && (
              <div className="id-card-info-item">
                <div className="id-card-icon bg-emerald-100 text-emerald-800">
                  <CreditCard size={10} />
                </div>
                <div className="id-card-text">
                  <span className="id-card-label">Département :</span>
                  <span className="id-card-value">{departmentText}</span>
                </div>
              </div>
            )}

            {/* N° de carte */}
            <div className="id-card-info-item">
              <div className="id-card-icon bg-blue-100 text-blue-800">
                <ShieldCheck size={10} />
              </div>
              <div className="id-card-text">
                <span className="id-card-label">N° de carte :</span>
                <span className="id-card-value font-mono">{card.cardNumber}</span>
              </div>
            </div>

            {/* Statut */}
            <div className="id-card-info-item">
              <div className="id-card-icon bg-slate-100 text-slate-800">
                <Shield size={10} />
              </div>
              <div className="id-card-text">
                <span className="id-card-label">Statut :</span>
                <span className={`id-card-value font-bold ${
                  card.status === 'active' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {statusLabels[card.status]}
                </span>
              </div>
            </div>

            {/* Date émission */}
            <div className="id-card-info-item">
              <div className="id-card-icon bg-indigo-100 text-indigo-800">
                <Calendar size={10} />
              </div>
              <div className="id-card-text">
                <span className="id-card-label">Date d'émission :</span>
                <span className="id-card-value">{formatDate(card.issuedAt)}</span>
              </div>
            </div>

            {/* Date expiration */}
            <div className="id-card-info-item">
              <div className="id-card-icon bg-purple-100 text-purple-800">
                <Calendar size={10} />
              </div>
              <div className="id-card-text">
                <span className="id-card-label">Date d'expiration :</span>
                <span className="id-card-value">{formatDate(card.expiresAt)}</span>
              </div>
            </div>

            {/* Email */}
            {user.email && (
              <div className="id-card-info-item">
                <div className="id-card-icon bg-amber-100 text-amber-800">
                  <Mail size={10} />
                </div>
                <div className="id-card-text">
                  <span className="id-card-label">Email :</span>
                  <span className="id-card-value truncate max-w-[130px] inline-block align-bottom">{user.email}</span>
                </div>
              </div>
            )}

            {/* Téléphone */}
            {user.phone && (
              <div className="id-card-info-item">
                <div className="id-card-icon bg-rose-100 text-rose-800">
                  <Phone size={10} />
                </div>
                <div className="id-card-text">
                  <span className="id-card-label">Téléphone :</span>
                  <span className="id-card-value font-mono">{user.phone}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right QR Area */}
          <div className="id-card-right-qr">
            {/* Box extension indicator */}
            {!isSuperAdmin && user.branchName ? (
              <div className="id-card-extension-box">
                <div className="id-card-extension-hdr">Affecté à l'extension</div>
                <div className="id-card-extension-val">{user.branchName}</div>
              </div>
            ) : (
              <div className="id-card-extension-box-empty" />
            )}

            {/* QR SVG */}
            <div className="id-card-qr-frame">
              <QRCodeSVG value={qrValue} size={70} level="M" includeMargin />
            </div>
            
            {/* Front verification label */}
            <div className="id-card-qr-footer-text">
              SCANNEZ POUR VÉRIFIER
            </div>
          </div>
        </div>

        {/* Autorisé par footer */}
        <div className="id-card-footer-auth">
          <ShieldCheck size={14} className="inline mr-1 text-teal-400 shrink-0" />
          <span>Autorisé par : <strong>Le Secrétariat Général</strong></span>
        </div>
      </section>

      {/* BACK OF THE CARD */}
      <section className="user-id-card user-id-card--back" aria-label={`Verso de la carte de ${user.fullName}`}>
        {/* Header Wave Banner */}
        <div className="id-card-header-banner">
          <div className="id-card-logo-container">
            <img src={logoUrl} alt="CECND Logo" className="id-card-logo-img" />
          </div>
          <h1 className="id-card-org-title">CECND</h1>
          <p className="id-card-org-subtitle-back">COMMUNAUTÉ DES ÉGLISES CHRÉTIENNES POUR LE NOUVEAU DÉPART</p>
        </div>

        {/* Back Content Guidelines */}
        <div className="id-card-back-guidelines">
          <div className="id-card-guideline-item">
            <div className="id-card-guideline-icon">
              <ShieldCheck size={14} />
            </div>
            <div className="id-card-guideline-content">
              <h3>VÉRIFICATION INTERNE</h3>
              <p>Cette carte est la propriété de la CECND et doit être présentée sur demande pour toute vérification interne.</p>
            </div>
          </div>

          <div className="id-card-guideline-item">
            <div className="id-card-guideline-icon">
              <User size={14} />
            </div>
            <div className="id-card-guideline-content">
              <h3>CONTACT ADMINISTRATION</h3>
              <p>Pour toute question ou mise à jour, veuillez contacter le Secrétariat Général :</p>
              <p className="font-semibold text-teal-600 mt-0.5">{user.email || 'secretariat@cecnd.org'}</p>
              <p className="font-semibold text-teal-600">{user.phone || '+243 999 111 222'}</p>
            </div>
          </div>

          <div className="id-card-guideline-item">
            <div className="id-card-guideline-icon">
              <AlertTriangle size={14} />
            </div>
            <div className="id-card-guideline-content">
              <h3>PERTE OU VOL</h3>
              <p>En cas de perte ou de vol, veuillez en informer immédiatement l'administration. Toute utilisation non autorisée est strictement interdite.</p>
            </div>
          </div>
        </div>

        {/* Back QR and details split */}
        <div className="id-card-back-footer-grid">
          <div className="id-card-back-instructions">
            <div className="id-card-back-instructions-icon">
              <QRCodeSVG value={qrValue} size={40} level="M" />
            </div>
            <p>Scannez ce QR code pour vérifier l'authenticité de cette carte en ligne.</p>
          </div>
          
          <div className="id-card-back-qr-box">
            <QRCodeSVG value={qrValue} size={60} level="M" includeMargin />
          </div>
        </div>

        {/* Footer Contacts */}
        <div className="id-card-back-footer-bar">
          <span>www.cecnd.org</span>
          <span className="mx-1">•</span>
          <span>contact@cecnd.org</span>
          <span className="mx-1">•</span>
          <span>+243 81 555 1234</span>
        </div>
      </section>
    </div>
  );
}