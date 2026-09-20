import React from 'react';
import { Home, History, Settings, ShieldCheck } from 'lucide-react';

export type TabType = 'home' | 'activity' | 'settings';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  pendingCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onChangeTab,
  pendingCount = 0,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#08080A]/95 backdrop-blur-xl border-t border-zinc-800/80 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-3 px-3 py-2 gap-1">
        <button
          onClick={() => onChangeTab('home')}
          className={`min-h-11 flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all ${
            currentTab === 'home'
              ? 'text-amber-400 bg-amber-500/10 font-bold border border-amber-500/20 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[11px] tracking-tight">Accounts</span>
        </button>

        <button
          onClick={() => onChangeTab('activity')}
          className={`min-h-11 flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all relative ${
            currentTab === 'activity'
              ? 'text-amber-400 bg-amber-500/10 font-bold border border-amber-500/20 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <History className="w-5 h-5 mb-1" />
          <span className="text-[11px] tracking-tight">Activity</span>
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-6 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => onChangeTab('settings')}
          className={`min-h-11 flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all ${
            currentTab === 'settings'
              ? 'text-amber-400 bg-amber-500/10 font-bold border border-amber-500/20 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Settings className="w-5 h-5 mb-1" />
          <span className="text-[11px] tracking-tight">Connections</span>
        </button>
      </div>
    </nav>
  );
};
