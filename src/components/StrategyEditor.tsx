import React, { useState, useMemo } from 'react';
import { EASettings, MarketConfig, EAAppliedConfig } from '../types';
import { Plus, Trash2, ShieldCheck, AlertCircle, Save, Sliders, Search, Check, Sparkles, X, Clock, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StrategyEditorProps {
  initialSettings: EASettings;
  eaConfig?: EAAppliedConfig | null;
  secondsSinceHeartbeat?: number;
  onSave: (settings: EASettings) => Promise<void>;
  isOnline: boolean;
}

interface InstrumentCatalogItem {
  id: string;
  name: string;
  category: 'Forex' | 'Commodities' | 'Indices' | 'Crypto';
  baseSymbol: string;
  description: string;
}

const INSTRUMENT_CATALOG: InstrumentCatalogItem[] = [
  { id: 'eurusd', name: 'Euro vs US Dollar', category: 'Forex', baseSymbol: 'EURUSD', description: 'Major Forex pair' },
  { id: 'gbpusd', name: 'British Pound vs US Dollar', category: 'Forex', baseSymbol: 'GBPUSD', description: 'Cable Forex pair' },
  { id: 'usdjpy', name: 'US Dollar vs Japanese Yen', category: 'Forex', baseSymbol: 'USDJPY', description: 'Major Asian session pair' },
  { id: 'audusd', name: 'Australian Dollar vs US Dollar', category: 'Forex', baseSymbol: 'AUDUSD', description: 'Commodity currency pair' },
  { id: 'usdcad', name: 'US Dollar vs Canadian Dollar', category: 'Forex', baseSymbol: 'USDCAD', description: 'Loonie pair' },
  { id: 'xauusd', name: 'Gold (Spot USD)', category: 'Commodities', baseSymbol: 'XAUUSD', description: 'Gold bullion against USD' },
  { id: 'xagusd', name: 'Silver (Spot USD)', category: 'Commodities', baseSymbol: 'XAGUSD', description: 'Silver against USD' },
  { id: 'us30', name: 'US Wall Street 30 / Dow', category: 'Indices', baseSymbol: 'US30', description: 'Dow Jones Industrial Index' },
  { id: 'nas100', name: 'US Tech 100 / Nasdaq', category: 'Indices', baseSymbol: 'NAS100', description: 'Nasdaq 100 Technology Index' },
  { id: 'ger40', name: 'Germany 40 / DAX', category: 'Indices', baseSymbol: 'GER40', description: 'German Stock Index' },
  { id: 'btcusd', name: 'Bitcoin vs US Dollar', category: 'Crypto', baseSymbol: 'BTCUSD', description: 'Cryptocurrency spot' },
  { id: 'ethusd', name: 'Ethereum vs US Dollar', category: 'Crypto', baseSymbol: 'ETHUSD', description: 'Ethereum spot' },
];

export const StrategyEditor: React.FC<StrategyEditorProps> = ({
  initialSettings,
  eaConfig,
  secondsSinceHeartbeat = 3,
  onSave,
  isOnline,
}) => {
  const [markets, setMarkets] = useState<MarketConfig[]>(
    initialSettings.markets && initialSettings.markets.length > 0
      ? initialSettings.markets.map(m => ({ ...m, enabled: m.enabled !== false }))
      : [{ symbol: 'EURUSD', lotSize: 0.02, maxTrades: 2, enabled: true }]
  );
  const [globalMaxTrades, setGlobalMaxTrades] = useState<number>(
    initialSettings.globalMaxTrades || 5
  );
  const [isSaving, setIsSaving] = useState(false);
  const [justSavedToBridge, setJustSavedToBridge] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Suffix selector & Symbol picker modal state
  const [selectedSuffix, setSelectedSuffix] = useState<string>('');
  const [isSymbolPickerOpen, setIsSymbolPickerOpen] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [pickerCategory, setPickerCategory] = useState<string>('All');

  // Detect broker suffix automatically from existing symbols (e.g. EURUSDm -> 'm')
  const detectedSuffix = useMemo(() => {
    for (const m of markets) {
      if (m.symbol.endsWith('m') && m.symbol.length === 7) return 'm';
      if (m.symbol.endsWith('.a')) return '.a';
      if (m.symbol.endsWith('.pro')) return '.pro';
      if (m.symbol.endsWith('.raw')) return '.raw';
    }
    return '';
  }, [markets]);

  const activeSuffix = selectedSuffix !== '' ? selectedSuffix : detectedSuffix;

  // Compute 5-State Synchronization Status Truth
  const syncStatus = useMemo(() => {
    // 1. Check if draft has unsaved changes compared to initialSettings
    const hasUnsavedChanges =
      globalMaxTrades !== initialSettings.globalMaxTrades ||
      markets.length !== initialSettings.markets.length ||
      markets.some((dm, i) => {
        const sm = initialSettings.markets[i];
        if (!sm) return true;
        return (
          dm.symbol.toUpperCase().trim() !== sm.symbol.toUpperCase().trim() ||
          dm.lotSize !== sm.lotSize ||
          dm.maxTrades !== sm.maxTrades ||
          (dm.enabled !== false) !== (sm.enabled !== false)
        );
      });

    if (hasUnsavedChanges) {
      return {
        stage: 'UNSAVED' as const,
        badge: 'Draft (Unsaved Changes)',
        title: 'Unsaved Local Changes',
        description: 'You have modified strategy parameters locally. Tap "Save to Glera Bridge" below to dispatch them to your MT5 terminal.',
        badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        cardBorder: 'border-amber-500/30',
      };
    }

    if (!isOnline) {
      return {
        stage: 'OFFLINE' as const,
        badge: 'Saved in Cloud · MT5 Offline',
        title: 'Waiting for MT5 Terminal to Reconnect',
        description: `Settings are saved securely in Glera Bridge cloud, but Dennis1.0 EA last sent a signal ${secondsSinceHeartbeat}s ago. Dennis1.0 will apply this strategy as soon as the MT5 VPS reconnects.`,
        badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        cardBorder: 'border-rose-500/30',
      };
    }

    // Compare saved enabled markets against what MT5 EA reported in heartbeat
    const enabledSavedSymbols = initialSettings.markets
      .filter(m => m.enabled !== false)
      .map(m => m.symbol.toUpperCase().trim())
      .sort();
    const reportedSymbols = (eaConfig?.markets || [])
      .map(s => s.toUpperCase().trim())
      .sort();
    const savedGlobal = initialSettings.globalMaxTrades;
    const reportedGlobal = eaConfig?.globalMaxTrades;

    const isAppliedToMT5 =
      reportedGlobal === savedGlobal &&
      enabledSavedSymbols.length === reportedSymbols.length &&
      enabledSavedSymbols.every((sym, idx) => sym === reportedSymbols[idx]);

    if (isAppliedToMT5) {
      return {
        stage: 'APPLIED_TO_MT5' as const,
        badge: 'Verified Live on MT5',
        title: 'Applied & Active on MetaTrader 5',
        description: `Dennis1.0 EA reported in its latest heartbeat that it is actively managing ${reportedSymbols.length} market(s) with a global limit of ${reportedGlobal} open trades.`,
        badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        cardBorder: 'border-emerald-500/30',
      };
    }

    return {
      stage: 'WAITING_FOR_MT5' as const,
      badge: 'Saved on Bridge · Waiting for MT5',
      title: 'Waiting for Dennis1.0 EA Heartbeat',
      description: `Settings saved in Glera Bridge cloud. Dennis1.0 checks in every ~5 seconds and will apply these rules on its next check-in.`,
      badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      cardBorder: 'border-blue-500/30',
    };
  }, [markets, globalMaxTrades, initialSettings, eaConfig, isOnline, secondsSinceHeartbeat]);

  const handleUpdateMarket = (index: number, key: keyof MarketConfig, value: any) => {
    setMarkets(prev => {
      const next = [...prev];
      if (key === 'symbol') {
        next[index] = { ...next[index], symbol: String(value).toUpperCase().trim() };
      } else if (key === 'lotSize') {
        next[index] = { ...next[index], lotSize: Number(value) };
      } else if (key === 'maxTrades') {
        next[index] = { ...next[index], maxTrades: Number(value) };
      } else if (key === 'enabled') {
        next[index] = { ...next[index], enabled: Boolean(value) };
      }
      return next;
    });
    setValidationError(null);
    setJustSavedToBridge(false);
  };

  const handleStepLotSize = (index: number, delta: number) => {
    setMarkets(prev => {
      const next = [...prev];
      const current = next[index].lotSize || 0.02;
      const updated = Math.max(0.01, Math.min(100.0, Number((current + delta).toFixed(2))));
      next[index] = { ...next[index], lotSize: updated };
      return next;
    });
    setJustSavedToBridge(false);
  };

  const handleStepMaxTrades = (index: number, delta: number) => {
    setMarkets(prev => {
      const next = [...prev];
      const current = next[index].maxTrades || 1;
      const updated = Math.max(1, Math.min(50, current + delta));
      next[index] = { ...next[index], maxTrades: updated };
      return next;
    });
    setJustSavedToBridge(false);
  };

  const handleAddMarket = (baseSymbol?: string) => {
    if (markets.length >= 20) {
      setValidationError('You can configure a maximum of 20 simultaneous markets.');
      return;
    }
    let formattedSymbol = baseSymbol ? baseSymbol.toUpperCase().trim() : '';
    if (formattedSymbol && activeSuffix && !formattedSymbol.endsWith(activeSuffix)) {
      formattedSymbol = `${formattedSymbol}${activeSuffix}`;
    }

    setMarkets(prev => [
      ...prev,
      { symbol: formattedSymbol, lotSize: 0.02, maxTrades: 2, enabled: true }
    ]);
    setValidationError(null);
    setJustSavedToBridge(false);
  };

  const handleRemoveMarket = (index: number) => {
    if (markets.length <= 1) {
      setValidationError('You must have at least one active market in your strategy.');
      return;
    }
    setMarkets(prev => prev.filter((_, i) => i !== index));
    setValidationError(null);
    setJustSavedToBridge(false);
  };

  const handleStepGlobal = (delta: number) => {
    setGlobalMaxTrades(prev => Math.max(1, Math.min(100, prev + delta)));
    setJustSavedToBridge(false);
  };

  const validate = (): string | null => {
    if (markets.length === 0) return 'Add at least one market.';
    if (markets.length > 20) return 'Maximum 20 markets allowed.';

    const seen = new Set<string>();
    for (let i = 0; i < markets.length; i++) {
      const m = markets[i];
      if (!m.symbol || m.symbol.trim().length < 3) {
        return `Market #${i + 1} has an empty or invalid symbol name.`;
      }
      const sym = m.symbol.trim().toUpperCase();
      if (!/^[A-Z0-9._-]{3,20}$/.test(sym)) {
        return `Market symbol '${sym}' contains invalid characters. Use letters, numbers, dot, or underscore.`;
      }
      if (seen.has(sym)) {
        return `Duplicate market '${sym}' detected. Each market symbol must be unique.`;
      }
      seen.add(sym);

      if (isNaN(m.lotSize) || m.lotSize < 0.01 || m.lotSize > 100) {
        return `Lot size for ${sym} must be between 0.01 and 100.00.`;
      }
      if (!Number.isInteger(m.maxTrades) || m.maxTrades < 1 || m.maxTrades > 50) {
        return `Max trades for ${sym} must be a whole number between 1 and 50.`;
      }
    }

    if (!Number.isInteger(globalMaxTrades) || globalMaxTrades < 1 || globalMaxTrades > 100) {
      return 'Global maximum trades must be between 1 and 100.';
    }

    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      setValidationError(error);
      return;
    }

    setIsSaving(true);
    setJustSavedToBridge(false);
    try {
      await onSave({
        markets: markets.map(m => ({
          symbol: m.symbol.trim().toUpperCase(),
          lotSize: Number(m.lotSize.toFixed(2)),
          maxTrades: Math.round(m.maxTrades),
          enabled: m.enabled !== false,
        })),
        globalMaxTrades,
      });
      setJustSavedToBridge(true);
    } catch (e: any) {
      setValidationError(e.message || 'Failed to save settings to server');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered symbols for market picker modal
  const filteredCatalog = useMemo(() => {
    return INSTRUMENT_CATALOG.filter(item => {
      const matchesCategory = pickerCategory === 'All' || item.category === pickerCategory;
      const q = pickerSearchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.baseSymbol.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [pickerCategory, pickerSearchQuery]);

  return (
    <div className="space-y-4">
      {/* 5-State Truthful Synchronization Status Card */}
      <div className={`bg-[#121316] border rounded-2xl p-4 space-y-2 transition-all ${syncStatus.cardBorder}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {syncStatus.stage === 'APPLIED_TO_MT5' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : syncStatus.stage === 'WAITING_FOR_MT5' ? (
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
            ) : syncStatus.stage === 'OFFLINE' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <Sliders className="w-4 h-4 text-amber-400" />
            )}
            <h3 className="font-bold text-sm text-white">{syncStatus.title}</h3>
          </div>
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border font-mono ${syncStatus.badgeColor}`}>
            {syncStatus.badge}
          </span>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          {syncStatus.description}
        </p>

        {/* Live sync telemetry breakdown */}
        <div className="pt-2 border-t border-zinc-800 text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-400 font-mono">
          <div>
            <span className="text-zinc-500 font-semibold">Configured on Bridge: </span>
            <span className="text-zinc-200">
              {initialSettings.markets.map(m => m.symbol).join(', ') || 'None'} (Cap: {initialSettings.globalMaxTrades})
            </span>
          </div>
          <div>
            <span className="text-zinc-500 font-semibold">Reported Live on MT5: </span>
            <span className={syncStatus.stage === 'APPLIED_TO_MT5' ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {eaConfig?.markets?.length ? eaConfig.markets.join(', ') : 'None'} (Cap: {eaConfig?.globalMaxTrades ?? '—'})
            </span>
          </div>
        </div>
      </div>

      {/* Broker Suffix Assistant */}
      <div className="bg-[#121316] border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-white">Broker Symbol Suffix Assistant</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">
            {activeSuffix ? `Active: "${activeSuffix}"` : 'Standard symbols (no suffix)'}
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Brokers often append letters to symbols (e.g. <span className="font-mono text-zinc-300">EURUSDm</span> for Cent/Micro or <span className="font-mono text-zinc-300">EURUSD.a</span> for ECN). Match your MT5 Market Watch exactly.
        </p>

        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {[
            { label: 'None (Standard)', val: '' },
            { label: 'm (Micro/Cent)', val: 'm' },
            { label: '.a (Raw/ECN)', val: '.a' },
            { label: 'pro', val: '.pro' },
            { label: 'raw', val: '.raw' },
          ].map(s => {
            const isSelected = activeSuffix === s.val;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => setSelectedSuffix(s.val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-black shadow-sm font-extrabold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2 animate-in fade-in duration-150 font-mono">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Markets List */}
      <div className="space-y-3">
        {markets.map((m, index) => {
          const isMarketEnabled = m.enabled !== false;
          return (
            <div
              key={index}
              className={`border rounded-2xl p-4 transition-all ${
                isMarketEnabled
                  ? 'bg-[#121316] border-zinc-800'
                  : 'bg-[#0a0a0c] border-zinc-900 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    Market #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateMarket(index, 'enabled', !isMarketEnabled)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border transition-colors ${
                      isMarketEnabled
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-zinc-800/40 border-zinc-700/40 text-zinc-400'
                    }`}
                  >
                    {isMarketEnabled ? '● Enabled' : '○ Disabled'}
                  </button>
                </div>

                {markets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMarket(index)}
                    className="p-1 text-zinc-400 hover:text-rose-400 transition-colors"
                    title="Remove this market"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Symbol Input */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Exact MT5 Symbol
                  </label>
                  <input
                    type="text"
                    value={m.symbol}
                    onChange={e => handleUpdateMarket(index, 'symbol', e.target.value)}
                    placeholder="e.g. EURUSDm"
                    className="w-full bg-[#08080A] border border-zinc-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500 uppercase"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block font-mono">
                    Must match MT5 Market Watch
                  </span>
                </div>

                {/* Lot Size Stepper */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Lot Size
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStepLotSize(index, -0.01)}
                      className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold flex items-center justify-center text-lg active:scale-95"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="100"
                      value={m.lotSize}
                      onChange={e => handleUpdateMarket(index, 'lotSize', parseFloat(e.target.value) || 0.01)}
                      className="flex-1 bg-[#08080A] border border-zinc-800 rounded-xl py-2 text-center text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleStepLotSize(index, 0.01)}
                      className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold flex items-center justify-center text-lg active:scale-95"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block text-center font-mono">
                    Volume per trade
                  </span>
                </div>

                {/* Max Trades for this Market */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Max Trades (This Pair)
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStepMaxTrades(index, -1)}
                      className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold flex items-center justify-center text-lg active:scale-95"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="50"
                      value={m.maxTrades}
                      onChange={e => handleUpdateMarket(index, 'maxTrades', parseInt(e.target.value) || 1)}
                      className="flex-1 bg-[#08080A] border border-zinc-800 rounded-xl py-2 text-center text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleStepMaxTrades(index, 1)}
                      className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold flex items-center justify-center text-lg active:scale-95"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block text-center font-mono">
                    Position limit
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Market Selector Trigger & Quick Add Presets */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 font-medium font-mono">Quick Instruments ({activeSuffix ? `Suffix: ${activeSuffix}` : 'Standard'}):</span>
          <button
            type="button"
            onClick={() => setIsSymbolPickerOpen(true)}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Market Catalog</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'US30', 'NAS100'].map(baseSym => {
            const fullSym = activeSuffix ? `${baseSym}${activeSuffix}` : baseSym;
            return (
              <button
                key={baseSym}
                type="button"
                onClick={() => handleAddMarket(baseSym)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-zinc-900 hover:bg-amber-500/15 text-zinc-300 hover:text-amber-400 border border-zinc-800 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                <span>{fullSym}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleAddMarket()}
          className="w-full py-2.5 border border-dashed border-zinc-800 hover:border-amber-500/50 rounded-xl text-xs font-bold text-zinc-300 hover:text-amber-400 bg-zinc-900/50 hover:bg-zinc-900 flex items-center justify-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Broker Symbol</span>
        </button>
      </div>

      {/* Global Maximum Simultaneous Trades Card */}
      <div className="bg-[#121316] border border-amber-500/30 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="font-bold text-sm text-white">Global Account Trade Cap</div>
            <div className="text-xs text-zinc-400 mt-0.5 max-w-sm">
              Account-wide ceiling across all configured pairs. Dennis1.0 will never exceed this total number of open trades simultaneously.
            </div>
          </div>

          <div className="flex items-center gap-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleStepGlobal(-1)}
              className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold flex items-center justify-center text-xl active:scale-95"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max="100"
              value={globalMaxTrades}
              onChange={e => setGlobalMaxTrades(parseInt(e.target.value) || 1)}
              className="w-16 bg-[#08080A] border border-zinc-800 rounded-xl py-2 text-center text-base font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={() => handleStepGlobal(1)}
              className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold flex items-center justify-center text-xl active:scale-95"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Safety Guard Note */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-400 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          <b>Safety Protection:</b> If you remove or disable a market with active open positions, Dennis1.0 will safely manage those positions to their designated Stop Loss or Take Profit targets rather than leaving them unattended.
        </p>
      </div>

      {/* Save & Apply Button */}
      <div className="pt-2 sticky bottom-16 z-20">
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-black" />
              <span>Saving to Glera Bridge Cloud...</span>
            </div>
          ) : (
            <>
              <Save className="w-4 h-4 text-black" />
              <span>💾 Save to Glera Bridge ({markets.filter(m => m.enabled !== false).length} Active Market{markets.length === 1 ? '' : 's'})</span>
            </>
          )}
        </button>
      </div>

      {/* Instrument Catalog Search Modal */}
      {isSymbolPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121316] border border-zinc-800 rounded-3xl max-w-md w-full p-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="font-bold text-base text-white">Select Trading Instrument</h3>
                <p className="text-[11px] text-zinc-400">Choose an asset to automatically apply your broker's suffix</p>
              </div>
              <button
                onClick={() => setIsSymbolPickerOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="mt-3">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={pickerSearchQuery}
                  onChange={e => setPickerSearchQuery(e.target.value)}
                  placeholder="Search Gold, Euro, Nasdaq, BTC..."
                  className="w-full bg-[#08080A] border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1">
              {['All', 'Forex', 'Commodities', 'Indices', 'Crypto'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setPickerCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    pickerCategory === cat
                      ? 'bg-amber-500 text-black font-extrabold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Instrument Results List */}
            <div className="mt-3 overflow-y-auto space-y-2 flex-1 pr-1">
              {filteredCatalog.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  No matching instruments found. Use "Add Custom Broker Symbol" below.
                </div>
              ) : (
                filteredCatalog.map(item => {
                  const targetSymbol = activeSuffix ? `${item.baseSymbol}${activeSuffix}` : item.baseSymbol;
                  const isAlreadyAdded = markets.some(m => m.symbol.toUpperCase() === targetSymbol.toUpperCase());

                  return (
                    <div
                      key={item.id}
                      className="bg-[#08080A] border border-zinc-800 hover:border-amber-500/40 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{item.name}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                            {targetSymbol}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">{item.description}</div>
                      </div>

                      <button
                        type="button"
                        disabled={isAlreadyAdded}
                        onClick={() => {
                          handleAddMarket(item.baseSymbol);
                          setIsSymbolPickerOpen(false);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 transition-all ${
                          isAlreadyAdded
                            ? 'bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-800'
                            : 'bg-amber-500 hover:bg-amber-400 text-black font-extrabold shadow-sm'
                        }`}
                      >
                        {isAlreadyAdded ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3 text-black" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
