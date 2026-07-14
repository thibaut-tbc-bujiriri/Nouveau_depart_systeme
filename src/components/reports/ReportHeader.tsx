import logoUrl from '@/assets/ecdn_logo.png';
import type { Profile } from '@/types';

interface ReportHeaderProps {
  title: string;
  scope: 'global' | 'extension' | 'department' | 'personal';
  branchName?: string;
  departmentName?: string;
  period?: string;
  currentUser: Profile;
  officeName?: string;
  annualTheme?: string;
  monthYear?: string;
  subtheme?: string;
}

export function ReportHeader({
  title,
  scope,
  branchName,
  departmentName,
  period = 'Toutes les périodes',
  currentUser,
  officeName,
  annualTheme,
  monthYear,
  subtheme,
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

  const contextText = (() => {
    switch (scope) {
      case 'global':
        return 'Toutes les extensions';
      case 'extension':
        return `Extension : ${branchName || 'Non renseigné'}`;
      case 'department':
        return `Extension : ${branchName || 'Non renseigné'} - Département : ${departmentName || 'Non renseigné'}`;
      case 'personal':
        return `Rapport personnel - ${currentUser.fullName}`;
      default:
        return 'Toutes les extensions';
    }
  })();

  return (
    <header className="official-report-header border-b-2 border-slate-800 pb-4 mb-6 print:pb-2 print:mb-4">
      <div className="grid grid-cols-[72px_1fr_72px] items-start gap-4 mb-3 print:grid-cols-[54px_1fr_54px] print:gap-3">
        <img src={logoUrl} alt="Logo CECND gauche" className="h-16 w-16 object-contain print:h-12 print:w-12" />
        <div className="text-center text-slate-800">
          <p className="text-[13px] font-black uppercase tracking-wide leading-tight print:text-[10px]">
            Communauté des Églises Chrétiennes Pour le Nouveau Départ
          </p>
          <p className="text-xs font-black uppercase tracking-wide leading-tight print:text-[10px]">« CECND »</p>
          <p className="text-xs font-bold italic leading-tight print:text-[10px]">Centre Évangélique Francophone Nouveau Départ</p>
          {branchName ? <p className="text-xs font-bold leading-tight print:text-[10px]">{branchName}</p> : null}
          <div className="mx-auto my-2 h-0.5 w-48 bg-teal-700 print:my-1" />
          {officeName ? <p className="text-xs font-black text-slate-700 print:text-[10px]">{officeName}</p> : null}
          {annualTheme ? <p className="mt-2 text-sm font-black italic text-slate-700 print:text-xs">{annualTheme}</p> : null}
          {monthYear ? <p className="mt-2 text-sm font-black uppercase text-slate-800 print:text-xs">{monthYear}</p> : null}
          <h1 className="mt-2 text-base font-black uppercase tracking-wide text-slate-900 print:text-sm">{title}</h1>
          {subtheme ? <p className="mt-1 text-sm italic text-slate-700 print:text-xs"><span>Sous-thème :</span> {subtheme}</p> : null}
        </div>
        <img src={logoUrl} alt="Logo CECND droite" className="h-16 w-16 object-contain justify-self-end print:h-12 print:w-12" />
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-semibold text-slate-700 print:bg-white print:border-slate-300 print:p-2 print:grid-cols-2">
        <div><span className="text-slate-500 font-medium">Contexte :</span> {contextText}</div>
        <div><span className="text-slate-500 font-medium">Date d'édition :</span> {todayStr}</div>
        <div><span className="text-slate-500 font-medium">Période du rapport :</span> {period}</div>
        <div><span className="text-slate-500 font-medium">Édité par :</span> {currentUser.fullName} ({roleLabels[currentUser.role] || currentUser.role})</div>
      </div>
    </header>
  );
}
