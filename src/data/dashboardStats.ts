import type {
  ActivityItem,
  BranchStatsPoint,
  DepartmentDistributionPoint,
  DepartmentPerformancePoint,
  FinanceCategoryPoint,
  KpiItem,
  MembersCategoryPoint,
  MembersByDepartmentPoint,
  MonthlyAttendancePoint,
  MonthlyFinancePoint,
  ReportItem,
  SmartAlertItem,
  SpiritualFocus,
  UpcomingEventItem,
  WeeklyProgramItem,
} from '@/features/dashboard/types';

export const branchesStats: BranchStatsPoint[] = [
  { branchId: 'branch-goma', branchName: 'ECND Goma', members: 520, activities: 24 },
  { branchId: 'branch-lubumbashi', branchName: 'ECND Lubumbashi', members: 360, activities: 18 },
  { branchId: 'branch-kinshasa', branchName: 'ECND Kinshasa', members: 190, activities: 13 },
];

export const monthlyFinanceStats: MonthlyFinancePoint[] = [
  { month: 'Jan', income: 8200, expense: 5300 },
  { month: 'Fev', income: 8600, expense: 5700 },
  { month: 'Mar', income: 9200, expense: 6100 },
  { month: 'Avr', income: 9800, expense: 6400 },
  { month: 'Mai', income: 10100, expense: 6600 },
  { month: 'Juin', income: 10800, expense: 7000 },
  { month: 'Jan', income: 3600, expense: 2300, branchId: 'branch-goma' },
  { month: 'Fev', income: 4000, expense: 2600, branchId: 'branch-goma' },
  { month: 'Mar', income: 4300, expense: 2800, branchId: 'branch-goma' },
  { month: 'Avr', income: 4600, expense: 2900, branchId: 'branch-goma' },
  { month: 'Mai', income: 4900, expense: 3200, branchId: 'branch-goma' },
  { month: 'Juin', income: 5200, expense: 3400, branchId: 'branch-goma' },
  { month: 'Jan', income: 2800, expense: 1700, branchId: 'branch-lubumbashi' },
  { month: 'Fev', income: 3000, expense: 1900, branchId: 'branch-lubumbashi' },
  { month: 'Mar', income: 3200, expense: 2100, branchId: 'branch-lubumbashi' },
  { month: 'Avr', income: 3500, expense: 2300, branchId: 'branch-lubumbashi' },
  { month: 'Mai', income: 3600, expense: 2350, branchId: 'branch-lubumbashi' },
  { month: 'Juin', income: 3900, expense: 2550, branchId: 'branch-lubumbashi' },
];

export const departmentDistribution: DepartmentDistributionPoint[] = [
  { name: 'Actifs', value: 15 },
  { name: 'A renforcer', value: 2 },
  { name: 'En pause', value: 1 },
];

export const membersByDepartment: MembersByDepartmentPoint[] = [
  { departmentId: 'dep-musique', departmentName: 'Musique', members: 27, branchId: 'branch-goma' },
  { departmentId: 'dep-coordination', departmentName: 'Coordination', members: 18, branchId: 'branch-goma' },
  { departmentId: 'dep-logistique', departmentName: 'Logistique', members: 20, branchId: 'branch-goma' },
  { departmentId: 'dep-caisse', departmentName: 'Caisse', members: 12, branchId: 'branch-lubumbashi' },
  { departmentId: 'dep-chanteurs', departmentName: 'Chanteurs', members: 24, branchId: 'branch-lubumbashi' },
  { departmentId: 'dep-info', departmentName: 'Informatique', members: 13, branchId: 'branch-lubumbashi' },
];

export const monthlyAttendance: MonthlyAttendancePoint[] = [
  { label: 'S1', attendance: 540, branchId: 'branch-goma' },
  { label: 'S2', attendance: 570, branchId: 'branch-goma' },
  { label: 'S3', attendance: 585, branchId: 'branch-goma' },
  { label: 'S4', attendance: 600, branchId: 'branch-goma' },
  { label: 'S1', attendance: 340, branchId: 'branch-lubumbashi' },
  { label: 'S2', attendance: 360, branchId: 'branch-lubumbashi' },
  { label: 'S3', attendance: 370, branchId: 'branch-lubumbashi' },
  { label: 'S4', attendance: 385, branchId: 'branch-lubumbashi' },
  { label: 'Jan', attendance: 84, departmentId: 'dep-musique' },
  { label: 'Fev', attendance: 88, departmentId: 'dep-musique' },
  { label: 'Mar', attendance: 90, departmentId: 'dep-musique' },
  { label: 'Avr', attendance: 93, departmentId: 'dep-musique' },
  { label: 'Mai', attendance: 91, departmentId: 'dep-musique' },
  { label: 'Juin', attendance: 95, departmentId: 'dep-musique' },
];

export const membersByCategory: MembersCategoryPoint[] = [
  { category: 'Mamans', value: 230 },
  { category: 'Papas', value: 205 },
  { category: 'Jeunesse', value: 280 },
  { category: 'Enfants', value: 355 },
  { category: 'Mamans', value: 98, branchId: 'branch-goma' },
  { category: 'Papas', value: 82, branchId: 'branch-goma' },
  { category: 'Jeunesse', value: 140, branchId: 'branch-goma' },
  { category: 'Enfants', value: 200, branchId: 'branch-goma' },
  { category: 'Mamans', value: 70, branchId: 'branch-lubumbashi' },
  { category: 'Papas', value: 61, branchId: 'branch-lubumbashi' },
  { category: 'Jeunesse', value: 93, branchId: 'branch-lubumbashi' },
  { category: 'Enfants', value: 136, branchId: 'branch-lubumbashi' },
];

export const recentActivities: ActivityItem[] = [
  {
    id: 'act-001',
    title: 'Validation rapport financier',
    description: 'Le rapport mensuel de mars a ete valide.',
    date: '2026-04-01',
    level: 'success',
    status: 'termine',
    branchId: 'branch-goma',
  },
  {
    id: 'act-002',
    title: 'Preparation conference familles',
    description: 'Equipe protocole mobilisee pour l\'evenement.',
    date: '2026-04-02',
    level: 'info',
    status: 'en_cours',
    branchId: 'branch-lubumbashi',
  },
  {
    id: 'act-003',
    title: 'Alerte budget media',
    description: 'Le departement media atteint 92% du budget trimestriel.',
    date: '2026-04-02',
    level: 'warning',
    status: 'en_cours',
    branchId: 'branch-kinshasa',
  },
  {
    id: 'act-004',
    title: 'Repetition hebdomadaire',
    description: 'Participation du departement musique en progression.',
    date: '2026-04-01',
    level: 'success',
    status: 'termine',
    departmentId: 'dep-musique',
    branchId: 'branch-goma',
  },
  {
    id: 'act-005',
    title: 'Annonce planning culte',
    description: 'Mise a jour des horaires des services de la semaine.',
    date: '2026-04-02',
    level: 'info',
    status: 'planifie',
    departmentId: 'dep-musique',
    branchId: 'branch-goma',
  },
];

export const recentReports: ReportItem[] = [
  {
    id: 'dr-001',
    title: 'Synthese financiere T1',
    period: 'T1 2026',
    generatedAt: '2026-04-01',
    type: 'finance',
    departmentName: 'Tresorerie',
    summary: 'Hausse des offrandes de 11% et depenses maitrisees.',
    status: 'soumis',
    branchId: 'branch-goma',
  },
  {
    id: 'dr-002',
    title: 'Rapport attendance global',
    period: 'Mars 2026',
    generatedAt: '2026-03-30',
    type: 'attendance',
    departmentName: 'Coordination',
    summary: 'Frequentation stable avec pic le dimanche 17h.',
    status: 'en_attente',
    branchId: 'branch-lubumbashi',
  },
  {
    id: 'dr-003',
    title: 'Performance departement musique',
    period: 'Mars 2026',
    generatedAt: '2026-03-29',
    type: 'department',
    departmentName: 'Musique',
    summary: 'Objectifs atteints a 92% pour le trimestre.',
    status: 'soumis',
    branchId: 'branch-goma',
    departmentId: 'dep-musique',
  },
];

export const financeCategories: FinanceCategoryPoint[] = [
  { category: 'Offrandes', value: 36, branchId: 'branch-goma' },
  { category: 'Dimes', value: 28, branchId: 'branch-goma' },
  { category: 'Dons', value: 18, branchId: 'branch-goma' },
  { category: 'Charges', value: 18, branchId: 'branch-goma' },
  { category: 'Offrandes', value: 40, branchId: 'branch-lubumbashi' },
  { category: 'Dimes', value: 24, branchId: 'branch-lubumbashi' },
  { category: 'Dons', value: 22, branchId: 'branch-lubumbashi' },
  { category: 'Charges', value: 14, branchId: 'branch-lubumbashi' },
];

export const departmentPerformance: DepartmentPerformancePoint[] = [
  {
    departmentId: 'dep-musique',
    departmentName: 'Musique',
    completionRate: 92,
    target: 12,
    achieved: 11,
    branchId: 'branch-goma',
  },
  {
    departmentId: 'dep-coordination',
    departmentName: 'Coordination',
    completionRate: 78,
    target: 9,
    achieved: 7,
    branchId: 'branch-goma',
  },
  {
    departmentId: 'dep-logistique',
    departmentName: 'Logistique',
    completionRate: 82,
    target: 11,
    achieved: 9,
    branchId: 'branch-goma',
  },
];

export const upcomingEvents: UpcomingEventItem[] = [
  {
    id: 'ue-001',
    title: 'Conference Maranatha',
    date: '2026-04-19',
    location: 'Temple Principal Goma',
    branchId: 'branch-goma',
  },
  {
    id: 'ue-001b',
    title: 'Conference des Familles',
    date: '2026-04-19',
    location: 'Temple Principal Goma',
    branchId: 'branch-goma',
  },
  {
    id: 'ue-002',
    title: 'Veillee de Priere inter-branches',
    date: '2026-04-13',
    location: 'Grand Temple Lubumbashi',
    branchId: 'branch-lubumbashi',
  },
  {
    id: 'ue-003',
    title: 'Reunion des responsables departements',
    date: '2026-04-09',
    location: 'Salle de conseil',
    branchId: 'branch-goma',
  },
  {
    id: 'ue-004',
    title: 'Conference leadership jeunesse',
    date: '2026-04-09',
    location: 'Salle de louange',
    branchId: 'branch-goma',
    departmentId: 'dep-musique',
  },
];

export const spiritualFocus: SpiritualFocus = {
  verseReference: 'Esaie 43:19',
  verseText: 'Voici, je vais faire une chose nouvelle, sur le point d\'arriver: ne la connaitrez-vous pas?',
  visionTitle: 'Vision ECND',
  visionText: 'Conduire les ames a Christ, former des disciples et impacter la cite par la saintete et le service.',
  inspirationalMessage: 'Servons avec excellence, dans l\'unite, pour la gloire de Dieu.',
};

export const weeklyProgram: WeeklyProgramItem[] = [
  { day: 'Lundi', title: 'Formation des ouvriers', startTime: '18:00', location: 'Salle de formation' },
  { day: 'Mercredi', title: 'Etude biblique', startTime: '17:30', location: 'Temple principal' },
  { day: 'Vendredi', title: 'Soiree de priere', startTime: '18:30', location: 'Sanctuaire' },
  { day: 'Dimanche', title: 'Culte dominical', startTime: '08:30', location: 'Temple principal' },
];

export const smartAlerts: SmartAlertItem[] = [
  {
    id: 'alert-001',
    title: 'Rapport manquant',
    description: 'Le departement Proprete n\'a pas soumis son rapport mensuel.',
    level: 'warning',
    branchId: 'branch-goma',
  },
  {
    id: 'alert-002',
    title: 'Faible activite',
    description: 'Participation en baisse de 14% au departement Evangelisation.',
    level: 'critical',
    branchId: 'branch-kinshasa',
    departmentId: 'dep-evangelisation',
  },
  {
    id: 'alert-003',
    title: 'Baisse des finances',
    description: 'Les dons hebdomadaires ont diminue de 8% sur deux semaines consecutives.',
    level: 'warning',
    branchId: 'branch-lubumbashi',
  },
];

export const globalKpis: KpiItem[] = [
  { key: 'growth', label: 'Croissance', value: '+12.4%', trend: 12.4 },
  { key: 'attendance', label: 'Frequentation', value: '+6.8%', trend: 6.8 },
  { key: 'expenses', label: 'Depenses', value: '-2.1%', trend: -2.1 },
  { key: 'revenues', label: 'Revenus', value: '+9.7%', trend: 9.7 },
];

