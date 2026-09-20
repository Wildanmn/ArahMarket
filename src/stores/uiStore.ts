import { create } from 'zustand';
import { useMarketStore } from './marketStore';
import { useAuthStore } from './authStore';
import { MarketEvent } from '../types';

export type NavTabId =
  | 'terminal'
  | 'intraday_map'
  | 'today_catalysts'
  | 'markets'
  | 'currency'
  | 'macro'
  | 'events'
  | 'intelligence'
  | 'watchlist'
  | 'admin';

interface UIState {
  activeTab: NavTabId;
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  selectedEventId: string | null;
  selectedSymbol: string | null;
  chartModalSymbol: string | null;
  searchQuery: string;
  categoryFilter: string;
  sseStatus: string;

  setActiveTab: (tab: NavTabId) => void;
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  setSelectedEventId: (id: string | null) => void;
  setSelectedSymbol: (symbol: string | null) => void;
  setChartModalSymbol: (symbol: string | null) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (filter: string) => void;
  setSseStatus: (status: string) => void;
  
  getFilteredEvents: () => MarketEvent[];
  getWatchlistSymbols: () => string[];
}

/**
 * Store for managing UI state, filters, and navigation.
 * Keeps track of selected items, open modals, and filtering criteria.
 */
export const useUIStore = create<UIState>((set, get) => ({
  activeTab: 'terminal',
  isSidebarOpen: false,
  isSidebarCollapsed: false,
  selectedEventId: null,
  selectedSymbol: null,
  chartModalSymbol: null,
  searchQuery: '',
  categoryFilter: 'ALL',
  sseStatus: 'disconnected',

  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleSidebarCollapse: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSelectedEventId: (id) => set({ selectedEventId: id }),
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  setChartModalSymbol: (symbol) => set({ chartModalSymbol: symbol }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategoryFilter: (filter) => set({ categoryFilter: filter }),
  setSseStatus: (status) => set({ sseStatus: status }),

  getFilteredEvents: () => {
    const { categoryFilter, selectedSymbol, searchQuery } = get();
    // Retrieve events from marketStore
    const events = useMarketStore.getState().events;

    return events.filter((e) => {
      if (categoryFilter !== 'ALL' && e.primary_category !== categoryFilter) return false;
      if (
        selectedSymbol &&
        !e.affected_assets.includes(selectedSymbol) &&
        !e.affected_currencies.includes(selectedSymbol)
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchSummary = e.summary.toLowerCase().includes(q);
        const matchSources = e.source_names.some((s) => s.toLowerCase().includes(q));
        const matchAssets = e.affected_assets.some((a) => a.toLowerCase().includes(q));
        const matchCurrs = e.affected_currencies.some((c) => c.toLowerCase().includes(q));
        return matchTitle || matchSummary || matchSources || matchAssets || matchCurrs;
      }
      return true;
    });
  },

  getWatchlistSymbols: () => {
    const watchlist = useAuthStore.getState().watchlist;
    return watchlist.map((w) => w.symbol);
  },
}));
