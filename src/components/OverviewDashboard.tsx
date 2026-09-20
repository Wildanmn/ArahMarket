import React, { useState, useMemo } from 'react';
import {
  Compass,
  Zap,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Radio,
  RefreshCw,
  Sparkles,
  Layers,
  Filter,
  Flame,
  ShieldAlert,
  Clock,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import {
  MarketPrice,
  CurrencyStrength,
  MarketEvent,
  EconomicEvent,
  AIAnalysis,
  IntradayAssetBias,
  TodayCatalyst,
} from '../types';
import { EventCard } from './EventCard';
import { CurrencyStrengthWidget } from './CurrencyStrengthWidget';
import { MarketDataGrid } from './MarketDataGrid';
import { NavTabId } from './Sidebar';

interface OverviewDashboardProps {
  intradayMap: IntradayAssetBias[];
  todayCatalysts: TodayCatalyst[];
  prices: MarketPrice[];
  strengths: CurrencyStrength[];
  events: MarketEvent[];
  calendar: EconomicEvent[];
  overview: AIAnalysis | null;
  watchlistSymbols: string[];
  selectedSymbol: string | null;
  onSelectSymbol: (symbol: string | null) => void;
  onNavigateTab: (tab: NavTabId) => void;
  onToggleWatchlist: (symbol: string, assetType: string) => void;
  onOpenChart: (symbol: string) => void;
  onSelectEvent: (eventId: string) => void;
  onRefreshPrices: () => Promise<void>;
  isRefreshingPrices: boolean;
  onRefreshCS: () => Promise<void>;
  isRefreshingCS: boolean;
  onSyncWire: () => Promise<void>;
  isSyncingWire: boolean;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  intradayMap,
  todayCatalysts,
  prices,
  strengths,
  events,
  calendar,
  overview,
  watchlistSymbols,
  selectedSymbol,
  onSelectSymbol,
  onNavigateTab,
  onToggleWatchlist,
  onOpenChart,
  onSelectEvent,
  onRefreshPrices,
  isRefreshingPrices,
  onRefreshCS,
  isRefreshingCS,
  onSyncWire,
  isSyncingWire,
}) => {
  // Asset filter for Intraday Map strip
  const [assetFilter, setAssetFilter] = useState<'ALL' | 'FOREX' | 'INDEX' | 'COMMODITY' | 'CRYPTO'>('ALL');

  // Bottom Feed toggle: News wire vs Economic calendar
  const [bottomTab, setBottomTab] = useState<'news' | 'calendar'>('news');

  // 1. KPI Top Bar calculations
  const kpiStats = useMemo(() => {
    // Strongest & Weakest Currency
    let strongest: CurrencyStrength | null = null;
    let weakest: CurrencyStrength | null = null;
    if (strengths && strengths.length > 0) {
      const sorted = [...strengths].sort((a, b) => b.strength_score - a.strength_score);
      strongest = sorted[0];
      weakest = sorted[sorted.length - 1];
    }

    // Market Sentiment tally (Bullish vs Bearish count from Intraday Map)
    const bullishCount = intradayMap.filter(a => a.overall_bias === 'BULLISH').length;
    const bearishCount = intradayMap.filter(a => a.overall_bias === 'BEARISH').length;
    const neutralCount = intradayMap.filter(a => a.overall_bias === 'NEUTRAL' || a.overall_bias === 'MIXED').length;

    let overallRegime = 'BALANCED / ROTATIONAL';
    let regimeColor = 'text-amber-300';
    if (bullishCount >= 7) {
      overallRegime = 'RISK-ON DOMINANT';
      regimeColor = 'text-emerald-400';
    } else if (bearishCount >= 7) {
      overallRegime = 'DEFENSIVE / RISK-OFF';
      regimeColor = 'text-rose-400';
    }

    // Next High Impact Event in Calendar
    const upcomingHigh = calendar.find(c => c.status === 'UPCOMING' && (c.impact === 'CRITICAL' || c.impact === 'HIGH'));

    return {
      strongest,
      weakest,
      bullishCount,
      bearishCount,
      neutralCount,
      overallRegime,
      regimeColor,
      upcomingHigh,
    };
  }, [strengths, intradayMap, calendar]);

  // Filtered Intraday Map
  const filteredMap = useMemo(() => {
    if (assetFilter === 'ALL') return intradayMap;
    return intradayMap.filter(a => a.asset_type === assetFilter);
  }, [intradayMap, assetFilter]);

  return (
    <div className="space-y-4" id="terminal-overview-dashboard">
      {/* ======================================================== */}
      {/* 1. TOP EXECUTIVE TELEMETRY BAR (KPI SUMMARY)            */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* KPI 1: Market Regime / Mood */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-cyan-400" />
              <span>MARKET REGIME</span>
            </span>
            <div className={`text-xs font-mono font-bold ${kpiStats.regimeColor}`}>
              {kpiStats.overallRegime}
            </div>
          </div>
          <div className="text-right font-mono text-[10px]">
            <div className="text-emerald-400 font-semibold">{kpiStats.bullishCount} Bullish</div>
            <div className="text-rose-400 font-semibold">{kpiStats.bearishCount} Bearish</div>
          </div>
        </div>

        {/* KPI 2: Currency Divergence (G8 Alpha) */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>G8 STRONGEST LEAD</span>
            </span>
            <div className="text-xs font-mono font-bold text-slate-100 flex items-center gap-1.5">
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-bold">
                {kpiStats.strongest?.currency || '—'}
              </span>
              <span className="text-emerald-400">
                {kpiStats.strongest ? (kpiStats.strongest.strength_score > 0 ? `+${kpiStats.strongest.strength_score.toFixed(1)}` : kpiStats.strongest.strength_score.toFixed(1)) : ''}
              </span>
            </div>
          </div>
          <div className="text-right font-mono text-[10px] space-y-0.5">
            <span className="text-slate-500 block">WEAKEST LAG</span>
            <div className="text-rose-400 font-bold flex items-center justify-end gap-1">
              <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800/80">
                {kpiStats.weakest?.currency || '—'}
              </span>
              <span>{kpiStats.weakest ? kpiStats.weakest.strength_score.toFixed(1) : ''}</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Next High-Impact Catalyst */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5 truncate pr-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>NEXT HIGH IMPACT</span>
            </span>
            <div className="text-xs font-mono font-bold text-slate-200 truncate">
              {kpiStats.upcomingHigh ? (
                <span className="flex items-center gap-1.5 truncate">
                  <span className="px-1 py-0.2 rounded bg-slate-800 text-cyan-300 text-[10px]">
                    {kpiStats.upcomingHigh.currency}
                  </span>
                  <span className="truncate">{kpiStats.upcomingHigh.event_name}</span>
                </span>
              ) : (
                <span className="text-slate-400">No imminent release</span>
              )}
            </div>
          </div>
          {kpiStats.upcomingHigh && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 shrink-0 font-semibold">
              {new Date(kpiStats.upcomingHigh.date_time_utc).toLocaleTimeString('id-ID', {
                timeZone: 'Asia/Jakarta',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              WIB
            </span>
          )}
        </div>

        {/* KPI 4: Today Catalysts Status */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>ACTIVE CATALYSTS</span>
            </span>
            <div className="text-xs font-mono font-bold text-slate-100 flex items-center gap-1.5">
              <span className="text-cyan-400">{todayCatalysts.length} Sessions Tracked</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('today_catalysts')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-[10px] font-semibold flex items-center gap-1 border border-slate-700 transition cursor-pointer"
          >
            <span>Buka</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. INTRADAY MARKET MAP (COMPACT STRIP WITH FILTERS)       */}
      {/* ======================================================== */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm space-y-3" id="dash-sec-1-market-map">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Compass className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <span>INTRADAY DIRECTIONAL BIAS MAP</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  {filteredMap.length} ASSETS
                </span>
              </h2>
            </div>
          </div>

          {/* Quick Filter Pill Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'FOREX', 'INDEX', 'COMMODITY', 'CRYPTO'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setAssetFilter(f)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition cursor-pointer ${
                  assetFilter === f
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f}
              </button>
            ))}

            <button
              onClick={() => onNavigateTab('intraday_map')}
              className="ml-2 flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 transition cursor-pointer shrink-0"
            >
              <span>Scanner Penuh</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 13-Asset Compact Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2">
          {filteredMap.map(asset => {
            const isBullish = asset.overall_bias === 'BULLISH';
            const isBearish = asset.overall_bias === 'BEARISH';
            const isMixed = asset.overall_bias === 'MIXED';

            const badgeClass = isBullish
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
              : isBearish
              ? 'bg-rose-950/80 text-rose-300 border-rose-700/80'
              : isMixed
              ? 'bg-purple-950/80 text-purple-300 border-purple-700/80'
              : 'bg-amber-950/80 text-amber-300 border-amber-700/80';

            const isSelected = selectedSymbol === asset.symbol;

            return (
              <div
                key={asset.symbol}
                onClick={() => {
                  onSelectSymbol(asset.symbol === selectedSymbol ? null : asset.symbol);
                }}
                className={`p-2 rounded-lg bg-slate-950/80 border transition cursor-pointer flex flex-col justify-between group space-y-1.5 ${
                  isSelected
                    ? 'border-cyan-400 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                    : 'border-slate-800/80 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-xs text-slate-100 group-hover:text-cyan-300 transition">
                    {asset.symbol}
                  </span>
                  <span className={`text-[8.5px] px-1 py-0.2 rounded font-bold border ${badgeClass}`}>
                    {asset.overall_bias}
                  </span>
                </div>

                <div className="flex items-baseline justify-between font-mono text-[11px]">
                  <span className="font-semibold text-slate-200">
                    {asset.asset_type === 'COMMODITY' || asset.asset_type === 'CRYPTO' ? '$' : ''}
                    {asset.symbol === 'JPY' || asset.asset_type === 'FOREX'
                      ? asset.price.toFixed(asset.symbol === 'USD' || asset.symbol === 'JPY' ? 2 : 4)
                      : asset.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </span>
                  <span
                    className={`text-[9.5px] font-bold ${
                      asset.change_24h_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {asset.change_24h_pct >= 0 ? '+' : ''}
                    {asset.change_24h_pct.toFixed(2)}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 border-t border-slate-900 pt-1">
                  <span>
                    Score:{' '}
                    <strong className={asset.direction_score >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                      {asset.direction_score > 0 ? '+' : ''}
                      {asset.direction_score}
                    </strong>
                  </span>
                  <span>
                    Conf: <strong className="text-cyan-300">{asset.confidence}%</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3 & 4. BALANCED 2-COLUMN SPLIT (DESKTOP)                 */}
      {/* Col 1 (7 cols): Market Data Grid + Watchlist             */}
      {/* Col 2 (5 cols): Currency Strength + Key Catalysts        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Market Data Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-4" id="dash-sec-3-market-overview">
          <MarketDataGrid
            prices={prices}
            watchlistSymbols={watchlistSymbols}
            intradayMap={intradayMap}
            onToggleWatchlist={onToggleWatchlist}
            onRefresh={onRefreshPrices}
            isRefreshing={isRefreshingPrices}
            onSelectSymbol={onSelectSymbol}
            onOpenChart={onOpenChart}
          />
        </div>

        {/* RIGHT COLUMN: Currency Strength + Today Catalysts (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Currency Strength Matrix Widget */}
          <div id="dash-sec-4-currency-strength">
            <CurrencyStrengthWidget
              strengths={strengths}
              onRefresh={onRefreshCS}
              isRefreshing={isRefreshingCS}
              onSelectCurrency={(cur) => onSelectSymbol(cur === selectedSymbol ? null : cur)}
            />
          </div>

          {/* Compact Today Key Catalysts Widget */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm space-y-3" id="dash-sec-2-catalysts">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                  TODAY'S KEY CATALYSTS
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('today_catalysts')}
                className="text-[11px] font-mono text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Detail</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Compact Catalysts List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
              {todayCatalysts.slice(0, 4).map(cat => (
                <div
                  key={cat.id}
                  className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-850 space-y-1.5 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[10px] text-cyan-300 px-1 py-0.2 rounded bg-slate-800">
                        {cat.currency}
                      </span>
                      <span className="text-[11px] font-bold text-slate-200 truncate max-w-[150px]">
                        {cat.event_name}
                      </span>
                    </div>
                    <span
                      className={`text-[8px] px-1 py-0.2 rounded font-bold ${
                        cat.status === 'RELEASED'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                      }`}
                    >
                      {cat.status}
                    </span>
                  </div>

                  {/* Reaction snippet */}
                  <div className="text-[10px] text-slate-300 font-sans line-clamp-1">
                    <span className="text-cyan-400 font-mono font-semibold text-[9px] mr-1">HASIL:</span>
                    {cat.actual_market_reaction}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Macro Context Pill */}
          {overview && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI MACRO SYNTHESIS</span>
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('intelligence')}
                  className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 cursor-pointer"
                >
                  Detail →
                </button>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed line-clamp-3">
                {overview.summary}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5 & 6. UNIFIED BOTTOM WIRE & CALENDAR WORKSPACE         */}
      {/* Tab Switcher: "Canonical News Wire" vs "Economic Calendar" */}
      {/* ======================================================== */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3" id="dash-sec-bottom-feeds">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          {/* Feed Switcher Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex p-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => setBottomTab('news')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  bottomTab === 'news'
                    ? 'bg-slate-800 text-cyan-300 shadow-xs border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>CANONICAL NEWS WIRE</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 ml-1">
                  {events.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBottomTab('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  bottomTab === 'calendar'
                    ? 'bg-slate-800 text-cyan-300 shadow-xs border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>ECONOMIC CALENDAR</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-amber-950 text-amber-400 ml-1">
                  {calendar.length}
                </span>
              </button>
            </div>
          </div>

          {/* Actions on right */}
          <div className="flex items-center gap-2">
            {bottomTab === 'news' ? (
              <>
                <button
                  onClick={onSyncWire}
                  disabled={isSyncingWire}
                  className="flex items-center gap-1 text-xs font-mono text-slate-300 hover:text-cyan-300 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 transition cursor-pointer disabled:opacity-50"
                  title="Sync news wire with latest source releases"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingWire ? 'animate-spin text-cyan-400' : ''}`} />
                  <span className="hidden sm:inline">Sync Wire</span>
                </button>

                <button
                  onClick={() => onNavigateTab('events')}
                  className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 transition cursor-pointer"
                >
                  <span>Full Event Wire</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => onNavigateTab('macro')}
                className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 transition cursor-pointer"
              >
                <span>Jadwal Lengkap & Filter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {bottomTab === 'news' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {events.slice(0, 6).map(event => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => onSelectEvent(event.id)}
              />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto pr-1">
            {calendar.slice(0, 10).map(item => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs font-mono hover:bg-slate-950/40 px-2 rounded transition">
                <div className="flex items-center gap-2.5 truncate pr-2">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold text-[10px]">
                    {item.currency}
                  </span>
                  <span className="text-slate-200 truncate max-w-sm">{item.event_name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
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
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      item.impact === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
