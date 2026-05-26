import { useAuthStore } from '@/store/auth';
import type { UserProfile } from '@/types';

export function useAuth() {
  const { user, loading, initialized, setUser, initialize, refreshProfile } = useAuthStore();

  const isAdmin = user?.role === 'admin';
  const isApproved = user?.role === 'member' || user?.role === 'admin';
  const isPending = user?.role === 'pending';

  return {
    user: user as UserProfile | null,
    loading,
    initialized,
    isAdmin,
    isApproved,
    isPending,
    setUser,
    initialize,
    refreshProfile,
  };
}
