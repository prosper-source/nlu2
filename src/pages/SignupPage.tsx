import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp, signInWithGoogle } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Crosshair, Mail, Lock, User, Chrome, Gamepad2, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { AnimatedBackground } from '@/components/shared/AnimatedBackground';

const signupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username too long'),
  displayName: z.string().min(1, 'Display name is required').max(50, 'Name too long'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function SignupPage() {
  const [form, setForm] = useState({ username: '', displayName: '', email: '', password: '', gameTag: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = signupSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    try {
      await signUp(form.email, form.password, form.username, form.displayName, form.gameTag, form.message);
      toast({ title: 'Account created! Your join request is pending approval.' });
      navigate('/pending');
    } catch (err: any) {
      toast({ title: err.message || 'Signup failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      toast({ title: err.message || 'Google sign-in failed', variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg scan-line relative flex items-center justify-center p-4">
      <AnimatedBackground />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-crimson-500/15 flex items-center justify-center border border-crimson-500/20 neon-border">
              <Crosshair className="w-6 h-6 text-crimson-500" />
            </div>
          </Link>
          <h1 className="text-2xl font-display font-bold text-white mt-4 gradient-text">Join the Squad</h1>
          <p className="text-slate-500 text-sm mt-1 font-body">Create your account and request to join</p>
        </div>

        <Card className="glass-card-glow rounded-xl border-white/[0.06] top-glow">
          <CardHeader className="pb-2">
            <Button variant="outline" onClick={handleGoogle} disabled={loading} className="w-full border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-white font-body">
              <Chrome className="w-4 h-4 mr-2" /> Continue with Google
            </Button>
          </CardHeader>
          <CardContent>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.04]" /></div>
              <div className="relative flex justify-center text-xs"><span className="px-2 text-slate-600 bg-transparent font-display tracking-wider">OR</span></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-400 text-sm font-body">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <Input id="username" placeholder="gamertag" value={form.username} onChange={(e) => handleChange('username', e.target.value)}
                    className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-crimson-500/50 focus:ring-crimson-500/20 font-body" />
                </div>
                {errors.username && <p className="text-xs text-rose-400">{errors.username}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-slate-400 text-sm font-body">Display Name</Label>
                <Input id="displayName" placeholder="Your name" value={form.displayName} onChange={(e) => handleChange('displayName', e.target.value)}
                  className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-crimson-500/50 focus:ring-crimson-500/20 font-body" />
                {errors.displayName && <p className="text-xs text-rose-400">{errors.displayName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gameTag" className="text-slate-400 text-sm font-body">Game Tag <span className="text-slate-600">(optional)</span></Label>
                <div className="relative">
                  <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <Input id="gameTag" placeholder="#PLAYER001" value={form.gameTag} onChange={(e) => handleChange('gameTag', e.target.value)}
                    className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-crimson-500/50 focus:ring-crimson-500/20 font-body" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-400 text-sm font-body">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <Input id="email" type="email" placeholder="your@email.com" value={form.email} onChange={(e) => handleChange('email', e.target.value)}
                    className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-crimson-500/50 focus:ring-crimson-500/20 font-body" />
                </div>
                {errors.email && <p className="text-xs text-rose-400">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-400 text-sm font-body">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <Input id="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={(e) => handleChange('password', e.target.value)}
                    className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-crimson-500/50 focus:ring-crimson-500/20 font-body" />
                </div>
                {errors.password && <p className="text-xs text-rose-400">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-slate-400 text-sm font-body">Message to Admin <span className="text-slate-600">(optional)</span></Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                  <Input id="message" placeholder="Why do you want to join?" value={form.message} onChange={(e) => handleChange('message', e.target.value)}
                    className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-crimson-500/50 focus:ring-crimson-500/20 font-body" />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-crimson-500 hover:bg-crimson-600 text-white glow-btn font-display text-xs tracking-wider">
                {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6 font-body">
              Already have an account?{' '}
              <Link to="/login" className="text-crimson-300 hover:text-crimson-500 transition-colors font-medium">Sign In</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
