import {
  ActivityFeed,
  AdvancedStatCard,
  MiniCalendar,
  QuickActions,
  SectionCard,
  DailyVerseCard,
  UpcomingEventsCard,
  WeeklyProgramCard,
} from '@/components/dashboard';
import { getWeeklyProgram } from '@/features/dashboard/lib/dashboardSelectors';
import { type UseDashboardStatsResult } from '@/hooks/useDashboardStats';
import type { Profile } from '@/types';
import { BellRing, CalendarDays, UsersRound } from 'lucide-react';

interface DepartmentMemberDashboardProps {
  user: Profile;
  dashboard: UseDashboardStatsResult;
}

export function DepartmentMemberDashboard({ user, dashboard }: DepartmentMemberDashboardProps) {
  const department = dashboard.membersByDepartment.find((item) => user.departmentIds.includes(item.departmentId));
  const activities = dashboard.recentActivities.slice(0, 5);
  const upcoming = dashboard.upcomingEvents.slice(0, 4);
  const weeklyProgram = getWeeklyProgram();

  return (
    <div className="space-y-6">
      <DailyVerseCard user={user} />

      <section className="grid gap-4 md:grid-cols-3">
        <AdvancedStatCard label="Mon departement" value={department?.departmentName ?? 'N/A'} subtitle="Service principal" icon={UsersRound} />
        <AdvancedStatCard label="Annonces" value={String(activities.length)} subtitle="Informations recentes" icon={BellRing} tone="success" />
        <AdvancedStatCard label="Evenements" value={String(upcoming.length)} subtitle="Calendrier simplifie" icon={CalendarDays} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <WeeklyProgramCard items={weeklyProgram} />
        <SectionCard>
          <h3 className="text-base font-semibold text-slate-900">Message du departement</h3>
          <p className="mt-2 text-sm text-slate-600">
            Soyez ponctuel aux rendez-vous de priere, restez engage dans les repetitions et soutenez les activites missionnaires.
          </p>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-6">
          <ActivityFeed title="Annonces et activites" activities={activities} />
          <SectionCard>
            <h3 className="text-base font-semibold text-slate-900">Resume departement</h3>
            <p className="mt-2 text-sm text-slate-600">
              Restez aligne avec les objectifs de votre equipe, participez aux activites programmees et consultez les annonces importantes.
            </p>
          </SectionCard>
        </div>
        <div className="space-y-4 xl:col-span-3">
          <UpcomingEventsCard title="Evenements importants" events={upcoming} />
          <MiniCalendar events={upcoming} />
        </div>
        <div className="space-y-4 xl:col-span-3">
          <QuickActions role={user.role} />
        </div>
      </section>
    </div>
  );
}

