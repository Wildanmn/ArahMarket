import { create } from 'zustand';
import { User, UserWatchlist } from '../types';
import { api } from '../lib/api';

const TOKEN_KEY = 'arah_market_token';

interface AuthState {
  user: User | null;
  watchlist: UserWatchlist[];
  isAuthChecking: boolean;
  token: string | null;
  
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => void;
  checkSession: () => Promise<void>;
  setUser: (user: User | null) => void;
  setWatchlist: (watchlist: UserWatchlist[]) => void;
  toggleWatchlist: (symbol: string, assetType: string) => Promise<void>;
  getToken: () => string | null;
  setToken: (token: string | null) => void;
}

/**
 * Store for managing user authentication and profile state.
 * Replaces the authentication logic previously handled in App.tsx.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  watchlist: [],
  isAuthChecking: true,
  token: localStorage.getItem(TOKEN_KEY) || localStorage.getItem('arah_market_auth_token') || localStorage.getItem('nexus_auth_token') || localStorage.getItem('auth_token') || null,

  getToken: () => {
    return localStorage.getItem(TOKEN_KEY)
      || localStorage.getItem('arah_market_auth_token')
      || localStorage.getItem('nexus_auth_token')
      || localStorage.getItem('auth_token')
      || null;
  },

  setToken: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      // For backwards compatibility until api.ts is updated
      localStorage.setItem('arah_market_auth_token', token);
      localStorage.setItem('nexus_auth_token', token);
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('arah_market_auth_token');
      localStorage.removeItem('nexus_auth_token');
      localStorage.removeItem('auth_token');
    }
    set({ token });
  },

  login: async (credentials) => {
    try {
      const res = await api.login(credentials);
      get().setToken(res.token);
      set({ user: res.user });
      await get().checkSession(); // Load watchlist and other user data
    } catch (err) {
      throw err;
    }
  },

  register: async (payload) => {
    try {
      const res = await api.register(payload);
      // If registration auto-logs in and returns a token (based on API design, it might not always do this if verification is pending)
      // We handle what we can. If the API doesn't return a token on register, the user will need to log in separately.
      if ((res as any).token) {
        get().setToken((res as any).token);
      }
      set({ user: res.user });
    } catch (err) {
      throw err;
    }
  },

  logout: () => {
    get().setToken(null);
    set({ user: null, watchlist: [] });
  },

  checkSession: async () => {
    set({ isAuthChecking: true });
    try {
      const token = get().getToken();
      if (!token) {
        set({ user: null, watchlist: [], isAuthChecking: false });
        return;
      }
      
      const res = await api.getMe();
      set({ user: res.user, watchlist: res.watchlist || [] });
    } catch (err) {
      console.warn('Session verification notice:', err);
      get().setToken(null);
      set({ user: null, watchlist: [] });
    } finally {
      set({ isAuthChecking: false });
    }
  },

  setUser: (user) => set({ user }),
  
  setWatchlist: (watchlist) => set({ watchlist }),

  toggleWatchlist: async (symbol, assetType) => {
    const { watchlist, user } = get();
    if (!user) return; // Cannot modify watchlist if not logged in
    
    const exists = watchlist.some((w) => w.symbol === symbol);
    try {
      if (exists) {
        await api.removeFromWatchlist(symbol);
        set({ watchlist: watchlist.filter((w) => w.symbol !== symbol) });
      } else {
        const res = await api.addToWatchlist(symbol, assetType);
        if (res.item) {
          set({ watchlist: [...watchlist, res.item] });
        }
      }
    } catch (err) {
      console.error('Error toggling watchlist:', err);
      throw err;
    }
  },
}));
