import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  className?: string;
  delay?: number;
}

export function StatCard({ icon: Icon, label, value, trend, className, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-xl glass-card-glow p-6 group top-glow',
        className
      )}
    >
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-crimson-500/5 rounded-full blur-2xl group-hover:bg-crimson-500/10 transition-colors duration-700" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-crimson-500/10 flex items-center justify-center border border-crimson-500/15">
            <Icon className="w-5 h-5 text-crimson-500" />
          </div>
          {trend && (
            <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
              {trend}
            </span>
          )}
        </div>
        <p className="text-2xl font-display font-bold text-white counter-glow">{value}</p>
        <p className="text-sm text-slate-500 mt-1">{label}</p>
      </div>
    </motion.div>
  );
}
