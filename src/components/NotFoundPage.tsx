import React from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (to: string) => void;
}

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-mono">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-slate-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-200">404</h1>
        <p className="text-sm text-slate-400">Terminal endpoint not found</p>
        <button
          onClick={() => onNavigate('/')}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition text-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Terminal</span>
        </button>
      </div>
    </div>
  );
}
