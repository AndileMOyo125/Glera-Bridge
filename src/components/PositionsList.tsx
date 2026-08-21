import React, { useState } from 'react';
import { Position } from '../types';
import { Layers, ArrowUpRight, ArrowDownRight, CheckCircle2, Filter } from 'lucide-react';

interface PositionsListProps {
  positions: Position[];
  currency: string;
}

export const PositionsList: React.FC<PositionsListProps> = ({ positions, currency }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(val);
  };

  const symbols = Array.from(new Set(positions.map(p => p.symbol)));
  const filteredPositions = selectedFilter === 'ALL'
    ? positions
    : positions.filter(p => p.symbol === selectedFilter);

  const totalFloating = positions.reduce((acc, p) => acc + (p.profit || 0), 0);
  const isTotalProfit = totalFloating >= 0;

  if (positions.length === 0) {
    return (
      <div className="bg-[#111722] border border-white/10 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Layers className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-base text-white">No Open Positions</h4>
        <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
          The Dennis1.0 EA is actively monitoring market conditions and will open trades when strategy rules align.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Positions Header & Aggregate Summary */}
      <div className="bg-[#111722] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
        <div>
          <span className="text-[11px] uppercase font-bold text-slate-400">Open Exposure</span>
          <div className="text-xs text-slate-300 font-medium mt-0.5">
            {positions.length} active position{positions.length === 1 ? '' : 's'} · {positions.reduce((acc, p) => acc + p.lots, 0).toFixed(2)} total lots
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] uppercase font-bold text-slate-400">Floating Total</span>
          <div className={`text-base font-bold ${isTotalProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isTotalProfit ? '+' : ''}{formatMoney(totalFloating)}
          </div>
        </div>
      </div>

      {/* Symbol Filter Chips */}
      {symbols.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              selectedFilter === 'ALL'
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            All ({positions.length})
          </button>
          {symbols.map(sym => {
            const count = positions.filter(p => p.symbol === sym).length;
            return (
              <button
                key={sym}
                onClick={() => setSelectedFilter(sym)}
                className={`px-3 py-1 rounded-lg font-bold font-mono transition-all ${
                  selectedFilter === sym
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {sym} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Positions List */}
      <div className="space-y-2">
        {filteredPositions.map((pos) => {
          const isProfit = pos.profit >= 0;
          return (
            <div
              key={pos.ticket}
              className="bg-[#111722] border border-white/10 hover:border-white/20 rounded-xl p-3.5 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                    pos.type === 'BUY'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {pos.type}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white font-mono">{pos.symbol}</span>
                    <span className="text-[11px] text-slate-400 font-mono">#{pos.ticket}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {pos.lots.toFixed(2)} lots · Entry: <span className="font-mono">{pos.openPrice}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase font-semibold text-slate-500">Live P/L</div>
                <div className={`font-bold text-sm font-mono mt-0.5 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isProfit ? '+' : ''}{formatMoney(pos.profit)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
