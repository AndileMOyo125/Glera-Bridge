import React, { useState } from 'react';
import { AccountDetail as AccountDetailType, EASettings } from '../types';
import {
  ArrowLeft,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Clock,
  Layers,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  Sliders,
  Radio,
  Zap,
  Info
} from 'lucide-react';
import { StrategyEditor } from './StrategyEditor';
import { PositionsList } from './PositionsList';
import { api } from '../lib/api';

interface AccountDetailProps {
  account: AccountDetailType;
  onBack: () => void;
  onPauseResume: () => void;
  onRequestCloseAll: () => void;
  onSaveSettings: (settings: EASettings) => Promise<void>;
  onRefresh: () => void;
}

export const AccountDetail: React.FC<AccountDetailProps> = ({
  account,
  onBack,
  onPauseResume,
  onRequestCloseAll,
  onSaveSettings,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'strategy' | 'positions'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleDeleteAccount = async () => {
    if (!confirm(`Delete account #${account.accountId}? This cannot be undone.`)) return;
    try {
      const res = await api.deleteAccount(account.accountId);
      if (res && res.success) {
        alert(res.message || 'Account deleted');
        onBack();
        return;
      }
      alert('Failed to delete account');
    } catch (err: any) {
      alert(err?.message || 'Delete failed');
    }
  };

  // Check 2-phase sync diff: compare saved settings against MT5 reported eaConfig
  const savedMarkets = (account.settings?.markets || []).map(m => m.symbol.toUpperCase()).sort();
  const reportedMarkets = (account.eaConfig?.markets || []).map(m => m.toUpperCase()).sort();
  const savedGlobal = account.settings?.globalMaxTrades || 6;
  const reportedGlobal = account.eaConfig?.globalMaxTrades || 6;

  const isSettingsPending =
    savedMarkets.join(',') !== reportedMarkets.join(',') ||
    savedGlobal !== reportedGlobal;

  const timeAgo = (sec: number) => {
    if (sec < 5) return 'just now';
    if (sec < 60) return `${sec}s ago`;
    const m = Math.floor(sec / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return `${h}h ago`;
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Top Bar Navigation & Status */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Accounts</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            className={`p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors ${
              isRefreshing ? 'animate-spin text-amber-400' : ''
            }`}
            title="Refresh Account Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteAccount}
            className="p-2 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500 transition-colors"
            title="Delete Account"
          >
            Delete
          </button>
          <span className="text-xs font-mono text-zinc-400 font-semibold">#{account.accountId}</span>
        </div>
      </div>

      {/* Offline Warning Banner */}
      {!account.isOnline && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3 text-rose-200 animate-in slide-in-from-top duration-200">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-sm text-rose-300">MetaTrader 5 is Offline</div>
            <div className="mt-1 text-rose-200/90 leading-relaxed">
              Last signal received <b>{timeAgo(account.secondsSinceHeartbeat)}</b>. Please check your MT5 terminal on your VPS and verify that the EA is attached with <b>Algo Trading enabled</b>.
            </div>
          </div>
        </div>
      )}

      {/* Live Terminal Status Card */}
      <div className="bg-gradient-to-b from-[#15171C] to-[#101114] border border-zinc-800 rounded-2xl p-4 shadow-lg shadow-black/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${
                !account.isOnline
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : account.status === 'PAUSED'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {!account.isOnline ? <AlertOctagon className="w-6 h-6" /> : account.status === 'PAUSED' ? <PauseCircle className="w-6 h-6" /> : <Radio className="w-6 h-6 animate-pulse" />}
            </div>
            <div>
              <div className="font-bold text-base text-white flex items-center gap-2">
                <span>{account.accountName || 'MetaTrader 5 Terminal'}</span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5 font-mono">
                {account.broker || 'Broker'} · {account.isOnline ? `Signal received ${timeAgo(account.secondsSinceHeartbeat)}` : 'Terminal disconnected'}
              </div>
            </div>
          </div>

          <div>
            {!account.isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                OFFLINE
              </span>
            ) : account.status === 'PAUSED' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <PauseCircle className="w-3.5 h-3.5" />
                PAUSED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2-Phase Synchronization Truth Banner */}
      {isSettingsPending ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              Saved to Glera Bridge · Delivering to MT5...
            </span>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
              Phase 1: Cloud Saved
            </span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            Your updated strategy has been saved on the bridge server. MT5 will pick it up on its next 5-second check-in.
          </p>
          <div className="mt-2 pt-2 border-t border-amber-500/20 text-[11px] grid grid-cols-2 gap-2 text-amber-100/80 font-mono">
            <div><b>Saved in App:</b> {savedMarkets.join(', ')} (Cap: {savedGlobal})</div>
            <div><b>Reported on MT5:</b> {reportedMarkets.length > 0 ? reportedMarkets.join(', ') : 'None'} (Cap: {reportedGlobal})</div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3 text-emerald-200 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              <b>Active on MT5:</b> {reportedMarkets.join(', ')} · Global Max: {reportedGlobal} Trades
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
            Verified Live
          </span>
        </div>
      )}

      {/* Account Financials 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#121316] border border-zinc-800 rounded-2xl p-4">
          <div className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider font-mono">Account Balance</div>
          <div className="font-bold text-xl text-white mt-1 font-mono">{formatMoney(account.balance)}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Cash funds</div>
        </div>

        <div className="bg-[#121316] border border-zinc-800 rounded-2xl p-4">
          <div className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider font-mono">Net Equity</div>
          <div className="font-bold text-xl text-white mt-1 font-mono">{formatMoney(account.equity)}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Live valuation</div>
        </div>

        <div className="bg-[#121316] border border-zinc-800 rounded-2xl p-4">
          <div className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider font-mono">Floating P/L</div>
          <div className={`font-bold text-xl mt-1 font-mono ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isProfit ? '+' : ''}{formatMoney(pnl)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Unrealized profit/loss</div>
        </div>

        <div className="bg-[#121316] border border-zinc-800 rounded-2xl p-4">
          <div className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider font-mono">Open Positions</div>
          <div className="font-bold text-xl text-white mt-1 font-mono">{account.openPositions?.length || 0}</div>
          <div className="text-[11px] text-zinc-500 mt-1">EA managed trades</div>
        </div>
      </div>

      {/* Remote Controls Action Bar */}
      <div className="bg-[#121316] border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-sm text-white">Emergency Remote Controls</h3>
            <p className="text-xs text-zinc-400">High-level management controls for your EA</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={onPauseResume}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              account.status === 'PAUSED'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold shadow-lg shadow-amber-500/20'
            }`}
          >
            {account.status === 'PAUSED' ? (
              <>
                <PlayCircle className="w-5 h-5" />
                <span>Resume EA (Allow Trades)</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-5 h-5" />
                <span>Pause EA (Stop New Trades)</span>
              </>
            )}
          </button>

          <button
            onClick={onRequestCloseAll}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 transition-all"
          >
            <AlertOctagon className="w-5 h-5" />
            <span>Emergency Close All</span>
          </button>
        </div>
        <p className="text-[11px] text-zinc-500 mt-2.5 text-center">
          * Pause stops new entries while keeping TP/SL managed. Close All immediately exits all open positions.
        </p>
      </div>

      {/* Operational View Switcher Tabs */}
      <div className="flex border-b border-zinc-800 gap-2 pt-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 px-3 text-xs font-bold tracking-tight border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Positions ({account.openPositions?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('strategy')}
          className={`pb-2.5 px-3 text-xs font-bold tracking-tight border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'strategy'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Multi-Market Strategy</span>
          {isSettingsPending && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
        </button>
      </div>

      {/* Sub-view Content */}
      {activeTab === 'overview' && (
        <PositionsList positions={account.openPositions || []} currency={currency} />
      )}

      {activeTab === 'strategy' && (
        <StrategyEditor
          initialSettings={account.settings || { markets: [{ symbol: 'EURUSD', lotSize: 0.02, maxTrades: 2 }], globalMaxTrades: 5 }}
          eaConfig={account.eaConfig}
          secondsSinceHeartbeat={account.secondsSinceHeartbeat}
          onSave={onSaveSettings}
          isOnline={account.isOnline}
        />
      )}
    </div>
  );
};
