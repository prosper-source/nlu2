import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Crosshair, Mail, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { AnimatedBackground } from '@/components/shared/AnimatedBackground';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast({ title: 'Reset link sent to your email' });
    } catch (err: any) {
      toast({ title: err.message || 'Failed to send reset link', variant: 'destructive' });
    } finally {
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
          <h1 className="text-2xl font-display font-bold text-white mt-4 gradient-text">Reset Password</h1>
          <p className="text-slate-500 text-sm mt-1 font-body">We'll send you a reset link</p>
        </div>

        <Card className="glass-card-glow rounded-xl border-white/[0.06] top-glow">
          <CardContent className="pt-6">
            {sent ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <Mail className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-display font-medium text-white">Check your email</h3>
                <p className="text-sm text-slate-500 font-body">We sent a password reset link to {email}</p>
                <Link to="/login">
                  <Button variant="outline" className="border-white/[0.08] text-slate-300 hover:bg-white/[0.04] font-body">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-400 text-sm font-body">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required
                      className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-crimson-500/50 focus:ring-crimson-500/20 font-body" />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-crimson-500 hover:bg-crimson-600 text-white font-display text-xs tracking-wider glow-btn">
                  {loading ? 'SENDING...' : 'SEND RESET LINK'}
                </Button>
                <Link to="/login" className="block text-center">
                  <Button type="button" variant="ghost" className="text-slate-500 hover:text-white font-body">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
