import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { submitWarPoints, getMyWarSubmissions } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner, EmptyState } from '@/components/shared/LoadingSpinner';
import { Swords, Clock, CheckCircle2, XCircle, CalendarDays, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import type { WarSubmission } from '@/types';

const warSchema = z.object({
  points: z.number().min(0, 'Points must be positive').max(100000, 'Points too high'),
  warDate: z.string().min(1, 'War date is required'),
});

function getNextSaturdays(count: number): Date[] {
  const saturdays: Date[] = [];
  const d = new Date();
  while (saturdays.length < count) { if (d.getDay() === 6) saturdays.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return saturdays;
}

export default function WarPage() {
  const { user } = useAuth();
  const [points, setPoints] = useState('');
  const [warDate, setWarDate] = useState('');
  const [note, setNote] = useState('');
  const [submissions, setSubmissions] = useState<WarSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const saturdays = getNextSaturdays(4);

  const isNonSaturday = warDate ? new Date(warDate).getDay() !== 6 : false;

  useEffect(() => {
    async function load() { if (!user) return; try { const data = await getMyWarSubmissions(user.id); setSubmissions(data); } catch (err) { console.error(err); } finally { setLoading(false); } }
    load();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const result = warSchema.safeParse({ points: Number(points), warDate });
    if (!result.success) { toast({ title: result.error.issues[0]?.message || 'Invalid input', variant: 'destructive' }); return; }
    setSubmitting(true);
    try {
      await submitWarPoints(user.id, Number(points), warDate, note);
      const data = await getMyWarSubmissions(user.id); setSubmissions(data);
      setPoints(''); setWarDate(''); setNote('');
      toast({ title: 'War points submitted for review' });
    } catch (err: any) { toast({ title: err.message || 'Submission failed', variant: 'destructive' }); } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner />;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 font-display text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" /> APPROVED</Badge>;
      case 'rejected': return <Badge variant="outline" className="border-rose-500/30 text-rose-400 font-display text-[10px]"><XCircle className="w-3 h-3 mr-1" /> REJECTED</Badge>;
      default: return <Badge variant="outline" className="border-amber-500/30 text-amber-400 font-display text-[10px]"><Clock className="w-3 h-3 mr-1" /> PENDING</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="top-glow pt-2">
        <h1 className="text-2xl font-display font-bold text-white gradient-text">War Submissions</h1>
        <p className="text-slate-500 text-sm font-body">Submit your weekly war points</p>
      </motion.div>

      <Card className="glass-card-glow rounded-xl border-white/[0.06] top-glow">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 font-display"><Swords className="w-5 h-5 text-crimson-500" /> Submit Points</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-400 text-sm font-body">Points Scored</Label>
              <Input type="number" min={0} placeholder="Enter points" value={points} onChange={(e) => setPoints(e.target.value)} required
                className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-crimson-500/50 focus:ring-crimson-500/20 font-body font-display" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-sm font-body">War Date</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {saturdays.map((s) => (
                  <button key={s.toISOString()} type="button" onClick={() => setWarDate(s.toISOString().split('T')[0])}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors font-display tracking-wider ${warDate === s.toISOString().split('T')[0] ? 'border-crimson-500/25 bg-crimson-500/8 text-crimson-300' : 'border-white/[0.06] glass-card text-slate-500 hover:border-white/10'}`}>
                    <CalendarDays className="w-3 h-3 inline mr-1" />{s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </button>
                ))}
              </div>
              <Input type="date" value={warDate} onChange={(e) => setWarDate(e.target.value)} required
                className="bg-white/[0.03] border-white/[0.08] text-white focus:border-crimson-500/50 focus:ring-crimson-500/20 font-body" />
              {isNonSaturday && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/8 border border-amber-500/15">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-400 font-body">This date is not a Saturday. Submission will still be accepted.</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-sm font-body">Note <span className="text-slate-600">(optional)</span></Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Add any notes about your submission..."
                className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-crimson-500/50 focus:ring-crimson-500/20 resize-none font-body" />
            </div>
            <Button type="submit" disabled={submitting} className="bg-crimson-500 hover:bg-crimson-600 text-white glow-btn font-display text-xs tracking-wider">
              <Swords className="w-4 h-4 mr-2" /> {submitting ? 'SUBMITTING...' : 'SUBMIT WAR POINTS'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-display font-semibold text-white mb-4">Submission History</h2>
        {submissions.length === 0 ? (
          <EmptyState icon={Clock} title="No submissions yet" description="Your war point submissions will appear here" />
        ) : (
          <div className="space-y-3">
            {submissions.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-xl glass-card-glow top-glow">
                <div className="w-10 h-10 rounded-lg bg-crimson-500/8 flex items-center justify-center border border-crimson-500/15">
                  <Swords className="w-5 h-5 text-crimson-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-medium text-white counter-glow">{s.points} points</p>
                  <p className="text-xs text-slate-600 font-body">
                    {new Date(s.war_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {s.note && <span className="ml-2 text-slate-500">- {s.note}</span>}
                  </p>
                </div>
                {statusBadge(s.status)}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
