import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MarketPrice,
  CurrencyStrength,
  MarketEvent,
  EconomicEvent,
  AIAnalysis,
  User,
  UserWatchlist,
  IntradayAssetBias,
  TodayCatalyst,
} from './types';
import { api, setAuthToken, getAuthToken } from './lib/api';
import { useSSE } from './lib/useSSE';

import { Sidebar, NavTabId } from './components/Sidebar';
import { Header } from './components/Header';
import { TickerBar } from './components/TickerBar';
import { EventCard } from './components/EventCard';
import { EventDetailModal } from './components/EventDetailModal';
import { CurrencyStrengthWidget } from './components/CurrencyStrengthWidget';
import { MarketDataGrid } from './components/MarketDataGrid';
import { MacroCalendarView } from './components/MacroCalendarView';
import { AIIntelligenceView } from './components/AIIntelligenceView';
import { AdminPanel } from './components/AdminPanel';
import { WatchlistView } from './components/WatchlistView';
import { TradingViewChartModal } from './components/TradingViewChartModal';
import { IntradayMarketMapView } from './components/IntradayMarketMapView';
import { TodayCatalystsView } from './components/TodayCatalystsView';
import { CurrencyPairOpportunityMatrix } from './components/CurrencyPairOpportunityMatrix';
import { MarketHistoryView } from './components/MarketHistoryView';
import { OverviewDashboard } from './components/OverviewDashboard';
import { PublicLandingPage } from './components/PublicLandingPage';
import { AuthPage } from './components/AuthPage';
import {
  useLocation,
  isPublicRoute,
  isPrivateRoute,
  routeToTab,
  tabToRoute,
} from './lib/router';
import { motion, AnimatePresence } from 'motion/react';

import {
  Layers,
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  Radio,
  RefreshCw,
  Compass,
  Zap,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Activity,
  BarChart2,
} from 'lucide-react';

export default function App() {
  // Router Location
  const { path, navigate } = useLocation();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<NavTabId>(() => routeToTab(path));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile drawer
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop compact
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [chartModalSymbol, setChartModalSymbol] = useState<string | null>(null);

  // Core Data Collections (Single Source of Truth)
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [strengths, setStrengths] = useState<CurrencyStrength[]>([]);
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [calendar, setCalendar] = useState<EconomicEvent[]>([]);
  const [overview, setOverview] = useState<AIAnalysis | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [intradayMap, setIntradayMap] = useState<IntradayAssetBias[]>([]);
  const [todayCatalysts, setTodayCatalysts] = useState<TodayCatalyst[]>([]);

  // User State
  const [user, setUser] = useState<User | null>(null);
  const [watchlist, setWatchlist] = useState<UserWatchlist[]>([]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Loading & Sync States
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshingCS, setIsRefreshingCS] = useState(false);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [isRefreshingMacro, setIsRefreshingMacro] = useState(false);
  const [isRefreshingIntraday, setIsRefreshingIntraday] = useState(false);
  const [isRefreshingCatalysts, setIsRefreshingCatalysts] = useState(false);

  // Tab change handler that updates route
  const handleTabChange = useCallback((newTab: NavTabId) => {
    setActiveTab(newTab);
    const targetRoute = tabToRoute(newTab);
    if (targetRoute !== path) {
      navigate(targetRoute);
    }
  }, [navigate, path]);

  // Server-Sent Events (SSE) Real-Time Hook - only enabled when authenticated
  const { status: sseStatus } = useSSE({
    enabled: !!user,
    onMarketPrices: (updatedPrices: MarketPrice[]) => {
      setPrices(updatedPrices);
      // Auto-recalculate Intraday Market Map on live price ticks
      api.getIntradayMarketMap().then(res => setIntradayMap(res.market_map)).catch(() => {});
    },
    onCurrencyStrength: (updatedStrengths: CurrencyStrength[]) => {
      setStrengths(updatedStrengths);
      api.getIntradayMarketMap().then(res => setIntradayMap(res.market_map)).catch(() => {});
    },
    onEventUpdated: (updatedEvent: MarketEvent) => {
      setEvents(prev => {
        const index = prev.findIndex(e => e.id === updatedEvent.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = updatedEvent;
          return next;
        }
        return [updatedEvent, ...prev];
      });
    },
    onEconomicCalendar: (updatedCalendar: EconomicEvent[]) => {
      setCalendar(updatedCalendar);
      api.getTodayCatalysts().then(res => setTodayCatalysts(res.catalysts)).catch(() => {});
    },
  });

  // Initial Data Load for Authenticated Dashboard
  const loadInitialData = useCallback(async () => {
    try {
      setInitialLoading(true);
      const [mktRes, curRes, evtRes, calRes, sesRes, mapRes, catRes] = await Promise.allSettled([
        api.getMarkets(),
        api.getCurrencyStrength(),
        api.getEvents(40),
        api.getEconomicCalendar(200),
        api.getMarketSessions(),
        api.getIntradayMarketMap(),
        api.getTodayCatalysts(),
      ]);

      if (mktRes.status === 'fulfilled') setPrices(mktRes.value.prices);
      if (curRes.status === 'fulfilled') setStrengths(curRes.value.currency_strength);
      if (evtRes.status === 'fulfilled') setEvents(evtRes.value.events);
      if (calRes.status === 'fulfilled') setCalendar(calRes.value.calendar);
      if (sesRes.status === 'fulfilled') setSessions(sesRes.value.sessions);
      if (mapRes.status === 'fulfilled') setIntradayMap(mapRes.value.market_map);
      if (catRes.status === 'fulfilled') setTodayCatalysts(catRes.value.catalysts);
    } catch (err) {
      console.warn('Initialization notice:', err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  // Check current user session on mount
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const token = getAuthToken();
        if (token) {
          const meRes = await api.getMe();
          if (isMounted) {
            setUser(meRes.user);
            setWatchlist(meRes.watchlist || []);
            loadInitialData();
          }
        } else {
          if (isMounted) setUser(null);
        }
      } catch (err) {
        console.warn('Session verification notice:', err);
        setAuthToken(null);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsAuthChecking(false);
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, [loadInitialData]);

  // Route enforcement & sync
  useEffect(() => {
    if (isAuthChecking) return;

    if (!user) {
      // Unauthenticated user attempting to access private route -> redirect to /login
      if (isPrivateRoute(path)) {
        navigate('/login', true);
      }
    } else {
      // Authenticated user
      if (path === '/' || path === '/login' || path === '/register') {
        navigate('/dashboard', true);
      } else if (isPrivateRoute(path)) {
        const expectedTab = routeToTab(path);
        if (expectedTab !== activeTab) {
          setActiveTab(expectedTab);
        }
      }
    }
  }, [user, path, isAuthChecking, navigate, activeTab]);

  // Global Ingestion Trigger
  const handleTriggerGlobalSync = async () => {
    try {
      setIsSyncing(true);
      await api.runGlobalIngest();
      // Refetch all active streams
      const [eRes, cRes, mRes, mapRes, catRes] = await Promise.allSettled([
        api.getEvents(40),
        api.getCurrencyStrength(),
        api.getMarkets(),
        api.getIntradayMarketMap(),
        api.getTodayCatalysts(),
      ]);
      if (eRes.status === 'fulfilled') setEvents(eRes.value.events);
      if (cRes.status === 'fulfilled') setStrengths(cRes.value.currency_strength);
      if (mRes.status === 'fulfilled') setPrices(mRes.value.prices);
      if (mapRes.status === 'fulfilled') setIntradayMap(mapRes.value.market_map);
      if (catRes.status === 'fulfilled') setTodayCatalysts(catRes.value.catalysts);
    } catch (err) {
      console.error('Manual sync notice:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Watchlist Toggle
  const handleToggleWatchlist = async (symbol: string, assetType: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const exists = watchlist.some(w => w.symbol === symbol);
    if (exists) {
      await api.removeFromWatchlist(symbol);
      setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
    } else {
      const res = await api.addToWatchlist(symbol, assetType);
      if (res.item) setWatchlist(prev => [...prev, res.item]);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setWatchlist([]);
    navigate('/login');
  };

  const handleAuthSuccess = useCallback(async (u: User) => {
    setUser(u);
    try {
      const me = await api.getMe();
      setUser(me.user);
      setWatchlist(me.watchlist || []);
    } catch (err) {
      console.warn('Profile hydration notice:', err);
    }
    loadInitialData();
    navigate('/dashboard', true);
  }, [loadInitialData, navigate]);

  // Filtered Events for Wire - strictly newest first
  const filteredEvents = useMemo(() => {
    return events
      .filter(e => {
        if (categoryFilter !== 'ALL' && e.primary_category !== categoryFilter) return false;
        if (selectedSymbol && !e.affected_assets.includes(selectedSymbol) && !e.affected_currencies.includes(selectedSymbol)) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = e.title.toLowerCase().includes(q);
          const matchSummary = e.summary.toLowerCase().includes(q);
          const matchSources = e.source_names.some(s => s.toLowerCase().includes(q));
          const matchAssets = e.affected_assets.some(a => a.toLowerCase().includes(q));
          const matchCurrs = e.affected_currencies.some(c => c.toLowerCase().includes(q));
          return matchTitle || matchSummary || matchSources || matchAssets || matchCurrs;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.first_detected_at).getTime() || 0;
        const timeB = new Date(b.first_detected_at).getTime() || 0;
        return timeB - timeA;
      });
  }, [events, categoryFilter, selectedSymbol, searchQuery]);

  const watchlistSymbols = useMemo(() => watchlist.map(w => w.symbol), [watchlist]);

  // Screen 1: Session Verification
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

  // Screen 2: Unauthenticated Visitor Flow (Public Landing & Auth Pages)
  if (!user) {
    if (path === '/login') {
      return (
        <AuthPage
          mode="login"
          onNavigate={navigate}
          onSuccess={(u) => handleAuthSuccess(u)}
        />
      );
    }

    if (path === '/register') {
      return (
        <AuthPage
          mode="register"
          onNavigate={navigate}
          onSuccess={(u) => handleAuthSuccess(u)}
        />
      );
    }

    if (path === '/verify-email') {
      return (
        <AuthPage
          mode="verify-email"
          onNavigate={navigate}
          onSuccess={(u) => handleAuthSuccess(u)}
        />
      );
    }

    if (path === '/forgot-password') {
      return (
        <AuthPage
          mode="forgot-password"
          onNavigate={navigate}
          onSuccess={(u) => handleAuthSuccess(u)}
        />
      );
    }

    if (path === '/reset-password') {
      return (
        <AuthPage
          mode="reset-password"
          onNavigate={navigate}
          onSuccess={(u) => handleAuthSuccess(u)}
        />
      );
    }

    if (path === '/magic-link') {
      navigate('/login');
      return null;
    }

    if (path === '/pricing') {
      navigate('/');
      return null;
    }

    // Default Public View for '/', '/features'
    return (
      <PublicLandingPage
        currentPath={path}
        onNavigate={navigate}
        user={user}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Global Responsive Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        marketMapCount={intradayMap.length || 13}
        catalystsCount={todayCatalysts.length}
        user={user}
        onOpenAuth={() => navigate('/login')}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          sseStatus={sseStatus}
          sessions={sessions}
          onTriggerGlobalSync={handleTriggerGlobalSync}
          isSyncing={isSyncing}
          onToggleMobileMenu={() => setIsSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Real-time Ticker Bar */}
        <TickerBar
          prices={prices}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={(sym) => {
            setSelectedSymbol(sym === selectedSymbol ? null : sym);
            if (activeTab !== 'terminal') handleTabChange('terminal');
          }}
          onOpenChart={(sym) => setChartModalSymbol(sym)}
        />

        {/* Active Instrument Filter Strip */}
        {selectedSymbol && (
          <div className="bg-cyan-950/70 border-b border-cyan-800/60 px-4 py-1.5 flex items-center justify-between text-xs font-mono text-cyan-300">
            <div className="flex items-center gap-2">
              <span>FILTERED BY INSTRUMENT:</span>
              <strong className="text-white font-bold bg-cyan-900 px-2 py-0.5 rounded">{selectedSymbol}</strong>
              <span className="text-slate-400 hidden sm:inline">Highlighting events and macro correlations</span>
            </div>
            <button
              onClick={() => setSelectedSymbol(null)}
              className="text-cyan-400 hover:text-white underline cursor-pointer"
            >
              Clear Filter ×
            </button>
          </div>
        )}

        {/* 3. Primary Views Workspace */}
        <main className="flex-1 p-3 sm:p-4 max-w-[1720px] w-full mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full space-y-4"
            >
          {/* VIEW 1: TERMINAL / OVERVIEW DASHBOARD */}
          {activeTab === 'terminal' && (
            <OverviewDashboard
              intradayMap={intradayMap}
              todayCatalysts={todayCatalysts}
              prices={prices}
              strengths={strengths}
              events={filteredEvents}
              calendar={calendar}
              overview={overview}
              watchlistSymbols={watchlistSymbols}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={(sym) => setSelectedSymbol(sym)}
              onNavigateTab={handleTabChange}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenChart={(sym) => setChartModalSymbol(sym)}
              onSelectEvent={(id) => setSelectedEventId(id)}
              onRefreshPrices={async () => {
                setIsRefreshingPrices(true);
                await api.refreshMarkets();
                const res = await api.getMarkets();
                setPrices(res.prices);
                setIsRefreshingPrices(false);
              }}
              isRefreshingPrices={isRefreshingPrices}
              onRefreshCS={async () => {
                setIsRefreshingCS(true);
                const res = await api.refreshCurrencyStrength();
                setStrengths(res.currency_strength);
                setIsRefreshingCS(false);
              }}
              isRefreshingCS={isRefreshingCS}
              onSyncWire={async () => {
                setIsSyncing(true);
                const res = await api.getEvents(40);
                setEvents(res.events);
                setIsSyncing(false);
              }}
              isSyncingWire={isSyncing}
            />
          )}

          {/* VIEW 2: DEDICATED INTRADAY MARKET MAP (13 ASSETS) */}
          {activeTab === 'intraday_map' && (
            <IntradayMarketMapView
              data={intradayMap}
              onRefresh={async () => {
                setIsRefreshingIntraday(true);
                const res = await api.getIntradayMarketMap();
                setIntradayMap(res.market_map);
                setIsRefreshingIntraday(false);
              }}
              isRefreshing={isRefreshingIntraday}
              onOpenChart={(sym) => setChartModalSymbol(sym)}
            />
          )}

          {/* VIEW 3: TODAY'S KEY CATALYSTS */}
          {activeTab === 'today_catalysts' && (
            <TodayCatalystsView
              catalysts={todayCatalysts}
              onRefresh={async () => {
                setIsRefreshingCatalysts(true);
                const res = await api.getTodayCatalysts();
                setTodayCatalysts(res.catalysts);
                setIsRefreshingCatalysts(false);
              }}
              isRefreshing={isRefreshingCatalysts}
              onSelectAsset={(sym) => setSelectedSymbol(sym)}
              onOpenChart={(sym) => setChartModalSymbol(sym)}
            />
          )}

          {/* VIEW 4: LIVE MARKET SURVEILLANCE GRID */}
          {activeTab === 'markets' && (
            <div className="space-y-4">
              <MarketDataGrid
                prices={prices}
                watchlistSymbols={watchlistSymbols}
                intradayMap={intradayMap}
                onToggleWatchlist={handleToggleWatchlist}
                onRefresh={async () => {
                  setIsRefreshingPrices(true);
                  await api.refreshMarkets();
                  const res = await api.getMarkets();
                  setPrices(res.prices);
                  setIsRefreshingPrices(false);
                }}
                isRefreshing={isRefreshingPrices}
                onSelectSymbol={(sym) => setSelectedSymbol(sym === selectedSymbol ? null : sym)}
                onOpenChart={(sym) => setChartModalSymbol(sym)}
              />
            </div>
          )}

          {/* VIEW 5: CURRENCY MATRIX */}
          {activeTab === 'currency' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5">
                <CurrencyStrengthWidget
                  strengths={strengths}
                  onRefresh={async () => {
                    setIsRefreshingCS(true);
                    const res = await api.refreshCurrencyStrength();
                    setStrengths(res.currency_strength);
                    setIsRefreshingCS(false);
                  }}
                  isRefreshing={isRefreshingCS}
                />
              </div>

              <div className="lg:col-span-7">
                <CurrencyPairOpportunityMatrix
                  strengths={strengths}
                  onOpenChart={(sym) => setChartModalSymbol(sym)}
                  onSelectSymbol={(sym) => setSelectedSymbol(sym === selectedSymbol ? null : sym)}
                />
              </div>
            </div>
          )}

          {/* VIEW 6: MACRO CALENDAR */}
          {activeTab === 'macro' && (
            <MacroCalendarView
              events={calendar}
              onRefresh={async () => {
                setIsRefreshingMacro(true);
                await api.refreshEconomicCalendar();
                const res = await api.getEconomicCalendar();
                setCalendar(res.calendar);
                setIsRefreshingMacro(false);
              }}
              isRefreshing={isRefreshingMacro}
            />
          )}

          {/* VIEW 7: CANONICAL EVENT WIRE */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <h1 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>DEDUPLICATED EVENT ENGINE WIRE</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ONE EVENT → ONE EVENT ID → MULTIPLE SOURCES → MULTIPLE ASSETS → ONE ANALYSIS
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      setIsSyncing(true);
                      const res = await api.getEvents(50);
                      setEvents(res.events);
                      setIsSyncing(false);
                    }}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-medium transition cursor-pointer disabled:opacity-50"
                    title="Sync wire with latest source releases"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
                    <span>Sync Wire</span>
                  </button>

                  <input
                    type="text"
                    placeholder="Filter events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-800 px-3 py-1 rounded text-xs font-mono text-slate-200 outline-none w-56"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => setSelectedEventId(event.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* VIEW 8: AI INTELLIGENCE */}
          {activeTab === 'intelligence' && (
            <AIIntelligenceView
              initialOverview={overview}
              user={user}
            />
          )}

          {/* VIEW 8.5: MARKET HISTORY & PERMANENT MEMORY */}
          {activeTab === 'history' && (
            <MarketHistoryView
              onOpenChart={(sym) => setChartModalSymbol(sym)}
            />
          )}

          {/* VIEW 9: WATCHLIST */}
          {activeTab === 'watchlist' && (
            <WatchlistView
              watchlist={watchlist}
              prices={prices}
              user={user}
              onOpenAuth={() => navigate('/login')}
              onRemove={async (symbol) => {
                await api.removeFromWatchlist(symbol);
                setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
              }}
              onAdd={async (symbol, assetType) => {
                try {
                  const res = await api.addToWatchlist(symbol, assetType);
                  if (res.item) setWatchlist(prev => [...prev, res.item]);
                } catch (err: any) {
                  alert(err.message || 'Failed to add to watchlist');
                }
              }}
              onSelectSymbol={(sym) => {
                setSelectedSymbol(sym);
                handleTabChange('terminal');
              }}
            />
          )}

          {/* VIEW 10: ADMIN PANEL */}
          {activeTab === 'admin' && (
            user?.role === 'ADMIN' ? (
              <AdminPanel currentUser={user} />
            ) : (
              <div className="max-w-md mx-auto my-12 p-6 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono">
                <div className="w-12 h-12 mx-auto rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 mb-4">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Access Restricted</h2>
                <p className="text-xs text-slate-400 mt-2">
                  Administrative Telemetry & Feed Orchestration is restricted to system administrators with verified authority.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => handleTabChange('terminal')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition cursor-pointer"
                  >
                    Return to Terminal
                  </button>
                </div>
              </div>
            )
          )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* 4. Event Detail Modal */}
      {selectedEventId && (
        <EventDetailModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />
      )}

      {/* 5. TradingView Interactive Candlestick Chart Modal */}
      {chartModalSymbol && (
        <TradingViewChartModal
          initialSymbol={chartModalSymbol}
          prices={prices}
          onClose={() => setChartModalSymbol(null)}
        />
      )}
    </div>
  );
}
