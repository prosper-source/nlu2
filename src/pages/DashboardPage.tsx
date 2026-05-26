import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getDashboardStats, getAnnouncements } from '@/services/api';
import { StatCard } from '@/components/shared/StatCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Users, Flame, AlertCircle, Megaphone, Trophy, Swords, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import type { Announcement } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{ totalMembers: number; weeklyPoints: number; pendingSubmissions: number; pendingRequests: number; topContributors: any[] } | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, a] = await Promise.all([getDashboardStats(), getAnnouncements()]);
        setStats(s);
        setAnnouncements(a.slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  const nextSaturday = (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day <= 6 ? 6 - day : 6;
    d.setDate(d.getDate() + diff);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  })();

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="top-glow pt-2">
        <h1 className="text-2xl font-display font-bold text-white gradient-text">Dashboard</h1>
        <p className="text-slate-500 text-sm font-body">Welcome back, {user?.display_name || user?.username}</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Members" value={stats?.totalMembers || 0} delay={0} />
        <StatCard icon={Flame} label="Weekly Points" value={stats?.weeklyPoints || 0} delay={0.05} />
        <StatCard icon={Swords} label="Next War" value={nextSaturday} delay={0.1} />
        <StatCard icon={AlertCircle} label="Pending Reviews" value={(stats?.pendingSubmissions || 0) + (stats?.pendingRequests || 0)} delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card-glow rounded-xl border-white/[0.06] top-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-base font-display">
              <Trophy className="w-4 h-4 text-crimson-500" /> Top Contributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats?.topContributors || []).map((m: any, i: number) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className={`w-6 text-xs font-display font-bold ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-500' : 'text-slate-600'}`}>
                    #{i + 1}
                  </span>
                  <Avatar className="w-8 h-8 border border-crimson-500/15">
                    <AvatarImage src={m.avatar_url} />
                    <AvatarFallback className="bg-crimson-500/15 text-crimson-300 text-xs">{(m.username || 'U')[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm text-slate-300 truncate font-body">{m.display_name || m.username}</span>
                  <span className="text-sm font-display font-medium text-crimson-300 counter-glow">{m.total_points} pts</span>
                </div>
              ))}
              {(!stats?.topContributors?.length) && (
                <p className="text-sm text-slate-600 text-center py-4 font-body">No contributors yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-glow rounded-xl border-white/[0.06] top-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-base font-display">
              <Megaphone className="w-4 h-4 text-crimson-500" /> Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.map((a) => (
                <div key={a.id} className={`border-l-2 ${a.pinned ? 'border-crimson-500/40' : 'border-crimson-500/20'} pl-3`}>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-white font-body">{a.title}</h4>
                    {a.pinned && <span className="text-[8px] font-display font-bold text-crimson-500 uppercase tracking-wider">Pinned</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 font-body">{a.content}</p>
                  <p className="text-xs text-slate-600 mt-1 font-body">
                    {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
              {announcements.length === 0 && (
                <p className="text-sm text-slate-600 text-center py-4 font-body">No announcements yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Submit Points', icon: Swords, path: '/war' },
          { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
          { label: 'Chat', icon: MessageSquare, path: '/chat' },
          { label: 'Members', icon: Users, path: '/members' },
        ].map((action, i) => (
          <motion.a
            key={action.path}
            href={action.path}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl glass-card-glow glass-card-hover transition-all duration-200 top-glow"
          >
            <action.icon className="w-5 h-5 text-crimson-500" />
            <span className="text-xs font-display font-medium text-slate-400 tracking-wider uppercase">{action.label}</span>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
