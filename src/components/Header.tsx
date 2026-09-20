import React from 'react';
import { ShieldCheck, HelpCircle, Lock, MessageSquare } from 'lucide-react';

interface HeaderProps {
  onOpenSecurity: () => void;
  onOpenHelp: () => void;
  onOpenAdmin?: () => void;
  liveStatus: 'LIVE' | 'DEGRADED' | 'OFFLINE';
  activeAccountCount: number;
  totalAccountCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSecurity,
  onOpenHelp,
  onOpenAdmin,
  liveStatus,
  activeAccountCount,
  totalAccountCount,
}) => {
  const statusCopy = liveStatus === 'LIVE'
    ? `${activeAccountCount} of ${totalAccountCount} terminal${totalAccountCount === 1 ? '' : 's'} live`
    : liveStatus === 'DEGRADED'
    ? `${activeAccountCount} of ${totalAccountCount} terminals live`
    : 'No live terminal signal';

  return (
    <header className="sticky top-0 z-40 bg-[#08080A]/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700/60 overflow-hidden flex items-center justify-center shadow-lg shadow-black/60 group">
            <img
              src="/gas-logo.jpg"
              alt="Glera Bridge Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-zinc-100 tracking-tight font-sans">Glera Bridge</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
              <span className={`w-2 h-2 rounded-full ${liveStatus === 'LIVE' ? 'bg-emerald-400 animate-pulse' : liveStatus === 'DEGRADED' ? 'bg-amber-400' : 'bg-rose-500'}`} />
              <span>{statusCopy}</span>
            </div>
          </div>
        </div>

        {/* Header Action Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHelp}
            className="min-h-11 min-w-11 p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors flex items-center justify-center gap-1.5 text-xs font-medium"
            title="Setup Guide & Help"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          <button
            onClick={onOpenSecurity}
            className="min-h-11 min-w-11 p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors flex items-center justify-center gap-1.5 text-xs font-medium"
            title="Connection keys and security"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">License</span>
          </button>

          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="min-h-11 min-w-11 p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold font-mono shadow-sm"
              title="Developer Master Key Dispenser & WhatsApp Dispatch"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Dev Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
