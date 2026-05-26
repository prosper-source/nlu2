import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getJoinRequests, approveJoinRequest, rejectJoinRequest, getPendingSubmissions, approveWarSubmission, rejectWarSubmission, getApprovedMembers, updateUserRole } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner, EmptyState } from '@/components/shared/LoadingSpinner';
import { StatCard } from '@/components/shared/StatCard';
import { Shield, UserCheck, Swords, Users, CheckCircle2, XCircle, ArrowUpDown, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { JoinRequest, WarSubmission, UserProfile } from '@/types';

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [pendingSubs, setPendingSubs] = useState<WarSubmission[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('requests');

  useEffect(() => { if (!isAdmin) { navigate('/dashboard'); return; } loadData(); }, [isAdmin]);

  const loadData = async () => {
    try {
      const [reqs, subs, mems] = await Promise.all([getJoinRequests(), getPendingSubmissions(), getApprovedMembers()]);
      setJoinRequests(reqs); setPendingSubs(subs); setMembers(mems);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'join_requests' }, () => { loadData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'war_submissions' }, () => { loadData(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const handleApproveJoin = async (id: string) => {
    try { await approveJoinRequest(id); await loadData(); toast({ title: 'Request approved' }); }
    catch (err: any) { toast({ title: err.message || 'Failed to approve', variant: 'destructive' }); }
  };

  const handleRejectJoin = async (id: string) => {
    try { await rejectJoinRequest(id); await loadData(); toast({ title: 'Request rejected' }); }
    catch (err: any) { toast({ title: err.message || 'Failed to reject', variant: 'destructive' }); }
  };

  const handleApproveWar = async (id: string) => {
    try { await approveWarSubmission(id); await loadData(); toast({ title: 'Submission approved - points added' }); }
    catch (err: any) { toast({ title: err.message || 'Failed to approve', variant: 'destructive' }); }
  };

  const handleRejectWar = async (id: string) => {
    try { await rejectWarSubmission(id); await loadData(); toast({ title: 'Submission rejected' }); }
    catch (err: any) { toast({ title: err.message || 'Failed to reject', variant: 'destructive' }); }
  };

  const handleRoleChange = async (userId: string, role: 'member' | 'admin') => {
    try { await updateUserRole(userId, role); await loadData(); toast({ title: `Role updated to ${role}` }); }
    catch (err: any) { toast({ title: err.message || 'Failed to update role', variant: 'destructive' }); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="top-glow pt-2">
        <h1 className="text-2xl font-display font-bold text-white gradient-text">Admin Panel</h1>
        <p className="text-slate-500 text-sm font-body">Manage the squad</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Pending Requests" value={joinRequests.length} delay={0} />
        <StatCard icon={Swords} label="Pending Submissions" value={pendingSubs.length} delay={0.05} />
        <StatCard icon={Shield} label="Total Members" value={members.length} delay={0.1} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white/[0.03] border border-white/[0.06]">
          <TabsTrigger value="requests" className="data-[state=active]:bg-crimson-500/10 data-[state=active]:text-crimson-300 text-slate-500 font-display text-xs tracking-wider">
            <UserCheck className="w-3.5 h-3.5 mr-1.5" /> REQUESTS ({joinRequests.length})
          </TabsTrigger>
          <TabsTrigger value="submissions" className="data-[state=active]:bg-crimson-500/10 data-[state=active]:text-crimson-300 text-slate-500 font-display text-xs tracking-wider">
            <Swords className="w-3.5 h-3.5 mr-1.5" /> SUBMISSIONS ({pendingSubs.length})
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-crimson-500/10 data-[state=active]:text-crimson-300 text-slate-500 font-display text-xs tracking-wider">
            <Users className="w-3.5 h-3.5 mr-1.5" /> MEMBERS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          {joinRequests.length === 0 ? (
            <EmptyState icon={UserCheck} title="No pending requests" description="All join requests have been processed" />
          ) : (
            <div className="space-y-3">
              {joinRequests.map((req, i) => (
                <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl glass-card-glow top-glow">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10 border border-crimson-500/15">
                      <AvatarImage src={req.user?.avatar_url} />
                      <AvatarFallback className="bg-crimson-500/15 text-crimson-300 text-sm">{(req.user?.username || 'U')[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white font-body">{req.user?.display_name || req.user?.username}</p>
                      <p className="text-xs text-slate-600 font-body">Requested {new Date(req.requested_at || req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApproveJoin(req.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs tracking-wider">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> APPROVE
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRejectJoin(req.id)} className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-display text-xs tracking-wider">
                        <XCircle className="w-3 h-3 mr-1" /> REJECT
                      </Button>
                    </div>
                  </div>
                  {req.message && (
                    <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <MessageSquare className="w-3 h-3 text-slate-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-400 font-body">{req.message}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          {pendingSubs.length === 0 ? (
            <EmptyState icon={Swords} title="No pending submissions" description="All war submissions have been reviewed" />
          ) : (
            <div className="space-y-3">
              {pendingSubs.map((sub, i) => (
                <motion.div key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl glass-card-glow top-glow">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10 border border-crimson-500/15">
                      <AvatarImage src={sub.user?.avatar_url} />
                      <AvatarFallback className="bg-crimson-500/15 text-crimson-300 text-sm">{(sub.user?.username || 'U')[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white font-body">{sub.user?.display_name || sub.user?.username}</p>
                      <p className="text-xs text-slate-600 font-body">{sub.points} pts on {new Date(sub.war_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApproveWar(sub.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs tracking-wider">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> APPROVE
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRejectWar(sub.id)} className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-display text-xs tracking-wider">
                        <XCircle className="w-3 h-3 mr-1" /> REJECT
                      </Button>
                    </div>
                  </div>
                  {sub.note && (
                    <div className="mt-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <p className="text-xs text-slate-400 font-body">{sub.note}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <div className="space-y-3">
            {members.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 rounded-xl glass-card-glow top-glow">
                <Avatar className="w-10 h-10 border border-crimson-500/15">
                  <AvatarImage src={m.avatar_url} />
                  <AvatarFallback className="bg-crimson-500/15 text-crimson-300 text-sm">{m.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white font-body">{m.display_name || m.username}</p>
                  <p className="text-xs text-slate-600 font-body">{m.total_points} pts | {m.weekly_points}/wk</p>
                </div>
                <Badge variant="outline" className={`font-display text-[10px] tracking-wider ${m.role === 'admin' ? 'border-crimson-500/25 text-crimson-300' : 'border-slate-700 text-slate-500'}`}>
                  {m.role.toUpperCase()}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => handleRoleChange(m.id, m.role === 'admin' ? 'member' : 'admin')}
                  className="border-white/[0.08] text-slate-400 hover:bg-white/[0.04] font-display text-xs tracking-wider">
                  <ArrowUpDown className="w-3 h-3 mr-1" />{m.role === 'admin' ? 'DEMOTE' : 'PROMOTE'}
                </Button>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
