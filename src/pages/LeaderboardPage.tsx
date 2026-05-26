import { useEffect, useState } from 'react';
import { getLeaderboard } from '@/services/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner, EmptyState } from '@/components/shared/LoadingSpinner';
import { Trophy, Medal, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UserProfile } from '@/types';

export default function LeaderboardPage() {
  const [allTime, setAllTime] = useState<UserProfile[]>([]);
  const [weekly, setWeekly] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('alltime');

  useEffect(() => {
    async function load() {
      try {
        const [at, wk] = await Promise.all([getLeaderboard('alltime'), getLeaderboard('weekly')]);
        setAllTime(at);
        setWeekly(wk);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  const data = tab === 'alltime' ? allTime : weekly;
  const pointsKey = tab === 'alltime' ? 'total_points' : 'weekly_points';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="top-glow pt-2">
        <h1 className="text-2xl font-display font-bold text-white gradient-text">Leaderboard</h1>
        <p className="text-slate-500 text-sm font-body">Top performers in the squad</p>
      </motion.div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white/[0.03] border border-white/[0.06]">
          <TabsTrigger value="alltime" className="data-[state=active]:bg-crimson-500/10 data-[state=active]:text-crimson-300 text-slate-500 font-display text-xs tracking-wider">
            <Trophy className="w-3.5 h-3.5 mr-1.5" /> ALL TIME
          </TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-crimson-500/10 data-[state=active]:text-crimson-300 text-slate-500 font-display text-xs tracking-wider">
            <Flame className="w-3.5 h-3.5 mr-1.5" /> WEEKLY
          </TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {data.length === 0 ? (
            <EmptyState icon={Medal} title="No rankings yet" description="Start submitting war points to appear here" />
          ) : (
            <div className="space-y-3">
              {data.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-colors top-glow ${
                    i === 0 ? 'border-amber-500/20 bg-amber-500/[0.04] neon-border' :
                    i === 1 ? 'border-slate-400/15 bg-slate-400/[0.02]' :
                    i === 2 ? 'border-orange-600/15 bg-orange-600/[0.02]' :
                    'border-white/[0.04] glass-card-glow'
                  }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-display font-bold ${
                    i === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/25' :
                    i === 1 ? 'bg-slate-400/10 text-slate-300 border border-slate-400/15' :
                    i === 2 ? 'bg-orange-600/10 text-orange-400 border border-orange-600/15' :
                    'bg-white/[0.03] text-slate-600 border border-white/[0.06]'
                  }`}>
                    {i + 1}
                  </div>
                  <Avatar className="w-10 h-10 border border-crimson-500/15">
                    <AvatarImage src={m.avatar_url} />
                    <AvatarFallback className="bg-crimson-500/15 text-crimson-300 text-sm">{m.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate font-body">{m.display_name || m.username}</p>
                    <p className="text-xs text-slate-600 capitalize font-display">{m.role}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-display font-bold counter-glow ${i === 0 ? 'text-amber-400' : 'text-crimson-300'}`}>{m[pointsKey]}</p>
                    <p className="text-[10px] text-slate-600 font-display tracking-wider uppercase">points</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
