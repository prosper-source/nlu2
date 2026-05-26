import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getAnnouncements, createAnnouncement, deleteAnnouncement, updateAnnouncement } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoadingSpinner, EmptyState } from '@/components/shared/LoadingSpinner';
import { Megaphone, Plus, Trash2, Clock, Pin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import type { Announcement } from '@/types';

export default function AnnouncementsPage() {
  const { user, isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);
  const [posting, setPosting] = useState(false);
  const { toast } = useToast();

  const loadAnnouncements = async () => {
    try { const data = await getAnnouncements(); setAnnouncements(data); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { loadAnnouncements(); }, []);

  const handlePost = async () => {
    if (!user || !title.trim() || !content.trim()) return;
    setPosting(true);
    try {
      await createAnnouncement(title, content, user.id, pinned);
      await loadAnnouncements();
      setTitle(''); setContent(''); setPinned(false); setDialogOpen(false);
      toast({ title: 'Announcement posted' });
    } catch (err: any) { toast({ title: err.message || 'Failed to post', variant: 'destructive' }); } finally { setPosting(false); }
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      await updateAnnouncement(id, { pinned: !currentPinned });
      await loadAnnouncements();
      toast({ title: currentPinned ? 'Unpinned' : 'Pinned' });
    } catch (err: any) { toast({ title: err.message || 'Failed to update', variant: 'destructive' }); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteAnnouncement(id); await loadAnnouncements(); toast({ title: 'Announcement deleted' }); }
    catch (err: any) { toast({ title: err.message || 'Failed to delete', variant: 'destructive' }); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="top-glow pt-2">
          <h1 className="text-2xl font-display font-bold text-white gradient-text">Announcements</h1>
          <p className="text-slate-500 text-sm font-body">Latest updates from the squad</p>
        </motion.div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-crimson-500 hover:bg-crimson-600 text-white glow-btn font-display text-xs tracking-wider"><Plus className="w-4 h-4 mr-1" /> NEW</Button>
            </DialogTrigger>
            <DialogContent className="bg-surface-900/95 border-white/[0.06] backdrop-blur-xl">
              <DialogHeader><DialogTitle className="text-white font-display">Post Announcement</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm font-body">Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title"
                    className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-crimson-500/50 font-body" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm font-body">Content</Label>
                  <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Write your announcement..."
                    className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-crimson-500/50 resize-none font-body" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="pin-check" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded border-white/10 accent-crimson-500" />
                  <Label htmlFor="pin-check" className="text-slate-400 text-sm cursor-pointer font-body">Pin this announcement</Label>
                </div>
                <Button onClick={handlePost} disabled={posting} className="w-full bg-crimson-500 hover:bg-crimson-600 text-white glow-btn font-display text-xs tracking-wider">
                  {posting ? 'POSTING...' : 'POST ANNOUNCEMENT'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements" description="Check back later for squad updates" />
      ) : (
        <div className="space-y-4">
          {announcements.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`glass-card-glow rounded-xl top-glow ${a.pinned ? 'border-crimson-500/15' : 'border-white/[0.06]'} glass-card-hover transition-colors`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Megaphone className="w-4 h-4 text-crimson-500" />
                        <h3 className="text-base font-display font-semibold text-white">{a.title}</h3>
                        {a.pinned && (
                          <span className="inline-flex items-center gap-1 text-[8px] font-display font-bold text-crimson-500 uppercase tracking-wider bg-crimson-500/8 px-1.5 py-0.5 rounded">
                            <Pin className="w-2.5 h-2.5" /> PINNED
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap font-body">{a.content}</p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-slate-600 font-body">
                        <Clock className="w-3 h-3" />
                        {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {a.user && <span>by {a.user.display_name || a.user.username}</span>}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => handleTogglePin(a.id, a.pinned)}
                          className={`${a.pinned ? 'text-crimson-500' : 'text-slate-700'} hover:text-crimson-500 hover:bg-crimson-500/8`}>
                          <Pin className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}
                          className="text-slate-700 hover:text-rose-400 hover:bg-rose-500/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
