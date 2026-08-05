import { DataTable, EmptyState, LoadingState, PageHeader } from '@/components/common';
import { ActionMenu, AppButton, AppInput, AppSelect, AppTextarea, FormFieldWrapper, SearchInput, AppCombobox, useToast } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { useReportsData } from '@/hooks/useReportsData';
import type { Report } from '@/types';
import { hasModulePermission } from '@/lib/permissions';
import { formatDate, parseSafeDate } from '@/utils/format';
import { restrictReportsByRole } from '@/utils/permissions';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

// Reporting elements
import { ReportLayout, ReportTable, ReportFilters, ReportEmptyState } from '@/components/reports';
import { TeachingProgramReport } from '@/components/reports/TeachingProgramReport';
import { exportToCSV } from '@/services/exportService';
import { resolveReportScope } from '@/services/reportsService';
import { getBranches } from '@/services/branches.service';
import { getManagedUsers } from '@/services/users.service';
import { getMembers } from '@/services/members.service';
import { getDepartments } from '@/services/departments.service';
import { getServices } from '@/services/services.service';
import { getEvents } from '@/services/events.service';
import { getFinanceRecords } from '@/services/finance.service';
import { getNotificationsForCurrentUser } from '@/services/notificationsService';
import { getDailyVerseHistory } from '@/services/dailyVerseService';
import { getTeachingPrograms, type TeachingProgram } from '@/services/teachingPrograms.service';

import { 
  Building2, 
  Users, 
  Network, 
  UserCheck, 
  BookOpen,
  CalendarDays,
  Coins,
  Bell,
  Settings,
  TrendingUp
} from 'lucide-react';

interface ReportFormState {
  branchId: string;
  title: string;
  type: Report['type'];
  period: string;
  summary: string;
  generatedAt: string;
}

const initialForm: ReportFormState = {
  branchId: '',
  title: '',
  type: 'department',
  period: '',
  summary: '',
  generatedAt: new Date().toISOString().slice(0, 10),
};

const roleLabels: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrateur',
  department_manager: 'Responsable Département',
  department_member: 'Membre Département',
};

export function ReportsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { branches } = useBranches();
  const { reports, isLoading, isMutating, error, createReport, updateReport, deleteReport } = useReportsData();
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'generate' | 'archive'>('generate');
  
  // Generation engine states
  const [activeReport, setActiveReport] = useState<string>('member_list');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [periodText, setPeriodText] = useState<string>('Toutes les périodes');
  const [searchVal, setSearchVal] = useState<string>('');
  const [selectedTeachingProgramId, setSelectedTeachingProgramId] = useState<string>('');

  // Resources state
  const [branchesData, setBranchesData] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [membersData, setMembersData] = useState<any[]>([]);
  const [deptsData, setDeptsData] = useState<any[]>([]);
  const [servicesData, setServicesData] = useState<any[]>([]);
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [financesData, setFinancesData] = useState<any[]>([]);
  const [notificationsData, setNotificationsData] = useState<any[]>([]);
  const [versesData, setVersesData] = useState<any[]>([]);
  const [teachingProgramsData, setTeachingProgramsData] = useState<TeachingProgram[]>([]);
  const [settingsData, setSettingsData] = useState<any | null>(null);
  const [logsData, setLogsData] = useState<any[]>([]);
  const [isReportDataLoading, setIsReportDataLoading] = useState(false);

  // Archive state
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<ReportFormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const role = user?.role;
  const branchId = user?.branchId ?? '';
  const canCreate = user ? hasModulePermission(user.role, 'reports', 'create') : false;
  const canUpdate = user ? hasModulePermission(user.role, 'reports', 'update') : false;
  const canDelete = user ? hasModulePermission(user.role, 'reports', 'delete') : false;
  
  const scopedReports = useMemo(() => (user ? restrictReportsByRole(reports, user) : []), [reports, user]);
  
  const filteredReports = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return scopedReports;
    }

    return scopedReports.filter((report) =>
      [report.title, report.type, report.period].join(' ').toLowerCase().includes(normalized),
    );
  }, [query, scopedReports]);
  
  const scopedBranches = branches.filter((branch) => (role === 'superadmin' ? true : branch.id === branchId));

  const branchOptions = useMemo(() =>
    scopedBranches.map((branch) => ({ value: branch.id, label: branch.name })),
    [scopedBranches]
  );

  const filterBranchOptions = useMemo(() => [
    { value: '', label: 'Toutes les extensions' },
    ...branchesData.map((b) => ({ value: b.id, label: b.name }))
  ], [branchesData]);

  const filterDeptOptions = useMemo(() => [
    { value: '', label: 'Tous les départements' },
    ...deptsData
      .filter(d => user?.role === 'superadmin' || d.branchId === user?.branchId)
      .map((d) => ({ value: d.id, label: d.name }))
  ], [deptsData, user?.role, user?.branchId]);

  // Enforce security filters
  useEffect(() => {
    if (user) {
      const res = resolveReportScope(user, selectedBranchId, selectedDeptId);
      if (res.branchId && res.branchId !== selectedBranchId) {
        setSelectedBranchId(res.branchId);
      }
      if (res.departmentId && res.departmentId !== selectedDeptId) {
        setSelectedDeptId(res.departmentId);
      }
    }
  }, [user]);

  // Load backend data for generating reports
  const loadReportData = async () => {
    if (!user) return;
    setIsReportDataLoading(true);
    try {
      const [
        bRes, 
        uRes, 
        mRes, 
        dRes,
        sRes,
        eRes,
        fRes,
        nRes,
        vRes,
        tpRes,
        settingsRes
      ] = await Promise.all([
        getBranches().catch(() => []),
        getManagedUsers().catch(() => ({ users: [], branches: [], departments: [] })),
        getMembers().catch(() => []),
        getDepartments().catch(() => []),
        getServices().catch(() => []),
        getEvents().catch(() => []),
        getFinanceRecords().catch(() => []),
        getNotificationsForCurrentUser(user).catch(() => []),
        getDailyVerseHistory().then(v => v, () => []),
        getTeachingPrograms().catch(() => []),
        Promise.resolve(supabase.from('app_settings').select('*').maybeSingle()).then(res => res.data).catch(() => null)
      ]);

      setBranchesData(bRes);
      setUsersData(uRes.users || []);
      setMembersData(mRes);
      setDeptsData(dRes);
      setServicesData(sRes);
      setEventsData(eRes);
      setFinancesData(fRes);
      setNotificationsData(nRes);
      setVersesData(vRes);
      setTeachingProgramsData(tpRes);
      if (!selectedTeachingProgramId && tpRes[0]) setSelectedTeachingProgramId(tpRes[0].id);
      setSettingsData(settingsRes);

      if (activeReport === 'sys_logs' || activeReport === 'profile_activities' || activeReport === 'sys_general') {
        const { getActivityLogsForCurrentUser } = await import('@/services/activityLogService');
        const lRes = await getActivityLogsForCurrentUser(user).catch(() => []);
        setLogsData(lRes);
      }
    } catch (err) {
      console.error("Failed to load report data sources:", err);
    } finally {
      setIsReportDataLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'generate') {
      void loadReportData();
    }
  }, [activeTab, activeReport]);

  if (!user) {
    return null;
  }

  // Filter lists based on selected report types and filters
  const getFilteredReportData = () => {
    const searchLower = searchVal.trim().toLowerCase();

    // 1. EXTENSIONS
    if (activeReport.startsWith('ext_')) {
      return branchesData.filter((b) => {
        if (role !== 'superadmin' && b.id !== user.branchId) return false;
        if (selectedBranchId && b.id !== selectedBranchId) return false;
        
        if (activeReport === 'ext_active') {
          if (!b.isActive) return false;
        } else if (activeReport === 'ext_inactive') {
          if (b.isActive) return false;
        } else {
          if (selectedStatus === 'active' && !b.isActive) return false;
          if (selectedStatus === 'inactive' && b.isActive) return false;
        }

        if (searchLower && !b.name.toLowerCase().includes(searchLower)) return false;
        return true;
      });
    }

    // 2. UTILISATEURS
    if (activeReport.startsWith('user_')) {
      return usersData.filter((u) => {
        if (role !== 'superadmin' && u.branchId !== user.branchId) return false;
        if (selectedBranchId && u.branchId !== selectedBranchId) return false;
        if (selectedRole && u.role !== selectedRole) return false;
        
        if (activeReport === 'user_active') {
          if (u.status !== 'active') return false;
        } else if (activeReport === 'user_inactive') {
          if (u.status === 'active') return false;
        } else {
          if (selectedStatus === 'active' && u.status !== 'active') return false;
          if (selectedStatus === 'inactive' && u.status === 'active') return false;
        }

        if (searchLower && !u.fullName.toLowerCase().includes(searchLower)) return false;
        return true;
      });
    }

    // 3. MEMBRES
    if (activeReport.startsWith('member_')) {
      return membersData.filter((m) => {
        if (role !== 'superadmin' && m.branchId !== user.branchId) return false;
        if (selectedBranchId && m.branchId !== selectedBranchId) return false;
        
        if (role === 'department_manager' && !m.departmentIds.includes(user.departmentIds[0])) return false;
        if (selectedDeptId && !m.departmentIds.includes(selectedDeptId)) return false;

        if (activeReport === 'member_active') {
          if (m.status !== 'active') return false;
        } else if (activeReport === 'member_inactive') {
          if (m.status !== 'inactive') return false;
        } else {
          if (selectedStatus === 'active' && m.status !== 'active') return false;
          if (selectedStatus === 'inactive' && m.status !== 'inactive') return false;
        }
        
        if (activeReport === 'member_new') {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          if ((parseSafeDate(m.joinedAt)?.getTime() ?? 0) < thirtyDaysAgo.getTime()) return false;
        }

        if (searchLower && !`${m.firstName} ${m.lastName}`.toLowerCase().includes(searchLower)) return false;
        return true;
      });
    }

    // 4. DEPARTEMENTS
    if (activeReport.startsWith('dept_')) {
      return deptsData.filter((d) => {
        if (role !== 'superadmin' && d.branchId !== user.branchId) return false;
        if (selectedBranchId && d.branchId !== selectedBranchId) return false;
        if (role === 'department_manager' && !user.departmentIds.includes(d.id)) return false;
        
        if (activeReport === 'dept_active') {
          if (d.status !== 'active') return false;
        } else {
          if (selectedStatus === 'active' && d.status !== 'active') return false;
          if (selectedStatus === 'inactive' && d.status === 'active') return false;
        }

        if (activeReport === 'dept_no_manager' && d.managerProfileId) return false;
        if (searchLower && !d.name.toLowerCase().includes(searchLower)) return false;
        return true;
      });
    }

    // 5. SERVICES
    if (activeReport.startsWith('service_')) {
      return servicesData.filter((s) => {
        if (role !== 'superadmin' && s.branchId !== user.branchId) return false;
        if (selectedBranchId && s.branchId !== selectedBranchId) return false;

        if (activeReport === 'service_upcoming') {
          if ((parseSafeDate(s.date)?.getTime() ?? 0) < Date.now()) return false;
        }

        if (searchLower && !s.title.toLowerCase().includes(searchLower)) return false;
        return true;
      });
    }

    // 6. EVENEMENTS
    if (activeReport.startsWith('event_')) {
      return eventsData.filter((e) => {
        if (role !== 'superadmin' && e.branchId !== user.branchId) return false;
        if (selectedBranchId && e.branchId !== selectedBranchId) return false;

        if (role === 'department_manager' && e.organizerDepartmentId !== user.departmentIds[0]) return false;
        if (selectedDeptId && e.organizerDepartmentId !== selectedDeptId) return false;

        if (activeReport === 'event_upcoming') {
          if ((parseSafeDate(e.date)?.getTime() ?? 0) < Date.now()) return false;
        }

        if (searchLower && !e.title.toLowerCase().includes(searchLower)) return false;
        return true;
      });
    }

    // 7. FINANCES
    if (activeReport.startsWith('finance_') || activeReport === 'sys_general') {
      return financesData.filter((f) => {
        if (role !== 'superadmin' && f.branchId !== user.branchId) return false;
        if (selectedBranchId && f.branchId !== selectedBranchId) return false;

        if (role === 'department_manager' && f.departmentId !== user.departmentIds[0]) return false;
        if (selectedDeptId && f.departmentId !== selectedDeptId) return false;

        if (activeReport === 'finance_income' && f.type !== 'income') return false;
        if (activeReport === 'finance_expense' && f.type !== 'expense') return false;

        if (searchLower && !f.description.toLowerCase().includes(searchLower)) return false;
        return true;
      });
    }

    // 8. LOGS
    if (activeReport === 'sys_logs') {
      return logsData.filter((l) => {
        if (role !== 'superadmin' && l.extensionId !== user.branchId) return false;
        if (selectedBranchId && l.extensionId !== selectedBranchId) return false;
        if (searchLower && !l.title.toLowerCase().includes(searchLower)) return false;
        return true;
      });
    }

    // 8.5 NOTIFICATIONS
    if (activeReport === 'sys_notifications') {
      return notificationsData.filter((n) => {
        if (selectedStatus === 'active' && n.isRead) return false;
        if (selectedStatus === 'inactive' && !n.isRead) return false;
        if (searchLower && !n.title.toLowerCase().includes(searchLower)) return false;
        return true;
      });
    }

    // 9. PROFIL & PERSONAL ACTIVITIES
    if (activeReport === 'profile_activities') {
      return logsData.filter((l) => {
        if (searchLower && !l.title.toLowerCase().includes(searchLower)) return false;
        return true;
      });
    }

    // 10. SPIRITUAL VERSES
    if (activeReport === 'spiritual_verses') {
      return versesData.filter((v) => {
        if (searchLower && !v.verseReference.toLowerCase().includes(searchLower)) return false;
        return true;
      });
    }

    if (activeReport === 'teaching_program') {
      return teachingProgramsData.filter((program) => {
        if (role !== 'superadmin' && program.extensionId !== user.branchId) return false;
        if (selectedBranchId && program.extensionId !== selectedBranchId) return false;
        if (selectedTeachingProgramId && program.id !== selectedTeachingProgramId) return false;
        return true;
      });
    }

    return [];
  };

  const getReportRenderDetails = () => {
    const dataList = getFilteredReportData();
    const resolvedScope = resolveReportScope(user, selectedBranchId, selectedDeptId);

    const selectedTeachingProgram = activeReport === 'teaching_program' ? (dataList[0] as TeachingProgram | undefined) : undefined;
    const bName = selectedTeachingProgram?.branch?.name || branchesData.find((b) => b.id === (resolvedScope.branchId || selectedBranchId))?.name;
    const dName = deptsData.find((d) => d.id === (resolvedScope.departmentId || selectedDeptId))?.name;
    const teachingMonthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const headerMeta = selectedTeachingProgram ? {
      officeName: selectedTeachingProgram.officeName,
      annualTheme: selectedTeachingProgram.annualTheme ? String(selectedTeachingProgram.year) + ', ' + selectedTeachingProgram.annualTheme.title : undefined,
      monthYear: String(teachingMonthNames[selectedTeachingProgram.month - 1] ?? selectedTeachingProgram.month) + ' ' + String(selectedTeachingProgram.year),
      subtheme: selectedTeachingProgram.subtheme,
    } : {};

    const exportCSVHandler = () => {
      let headers: string[] = [];
      let rows: string[][] = [];

      if (activeReport.startsWith('ext_')) {
        headers = ["Nom", "Code", "Ville", "Pays", "Responsable", "Statut"];
        rows = dataList.map((b) => [
          b.name,
          b.code,
          b.city,
          b.country,
          b.pastorName,
          b.isActive ? 'Actif' : 'Inactif'
        ]);
      } else if (activeReport.startsWith('user_')) {
        headers = ["Nom complet", "Email", "Téléphone", "Rôle", "Statut"];
        rows = dataList.map((u) => [
          u.fullName,
          u.email,
          u.phone,
          roleLabels[u.role] || u.role,
          u.status === 'active' ? 'Actif' : 'Inactif'
        ]);
      } else if (activeReport.startsWith('member_')) {
        headers = ["Nom complet", "Sexe", "Téléphone", "Email", "Statut", "Date d'inscription"];
        rows = dataList.map((m) => [
          `${m.firstName} ${m.lastName}`,
          m.gender === 'male' ? 'Homme' : 'Femme',
          m.phone,
          m.email || 'Non renseigné',
          m.status === 'active' ? 'Actif' : 'Inactif',
          formatDate(m.joinedAt)
        ]);
      } else if (activeReport.startsWith('dept_')) {
        headers = ["Département", "Extension", "Responsable", "Budget"];
        rows = dataList.map((d) => [
          d.name,
          branchesData.find(b => b.id === d.branchId)?.name || 'Non renseigné',
          usersData.find(u => u.id === d.managerProfileId)?.fullName || 'Aucun',
          d.monthlyBudget ? `${d.monthlyBudget} USD` : '-'
        ]);
      } else if (activeReport.startsWith('service_')) {
        headers = ["Titre", "Date", "Heure début", "Heure fin", "Extension"];
        rows = dataList.map((s) => [
          s.title,
          formatDate(s.date),
          s.startTime || 'Non renseigné',
          s.endTime || 'Non renseigné',
          branchesData.find(b => b.id === s.branchId)?.name || 'Non renseigné'
        ]);
      } else if (activeReport.startsWith('event_')) {
        headers = ["Événement", "Date", "Lieu", "Extension", "Département"];
        rows = dataList.map((e) => [
          e.title,
          formatDate(e.date),
          e.location || 'Non renseigné',
          branchesData.find(b => b.id === e.branchId)?.name || 'Non renseigné',
          deptsData.find(d => d.id === e.organizerDepartmentId)?.name || 'Tous'
        ]);
      } else if (activeReport.startsWith('finance_')) {
        headers = ["Date", "Type", "Catégorie", "Montant", "Description"];
        rows = dataList.map((f) => [
          formatDate(f.recordedAt),
          f.type === 'income' ? 'Recette' : 'Dépense',
          f.category,
          `${f.amount} USD`,
          f.description
        ]);
      } else if (activeReport === 'sys_logs') {
        headers = ["Date", "Auteur", "Action", "Module", "Description", "Statut"];
        rows = dataList.map((l) => [
          formatDate(l.createdAt),
          l.userName || 'Système',
          l.title,
          l.module,
          l.description,
          l.status
        ]);
      } else if (activeReport === 'profile_activities') {
        headers = ["Date", "Action", "Module", "Description", "Statut"];
        rows = dataList.map((l) => [
          formatDate(l.createdAt),
          l.title,
          l.module,
          l.description,
          l.status
        ]);
      } else if (activeReport === 'spiritual_verses') {
        headers = ["Date publication", "Référence", "Texte du verset", "Statut"];
        rows = dataList.map((v) => [
          formatDate(v.publishedAt),
          v.verseReference,
          v.verseText,
          v.status
        ]);
      }

      exportToCSV(activeReport, headers, rows);
    };

    return {
      scope: resolvedScope.scope,
      branchName: bName,
      departmentName: dName,
      exportCSV: exportCSVHandler,
      headerMeta,
      dataList
    };
  };

  const { scope, branchName, departmentName, exportCSV, headerMeta, dataList } = getReportRenderDetails();

  // Archive functions
  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      ...initialForm,
      branchId: user.role === 'superadmin' ? '' : user.branchId,
      period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (location.state && typeof location.state === 'object' && 'openCreate' in location.state && location.state.openCreate) {
      openCreateModal();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const openEditModal = (report: Report) => {
    setEditingId(report.id);
    setForm({
      branchId: report.branchId,
      title: report.title,
      type: report.type,
      period: report.period,
      summary: report.summary,
      generatedAt: report.generatedAt.slice(0, 10),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.branchId || !form.title.trim()) {
      toast.error('Veuillez remplir les champs obligatoires.');
      return;
    }

    const resolvedDepartmentId =
      user.role === 'department_manager' || user.role === 'department_member'
        ? (user.departmentIds[0] ?? undefined)
        : undefined;

    const payload = {
      branchId: form.branchId,
      departmentId: resolvedDepartmentId,
      title: form.title,
      type: form.type,
      period: form.period,
      summary: form.summary,
      generatedAt: form.generatedAt,
    };

    const ok = editingId ? await updateReport(editingId, payload) : await createReport(payload);
    if (ok) {
      toast.success(editingId ? 'Modification r?ussie.' : 'Enregistrement r?ussi.');
      setIsModalOpen(false);
      setEditingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    const ok = await deleteReport(deleteId);
    if (ok) {
      toast.success('Suppression r?ussie.');
      setDeleteId(null);
    }
  };

  // Financial calculations
  const totalIn = financesData.filter(f => f.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const totalOut = financesData.filter(f => f.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIn - totalOut;

  return (
    <div className="space-y-6">
      <PageHeader
        className="print:hidden"
        title="Rapports & États de sortie"
        description="Générez des fiches et listes opérationnelles ou consultez les rapports d'activités archivés."
        actions={
          <div className="flex gap-2">
            <AppButton
              variant={activeTab === 'generate' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('generate')}
              size="sm"
            >
              Générer un état
            </AppButton>
            <AppButton
              variant={activeTab === 'archive' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('archive')}
              size="sm"
            >
              Rapports archivés
            </AppButton>
            {activeTab === 'archive' && canCreate && (
              <AppButton onClick={openCreateModal} size="sm">
                Archiver un rapport
              </AppButton>
            )}
          </div>
        }
      />

      {activeTab === 'generate' ? (
        <div className="grid gap-6 lg:grid-cols-4 items-start print:block print:w-full print:p-0">
          {/* Left panel: template selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 print:hidden max-h-[80vh] overflow-y-auto">
            {user.role === 'superadmin' && (
              <div>
                <h3 className="text-xs font-black uppercase text-teal-850 tracking-wider mb-2 flex items-center gap-1">
                  <TrendingUp className="size-3.5" /> Synthèse générale
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveReport('sys_general')}
                    className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                      activeReport === 'sys_general' ? 'bg-teal-50 text-teal-850' : 'text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    Rapport général système
                  </button>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Rapports administratifs</h3>
              <div className="space-y-1">
                {user.role === 'superadmin' && (
                  <>
                    <button
                      onClick={() => setActiveReport('ext_list')}
                      className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                        activeReport === 'ext_list' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="size-3.5" /> Liste des extensions
                    </button>
                    <button
                      onClick={() => setActiveReport('ext_active')}
                      className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                        activeReport === 'ext_active' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="size-3.5" /> Extensions actives
                    </button>
                  </>
                )}
                {(user.role === 'superadmin' || user.role === 'admin') && (
                  <>
                    <button
                      onClick={() => setActiveReport('user_list')}
                      className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                        activeReport === 'user_list' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                      }`}
                    >
                      <Users className="size-3.5" /> Liste des utilisateurs
                    </button>
                    <button
                      onClick={() => setActiveReport('dept_list')}
                      className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                        activeReport === 'dept_list' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                      }`}
                    >
                      <Network className="size-3.5" /> Liste des départements
                    </button>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Rapports membres</h3>
              <div className="space-y-1">
                {(user.role === 'superadmin' || user.role === 'admin' || user.role === 'department_manager') && (
                  <>
                    <button
                      onClick={() => setActiveReport('member_list')}
                      className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                        activeReport === 'member_list' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                      }`}
                    >
                      <UserCheck className="size-3.5" /> Liste des membres
                    </button>
                    <button
                      onClick={() => setActiveReport('member_active')}
                      className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                        activeReport === 'member_active' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                      }`}
                    >
                      <UserCheck className="size-3.5" /> Membres actifs
                    </button>
                    <button
                      onClick={() => setActiveReport('member_new')}
                      className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                        activeReport === 'member_new' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                      }`}
                    >
                      <UserCheck className="size-3.5" /> Nouveaux membres
                    </button>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Rapports activités</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveReport('service_list')}
                  className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                    activeReport === 'service_list' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  <CalendarDays className="size-3.5" /> Liste des cultes
                </button>
                <button
                  onClick={() => setActiveReport('service_upcoming')}
                  className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                    activeReport === 'service_upcoming' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  <CalendarDays className="size-3.5" /> Cultes à venir
                </button>
                <button
                  onClick={() => setActiveReport('event_list')}
                  className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                    activeReport === 'event_list' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  <CalendarDays className="size-3.5" /> Liste des événements
                </button>
              </div>
            </div>

            {user.role !== 'department_member' && (
              <div>
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Rapports financiers</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveReport('finance_income')}
                    className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                      activeReport === 'finance_income' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    <Coins className="size-3.5" /> Rapport des recettes
                  </button>
                  <button
                    onClick={() => setActiveReport('finance_expense')}
                    className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                      activeReport === 'finance_expense' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    <Coins className="size-3.5" /> Rapport des dépenses
                  </button>
                  <button
                    onClick={() => setActiveReport('finance_balance')}
                    className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                      activeReport === 'finance_balance' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    <Coins className="size-3.5" /> Balance générale
                  </button>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Rapports système</h3>
              <div className="space-y-1">
                {user.role === 'superadmin' && (
                  <button
                    onClick={() => setActiveReport('sys_logs')}
                    className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                      activeReport === 'sys_logs' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    <Settings className="size-3.5" /> Journal d'activités
                  </button>
                )}
                <button
                  onClick={() => setActiveReport('sys_notifications')}
                  className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                    activeReport === 'sys_notifications' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  <Bell className="size-3.5" /> Liste des notifications
                </button>
                {user.role === 'superadmin' && (
                  <button
                    onClick={() => setActiveReport('sys_settings')}
                    className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                      activeReport === 'sys_settings' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    <Settings className="size-3.5" /> Configuration système
                  </button>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Rapports spirituels</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveReport('spiritual_verses')}
                  className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                    activeReport === 'spiritual_verses' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="size-3.5" /> Historique des versets
                </button>
                <button
                  onClick={() => setActiveReport('teaching_program')}
                  className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                    activeReport === 'teaching_program' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="size-3.5" /> Programme des enseignements
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Rapports Profil</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveReport('profile_info')}
                  className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                    activeReport === 'profile_info' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="size-3.5" /> Fiche profil
                </button>
                <button
                  onClick={() => setActiveReport('profile_activities')}
                  className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                    activeReport === 'profile_activities' ? 'bg-teal-50 text-teal-800' : 'text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="size-3.5" /> Activités personnelles
                </button>
              </div>
            </div>
          </div>

          {/* Right panel: report preview and filters */}
          <div className="lg:col-span-3 space-y-6 print:col-span-4 print:w-full print:p-0">
            <ReportFilters>
              <div className="grid gap-4 md:grid-cols-4 flex-1">
                <FormFieldWrapper label="Période du rapport">
                  <AppInput
                    value={periodText}
                    onChange={(e) => setPeriodText(e.target.value)}
                    placeholder="Ex : Juillet 2026"
                  />
                </FormFieldWrapper>

                {user.role === 'superadmin' && (
                  <FormFieldWrapper label="Filtrer par extension">
                    <AppCombobox
                      value={selectedBranchId}
                      onChange={(val) => setSelectedBranchId(val)}
                      options={filterBranchOptions}
                    />
                  </FormFieldWrapper>
                )}

                {user.role !== 'department_member' && (
                  <FormFieldWrapper label="Filtrer par département">
                    <AppCombobox
                      value={selectedDeptId}
                      onChange={(val) => setSelectedDeptId(val)}
                      options={filterDeptOptions}
                      disabled={user.role === 'department_manager'}
                    />
                  </FormFieldWrapper>
                )}

                {activeReport === 'teaching_program' && (
                  <FormFieldWrapper label="Choisir le programme">
                    <AppSelect value={selectedTeachingProgramId} onChange={(e) => setSelectedTeachingProgramId(e.target.value)}>
                      <option value="">Dernier programme disponible</option>
                      {teachingProgramsData
                        .filter((program) => user.role === 'superadmin' || program.extensionId === user.branchId)
                        .map((program) => (
                          <option key={program.id} value={program.id}>
                            {program.branch?.name || 'Extension'} - {program.month}/{program.year} - {program.subtheme}
                          </option>
                        ))}
                    </AppSelect>
                  </FormFieldWrapper>
                )}

                {activeReport.startsWith('user_') && (
                  <FormFieldWrapper label="Filtrer par rôle">
                    <AppSelect
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="">Tous les rôles</option>
                      <option value="superadmin">Super Admin</option>
                      <option value="admin">Administrateur</option>
                      <option value="department_manager">Responsable Département</option>
                      <option value="department_member">Membre Département</option>
                    </AppSelect>
                  </FormFieldWrapper>
                )}

                {!activeReport.includes('_active') && !activeReport.includes('_inactive') && !activeReport.includes('_new') && !activeReport.includes('_no_manager') && !activeReport.includes('_upcoming') && (
                  <FormFieldWrapper label="Filtrer par statut">
                    <AppSelect
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="active">Actifs / Activés</option>
                      <option value="inactive">Inactifs / Désactivés</option>
                    </AppSelect>
                  </FormFieldWrapper>
                )}

                <FormFieldWrapper label="Rechercher">
                  <SearchInput
                    value={searchVal}
                    onChange={setSearchVal}
                    placeholder="Saisissez un mot clé..."
                  />
                </FormFieldWrapper>
              </div>
            </ReportFilters>

            {isReportDataLoading ? (
              <LoadingState message="Chargement des données en cours..." />
            ) : (
              <ReportLayout
                title={
                  activeReport === 'sys_general' ? 'Rapport Général de Synthèse Système' :
                  activeReport === 'ext_list' ? 'Liste Générale des Extensions' :
                  activeReport === 'ext_active' ? 'Extensions Actives' :
                  activeReport === 'user_list' ? 'Liste des Utilisateurs du Système' :
                  activeReport === 'dept_list' ? 'Liste des Départements de Service' :
                  activeReport === 'member_list' ? 'Registre Général des Membres d\'Église' :
                  activeReport === 'member_active' ? 'Membres d\'Église Actifs' :
                  activeReport === 'member_new' ? 'Nouveaux Membres Enregistrés' :
                  activeReport === 'service_list' ? 'Programme Historique des Cultes & Services' :
                  activeReport === 'service_upcoming' ? 'Calendrier des Cultes à Venir' :
                  activeReport === 'event_list' ? 'Registre des Événements' :
                  activeReport === 'finance_income' ? 'Registre des Recettes en Caisse' :
                  activeReport === 'finance_expense' ? 'Registre des Dépenses de Caisse' :
                  activeReport === 'finance_balance' ? 'Balance Recettes et Dépenses de Caisse' :
                  activeReport === 'sys_logs' ? 'Journal Global d\'Audit Système' :
                  activeReport === 'sys_notifications' ? 'Registre Général des Notifications' :
                  activeReport === 'sys_settings' ? 'Fiche des Paramètres Généraux' :
                  activeReport === 'spiritual_verses' ? 'Historique des Versets du Jour' :
                  activeReport === 'teaching_program' ? 'Programme des enseignements' :
                  activeReport === 'profile_info' ? 'Fiche de Profil Utilisateur' :
                  activeReport === 'profile_activities' ? 'Historique d\'Activités Personnel' :
                  'Rapport'
                }
                scope={scope}
                branchName={branchName}
                departmentName={departmentName}
                period={periodText}
                currentUser={user}
                officeName={headerMeta.officeName}
                annualTheme={headerMeta.annualTheme}
                monthYear={headerMeta.monthYear}
                subtheme={headerMeta.subtheme}
                onExportCSV={activeReport !== 'profile_info' && activeReport !== 'sys_general' && activeReport !== 'sys_settings' && activeReport !== 'teaching_program' ? exportCSV : undefined}
              >
                {activeReport === 'teaching_program' ? (
                  <TeachingProgramReport program={(dataList[0] as TeachingProgram | undefined) ?? null} />
                ) : activeReport === 'sys_general' ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Membres rattachés</span>
                        <span className="text-2xl font-black text-slate-800">
                          {scope === 'global' ? membersData.length : membersData.filter(m => m.branchId === user.branchId).length}
                        </span>
                      </div>
                      {scope === 'global' && (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Extensions</span>
                          <span className="text-2xl font-black text-slate-800">{branchesData.length}</span>
                        </div>
                      )}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Activités planifiées (Cultes / Événements)</span>
                        <span className="text-2xl font-black text-slate-800">{servicesData.length + eventsData.length}</span>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Total Recettes</span>
                        <span className="text-2xl font-black text-emerald-950">{totalIn} USD</span>
                      </div>
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                        <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Total Dépenses</span>
                        <span className="text-2xl font-black text-rose-950">{totalOut} USD</span>
                      </div>
                      <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                        <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider block">Solde en caisse</span>
                        <span className="text-2xl font-black text-teal-950">{balance} USD</span>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Synthèse des indicateurs d'exploitation</h3>
                      <ReportTable
                        headers={["Indicateur clé", "Valeur / Résumé"]}
                        rows={[
                          ["Extensions enregistrées", `${branchesData.length} extensions`],
                          ["Utilisateurs du système", `${usersData.length} profils`],
                          ["Départements opérationnels", `${deptsData.length} départements`],
                          ["Volume d'événements programmés", `${eventsData.length} événements`],
                          ["Volume de cultes célébrés", `${servicesData.length} cultes`],
                          ["Transactions financières enregistrées", `${financesData.length} lignes de caisse`]
                        ]}
                      />
                    </div>
                  </div>
                ) : activeReport === 'profile_info' ? (
                  <ReportTable
                    headers={["Information", "Détails / Affectation"]}
                    rows={[
                      ["Nom complet", <span className="font-bold text-slate-800">{user.fullName}</span>],
                      ["Adresse E-mail", <span className="font-mono">{user.email}</span>],
                      ["Rôle dans le système", <span className="font-semibold text-teal-800">{roleLabels[user.role] || user.role}</span>],
                      ["Extension rattachée", <span>{branchesData.find(b => b.id === user.branchId)?.name || 'Aucune'}</span>],
                      ["Départements assignés", <span>{user.departmentIds.map(id => deptsData.find(d => d.id === id)?.name).filter(Boolean).join(', ') || 'Aucun'}</span>],
                      ["Statut du compte", <span className="text-emerald-700 font-bold">Actif</span>]
                    ]}
                  />
                ) : activeReport === 'sys_settings' ? (
                  <ReportTable
                    headers={["Paramètre global", "Valeur configurée"]}
                    rows={[
                      ["Nom de l'église / institution", <span className="font-bold">{settingsData?.churchName || "Communauté CECND"}</span>],
                      ["Fuseau horaire du serveur", <span className="font-mono">{settingsData?.timezone || "Africa/Kinshasa"}</span>],
                      ["Devise de compte par défaut", <span className="font-mono">{settingsData?.currency || "USD"}</span>],
                      ["Politique de sauvegarde automatique", <span>{settingsData?.autoBackup ? 'Sauvegarde quotidienne activée' : 'Désactivée'}</span>],
                      ["Adresse e-mail de support", <span className="font-mono">{settingsData?.contactEmail || "support@ecnd.org"}</span>]
                    ]}
                  />
                ) : activeReport.startsWith('ext_') ? (
                  <ReportTable
                    headers={["Nom", "Code", "Ville", "Pays", "Responsable", "Statut"]}
                    rows={dataList.map((b) => [
                      <span className="font-bold text-slate-850">{b.name}</span>,
                      <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px]">{b.code}</span>,
                      b.city,
                      b.country,
                      b.pastorName || 'A définir',
                      <span className={`font-semibold ${b.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {b.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    ])}
                  />
                ) : activeReport.startsWith('user_') ? (
                  <ReportTable
                    headers={["Nom complet", "Email", "Téléphone", "Rôle", "Statut"]}
                    rows={dataList.map((u) => [
                      <span className="font-bold text-slate-850">{u.fullName}</span>,
                      <span className="font-mono">{u.email}</span>,
                      u.phone || '-',
                      <span className="font-semibold text-slate-650">{roleLabels[u.role] || u.role}</span>,
                      <span className={`font-semibold ${u.status === 'active' ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {u.status === 'active' ? 'Actif' : 'Désactivé'}
                      </span>
                    ])}
                  />
                ) : activeReport.startsWith('member_') ? (
                  <ReportTable
                    headers={["Nom complet", "Sexe", "Téléphone", "Email", "Statut", "Inscription"]}
                    rows={dataList.map((m) => [
                      <span className="font-bold text-slate-850">{m.firstName} {m.lastName}</span>,
                      m.gender === 'male' ? 'Homme' : 'Femme',
                      m.phone || 'Non renseigné',
                      <span className="font-mono">{m.email || 'Non renseigné'}</span>,
                      <span className={`font-semibold ${m.status === 'active' ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {m.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>,
                      formatDate(m.joinedAt)
                    ])}
                  />
                ) : activeReport.startsWith('dept_') ? (
                  <ReportTable
                    headers={["Département", "Code / Extension", "Responsable", "Budget"]}
                    rows={dataList.map((d) => [
                      <span className="font-bold text-slate-850">{d.name}</span>,
                      branchesData.find(b => b.id === d.branchId)?.name || 'Non renseigné',
                      usersData.find(u => u.id === d.managerProfileId)?.fullName || 'Aucun',
                      <span className="font-mono">{d.monthlyBudget ? `${d.monthlyBudget} USD` : '-'}</span>
                    ])}
                  />
                ) : activeReport.startsWith('service_') ? (
                  <ReportTable
                    headers={["Intitulé du culte", "Date", "Heure début", "Heure fin", "Extension"]}
                    rows={dataList.map((s) => [
                      <span className="font-bold text-slate-850">{s.title}</span>,
                      formatDate(s.date),
                      s.startTime || 'Non renseigné',
                      s.endTime || 'Non renseigné',
                      branchesData.find(b => b.id === s.branchId)?.name || 'Non renseigné'
                    ])}
                  />
                ) : activeReport.startsWith('event_') ? (
                  <ReportTable
                    headers={["Événement", "Date", "Lieu / Salle", "Extension", "Département Organisateur"]}
                    rows={dataList.map((e) => [
                      <span className="font-bold text-slate-850">{e.title}</span>,
                      formatDate(e.date),
                      e.location || 'Non renseigné',
                      branchesData.find(b => b.id === e.branchId)?.name || 'Non renseigné',
                      deptsData.find(d => d.id === e.organizerDepartmentId)?.name || 'Tous'
                    ])}
                  />
                ) : activeReport.startsWith('finance_') ? (
                  <div className="space-y-4">
                    {/* Compact financial summary card */}
                    <div className="flex gap-4 mb-4 justify-end text-xs print:hidden">
                      <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-lg">
                        Recettes: <span className="font-bold">{dataList.filter(f => f.type === 'income').reduce((sum, item) => sum + item.amount, 0)} USD</span>
                      </div>
                      <div className="p-2 bg-rose-50 text-rose-800 border border-rose-150 rounded-lg">
                        Dépenses: <span className="font-bold">{dataList.filter(f => f.type === 'expense').reduce((sum, item) => sum + item.amount, 0)} USD</span>
                      </div>
                    </div>
                    <ReportTable
                      headers={["Date de valeur", "Type d'opération", "Catégorie", "Montant", "Description"]}
                      rows={dataList.map((f) => [
                        formatDate(f.recordedAt),
                        <span className={`font-semibold ${f.type === 'income' ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {f.type === 'income' ? 'Recette' : 'Dépense'}
                        </span>,
                        f.category,
                        <span className="font-bold">{f.amount} {f.currency}</span>,
                        f.description
                      ])}
                    />
                  </div>
                ) : activeReport === 'sys_logs' ? (
                  <ReportTable
                    headers={["Date", "Auteur", "Action", "Module", "Description", "Statut"]}
                    rows={dataList.map((l) => [
                      formatDate(l.createdAt),
                      l.userName || 'Système',
                      <span className="font-bold">{l.title}</span>,
                      l.module,
                      l.description,
                      <span className={`font-semibold ${l.status === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {l.status}
                      </span>
                    ])}
                  />
                ) : activeReport === 'sys_notifications' ? (
                  <ReportTable
                    headers={["Date de réception", "Notification", "Type", "Contenu", "Statut"]}
                    rows={dataList.map((n) => [
                      formatDate(n.createdAt),
                      <span className="font-bold">{n.title}</span>,
                      n.type,
                      n.message,
                      <span className={`font-semibold ${n.isRead ? 'text-slate-400' : 'text-emerald-700'}`}>
                        {n.isRead ? 'Lu' : 'Non lu'}
                      </span>
                    ])}
                  />
                ) : activeReport === 'spiritual_verses' ? (
                  <ReportTable
                    headers={["Date de publication", "Référence", "Texte du verset", "Message inspirant", "Statut"]}
                    rows={dataList.map((v) => [
                      formatDate(v.publishedAt),
                      <span className="font-bold text-slate-800">{v.verseReference}</span>,
                      <span className="italic">« {v.verseText} »</span>,
                      v.inspirationalMessage || '-',
                      <span className={`font-semibold uppercase text-[10px] tracking-wider ${v.status === 'active' ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {v.status}
                      </span>
                    ])}
                  />
                ) : activeReport === 'profile_activities' ? (
                  <ReportTable
                    headers={["Date", "Action", "Module", "Description", "Statut"]}
                    rows={dataList.map((l) => [
                      formatDate(l.createdAt),
                      <span className="font-bold">{l.title}</span>,
                      l.module,
                      l.description,
                      <span className={`font-semibold ${l.status === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {l.status}
                      </span>
                    ])}
                  />
                ) : (
                  <ReportEmptyState />
                )}
              </ReportLayout>
            )}
          </div>
        </div>
      ) : (
        /* Archive List (Original code untouched) */
        <>
          <div className="flex justify-between items-center mb-4">
            <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un rapport..." />
          </div>

          {error ? (
            <EmptyState
              title="Donnees rapports partielles"
              description={error}
            />
          ) : null}

          {isLoading ? (
            <LoadingState message="Chargement des rapports..." />
          ) : (
            <DataTable
              data={filteredReports}
              keyExtractor={(report) => report.id}
              columns={[
                { key: 'title', label: 'Titre', render: (report) => report.title },
                {
                  key: 'branch',
                  label: 'Extension',
                  render: (report) => branches.find((branch) => branch.id === report.branchId)?.name ?? 'N/A',
                },
                { key: 'type', label: 'Type', render: (report) => report.type },
                { key: 'period', label: 'Periode', render: (report) => report.period },
                { key: 'generatedAt', label: 'Date', render: (report) => formatDate(report.generatedAt) },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: (report) => {
                    const items = [
                      canUpdate ? { label: 'Modifier', onClick: () => openEditModal(report) } : null,
                      canDelete ? { label: 'Supprimer', variant: 'danger' as const, onClick: () => setDeleteId(report.id) } : null,
                    ].filter(Boolean);
                    return <ActionMenu items={items} />;
                  },
                },
              ]}
            />
          )}

          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Modifier rapport' : 'Nouveau rapport'}>
            <div className="space-y-4">
              <FormFieldWrapper label="Extension" required>
                <AppCombobox
                  value={form.branchId}
                  onChange={(val) => setForm((prev) => ({ ...prev, branchId: val }))}
                  options={branchOptions}
                  disabled={user.role !== 'superadmin'}
                />
              </FormFieldWrapper>

              <FormFieldWrapper label="Titre" required>
                <AppInput value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
              </FormFieldWrapper>

              <div className="grid gap-4 md:grid-cols-2">
                <FormFieldWrapper label="Type">
                  <AppSelect value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as Report['type'] }))}>
                    <option value="finance">Finance</option>
                    <option value="attendance">Frequentation</option>
                    <option value="department">Departement</option>
                    <option value="members">Membres</option>
                  </AppSelect>
                </FormFieldWrapper>
                <FormFieldWrapper label="Date generation">
                  <AppInput
                    type="date"
                    value={form.generatedAt}
                    onChange={(event) => setForm((prev) => ({ ...prev, generatedAt: event.target.value }))}
                  />
                </FormFieldWrapper>
              </div>

              <FormFieldWrapper label="Periode">
                <AppInput value={form.period} onChange={(event) => setForm((prev) => ({ ...prev, period: event.target.value }))} />
              </FormFieldWrapper>

              <FormFieldWrapper label="Resume">
                <AppTextarea
                  rows={4}
                  value={form.summary}
                  onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
                />
              </FormFieldWrapper>

              <div className="flex justify-end gap-2">
                <AppButton variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </AppButton>
                <AppButton isLoading={isMutating} onClick={handleSubmit}>
                  Enregistrer
                </AppButton>
              </div>
            </div>
          </Modal>

          <ConfirmDialog
            isOpen={Boolean(deleteId)}
            title="Supprimer ce rapport ?"
            description="Cette action est irreversible."
            onCancel={() => setDeleteId(null)}
            onConfirm={handleDelete}
            confirmLabel={isMutating ? 'Suppression...' : 'Supprimer'}
          />
        </>
      )}
    </div>
  );
}
