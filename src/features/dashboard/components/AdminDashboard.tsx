import {
  ActivityFeed,
  AdvancedStatCard,
  AlertsPanel,
  ChartCard,
  EmptyChartState,
  FinanceSummaryCard,
  MiniCalendar,
  QuickActions,
  ReportList,
  SpiritualFocusCard,
  UpcomingEventsCard,
  WeeklyProgramCard,
} from '@/components/dashboard';
import { getSpiritualFocus, getWeeklyProgram } from '@/features/dashboard/lib/dashboardSelectors';
import { type UseDashboardStatsResult } from '@/hooks/useDashboardStats';
import type { Profile } from '@/types';
import { usePreferences } from '@/contexts/PreferencesContext';
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

interface AdminDashboardProps {
  user: Profile;
  dashboard: UseDashboardStatsResult;
}

const colors = ['#0f766e', '#22c55e', '#f59e0b', '#94a3b8'];

export function AdminDashboard({ user, dashboard }: AdminDashboardProps) {
  const { formatMoney } = usePreferences();
  const activeMembers = dashboard.counts.activeMembers;
  const newMembers = dashboard.counts.newMembers;

  const membersChart = dashboard.membersByDepartment;
  const financeTrend = dashboard.financeMonthly;
  const financeCategories = dashboard.financeByCategory;
  const membersCategory = dashboard.membersByCategory;
  const attendance = dashboard.attendance;
  const activities = dashboard.recentActivities.slice(0, 6);
  const activitiesMonthly = attendance.map((item) => ({ label: item.label, activities: Math.round(item.attendance / 8) }));
  const reports = dashboard.reports.slice(0, 4);
  const departmentReports = dashboard.reports.filter((item) => item.departmentName).slice(0, 4);
  const upcoming = dashboard.upcomingEvents.slice(0, 5);
  const alerts = dashboard.openAlerts.slice(0, 3);
  const spiritual = getSpiritualFocus();
  const weeklyProgram = getWeeklyProgram();

  const totalIncome = financeTrend.reduce((sum, item) => sum + item.income, 0);
  const totalExpense = financeTrend.reduce((sum, item) => sum + item.expense, 0);

  return (
    <div className="space-y-6">
      <SpiritualFocusCard content={spiritual} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdvancedStatCard label="Membres actifs" value={String(activeMembers)} subtitle="Extension locale" icon={Users} trend={5.6} tone="success" />
        <AdvancedStatCard label="Nouveaux membres" value={String(newMembers)} subtitle="30 derniers jours" icon={UserPlus} trend={3.8} />
        <AdvancedStatCard label="Cultes cette semaine" value={String(dashboard.counts.servicesThisWeek)} subtitle="Programme local" icon={Church} trend={1.9} />
        <AdvancedStatCard label="Finances du mois" value={formatMoney(totalIncome - totalExpense)} subtitle="Solde semestriel" icon={Wallet} trend={4.2} />
        <AdvancedStatCard label="Departements actifs" value={String(dashboard.counts.activeDepartments)} subtitle="Unites en service" icon={Landmark} trend={3.1} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Membres par departement" description="Distribution locale">
          {membersChart.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={membersChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="departmentName" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="members" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Evolution des finances" description="Revenus et depenses mensuels">
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
          {financeCategories.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={financeCategories} dataKey="value" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
                  {financeCategories.map((item, index) => (
                    <Cell key={`${item.category}-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Membres par categorie" description="Segmentation locale">
          {membersCategory.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={membersCategory} dataKey="value" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
                  {membersCategory.map((item, index) => (
                    <Cell key={`${item.category}-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Frequentation des cultes" description="Activite hebdomadaire">
          {attendance.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendance}>
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
        <ChartCard title="Activite mensuelle" description="Dynamique des actions locales">
          {activitiesMonthly.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activitiesMonthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="activities" stroke="#0ea5e9" fill="#bae6fd" strokeWidth={2} />
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
          <UpcomingEventsCard title="Evenements importants" events={upcoming} />
          <AlertsPanel alerts={alerts} />
        </div>
        <div className="space-y-4 xl:col-span-3">
          <QuickActions role={user.role} />
          <MiniCalendar events={upcoming} />
        </div>
      </section>
    </div>
  );
}

