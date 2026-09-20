import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  headerAction?: React.ReactNode;
  noPadding?: boolean;
}

export function Card({
  title,
  headerAction,
  noPadding = false,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-slate-900/90 border border-slate-800 rounded-xl shadow-sm overflow-hidden ${className}`}
      {...props}
    >
      {(title || headerAction) && (
        <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
          {title && (
            <div className="font-medium text-slate-200">{title}</div>
          )}
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4'}>
        {children}
      </div>
    </div>
  );
}
