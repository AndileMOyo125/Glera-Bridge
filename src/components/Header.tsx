import React from 'react';
import { ShieldCheck, HelpCircle, Lock, MessageSquare } from 'lucide-react';
import gasLogo from '../assets/images/gas_chrome_logo_1787193914844.jpg';

interface HeaderProps {
  onOpenSecurity: () => void;
  onOpenHelp: () => void;
  onOpenAdmin?: () => void;
  isOnline: boolean;
  activeAccountCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSecurity,
  onOpenHelp,
  onOpenAdmin,
  isOnline,
  activeAccountCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#08080A]/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700/60 overflow-hidden flex items-center justify-center shadow-lg shadow-black/60 group">
            <img
              src={gasLogo}
              alt="GAS Trading Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-zinc-100 tracking-tight font-sans">Glera Bridge</span>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                GAS EA
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span>{isOnline ? `${activeAccountCount} Terminal${activeAccountCount === 1 ? '' : 's'} Active` : 'No Signal / Offline'}</span>
            </div>
          </div>
        </div>

        {/* Header Action Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Setup Guide & Help"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          <button
            onClick={onOpenSecurity}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="EA License Status"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">License</span>
          </button>

          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors flex items-center gap-1.5 text-xs font-bold font-mono shadow-sm"
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
