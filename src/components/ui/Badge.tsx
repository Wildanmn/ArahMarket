import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'bullish' | 'bearish' | 'mixed' | 'neutral' | 'info' | 'critical';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  children,
  className = '',
  ...props
}: BadgeProps) {
  const variants = {
    bullish: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    bearish: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    mixed: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    neutral: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    info: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    critical: 'bg-red-500/20 text-red-400 border border-red-500/30 font-bold',
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 rounded',
    md: 'text-xs px-2 py-1 rounded-md',
  };

  const dotColors = {
    bullish: 'bg-emerald-400',
    bearish: 'bg-rose-400',
    mixed: 'bg-purple-400',
    neutral: 'bg-amber-400',
    info: 'bg-cyan-400',
    critical: 'bg-red-500',
  };

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 mr-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[variant]}`}></span>
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors[variant]}`}></span>
        </span>
      )}
      {children}
    </span>
  );
}
