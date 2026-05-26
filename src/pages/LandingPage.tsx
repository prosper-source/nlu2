import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crosshair, Shield, Swords, Trophy, Users, MessageSquare, ChevronRight, Zap, Target, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedBackground } from '@/components/shared/AnimatedBackground';

const features = [
  { icon: Swords, title: 'War Tracking', desc: 'Submit and track weekly war points with approval workflow' },
  { icon: Trophy, title: 'Leaderboard', desc: 'Realtime rankings for weekly and all-time top performers' },
  { icon: Users, title: 'Member Hub', desc: 'Searchable roster with roles, stats, and online presence' },
  { icon: MessageSquare, title: 'Clan Chat', desc: 'Live global chat with realtime messages and avatars' },
  { icon: Shield, title: 'Admin Controls', desc: 'Approve members, manage submissions, post announcements' },
  { icon: Target, title: 'Secure Access', desc: 'Role-based permissions enforced at the database level' },
];

const stats = [
  { icon: BarChart3, value: 'Realtime', label: 'Live Updates' },
  { icon: Zap, value: 'Fast', label: 'Optimized' },
  { icon: Shield, value: 'Secure', label: 'RLS Protected' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen animated-bg scan-line relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 text-white">
        {/* Nav */}
        <nav className="fixed top-0 w-full z-50 border-b border-white/[0.04] glass-card rounded-none top-glow">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-crimson-500/15 flex items-center justify-center border border-crimson-500/20">
                <Crosshair className="w-4 h-4 text-crimson-500" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight neon-text">NOT LIKE US<span className="text-crimson-500 align-super text-xs font-black ml-0.5">2</span></span>
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/[0.04] font-body">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-crimson-500 hover:bg-crimson-600 text-white glow-btn font-display text-xs tracking-wider">JOIN SQUAD</Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative pt-32 pb-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-crimson-500/8 border border-crimson-500/15 text-crimson-300 text-xs font-display font-medium mb-8 tracking-wider uppercase">
                <Swords className="w-3 h-3" /> Competitive Clan Management
              </div>
              <h1 className="text-5xl sm:text-7xl font-display font-black tracking-tight leading-[0.9] gradient-text">
                NOT LIKE US
                <span className="text-crimson-500 align-super text-2xl sm:text-3xl font-black ml-1">2</span>
              </h1>
              <p className="text-xl sm:text-2xl text-slate-300 mt-4 font-body font-light">
                The ultimate clan management platform for competitive squads
              </p>
              <p className="text-slate-500 mt-3 max-w-lg mx-auto font-body">
                Track wars, climb leaderboards, manage members, and communicate in real time.
                Built for squads that play to win.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                <Link to="/signup">
                  <Button size="lg" className="bg-crimson-500 hover:bg-crimson-600 text-white text-sm px-8 h-12 glow-btn font-display tracking-wider">
                    GET STARTED <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-white/[0.08] text-slate-300 hover:bg-white/[0.04] text-sm px-8 h-12 font-body">
                    Sign In
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 sm:px-6 border-t border-white/[0.04]">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-display font-bold gradient-text">Everything your clan needs</h2>
              <p className="text-slate-500 mt-3 font-body">One platform. Zero chaos.</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group glass-card-glow glass-card-hover rounded-xl p-6 transition-all duration-300 top-glow"
                >
                  <div className="w-10 h-10 rounded-lg bg-crimson-500/10 flex items-center justify-center border border-crimson-500/15 mb-4">
                    <f.icon className="w-5 h-5 text-crimson-500" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-body">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 px-4 sm:px-6 border-t border-white/[0.04]">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-8">
              {stats.map((s) => (
                <motion.div key={s.label} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
                  <s.icon className="w-6 h-6 text-crimson-500 mx-auto mb-2" />
                  <p className="text-2xl font-display font-bold text-white counter-glow">{s.value}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mt-1 font-display">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 sm:px-6 border-t border-white/[0.04]">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl sm:text-4xl font-display font-bold gradient-text">Ready to dominate?</h2>
              <p className="text-slate-500 mt-3 font-body">Join the squad and start climbing the ranks.</p>
              <Link to="/signup">
                <Button size="lg" className="bg-crimson-500 hover:bg-crimson-600 text-white text-sm px-8 h-12 mt-8 glow-btn font-display tracking-wider">
                  JOIN NOT LIKE US <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        <footer className="py-8 px-4 border-t border-white/[0.04] text-center">
          <p className="text-xs text-slate-600 font-display tracking-wider">NOT LIKE US<sup>2</sup> &mdash; Built for competitive squads</p>
        </footer>
      </div>
    </div>
  );
}
