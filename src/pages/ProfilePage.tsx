import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { updateProfile, uploadAvatar } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Camera, Save, Trophy, Calendar, User, Gamepad2, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const profileSchema = z.object({
  username: z.string().min(3).max(20),
  display_name: z.string().max(50),
  bio: z.string().max(200),
  game_tag: z.string().max(30),
});

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [gameTag, setGameTag] = useState(user?.game_tag || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setDisplayName(user.display_name || '');
      setBio(user.bio);
      setGameTag(user.game_tag || '');
    }
  }, [user]);

  if (!user) return <LoadingSpinner />;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(user.id, file);
      await updateProfile(user.id, { avatar_url: url });
      await refreshProfile();
      toast({ title: 'Avatar updated' });
    } catch (err: any) {
      toast({ title: err.message || 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const result = profileSchema.safeParse({ username, display_name: displayName, bio, game_tag: gameTag });
    if (!result.success) {
      const msg = result.error.issues[0]?.message || 'Invalid input';
      toast({ title: msg, variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await updateProfile(user.id, { username, display_name: displayName, bio, game_tag: gameTag });
      await refreshProfile();
      toast({ title: 'Profile updated' });
    } catch (err: any) {
      toast({ title: err.message || 'Update failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="top-glow pt-2">
        <h1 className="text-2xl font-display font-bold text-white gradient-text">Profile</h1>
        <p className="text-slate-500 text-sm font-body">Manage your account settings</p>
      </motion.div>

      <Card className="glass-card-glow rounded-xl border-white/[0.06] overflow-hidden top-glow">
        <div className="h-24 bg-gradient-to-r from-crimson-500/12 via-crimson-500/4 to-transparent neon-border" />
        <CardContent className="-mt-10 pt-0">
          <div className="flex items-end gap-4">
            <div className="relative group">
              <Avatar className="w-20 h-20 border-4 border-surface-900">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-crimson-500/15 text-crimson-300 text-2xl font-display">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-display font-semibold text-white">{user.display_name || user.username}</h2>
                <Badge variant="outline" className={`${
                  user.role === 'admin' ? 'border-crimson-500/25 text-crimson-300' : 'border-slate-700 text-slate-500'
                } text-[10px] font-display tracking-wider uppercase`}>{user.role}</Badge>
              </div>
              <p className="text-sm text-slate-500 font-body">Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl glass-card-glow p-4 text-center top-glow">
          <Trophy className="w-5 h-5 text-crimson-500 mx-auto mb-2" />
          <p className="text-xl font-display font-bold text-white counter-glow">{user.total_points}</p>
          <p className="text-xs text-slate-500 font-display tracking-wider uppercase">Total Points</p>
        </div>
        <div className="rounded-xl glass-card-glow p-4 text-center top-glow">
          <Flame className="w-5 h-5 text-crimson-500 mx-auto mb-2" />
          <p className="text-xl font-display font-bold text-white counter-glow">{user.weekly_points}</p>
          <p className="text-xs text-slate-500 font-display tracking-wider uppercase">Weekly Points</p>
        </div>
        <div className="rounded-xl glass-card-glow p-4 text-center top-glow">
          <Calendar className="w-5 h-5 text-crimson-500 mx-auto mb-2" />
          <p className="text-xl font-display font-bold text-white counter-glow">{Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))}</p>
          <p className="text-xs text-slate-500 font-display tracking-wider uppercase">Days Active</p>
        </div>
        <div className="rounded-xl glass-card-glow p-4 text-center top-glow">
          <User className="w-5 h-5 text-crimson-500 mx-auto mb-2" />
          <p className="text-xl font-display font-bold text-white capitalize counter-glow">{user.role}</p>
          <p className="text-xs text-slate-500 font-display tracking-wider uppercase">Role</p>
        </div>
      </div>

      <Card className="glass-card-glow rounded-xl border-white/[0.06] top-glow">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-400 text-sm font-body">Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)}
              className="bg-white/[0.03] border-white/[0.08] text-white focus:border-crimson-500/50 focus:ring-crimson-500/20 font-body" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-400 text-sm font-body">Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name"
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-crimson-500/50 focus:ring-crimson-500/20 font-body" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-400 text-sm font-body">Game Tag</Label>
            <div className="relative">
              <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <Input value={gameTag} onChange={(e) => setGameTag(e.target.value)} placeholder="#PLAYER001"
                className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-crimson-500/50 focus:ring-crimson-500/20 font-body" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-400 text-sm font-body">Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              className="bg-white/[0.03] border-white/[0.08] text-white focus:border-crimson-500/50 focus:ring-crimson-500/20 resize-none font-body" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-crimson-500 hover:bg-crimson-600 text-white glow-btn font-display text-xs tracking-wider">
            <Save className="w-4 h-4 mr-2" /> {saving ? 'SAVING...' : 'SAVE CHANGES'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
