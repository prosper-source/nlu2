import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from '@/layouts/AppLayout';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const PendingApprovalPage = lazy(() => import('@/pages/PendingApprovalPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const MembersPage = lazy(() => import('@/pages/MembersPage'));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'));
const WarPage = lazy(() => import('@/pages/WarPage'));
const AnnouncementsPage = lazy(() => import('@/pages/AnnouncementsPage'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#050507] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#E5173F] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized, loading } = useAuthStore();
  if (!initialized || loading) return <LoadingFallback />;
  if (!user) return <>{children}</>;
  if (user.role === 'pending') return <Navigate to="/pending" replace />;
  return <Navigate to="/dashboard" replace />;
}

function PendingRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized, loading } = useAuthStore();
  if (!initialized || loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'pending') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function ApprovedRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized, loading } = useAuthStore();
  if (!initialized || loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'pending') return <Navigate to="/pending" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/pending" element={<PendingRoute><PendingApprovalPage /></PendingRoute>} />

            <Route element={<ApprovedRoute><AppLayout /></ApprovedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/war" element={<WarPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster position="top-right" theme="dark" />
    </QueryClientProvider>
  );
}
