import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  ArrowRight,
  Zap,
  RefreshCw,
  Activity,
  Sparkles,
  Layers,
  Radio,
  ShieldAlert,
} from 'lucide-react';
import { NavTabId } from '../../stores/uiStore';
import { useMarketStore } from '../../stores/marketStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { api } from '../../lib/api';

import { Sidebar } from '../Sidebar';
import { Header } from '../Header';
import { TickerBar } from '../TickerBar';
import { EventCard } from '../EventCard';
import { EventDetailModal } from '../EventDetailModal';
import { CurrencyStrengthWidget } from '../CurrencyStrengthWidget';
import { MarketDataGrid } from '../MarketDataGrid';
import { MacroCalendarView } from '../MacroCalendarView';
import { AIIntelligenceView } from '../AIIntelligenceView';
import { AdminPanel } from '../AdminPanel';
import { WatchlistView } from '../WatchlistView';
import { TradingViewChartModal } from '../TradingViewChartModal';
import { IntradayMarketMapView } from '../IntradayMarketMapView';
import { TodayCatalystsView } from '../TodayCatalystsView';
import { CurrencyPairOpportunityMatrix } from '../CurrencyPairOpportunityMatrix';

interface DashboardLayoutProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  onLogout: () => void;
  onNavigate: (to: string) => void;
}

export function DashboardLayout({
  activeTab,
  onTabChange,
  onLogout,
  onNavigate,
}: DashboardLayoutProps) {
  const {
    prices,
    strengths,
    events,
    calendar,
    intradayMap,
    todayCatalysts,
    sessions,
    overview,
    isSyncing,
    refreshStates,
    triggerGlobalSync,
    refreshPrices,
    refreshCurrencyStrength,
    refreshMacro,
    refreshIntraday,
    refreshCatalysts,
  } = useMarketStore();

  const { user, watchlist, toggleWatchlist } = useAuthStore();

  const {
    selectedEventId,
    selectedSymbol,
    chartModalSymbol,
    searchQuery,
    isSidebarOpen,
    isSidebarCollapsed,
    sseStatus,
    setSelectedEventId,
    setSelectedSymbol,
    setChartModalSymbol,
    setSearchQuery,
    setSseStatus,
    getFilteredEvents,
    getWatchlistSymbols,
    toggleSidebar,
    toggleSidebarCollapse,
  } = useUIStore();

  const filteredEvents = getFilteredEvents();
  const watchlistSymbols = getWatchlistSymbols();

  const handleToggleWatchlist = async (symbol: string, assetType: string) => {
    if (!user) {
      onNavigate('/login');
      return;
    }
    await toggleWatchlist(symbol, assetType);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Global Responsive Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={onTabChange}
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        marketMapCount={intradayMap.length || 13}
        catalystsCount={todayCatalysts.length}
        user={user}
        onOpenAuth={() => onNavigate('/login')}
        onLogout={onLogout}
      />

      {/* 2. Main Content Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={onTabChange}
          sseStatus={sseStatus as any}
          sessions={sessions}
          onTriggerGlobalSync={triggerGlobalSync}
          isSyncing={isSyncing}
          onToggleMobileMenu={toggleSidebar}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Real-time Ticker Bar */}
        <TickerBar
          prices={prices}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={(sym) => {
            setSelectedSymbol(sym === selectedSymbol ? null : sym);
            if (activeTab !== 'terminal') onTabChange('terminal');
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
                <div className="space-y-4" id="terminal-overview-dashboard">
                  {/* ======================================================== */}
                  {/* 1. TODAY'S INTRADAY MARKET MAP (SUMMARY CAROUSEL / STRIP) */}
                  {/* ======================================================== */}
                  <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3" id="dash-sec-1-market-map">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          <Compass className="w-4 h-4" />
                        </span>
                        <div>
                          <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                            <span>TODAY'S INTRADAY MARKET MAP</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                              13 ASSETS
                            </span>
                          </h2>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Synchronized directional bias: Macro Data + Central Bank Stances + Currency Strength + Yields + Price Action
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onTabChange('intraday_map')}
                          className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 transition cursor-pointer"
                        >
                          <span>Full Scanner View</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 13-Asset Horizontal Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2">
                      {intradayMap.map((asset) => {
                        const isBullish = asset.overall_bias === 'BULLISH';
                        const isBearish = asset.overall_bias === 'BEARISH';
                        const isMixed = asset.overall_bias === 'MIXED';

                        const badgeClass = isBullish
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/70'
                          : isBearish
                          ? 'bg-rose-950/70 text-rose-300 border-rose-800/70'
                          : isMixed
                          ? 'bg-purple-950/70 text-purple-300 border-purple-800/70'
                          : 'bg-amber-950/70 text-amber-300 border-amber-800/70';

                        return (
                          <div
                            key={asset.symbol}
                            onClick={() => {
                              setSelectedSymbol(asset.symbol);
                              onTabChange('intraday_map');
                            }}
                            className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer flex flex-col justify-between group space-y-1.5"
                          >
                            <div className="flex items-center justify-between font-mono">
                              <span className="font-bold text-xs text-slate-100 group-hover:text-cyan-300 transition">
                                {asset.symbol}
                              </span>
                              <span className={`text-[9px] px-1 py-0.2 rounded font-bold border ${badgeClass}`}>
                                {asset.overall_bias}
                              </span>
                            </div>

                            <div className="flex items-baseline justify-between font-mono">
                              <span className="text-xs font-semibold text-slate-200">
                                {asset.asset_type === 'COMMODITY' || asset.asset_type === 'CRYPTO' ? '$' : ''}
                                {asset.symbol === 'JPY' || asset.asset_type === 'FOREX'
                                  ? asset.price.toFixed(asset.symbol === 'USD' || asset.symbol === 'JPY' ? 2 : 4)
                                  : asset.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </span>
                              <span className={`text-[10px] font-bold ${
                                asset.change_24h_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {asset.change_24h_pct >= 0 ? '+' : ''}{asset.change_24h_pct.toFixed(2)}%
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-900 pt-1">
                              <span>Score: <strong className="text-slate-200">{asset.direction_score > 0 ? '+' : ''}{asset.direction_score}</strong></span>
                              <span>Conf: <strong className="text-cyan-300">{asset.confidence}%</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* ======================================================== */}
                  {/* 2. TODAY'S KEY CATALYSTS (CURRENT SESSION DRIVERS)       */}
                  {/* ======================================================== */}
                  <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3" id="dash-sec-2-catalysts">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Zap className="w-4 h-4" />
                        </span>
                        <div>
                          <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                            <span>TODAY'S KEY CATALYSTS</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800/60">
                              HIGH-IMPACT SESSIONS
                            </span>
                          </h2>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Scheduled releases and actual post-release market reaction tracking
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => onTabChange('today_catalysts')}
                        className="flex items-center gap-1 text-xs font-mono text-amber-400 hover:text-amber-300 font-semibold px-2.5 py-1 rounded bg-amber-950/60 border border-amber-800/60 transition cursor-pointer"
                      >
                        <span>View All Today's Catalysts</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 3-4 Featured Today Catalysts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {todayCatalysts.slice(0, 3).map((cat) => (
                        <div
                          key={cat.id}
                          className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/90 space-y-2"
                        >
                          <div className="flex items-center justify-between font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-cyan-300 px-1.5 py-0.2 rounded bg-slate-800">
                                {cat.currency}
                              </span>
                              <span className="text-xs font-bold text-slate-200 truncate max-w-[180px]">
                                {cat.event_name}
                              </span>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              cat.status === 'RELEASED'
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                                : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                            }`}>
                              {cat.status}
                            </span>
                          </div>

                          {/* Actual / Forecast / Previous Row */}
                          <div className="grid grid-cols-3 gap-1 bg-slate-900/60 rounded p-1.5 text-center font-mono text-[11px]">
                            <div>
                              <span className="text-[9px] text-slate-500 block">ACTUAL</span>
                              <strong className={cat.actual ? 'text-slate-100' : 'text-slate-500'}>
                                {cat.actual ?? '—'}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block">FORECAST</span>
                              <span className="text-slate-300">{cat.forecast ?? '—'}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block">SURPRISE</span>
                              <span className="text-cyan-300 font-semibold">{cat.surprise ?? '—'}</span>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-300 line-clamp-2 leading-snug">
                            <strong className="text-cyan-400 text-[10px] uppercase font-mono block">REACTION:</strong>
                            {cat.actual_market_reaction}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* ======================================================== */}
                  {/* 3 & 4. MARKET OVERVIEW + CURRENCY STRENGTH (SPLIT GRID) */}
                  {/* ======================================================== */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* 3. MARKET OVERVIEW (8 cols) */}
                    <div className="lg:col-span-8 space-y-3" id="dash-sec-3-market-overview">
                      <MarketDataGrid
                        prices={prices}
                        watchlistSymbols={watchlistSymbols}
                        intradayMap={intradayMap}
                        onToggleWatchlist={handleToggleWatchlist}
                        onRefresh={refreshPrices}
                        isRefreshing={refreshStates.prices}
                        onSelectSymbol={(sym) => setSelectedSymbol(sym === selectedSymbol ? null : sym)}
                        onOpenChart={(sym) => setChartModalSymbol(sym)}
                      />
                    </div>

                    {/* 4. CURRENCY STRENGTH (4 cols) */}
                    <div className="lg:col-span-4" id="dash-sec-4-currency-strength">
                      <CurrencyStrengthWidget
                        strengths={strengths}
                        onRefresh={refreshCurrencyStrength}
                        isRefreshing={refreshStates.currency}
                        onSelectCurrency={(cur) => setSelectedSymbol(cur === selectedSymbol ? null : cur)}
                      />
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* 5. IMPORTANT NEWS (CANONICAL DEDUPLICATED WIRE FEED)     */}
                  {/* ======================================================== */}
                  <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3" id="dash-sec-5-news-wire">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Radio className="w-4 h-4" />
                        </span>
                        <div>
                          <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                            <span>IMPORTANT NEWS & CANONICAL EVENT WIRE</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800/60">
                              MULTI-SOURCE VERIFIED
                            </span>
                          </h2>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            One deduplicated event record with correlated source articles, affected assets, and single truth
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            const res = await api.getEvents(50);
                            useMarketStore.setState({ events: res.events });
                          }}
                          disabled={isSyncing}
                          className="flex items-center gap-1 text-xs font-mono text-slate-300 hover:text-cyan-300 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 transition cursor-pointer disabled:opacity-50"
                          title="Sync news wire with latest source releases"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
                          <span className="hidden sm:inline">Sync Wire</span>
                        </button>

                        <button
                          onClick={() => onTabChange('events')}
                          className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold px-2.5 py-1 rounded bg-slate-950 border border-slate-800 transition cursor-pointer"
                        >
                          <span>Full Event Wire</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* News Feed Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredEvents.slice(0, 6).map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onClick={() => setSelectedEventId(event.id)}
                        />
                      ))}
                    </div>
                  </section>

                  {/* ======================================================== */}
                  {/* 6 & 7. ECONOMIC CALENDAR + AI MARKET CONTEXT             */}
                  {/* ======================================================== */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* 6. ECONOMIC CALENDAR TEASER (7 cols) */}
                    <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3" id="dash-sec-6-calendar">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-cyan-400" />
                          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                            JADWAL KALENDER MAKROEKONOMI (WIB)
                          </h3>
                        </div>
                        <button
                          onClick={() => onTabChange('macro')}
                          className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Lihat Kalender Lengkap</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
                        {calendar.slice(0, 6).map((item) => (
                          <div key={item.id} className="py-2.5 flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold text-[10px]">
                                {item.currency}
                              </span>
                              <span className="text-slate-200 truncate max-w-xs">{item.event_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <span className="text-slate-500">
                                  {new Date(item.date_time_utc).toLocaleDateString('id-ID', {
                                    timeZone: 'Asia/Jakarta',
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                </span>
                                <span className="text-cyan-400 font-bold">
                                  {new Date(item.date_time_utc).toLocaleTimeString('id-ID', {
                                    timeZone: 'Asia/Jakarta',
                                    hour12: false,
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}{' '}
                                  WIB
                                </span>
                              </div>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                item.impact === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {item.impact}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 7. AI MARKET CONTEXT (5 cols) */}
                    <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3" id="dash-sec-7-ai-context">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                            AI MARKET CONTEXT & REGIME
                          </h3>
                        </div>
                        <button
                          onClick={() => onTabChange('intelligence')}
                          className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <span>Deep Synthesis</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="space-y-2.5 text-xs text-slate-300">
                        <div className="bg-slate-950/70 rounded-lg p-3 border border-slate-800/80 leading-relaxed font-sans">
                          <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold block mb-1">
                            SYNTHESIS SUMMARY:
                          </span>
                          {overview?.summary || 'Global markets reflect balanced policy pacing across major central banks with safe-haven support sustaining precious metals and commodity baskets. Consolidated event normalization maintains verified single-source accuracy.'}
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60 font-mono text-[11px] space-y-1">
                          <div className="text-slate-400 font-semibold">VISIBLE EVIDENCE PILLARS:</div>
                          <div className="text-slate-300 flex items-center gap-1.5">
                            <span className="text-cyan-400">•</span>
                            <span>Multi-source news deduplication & canonical resolution</span>
                          </div>
                          <div className="text-slate-300 flex items-center gap-1.5">
                            <span className="text-cyan-400">•</span>
                            <span>Live G8 sovereign rate differential pricing</span>
                          </div>
                          <div className="text-slate-300 flex items-center gap-1.5">
                            <span className="text-cyan-400">•</span>
                            <span>Central bank speech hawkish/dovish classification</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: DEDICATED INTRADAY MARKET MAP (13 ASSETS) */}
              {activeTab === 'intraday_map' && (
                <IntradayMarketMapView
                  data={intradayMap}
                  onRefresh={refreshIntraday}
                  isRefreshing={refreshStates.intraday}
                  onOpenChart={(sym) => setChartModalSymbol(sym)}
                />
              )}

              {/* VIEW 3: TODAY'S KEY CATALYSTS */}
              {activeTab === 'today_catalysts' && (
                <TodayCatalystsView
                  catalysts={todayCatalysts}
                  onRefresh={refreshCatalysts}
                  isRefreshing={refreshStates.catalysts}
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
                    onRefresh={refreshPrices}
                    isRefreshing={refreshStates.prices}
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
                      onRefresh={refreshCurrencyStrength}
                      isRefreshing={refreshStates.currency}
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
                  onRefresh={refreshMacro}
                  isRefreshing={refreshStates.macro}
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
                          const res = await api.getEvents(40);
                          useMarketStore.setState({ events: res.events });
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
                    {filteredEvents.map((event) => (
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

              {/* VIEW 9: WATCHLIST */}
              {activeTab === 'watchlist' && (
                <WatchlistView
                  watchlist={watchlist}
                  prices={prices}
                  user={user}
                  onOpenAuth={() => onNavigate('/login')}
                  onRemove={async (symbol) => {
                    await toggleWatchlist(symbol, 'ANY');
                  }}
                  onAdd={async (symbol, assetType) => {
                    try {
                      await toggleWatchlist(symbol, assetType);
                    } catch (err: any) {
                      alert(err.message || 'Failed to add to watchlist');
                    }
                  }}
                  onSelectSymbol={(sym) => {
                    setSelectedSymbol(sym);
                    onTabChange('terminal');
                  }}
                />
              )}

              {/* VIEW 10: ADMIN PANEL */}
              {activeTab === 'admin' && (
                user?.role === 'ADMIN' ? (
                  <AdminPanel />
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
                        onClick={() => onTabChange('terminal')}
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
