import { MarketPrice } from './market';

export type SubscriptionPlan = 'FREE' | 'PRO' | 'INSTITUTIONAL';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  is_verified: boolean;
  verification_status?: 'pending_verification' | 'verified';
  avatar_url?: string;
  plan?: SubscriptionPlan;
  subscription_status?: 'active' | 'trialing' | 'canceled' | 'none';
  subscription_expires_at?: string;
}

export interface UserWatchlist {
  id: string;
  user_id: string;
  symbol: string;
  asset_type: string;
  notes?: string;
  added_at: string;
  market_data?: MarketPrice | null;
}

export interface UserPreferences {
  // Add preferences as needed
  theme?: 'dark' | 'light';
  notifications?: boolean;
}

export interface AIAnalysis {
  id: string;
  event_id?: string;
  analysis_type: 'EVENT_ANALYSIS' | 'MARKET_OVERVIEW' | 'THEME_ANALYSIS';
  title: string;
  summary: string;
  context_data_used: {
    news_titles: string[];
    market_prices: Record<string, number>;
    currency_strength: Record<string, number>;
    macro_releases: string[];
  };
  key_implications: string[];
  affected_assets_outlook: Array<{
    asset: string;
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    rationale: string;
  }>;
  confidence: number;
  disclaimer: string;
  created_at: string;
  is_insufficient_data?: boolean;
}
