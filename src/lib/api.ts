import {
  MarketPrice,
  CurrencyStrength,
  MarketEvent,
  EconomicEvent,
  AIAnalysis,
  MarketTheme,
  TelegramChannel,
  User,
  UserWatchlist,
  CentralBankSpeech,
  CurrencyMacroContext,
  UnifiedMarketContext,
  IntradayAssetBias,
  TodayCatalyst,
  SubscriptionPlan,
  DailyMarketSnapshot,
  MarketMemoryInsight,
  HistoricalCurrencyComparison,
  SmtpStatusResponse,
  SmtpTestResponse,
} from '../types';

export const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('arah_market_auth_token') || localStorage.getItem('nexus_auth_token') || localStorage.getItem('auth_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('arah_market_auth_token', token);
    localStorage.setItem('nexus_auth_token', token);
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('arah_market_auth_token');
    localStorage.removeItem('nexus_auth_token');
    localStorage.removeItem('auth_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const err: any = new Error(errorJson.error || errorJson.message || `Request failed with status ${res.status}`);
    err.code = errorJson.code;
    err.email = errorJson.email;
    err.verificationUrl = errorJson.verificationUrl;
    err.status = res.status;
    throw err;
  }

  return res.json();
}

export const api = {
  // Markets
  getMarkets: () => request<{ prices: MarketPrice[]; count: number }>('/markets'),
  getMarketSessions: () => request<{ sessions: any[]; active_sessions_count: number }>('/markets/status'),
  refreshMarkets: () => request<{ success: boolean }>('/markets/refresh', { method: 'POST' }),

  // Events
  getEvents: (limit = 30) => request<{ events: MarketEvent[]; count: number }>(`/events?limit=${limit}`),
  getEventDetail: (id: string) => request<{
    event: MarketEvent;
    sources: any[];
    timeline: any[];
    affected_markets: MarketPrice[];
    affected_currencies: CurrencyStrength[];
    ai_analysis: AIAnalysis | null;
  }>(`/events/${id}`),
  reanalyzeEvent: (id: string) => request<{ success: boolean; analysis: AIAnalysis }>(`/events/${id}/analyze`, { method: 'POST' }),

  // Currency Strength
  getCurrencyStrength: () => request<{ currency_strength: CurrencyStrength[]; source: string }>('/currency-strength'),
  refreshCurrencyStrength: () => request<{ success: boolean; currency_strength: CurrencyStrength[] }>('/currency-strength/refresh', { method: 'POST' }),

  // Intraday Market Map & Today's Catalysts
  getIntradayMarketMap: () => request<{ market_map: IntradayAssetBias[]; count: number; timestamp: string }>('/intelligence/intraday-map'),
  getTodayCatalysts: () => request<{ catalysts: TodayCatalyst[]; count: number; timestamp: string }>('/macro/today-catalysts'),

  // Macro Calendar
  getEconomicCalendar: (limit = 200, status?: string) =>
    request<{ calendar: EconomicEvent[]; count: number; upcoming_count?: number; released_count?: number; next_event?: EconomicEvent }>(
      `/macro/calendar?limit=${limit}${status ? `&status=${status}` : ''}`
    ),
  refreshEconomicCalendar: () => request<{ success: boolean; count: number }>('/macro/refresh', { method: 'POST' }),

  // Intelligence & AI
  getMarketThemes: () => request<{ themes: MarketTheme[] }>('/intelligence/themes'),
  getCentralBankSpeeches: () => request<{ speeches: CentralBankSpeech[]; count: number }>('/intelligence/central-bank-speeches'),
  getMacroContext: () => request<{ contexts: CurrencyMacroContext[]; count: number }>('/intelligence/macro-context'),
  getUnifiedMarketContext: () => request<{ context: UnifiedMarketContext }>('/intelligence/unified-context'),
  getMarketImpact: () => request<{ high_impact_events: MarketEvent[]; currency_dispersion: CurrencyStrength[]; market_overview_prices: any[] }>('/intelligence/impact'),
  getRelationshipMatrix: () => request<{ relationship_matrix: any[] }>('/intelligence/relationships'),
  getAIOverview: () => request<{ market_overview: AIAnalysis }>('/intelligence/ai'),
  refreshAIOverview: () => request<{ success: boolean; market_overview: AIAnalysis }>('/intelligence/ai/refresh', { method: 'POST' }),

  // Auth & User
  getMe: () => request<{ user: User; preferences: any; watchlist: UserWatchlist[] }>('/auth/me'),
  login: (credentials: { email: string; password: string }) => request<{ user: User; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  register: (payload: { email: string; password: string; name: string }) => request<{
    success: boolean;
    status: 'pending_verification';
    message: string;
    email: string;
    verificationUrl?: string;
    user: User;
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  verifyEmail: (token: string) => request<{
    success: boolean;
    message: string;
    token: string;
    user: User;
  }>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  }),
  resendVerification: (email: string) => request<{
    success: boolean;
    message: string;
    verificationUrl?: string;
  }>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  getWatchlist: () => request<{ watchlist: UserWatchlist[] }>('/user/watchlist'),
  addToWatchlist: (symbol: string, asset_type: string) => request<{ success: boolean; item: UserWatchlist }>('/user/watchlist', {
    method: 'POST',
    body: JSON.stringify({ symbol, asset_type }),
  }),
  removeFromWatchlist: (symbol: string) => request<{ success: boolean; symbol: string }>(`/user/watchlist/${symbol}`, {
    method: 'DELETE',
  }),
  updateSubscription: (plan: SubscriptionPlan) => request<{ success: boolean; user: User }>('/user/subscription', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  }),
  getUserEntitlements: () => request<any>('/user/entitlements'),
  requestPasswordReset: (email: string) => request<{ message: string; resetUrl?: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  forgotPassword: (email: string) => request<{ success: boolean; message: string; resetUrl?: string; email: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  resetPassword: (payload: { token?: string; newPassword: string; email?: string; directReset?: boolean }) => request<{
    success: boolean;
    message: string;
    token: string;
    user: User;
  }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  requestMagicLink: (email: string) => request<{ success: boolean; message: string; magicUrl?: string; email: string }>('/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  verifyMagicLink: (token: string) => request<{
    success: boolean;
    message: string;
    token: string;
    user: User;
  }>('/auth/magic-link-verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  }),
  quickLogin: (email?: string) => request<{
    success: boolean;
    message: string;
    token: string;
    user: User;
  }>('/auth/quick-login', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),

  // Admin
  getSystemHealth: () => request<any>('/admin/system-health'),
  getAdminUsers: (params?: { search?: string; role?: string; plan?: string; status?: string; verified?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.role) q.set('role', params.role);
    if (params?.plan) q.set('plan', params.plan);
    if (params?.status) q.set('status', params.status);
    if (params?.verified) q.set('verified', params.verified);
    const qs = q.toString();
    return request<{
      users: User[];
      count: number;
      metrics?: {
        total: number;
        verified: number;
        unverified: number;
        admins: number;
        pro: number;
        institutional: number;
        free: number;
      };
    }>(`/admin/users${qs ? `?${qs}` : ''}`);
  },
  createAdminUser: (data: {
    name: string;
    email: string;
    password?: string;
    role?: 'USER' | 'ADMIN';
    plan?: 'FREE' | 'PRO' | 'INSTITUTIONAL';
    subscription_status?: string;
    is_verified?: boolean;
  }) => request<{ success: boolean; user: User; initial_password?: string }>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateAdminUser: (id: string, updates: {
    name?: string;
    email?: string;
    role?: string;
    plan?: string;
    subscription_status?: string;
    is_verified?: boolean;
  }) => request<{ success: boolean; user: User }>(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),
  deleteAdminUser: (id: string) => request<{ success: boolean; message: string; deleted_id: string }>(`/admin/users/${id}`, {
    method: 'DELETE',
  }),
  resetAdminUserPassword: (id: string, new_password?: string) => request<{
    success: boolean;
    message: string;
    temporary_password?: string;
  }>(`/admin/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ new_password }),
  }),
  generateAdminUserMagicLink: (id: string) => request<{
    success: boolean;
    token: string;
    magic_link: string;
    user_email: string;
    expires_at: string;
  }>(`/admin/users/${id}/magic-link`, {
    method: 'POST',
  }),
  toggleAdminUserVerification: (id: string) => request<{
    success: boolean;
    is_verified: boolean;
    user: User;
    message: string;
  }>(`/admin/users/${id}/toggle-verification`, {
    method: 'POST',
  }),
  getSources: () => request<{ sources: any[]; count: number }>('/admin/sources'),
  toggleSource: (id: string, is_enabled: boolean) => request<any>(`/admin/sources/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_enabled }),
  }),
  getTelegramChannels: () => request<{ channels: TelegramChannel[]; count: number }>('/admin/telegram'),
  addTelegramChannel: (handle: string, title?: string, language?: string) => request<any>('/admin/telegram', {
    method: 'POST',
    body: JSON.stringify({ handle, title, language }),
  }),
  toggleTelegramChannel: (handle: string, is_enabled: boolean) => request<any>(`/admin/telegram/${handle}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_enabled }),
  }),
  deleteTelegramChannel: (handle: string) => request<any>(`/admin/telegram/${handle}`, {
    method: 'DELETE',
  }),
  triggerTelegramScrape: (handle: string) => request<any>(`/admin/telegram/${handle}/scrape`, {
    method: 'POST',
  }),
  getDuplicates: () => request<{ total_deduplicated_events: number; events: any[] }>('/admin/duplicates'),
  runGlobalIngest: () => request<any>('/sync', { method: 'POST' }).catch(() => request<any>('/admin/ingest/run-all', { method: 'POST' })),
  getSourcesAudit: () => request<{
    total_sources: number;
    active_sources: number;
    sources: any[];
    telegram_channels: any[];
    integrity_stats: {
      total_canonical_events: number;
      multi_source_verified_events: number;
      total_news_items: number;
    };
    timestamp: string;
  }>('/sources'),
  injectTestArticle: (payload: { title: string; content?: string; source_name?: string; language?: string }) => request<any>('/admin/ingest/test-article', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Historical Market Memory & Snapshots
  getDailySnapshots: (range = 'ALL', date?: string, limit = 30) =>
    request<{ snapshots: DailyMarketSnapshot[]; count: number }>(`/history/snapshots?range=${range}${date ? `&date=${date}` : ''}&limit=${limit}`),
  getDailySnapshotDetail: (date: string) =>
    request<{
      snapshot: DailyMarketSnapshot;
      events: MarketEvent[];
      economic_events: EconomicEvent[];
      currency_history: any[];
    }>(`/history/snapshot/${date}`),
  getMarketMemoryInsights: () =>
    request<{ insights: MarketMemoryInsight[]; count: number }>('/history/insights'),
  getHistoricalCurrencyComparison: () =>
    request<{ comparisons: HistoricalCurrencyComparison[]; count: number; source: string }>('/history/currency-comparison'),
  generateDailySnapshot: (date?: string) =>
    request<{ success: boolean; snapshot: DailyMarketSnapshot }>('/history/generate-snapshot', {
      method: 'POST',
      body: JSON.stringify({ date }),
    }),

  // Admin SMTP Management & Connection Tester
  getSmtpStatus: () => request<SmtpStatusResponse>('/admin/smtp/status'),
  testSmtpConnection: (payload?: { send_test_email?: boolean; recipient?: string }) =>
    request<SmtpTestResponse>('/admin/smtp/test', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),
};
