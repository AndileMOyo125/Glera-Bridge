import React from 'react';
import { AccountSummary } from '../types';
import { ChevronRight, ArrowUpRight, ArrowDownRight, Layers, ShieldAlert, PauseCircle, PlayCircle, Radio } from 'lucide-react';

interface AccountCardProps {
  account: AccountSummary;
  onSelect: (accountId: string) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({ account, onSelect }) => {
  const pnl = account.equity - account.balance;
  const isProfit = pnl >= 0;
  const currency = account.currency || 'USD';

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(val);
  };

  const getStatusBadge = () => {
    if (!account.isOnline) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          OFFLINE
        </span>
      );
    }
    if (account.status === 'PAUSED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <PauseCircle className="w-3.5 h-3.5" />
          PAUSED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        ONLINE
      </span>
    );
  };

  return (
    <div
      onClick={() => onSelect(account.accountId)}
      className="group relative bg-gradient-to-b from-[#15171C]/90 to-[#101114]/90 hover:from-[#1A1C22] hover:to-[#131418] border border-zinc-800 hover:border-amber-500/40 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-lg shadow-black/40"
    >
      {/* Top row: Account Name, Broker, Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-white tracking-tight group-hover:text-amber-400 transition-colors">
              {account.accountName || 'Trading Account'}
            </h3>
            <span className="text-xs text-zinc-400 font-mono">#{account.accountId}</span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {account.broker || 'MetaTrader 5'} · {currency}
          </p>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Numerical Metrics 4-col */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-zinc-800">
        <div>
          <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider font-mono">Balance</div>
          <div className="font-bold text-sm text-zinc-200 mt-0.5 font-mono">{formatMoney(account.balance)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider font-mono">Equity</div>
          <div className="font-bold text-sm text-zinc-200 mt-0.5 font-mono">{formatMoney(account.equity)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider font-mono">Floating P/L</div>
          <div className={`font-bold text-sm mt-0.5 flex items-center gap-0.5 font-mono ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isProfit ? <ArrowUpRight className="w-3.5 h-3.5 inline" /> : <ArrowDownRight className="w-3.5 h-3.5 inline" />}
            {isProfit ? '+' : ''}{formatMoney(pnl)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider font-mono">Active Trades</div>
          <div className="font-bold text-sm text-zinc-200 mt-0.5 flex items-center justify-between">
            <span>{account.positionCount} position{account.positionCount === 1 ? '' : 's'}</span>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>

      {/* Active Strategy Pair Badges */}
      {account.activeMarkets && account.activeMarkets.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider font-mono">Markets:</span>
            {account.activeMarkets.slice(0, 4).map((sym) => (
              <span key={sym} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 text-zinc-300 border border-zinc-800">
                {sym}
              </span>
            ))}
            {account.activeMarkets.length > 4 && (
              <span className="text-[10px] text-zinc-400 font-medium">+{account.activeMarkets.length - 4} more</span>
            )}
          </div>
          <span className="text-[11px] text-amber-400 font-semibold group-hover:underline flex items-center gap-0.5">
            Command Center →
          </span>
        </div>
      )}
    </div>
  );
};
