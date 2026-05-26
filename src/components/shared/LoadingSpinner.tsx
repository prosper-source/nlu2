import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="relative">
          <Loader2 className="w-8 h-8 text-crimson-500 animate-spin" />
          <div className="absolute inset-0 w-8 h-8 rounded-full bg-crimson-500/10 blur-xl animate-pulse" />
        </div>
        <p className="text-sm text-slate-500 font-body">{text}</p>
      </motion.div>
    </div>
  );
}

export function LoadingCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-32 rounded-xl glass-card-glow animate-pulse" />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-crimson-500/8 flex items-center justify-center mb-4 border border-crimson-500/12 neon-border">
        <Icon className="w-8 h-8 text-crimson-500/50" />
      </div>
      <h3 className="text-lg font-display font-semibold text-slate-300 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm font-body">{description}</p>
    </motion.div>
  );
}
