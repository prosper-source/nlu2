import { useEffect, useState } from 'react';
import { getApprovedMembers } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner, EmptyState } from '@/components/shared/LoadingSpinner';
import { Users, Search, Trophy, Shield, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UserProfile } from '@/types';

export default function MembersPage() {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getApprovedMembers();
        setMembers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  const filtered = members.filter(
    (m) => m.username.toLowerCase().includes(search.toLowerCase()) || (m.display_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="top-glow pt-2">
        <h1 className="text-2xl font-display font-bold text-white gradient-text">Members</h1>
        <p className="text-slate-500 text-sm font-body">{members.length} members in the squad</p>
      </motion.div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
        <Input placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-crimson-500/50 focus:ring-crimson-500/20 font-body" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No members found" description="Try a different search term" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 p-4 rounded-xl glass-card-glow glass-card-hover transition-colors top-glow">
              <Avatar className="w-10 h-10 border border-crimson-500/15">
                <AvatarImage src={m.avatar_url} />
                <AvatarFallback className="bg-crimson-500/15 text-crimson-300 text-sm">{m.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate font-body">{m.display_name || m.username}</span>
                  {m.role === 'admin' ? (
                    <Badge variant="outline" className="border-crimson-500/25 text-crimson-300 text-[10px] gap-1 font-display">
                      <Shield className="w-2.5 h-2.5" /> ADMIN
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-slate-700 text-slate-500 text-[10px] font-display">MEMBER</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600 truncate font-body">{m.bio || m.game_tag || 'No bio'}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-crimson-500" />
                  <span className="text-sm font-display font-medium text-crimson-300 counter-glow">{m.total_points}</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <Flame className="w-2.5 h-2.5 text-amber-500" />
                  <span className="text-[10px] text-slate-600 font-display">{m.weekly_points}/wk</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
