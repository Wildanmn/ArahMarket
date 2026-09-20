import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
  action,
  className = ''
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-cyan-400" />
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          {title}
          {badge && <div>{badge}</div>}
        </h2>
        {subtitle && (
          <span className="text-[11px] text-slate-400 hidden sm:inline-block ml-2">
            {subtitle}
          </span>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
