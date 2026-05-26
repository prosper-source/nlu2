import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { getMyJoinRequest } from '@/services/api';
import { signOut } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Crosshair, Clock, XCircle, CheckCircle2, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AnimatedBackground } from '@/components/shared/AnimatedBackground';

export default function PendingApprovalPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requestStatus, setRequestStatus] = useState<string>('pending');
  const [requestMessage, setRequestMessage] = useState<string>('');

  useEffect(() => {
    if (!user) return;

    if (user.role === 'member' || user.role === 'admin') {
      navigate('/dashboard', { replace: true });
      return;
    }

    async function checkStatus() {
      try {
        const req = await getMyJoinRequest(user!.id);
        if (req) {
          setRequestStatus(req.status);
          setRequestMessage(req.message || '');
          if (req.status === 'approved') {
            await refreshProfile();
            navigate('/dashboard', { replace: true });
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    checkStatus();

    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [user, refreshProfile, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch {
      toast({ title: 'Error signing out', variant: 'destructive' });
    }
  };

  const statusConfig = {
    pending: {
      icon: Clock,
      title: 'Approval Pending',
      description: 'Your join request is being reviewed by an admin. This page will automatically update once you\'re approved.',
      iconClass: 'text-amber-400',
      bgClass: 'bg-amber-500/10 border-amber-500/20',
      animateClass: 'animate-pulse',
    },
    rejected: {
      icon: XCircle,
      title: 'Request Rejected',
      description: 'Your join request was not approved. You can sign out and contact an admin if you believe this was an error.',
      iconClass: 'text-rose-400',
      bgClass: 'bg-rose-500/10 border-rose-500/20',
      animateClass: '',
    },
    approved: {
      icon: CheckCircle2,
      title: 'Approved!',
      description: 'Redirecting you to the dashboard...',
      iconClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10 border-emerald-500/20',
      animateClass: '',
    },
  };

  const config = statusConfig[requestStatus as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen animated-bg scan-line relative flex items-center justify-center p-4">
      <AnimatedBackground />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-crimson-500/15 flex items-center justify-center border border-crimson-500/20 neon-border mx-auto">
            <Crosshair className={`w-8 h-8 text-crimson-500 ${requestStatus === 'pending' ? 'animate-pulse' : ''}`} />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mt-6 tracking-tight neon-text">NOT LIKE US<span className="text-crimson-500 align-super text-sm font-black ml-0.5">2</span></h1>
        </div>

        <Card className="glass-card-glow rounded-xl border-white/[0.06] top-glow">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className={`w-20 h-20 rounded-full ${config.bgClass} flex items-center justify-center mx-auto border`}>
              <StatusIcon className={`w-10 h-10 ${config.iconClass} ${config.animateClass}`} />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white">{config.title}</h2>
              <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed font-body">{config.description}</p>
            </div>
            {requestMessage && requestStatus === 'pending' && (
              <div className="px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <p className="text-xs text-slate-400 font-body">Your message: <span className="text-slate-300">"{requestMessage}"</span></p>
              </div>
            )}
            {requestStatus === 'pending' && (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-body">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Checking for updates...
              </div>
            )}
            <Button variant="outline" onClick={handleSignOut} className="border-white/[0.08] text-slate-400 hover:bg-white/[0.04] hover:text-white font-display text-xs tracking-wider">
              <LogOut className="w-4 h-4 mr-2" /> SIGN OUT
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
