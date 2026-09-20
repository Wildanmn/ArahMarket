import { create } from 'zustand';
import {
  MarketPrice,
  CurrencyStrength,
  MarketEvent,
  EconomicEvent,
  AIAnalysis,
  IntradayAssetBias,
  TodayCatalyst,
} from '../types';
import { api } from '../lib/api';

interface MarketState {
  prices: MarketPrice[];
  strengths: CurrencyStrength[];
  events: MarketEvent[];
  calendar: EconomicEvent[];
  overview: AIAnalysis | null;
  sessions: any[];
  intradayMap: IntradayAssetBias[];
  todayCatalysts: TodayCatalyst[];
  initialLoading: boolean;
  isSyncing: boolean;
  refreshStates: {
    prices: boolean;
    currency: boolean;
    macro: boolean;
    intraday: boolean;
    catalysts: boolean;
  };

  loadInitialData: () => Promise<void>;
  refreshPrices: () => Promise<void>;
  refreshCurrencyStrength: () => Promise<void>;
  refreshMacro: () => Promise<void>;
  refreshIntraday: () => Promise<void>;
  refreshCatalysts: () => Promise<void>;
  triggerGlobalSync: () => Promise<void>;
  setPrices: (prices: MarketPrice[]) => void;
  setStrengths: (strengths: CurrencyStrength[]) => void;
  updateEvent: (event: MarketEvent) => void;
  setCalendar: (calendar: EconomicEvent[]) => void;
}

/**
 * Store for managing market data and financial events.
 * Handles fetching, caching, and real-time updates of market data.
 */
export const useMarketStore = create<MarketState>((set, get) => ({
  prices: [],
  strengths: [],
  events: [],
  calendar: [],
  overview: null,
  sessions: [],
  intradayMap: [],
  todayCatalysts: [],
  initialLoading: true,
  isSyncing: false,
  refreshStates: {
    prices: false,
    currency: false,
    macro: false,
    intraday: false,
    catalysts: false,
  },

  loadInitialData: async () => {
    try {
      set({ initialLoading: true });
      const [mktRes, curRes, evtRes, calRes, sesRes, mapRes, catRes] = await Promise.allSettled([
        api.getMarkets(),
        api.getCurrencyStrength(),
        api.getEvents(40),
        api.getEconomicCalendar(200),
        api.getMarketSessions(),
        api.getIntradayMarketMap(),
        api.getTodayCatalysts(),
      ]);

      set((state) => ({
        prices: mktRes.status === 'fulfilled' ? mktRes.value.prices : state.prices,
        strengths: curRes.status === 'fulfilled' ? curRes.value.currency_strength : state.strengths,
        events: evtRes.status === 'fulfilled' ? evtRes.value.events : state.events,
        calendar: calRes.status === 'fulfilled' ? calRes.value.calendar : state.calendar,
        sessions: sesRes.status === 'fulfilled' ? sesRes.value.sessions : state.sessions,
        intradayMap: mapRes.status === 'fulfilled' ? mapRes.value.market_map : state.intradayMap,
        todayCatalysts: catRes.status === 'fulfilled' ? catRes.value.catalysts : state.todayCatalysts,
      }));
    } catch (err) {
      console.warn('Initialization notice:', err);
    } finally {
      set({ initialLoading: false });
    }
  },

  refreshPrices: async () => {
    set((state) => ({ refreshStates: { ...state.refreshStates, prices: true } }));
    try {
      await api.refreshMarkets();
      const res = await api.getMarkets();
      set({ prices: res.prices });
    } catch (err) {
      console.error('Failed to refresh prices:', err);
    } finally {
      set((state) => ({ refreshStates: { ...state.refreshStates, prices: false } }));
    }
  },

  refreshCurrencyStrength: async () => {
    set((state) => ({ refreshStates: { ...state.refreshStates, currency: true } }));
    try {
      await api.refreshCurrencyStrength();
      const res = await api.getCurrencyStrength();
      set({ strengths: res.currency_strength });
    } catch (err) {
      console.error('Failed to refresh currency strength:', err);
    } finally {
      set((state) => ({ refreshStates: { ...state.refreshStates, currency: false } }));
    }
  },

  refreshMacro: async () => {
    set((state) => ({ refreshStates: { ...state.refreshStates, macro: true } }));
    try {
      await api.refreshEconomicCalendar();
      const res = await api.getEconomicCalendar(200);
      set({ calendar: res.calendar });
    } catch (err) {
      console.error('Failed to refresh macro calendar:', err);
    } finally {
      set((state) => ({ refreshStates: { ...state.refreshStates, macro: false } }));
    }
  },

  refreshIntraday: async () => {
    set((state) => ({ refreshStates: { ...state.refreshStates, intraday: true } }));
    try {
      const res = await api.getIntradayMarketMap();
      set({ intradayMap: res.market_map });
    } catch (err) {
      console.error('Failed to refresh intraday map:', err);
    } finally {
      set((state) => ({ refreshStates: { ...state.refreshStates, intraday: false } }));
    }
  },

  refreshCatalysts: async () => {
    set((state) => ({ refreshStates: { ...state.refreshStates, catalysts: true } }));
    try {
      const res = await api.getTodayCatalysts();
      set({ todayCatalysts: res.catalysts });
    } catch (err) {
      console.error('Failed to refresh catalysts:', err);
    } finally {
      set((state) => ({ refreshStates: { ...state.refreshStates, catalysts: false } }));
    }
  },

  triggerGlobalSync: async () => {
    set({ isSyncing: true });
    try {
      await api.runGlobalIngest();
      // Refetch all active streams
      const [eRes, cRes, mRes, mapRes, catRes] = await Promise.allSettled([
        api.getEvents(40),
        api.getCurrencyStrength(),
        api.getMarkets(),
        api.getIntradayMarketMap(),
        api.getTodayCatalysts(),
      ]);
      set((state) => ({
        events: eRes.status === 'fulfilled' ? eRes.value.events : state.events,
        strengths: cRes.status === 'fulfilled' ? cRes.value.currency_strength : state.strengths,
        prices: mRes.status === 'fulfilled' ? mRes.value.prices : state.prices,
        intradayMap: mapRes.status === 'fulfilled' ? mapRes.value.market_map : state.intradayMap,
        todayCatalysts: catRes.status === 'fulfilled' ? catRes.value.catalysts : state.todayCatalysts,
      }));
    } catch (err) {
      console.error('Manual sync notice:', err);
    } finally {
      set({ isSyncing: false });
    }
  },

  setPrices: (prices) => set({ prices }),
  
  setStrengths: (strengths) => set({ strengths }),
  
  updateEvent: (event) => set((state) => {
    const index = state.events.findIndex((e) => e.id === event.id);
    if (index >= 0) {
      const next = [...state.events];
      next[index] = event;
      return { events: next };
    }
    return { events: [event, ...state.events] };
  }),

  setCalendar: (calendar) => set({ calendar }),
}));
