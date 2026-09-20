import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  if (!req.url.startsWith('/api')) return next();
  
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const level = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO';
    
    console.log(
      `[${level}] ${timestamp} | ${req.method} ${req.url} | ${status} | ${duration}ms`
    );
  });
  
  next();
}
