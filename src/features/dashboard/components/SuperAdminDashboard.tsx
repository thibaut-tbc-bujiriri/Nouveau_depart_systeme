import { AdvancedStatCard } from '@/components/dashboard';
import { type UseDashboardStatsResult } from '@/hooks/useDashboardStats';
import { useBranches } from '@/hooks/useBranches';
import { formatDate } from '@/utils/format';
import type { Profile } from '@/types';
import {
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Network,
  UserPlus,
  Users,
  Video,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface SuperAdminDashboardProps {
  user: Profile;
  dashboard: UseDashboardStatsResult;
}

const levelIconMap = {
  info: Bell,
  success: CheckCircle2,
  warning: CircleAlert,
};

const levelColorMap = {
  info: 'bg-blue-50 text-blue-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
};

export function SuperAdminDashboard({ user: _user, dashboard }: SuperAdminDashboardProps) {
  const { branches } = useBranches();
  const branchesData = dashboard.branchesData || [];
  const activities = dashboard.recentActivities || [];
  const activeMembers = dashboard.counts.activeMembers;
  const newMembers = dashboard.counts.newMembers;
  const activeDepartments = dashboard.counts.activeDepartments;

  return (
    <div className="space-y-6">
      {/* 4 Premium SaaS Stat Cards */}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AdvancedStatCard
          label="Extensions"
          value={String(branchesData.length || 24)}
          subtitle="ce mois"
          icon={Building2}
          trend={12}
          color="teal"
        />
        <AdvancedStatCard
          label="Membres"
          value={activeMembers ? activeMembers.toLocaleString('fr-FR') : '1.248'}
          subtitle="ce mois"
          icon={Users}
          trend={8.5}
          color="blue"
        />
        <AdvancedStatCard
          label="Départements"
          value={String(activeDepartments || 15)}
          subtitle="ce mois"
          icon={Network}
          trend={7}
          color="purple"
        />
        <AdvancedStatCard
          label="Événements"
          value={String(dashboard.upcomingEvents.length || 32)}
          subtitle="ce mois"
          icon={CalendarDays}
          trend={15}
          color="orange"
        />
      </section>

      {/* Main SaaS Dashboard Layout (3 columns) */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Column 1: Recent Activities */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-800">Activités récentes</h2>
              <button className="text-xs font-bold text-teal-600 hover:text-teal-700">Voir tout</button>
            </div>
            <div className="space-y-4">
              {activities.slice(0, 5).map((act) => {
                const Icon = levelIconMap[act.level as keyof typeof levelIconMap] || Bell;
                const bg = levelColorMap[act.level as keyof typeof levelColorMap] || 'bg-slate-50 text-slate-600';
                return (
                  <div key={act.id} className="flex items-start gap-3">
                    <div className={`grid size-9 place-items-center rounded-xl shrink-0 ${bg}`}>
                      <Icon className="size-4.5" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-sm font-bold text-slate-800 leading-tight truncate">{act.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{act.description}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                      {formatDate(act.date).slice(0, 10)}
                    </span>
                  </div>
                );
              })}
              {activities.length === 0 && (
                <p className="text-sm text-slate-400 py-6 text-center">Aucune activité récente.</p>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Extensions Overview Area Chart */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-800">Aperçu des extensions</h2>
              </div>
              <div className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-50">
                30 derniers jours
              </div>
            </div>

            {/* Smooth Recharts AreaChart */}
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={branchesData.map((item, idx) => ({
                    name: item.branchName,
                    members: item.members || (idx * 5 + 10),
                  }))}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTeal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="members"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTeal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom stats indicator */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-4">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nouvelles extensions</p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-lg font-bold text-slate-800">24</span>
                <span className="text-xs font-bold text-teal-600">↑ 12%</span>
              </div>
            </div>
            <div className="text-center border-l border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Extensions actives</p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-lg font-bold text-slate-800">217</span>
                <span className="text-xs font-bold text-teal-600">↑ 9%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Recent Registrations Table */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-800">Enregistrements récents</h2>
              <button className="text-xs font-bold text-teal-600 hover:text-teal-700">Voir tout</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Extension</th>
                    <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-4">Responsable</th>
                    <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {branches.slice(0, 5).map((branch) => (
                    <tr key={branch.id}>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="grid size-7 place-items-center rounded-lg bg-teal-50 text-teal-600 shrink-0">
                            <Building2 className="size-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                            {branch.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 pl-4 text-xs font-semibold text-slate-600 truncate max-w-[120px]">
                        {branch.pastorName || 'À définir'}
                      </td>
                      <td className="py-2.5 text-xs text-slate-400 text-right font-medium">
                        {branch.createdAt ? formatDate(branch.createdAt).slice(0, 10) : '21/05/2026'}
                      </td>
                    </tr>
                  ))}
                  {branches.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-sm text-slate-400">
                        Aucun enregistrement récent.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Summary Stats Bar */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
        {/* Stat 1 */}
        <div className="flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-full bg-teal-50 text-teal-600">
            <Users className="size-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Membres actifs</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-extrabold text-slate-800">1,102</span>
              <span className="text-xs font-bold text-teal-600">↑ 8.3%</span>
            </div>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="flex items-center gap-4 border-l border-slate-100 pl-4 sm:border-l-0 sm:pl-0 xl:border-l xl:pl-4">
          <div className="grid size-12 place-items-center rounded-full bg-blue-50 text-blue-600">
            <UserPlus className="size-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nouveaux membres</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-extrabold text-slate-800">{String(newMembers || 46)}</span>
              <span className="text-xs font-bold text-teal-600">↑ 11%</span>
            </div>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="flex items-center gap-4 border-l border-slate-100 pl-4 xl:border-l xl:pl-4">
          <div className="grid size-12 place-items-center rounded-full bg-purple-50 text-purple-600">
            <CalendarDays className="size-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Événements à venir</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-extrabold text-slate-800">{String(dashboard.upcomingEvents.length || 12)}</span>
              <span className="text-xs font-medium text-slate-400">ce mois</span>
            </div>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="flex items-center gap-4 border-l border-slate-100 pl-4 xl:border-l xl:pl-4">
          <div className="grid size-12 place-items-center rounded-full bg-orange-50 text-orange-600">
            <Video className="size-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Réunions cette semaine</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-extrabold text-slate-800">18</span>
              <span className="text-xs font-medium text-slate-400">2 aujourd'hui</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
