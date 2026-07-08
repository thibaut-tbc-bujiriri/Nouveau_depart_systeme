import logoUrl from '@/assets/ecdn_logo.png';
import type { Profile } from '@/types';

interface ReportHeaderProps {
  title: string;
  scope: 'global' | 'extension' | 'department' | 'personal';
  branchName?: string;
  departmentName?: string;
  period?: string;
  currentUser: Profile;
}

export function ReportHeader({
  title,
  scope,
  branchName,
  departmentName,
  period = 'Toutes les périodes',
  currentUser,
}: ReportHeaderProps) {
  const todayStr = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const roleLabels: Record<string, string> = {
    superadmin: 'Super Admin',
    admin: 'Administrateur',
    department_manager: 'Responsable Département',
    department_member: 'Membre Département',
  };

  const getContextText = () => {
    switch (scope) {
      case 'global':
        return 'Toutes les extensions';
      case 'extension':
        return `Extension : ${branchName || 'Non spécifiée'}`;
      case 'department':
        return `Extension : ${branchName || 'Non spécifiée'} — Département : ${departmentName || 'Non spécifié'}`;
      case 'personal':
        return `Rapport Personnel — ${currentUser.fullName}`;
      default:
        return 'Toutes les extensions';
    }
  };

  return (
    <div className="border-b-2 border-slate-800 pb-4 mb-6 print:pb-2 print:mb-4">
      {/* Logos and main institution header */}
      <div className="flex items-center justify-between gap-4 mb-4 print:mb-2">
        <img
          src={logoUrl}
          alt="Logo CECND Gauche"
          className="h-16 w-16 object-contain shrink-0 print:h-12 print:w-12"
        />
        <div className="text-center flex-1">
          <h2 className="text-xs font-black tracking-widest text-slate-800 uppercase leading-snug print:text-[10px]">
            Communauté des Églises Chrétiennes
          </h2>
          <h1 className="text-sm font-black tracking-wider text-teal-800 uppercase leading-normal print:text-xs">
            pour le Nouveau Départ (CECND)
          </h1>
          <div className="w-24 h-0.5 bg-teal-600 mx-auto my-1.5 print:my-1" />
          <h3 className="text-base font-extrabold text-slate-800 tracking-wide uppercase print:text-sm">
            {title}
          </h3>
        </div>
        <img
          src={logoUrl}
          alt="Logo CECND Droite"
          className="h-16 w-16 object-contain shrink-0 print:h-12 print:w-12"
        />
      </div>

      {/* Metadatas context area */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-semibold text-slate-700 print:bg-white print:border-slate-300 print:p-2 print:grid-cols-2">
        <div>
          <span className="text-slate-500 font-medium">Contexte :</span> {getContextText()}
        </div>
        <div>
          <span className="text-slate-500 font-medium">Date d'édition :</span> {todayStr}
        </div>
        <div>
          <span className="text-slate-500 font-medium">Période du rapport :</span> {period}
        </div>
        <div>
          <span className="text-slate-500 font-medium">Édité par :</span> {currentUser.fullName} ({roleLabels[currentUser.role] || currentUser.role})
        </div>
      </div>
    </div>
  );
}
