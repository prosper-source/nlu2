import { create } from 'zustand';
import type { UserProfile } from '@/types';
import { supabase } from '@/lib/supabase';
import { getUserProfile } from '@/services/auth';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: UserProfile | null) => void;
  initialize: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user, loading: false }),

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getUserProfile(session.user.id);
        set({ user: profile, loading: false, initialized: true });
      } else {
        set({ user: null, loading: false, initialized: true });
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      set({ user: null, loading: false, initialized: true });
    }

    supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await getUserProfile(session.user.id);
          set({ user: profile, loading: false });
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, loading: false });
        }
      })();
    });
  },

  refreshProfile: async () => {
    const { user } = get();
    if (user) {
      try {
        const profile = await getUserProfile(user.id);
        set({ user: profile });
      } catch (err) {
        console.error('Profile refresh error:', err);
      }
    }
  },
}));
