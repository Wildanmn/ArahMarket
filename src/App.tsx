import React, { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useMarketStore } from './stores/marketStore';
import { useUIStore, NavTabId } from './stores/uiStore';
import { useLocation, isPrivateRoute, routeToTab, tabToRoute } from './lib/router';
import { useSSE } from './lib/useSSE';
import { User } from './types';
import { Layers } from 'lucide-react';

// Lazy imports for code splitting
const PublicLandingPage = React.lazy(() => import('./components/PublicLandingPage').then(m => ({ default: m.PublicLandingPage })));
const AuthPage = React.lazy(() => import('./components/AuthPage').then(m => ({ default: m.AuthPage })));
const DashboardLayout = React.lazy(() => import('./components/layout/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const NotFoundPage = React.lazy(() => import('./components/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

export default function App() {
  const { path, navigate } = useLocation();
  const { user, isAuthChecking, checkSession, logout, setToken } = useAuthStore();
  const { loadInitialData, setPrices, setStrengths, updateEvent, setCalendar } = useMarketStore();
  const { activeTab, setActiveTab } = useUIStore();

  // SSE real-time integration (only when authenticated)
  const { status: sseStatus } = useSSE({
    enabled: !!user,
    onMarketPrices: (prices) => { setPrices(prices); },
    onCurrencyStrength: (strengths) => { setStrengths(strengths); },
    onEventUpdated: (event) => { updateEvent(event); },
    onEconomicCalendar: (calendar) => { setCalendar(calendar); },
  });

  // Store SSE status
  useEffect(() => {
    useUIStore.getState().setSseStatus(sseStatus);
  }, [sseStatus]);

  // Check session on mount
  useEffect(() => {
    checkSession().then(() => {
      const { user: currentUser } = useAuthStore.getState();
      if (currentUser) loadInitialData();
    });
  }, []);

  // Route enforcement
  useEffect(() => {
    if (isAuthChecking) return;
    if (!user) {
      if (isPrivateRoute(path)) navigate('/login', true);
    } else {
      if (path === '/' || path === '/login' || path === '/register') {
        navigate('/dashboard', true);
      } else if (isPrivateRoute(path)) {
        const expectedTab = routeToTab(path);
        if (expectedTab !== activeTab) setActiveTab(expectedTab);
      }
    }
  }, [user, path, isAuthChecking, activeTab, navigate, setActiveTab]);

  // Tab change handler
  const handleTabChange = (newTab: NavTabId) => {
    setActiveTab(newTab);
    const targetRoute = tabToRoute(newTab);
    if (targetRoute !== path) navigate(targetRoute);
  };

  // Auth success handler - receives (user, token) from AuthPage
  const handleAuthSuccess = async (u: User, token?: string) => {
    if (token) {
      useAuthStore.getState().setToken(token);
    }
    useAuthStore.getState().setUser(u);
    try {
      await useAuthStore.getState().checkSession();
    } catch (err) {
      console.warn('Session hydration notice:', err);
    }
    await loadInitialData();
    navigate('/dashboard', true);
  };

  // Loading splash
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-mono">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/20 animate-pulse">
            <Layers className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-base font-bold tracking-wider text-slate-100">
            ARAH <span className="text-cyan-400">MARKET</span>
          </span>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Verifying encrypted terminal session...</span>
        </div>
      </div>
    );
  }

  // Suspense wrapper
  const SuspenseFallback = (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Unauthenticated routes
  if (!user) {
    return (
      <React.Suspense fallback={SuspenseFallback}>
        {path === '/login' && <AuthPage mode="login" onNavigate={navigate} onSuccess={handleAuthSuccess} />}
        {path === '/register' && <AuthPage mode="register" onNavigate={navigate} onSuccess={handleAuthSuccess} />}
        {path === '/verify-email' && <AuthPage mode="verify-email" onNavigate={navigate} onSuccess={handleAuthSuccess} />}
        {(path === '/' || path === '/features' || path === '/pricing') && <PublicLandingPage currentPath={path} onNavigate={navigate} user={user} />}
        {!['/', '/features', '/pricing', '/login', '/register', '/verify-email'].includes(path) && <NotFoundPage onNavigate={navigate} />}
      </React.Suspense>
    );
  }

  // Authenticated dashboard
  return (
    <React.Suspense fallback={SuspenseFallback}>
      <DashboardLayout
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={logout}
        onNavigate={navigate}
      />
    </React.Suspense>
  );
}
