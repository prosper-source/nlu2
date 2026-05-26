import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, signInWithGoogle } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Crosshair, Mail, Lock, Chrome } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { AnimatedBackground } from '@/components/shared/AnimatedBackground';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: err.message || 'Invalid credentials', variant: 'destructive' });
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
          <h1 className="text-2xl font-display font-bold text-white mt-4 gradient-text">Welcome Back</h1>
          <p className="text-slate-500 text-sm mt-1 font-body">Sign in to your squad account</p>
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
                <Label htmlFor="email" className="text-slate-400 text-sm font-body">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-crimson-500/50 focus:ring-crimson-500/20 font-body" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-400 text-sm font-body">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <Input id="password" type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-crimson-500/50 focus:ring-crimson-500/20 font-body" />
                </div>
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-crimson-300 hover:text-crimson-500 transition-colors font-body">Forgot password?</Link>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-crimson-500 hover:bg-crimson-600 text-white font-display text-xs tracking-wider glow-btn">
                {loading ? 'SIGNING IN...' : 'SIGN IN'}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6 font-body">
              Don't have an account?{' '}
              <Link to="/signup" className="text-crimson-300 hover:text-crimson-500 transition-colors font-medium">Sign Up</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
