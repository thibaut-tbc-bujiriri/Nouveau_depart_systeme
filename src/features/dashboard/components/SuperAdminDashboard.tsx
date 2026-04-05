import {
  ActivityFeed,
  AdvancedStatCard,
  AlertsPanel,
  ChartCard,
  DepartmentPerformanceCard,
  EmptyChartState,
  FinanceSummaryCard,
  MiniCalendar,
  QuickActions,
  ReportList,
  SpiritualFocusCard,
  SummaryBadge,
  UpcomingEventsCard,
  WeeklyProgramCard,
} from '@/components/dashboard';
import { departments } from '@/data';
import { getScopedKpis, getSpiritualFocus, getWeeklyProgram } from '@/features/dashboard/lib/dashboardSelectors';
import { type UseDashboardStatsResult } from '@/hooks/useDashboardStats';
import type { Profile } from '@/types';
import { formatCurrency } from '@/utils/format';
import { Church, Landmark, UserPlus, Users, Wallet } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface SuperAdminDashboardProps {
  user: Profile;
  dashboard: UseDashboardStatsResult;
}

const pieColors = ['#0f766e', '#22c55e', '#f59e0b', '#0ea5e9'];

export function SuperAdminDashboard({ user, dashboard }: SuperAdminDashboardProps) {
  const branchesData = dashboard.branchesData;
  const financeTrend = dashboard.financeMonthly;
  const distribution = dashboard.financeByCategory;
  const membersCategory = dashboard.membersByCategory;
  const activities = dashboard.recentActivities.slice(0, 5);
  const reports = dashboard.reports.slice(0, 4);
  const departmentReports = dashboard.reports.filter((item) => item.departmentName).slice(0, 4);
  const upcoming = dashboard.upcomingEvents.slice(0, 4);
  const performance = dashboard.departmentPerformance.slice(0, 4);
  const alerts = dashboard.openAlerts.slice(0, 3);
  const kpis = getScopedKpis({ user, departments });
  const spiritual = getSpiritualFocus();
  const weeklyProgram = getWeeklyProgram();

  const totalIncome = financeTrend.reduce((sum, item) => sum + item.income, 0);
  const totalExpense = financeTrend.reduce((sum, item) => sum + item.expense, 0);
  const activeMembers = dashboard.counts.activeMembers;
  const newMembers = dashboard.counts.newMembers;
  const servicesThisWeek = dashboard.counts.servicesThisWeek;
  const activeDepartments = dashboard.counts.activeDepartments;

  const activitiesByBranch = branchesData.map((item) => ({ name: item.branchName, activities: item.activities }));

  const attendanceByWeek = Object.values(
    dashboard.attendance.reduce<Record<string, { label: string; attendance: number }>>((acc, item) => {
      const current = acc[item.label] ?? { label: item.label, attendance: 0 };
      current.attendance += item.attendance;
      acc[item.label] = current;
      return acc;
    }, {}),
  );

  return (
    <div className="space-y-6">
      <SpiritualFocusCard content={spiritual} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdvancedStatCard label="Membres actifs" value={String(activeMembers)} subtitle="Suivi global" icon={Users} trend={9.2} />
        <AdvancedStatCard label="Nouveaux membres" value={String(newMembers)} subtitle="30 derniers jours" icon={UserPlus} tone="success" trend={6.8} />
        <AdvancedStatCard label="Cultes cette semaine" value={String(servicesThisWeek)} subtitle="Tous sites" icon={Church} trend={5.1} />
        <AdvancedStatCard label="Finances du mois" value={formatCurrency(totalIncome - totalExpense)} subtitle="Net consolide" icon={Wallet} tone="warning" trend={4.4} />
        <AdvancedStatCard label="Departements actifs" value={String(activeDepartments)} subtitle="Unites engagees" icon={Landmark} trend={3.9} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <SummaryBadge key={kpi.key} label={kpi.label} value={kpi.value} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Membres par extension" description="Comparaison inter-extensions">
          {branchesData.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="branchName" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="members" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Evolution des finances" description="Revenus vs depenses mensuels">
          {financeTrend.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={financeTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="income" name="Revenus" stroke="#0f766e" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="expense" name="Depenses" stroke="#ef4444" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Repartition finances" description="Sources et charges">
          {distribution.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
                  {distribution.map((entry, index) => (
                    <Cell key={`${entry.category}-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Membres par categorie" description="Segmentation communautaire">
          {membersCategory.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={membersCategory} dataKey="value" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
                  {membersCategory.map((entry, index) => (
                    <Cell key={`${entry.category}-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Frequentation des cultes" description="Total hebdomadaire multi-sites">
          {attendanceByWeek.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceByWeek}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="attendance" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Activite mensuelle" description="Volume par extension">
          {activitiesByBranch.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activitiesByBranch}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="activities" stroke="#0284c7" fill="#7dd3fc" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <WeeklyProgramCard items={weeklyProgram} />
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-5">
          <ActivityFeed activities={activities} />
          <ReportList reports={reports} />
          <ReportList title="Rapports departements" reports={departmentReports} />
        </div>
        <div className="space-y-4 xl:col-span-4">
          <FinanceSummaryCard income={totalIncome} expense={totalExpense} />
          <DepartmentPerformanceCard items={performance} />
          <AlertsPanel alerts={alerts} />
        </div>
        <div className="space-y-4 xl:col-span-3">
          <QuickActions role={user.role} />
          <UpcomingEventsCard title="Evenements importants" events={upcoming} />
          <MiniCalendar events={upcoming} />
        </div>
      </section>
    </div>
  );
}

