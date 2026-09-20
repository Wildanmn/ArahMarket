import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // App
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  appSecret: process.env.APP_SECRET || 'default-dev-secret-change-me',
  
  // Gemini AI
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  
  // Database
  dbPath: process.env.DB_PATH || './data/market_intelligence.db.json',
  
  // Rate Limiting
  rateLimit: {
    windowMs: 60_000,
    maxRequests: 120,
  },
} as const;

export type AppConfig = typeof config;
