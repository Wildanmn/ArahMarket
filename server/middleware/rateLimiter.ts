import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 60_000);

export function rateLimiter({
  windowMs = 60_000,
  maxRequests = 100,
  message = 'Too many requests, please try again later.',
} = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    let entry = store.get(key);
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }
    
    entry.count++;
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));
    
    if (entry.count > maxRequests) {
      return res.status(429).json({ error: message });
    }
    
    next();
  };
}

// Stricter limiter for auth endpoints
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60_000, // 15 minutes
  maxRequests: 10,
  message: 'Too many authentication attempts. Please wait 15 minutes.',
});

// Default API limiter
export const apiRateLimiter = rateLimiter({
  windowMs: 60_000,
  maxRequests: 120,
});
