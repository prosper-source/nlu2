import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AnimatedBackground } from '@/components/shared/AnimatedBackground';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Swords,
  Megaphone,
  MessageSquare,
  Shield,
  User,
  LogOut,
  Menu,
  Crosshair,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/members', label: 'Members', icon: Users },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/war', label: 'War', icon: Swords },
  { path: '/announcements', label: 'Announcements', icon: Megaphone },
  { path: '/chat', label: 'Chat', icon: MessageSquare },
];

const adminItems = [
  { path: '/admin', label: 'Admin Panel', icon: Shield },
];

export default function AppLayout() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch {
      toast({ title: 'Error signing out', variant: 'destructive' });
    }
  };

  const NavLinks = ({ onClick, compact }: { onClick?: () => void; compact?: boolean }) => (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onClick}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
              compact ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5',
              isActive
                ? 'bg-crimson-500/10 text-crimson-300 border border-crimson-500/15 shadow-[0_0_15px_rgba(229,23,63,0.06)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            )
          }
        >
          <item.icon className="w-4 h-4 shrink-0" />
          {!compact && item.label}
        </NavLink>
      ))}
      {isAdmin && (
        <>
          <div className="my-2 border-t border-white/[0.04]" />
          {!compact && <p className="px-3 text-[10px] font-display font-semibold text-slate-600 uppercase tracking-wider">Admin</p>}
          {adminItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClick}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
                  compact ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5',
                  isActive
                    ? 'bg-crimson-500/10 text-crimson-300 border border-crimson-500/15'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!compact && item.label}
            </NavLink>
          ))}
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen animated-bg scan-line relative">
      <AnimatedBackground />

      <div className="relative z-10 flex min-h-screen">
        {/* Desktop Sidebar */}
        <AnimatePresence mode="wait">
          <motion.aside
            key={collapsed ? 'collapsed' : 'expanded'}
            initial={false}
            animate={{ width: collapsed ? 72 : 256 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="hidden lg:flex lg:flex-col border-r border-white/[0.04] glass-card rounded-none sidebar-glow overflow-hidden"
          >
            <div className={cn('p-6 border-b border-white/[0.04] flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
              <div className="w-10 h-10 rounded-xl bg-crimson-500/15 flex items-center justify-center border border-crimson-500/20 shrink-0">
                <Crosshair className="w-5 h-5 text-crimson-500" />
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <h1 className="text-lg font-display font-bold text-white tracking-tight neon-text">NOT LIKE US</h1>
                    <p className="text-[10px] text-crimson-300/60 font-display font-semibold tracking-widest uppercase">Hub</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              <NavLinks compact={collapsed} />
            </nav>
            <div className={cn('border-t border-white/[0.04]', collapsed ? 'p-3' : 'p-4')}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn('flex items-center gap-3 w-full rounded-lg hover:bg-white/[0.04] transition-colors', collapsed ? 'p-2 justify-center' : 'p-2')}>
                    <Avatar className="w-8 h-8 border border-crimson-500/15 shrink-0">
                      <AvatarImage src={user?.avatar_url} />
                      <AvatarFallback className="bg-crimson-500/15 text-crimson-300 text-xs">
                        {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.15 }}
                          className="text-left flex-1 min-w-0"
                        >
                          <p className="text-sm font-medium text-white truncate">{user?.display_name || user?.username}</p>
                          <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-surface-900/95 border-white/[0.06] backdrop-blur-xl">
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="text-slate-300 focus:bg-crimson-500/8 focus:text-white">
                    <User className="w-4 h-4 mr-2" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.04]" />
                  <DropdownMenuItem onClick={handleSignOut} className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-400">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {!collapsed && (
                <button
                  onClick={() => setCollapsed(true)}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-400 rounded-lg hover:bg-white/[0.03] transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" /> Collapse
                </button>
              )}
              {collapsed && (
                <button
                  onClick={() => setCollapsed(false)}
                  className="mt-2 w-full flex items-center justify-center px-2 py-1.5 text-slate-600 hover:text-slate-400 rounded-lg hover:bg-white/[0.03] transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.aside>
        </AnimatePresence>

        {/* Mobile Header + Sheet */}
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/[0.04] glass-card rounded-none">
            <div className="flex items-center gap-2">
              <Crosshair className="w-6 h-6 text-crimson-500" />
              <span className="font-display font-bold text-white tracking-tight neon-text">NLU<span className="text-crimson-500 align-super text-[8px] font-black">2</span></span>
            </div>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-surface-950/95 border-white/[0.04] p-0 backdrop-blur-xl">
                <div className="p-6 border-b border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-crimson-500/15 flex items-center justify-center border border-crimson-500/20">
                      <Crosshair className="w-5 h-5 text-crimson-500" />
                    </div>
                    <div>
                      <h1 className="text-lg font-display font-bold text-white tracking-tight neon-text">NOT LIKE US</h1>
                      <p className="text-[10px] text-crimson-300/60 font-display font-semibold tracking-widest uppercase">Hub</p>
                    </div>
                  </div>
                </div>
                <nav className="flex-1 p-3 space-y-1">
                  <NavLinks onClick={() => setMobileOpen(false)} />
                </nav>
                <div className="p-4 border-t border-white/[0.04] flex items-center gap-3">
                  <Avatar className="w-8 h-8 border border-crimson-500/15">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="bg-crimson-500/15 text-crimson-300 text-xs">
                      {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user?.display_name || user?.username}</p>
                    <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-rose-400 hover:bg-rose-500/10">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto p-4 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
