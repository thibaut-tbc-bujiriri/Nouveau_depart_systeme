import {
  ActivityFeed,
  AdvancedStatCard,
  AlertsPanel,
  ChartCard,
  DepartmentPerformanceCard,
  EmptyChartState,
  MiniCalendar,
  QuickActions,
  ReportList,
  DailyVerseCard,
  UpcomingEventsCard,
  WeeklyProgramCard,
} from '@/components/dashboard';
import { getWeeklyProgram } from '@/features/dashboard/lib/dashboardSelectors';
import { type UseDashboardStatsResult } from '@/hooks/useDashboardStats';
import type { Profile } from '@/types';
import { ClipboardCheck, ListChecks, UserRoundCheck } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface DepartmentManagerDashboardProps {
  user: Profile;
  dashboard: UseDashboardStatsResult;
}

const roleColors = ['#0f766e', '#38bdf8'];

export function DepartmentManagerDashboard({ user, dashboard }: DepartmentManagerDashboardProps) {
  const departmentId = user.departmentIds[0];
  const currentDepartment = dashboard.membersByDepartment.find((item) => item.departmentId === departmentId);

  const attendance = dashboard.attendance;
  const activities = dashboard.recentActivities.slice(0, 6);
  const reports = dashboard.reports.slice(0, 4);
  const departmentReports = dashboard.reports.filter((item) => item.departmentName).slice(0, 3);
  const upcoming = dashboard.upcomingEvents.slice(0, 4);
  const alerts = dashboard.openAlerts.slice(0, 2);
  const performance = dashboard.departmentPerformance.filter((item) => item.departmentId === departmentId);
  const weeklyProgram = getWeeklyProgram();

  const rolesDistribution = [
    { name: 'Managers', value: 1 },
    { name: 'Membres', value: Math.max(currentDepartment?.members ?? 0, 0) },
  ];

  return (
    <div className="space-y-6">
      <DailyVerseCard user={user} />

      <section className="grid gap-4 md:grid-cols-3">
        <AdvancedStatCard label="Departement" value={currentDepartment?.departmentName ?? 'Non defini'} subtitle="Vue responsable" icon={ClipboardCheck} trend={7.2} />
        <AdvancedStatCard label="Utilisateurs lies" value={String(currentDepartment?.members ?? 0)} subtitle="Equipe interne" icon={UserRoundCheck} tone="success" trend={5.8} />
        <AdvancedStatCard label="Objectifs" value={String(performance[0]?.target ?? 0)} subtitle="Cycle actuel" icon={ListChecks} trend={4.1} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Participation mensuelle" description="Presence departementale">
          {attendance.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="attendance" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Repartition par fonction" description="Structure equipe departementale">
          {rolesDistribution.every((item) => item.value === 0) ? (
            <EmptyChartState message="Aucune relation utilisateur departement configuree." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rolesDistribution} dataKey="value" nameKey="name" outerRadius={95} label>
                  {rolesDistribution.map((item, index) => (
                    <Cell key={item.name} fill={roleColors[index % roleColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <WeeklyProgramCard items={weeklyProgram} />
        <AlertsPanel alerts={alerts} />
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-5">
          <ActivityFeed activities={activities} />
          <ReportList reports={reports} />
          <ReportList title="Rapports departements" reports={departmentReports} />
        </div>
        <div className="space-y-4 xl:col-span-4">
          <DepartmentPerformanceCard items={performance} />
          <UpcomingEventsCard title="Evenements importants" events={upcoming} />
        </div>
        <div className="space-y-4 xl:col-span-3">
          <QuickActions role={user.role} />
          <MiniCalendar events={upcoming} />
        </div>
      </section>
    </div>
  );
}

