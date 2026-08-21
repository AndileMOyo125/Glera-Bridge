import React, { useState } from 'react';
import { Radio, Play, AlertTriangle, Plus, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { api } from '../lib/api';

interface SimulatedTerminalWidgetProps {
  currentAccountId: string;
  onEventTriggered: () => void;
}

export const SimulatedTerminalWidget: React.FC<SimulatedTerminalWidgetProps> = ({
  currentAccountId,
  onEventTriggered,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const trigger = async (action: 'heartbeat' | 'offline' | 'trade') => {
    try {
      const res = await api.triggerSimulator(currentAccountId, action);
      setStatusMsg(res.message || 'Signal sent');
      onEventTriggered();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch {
      setStatusMsg('Trigger failed');
    }
  };

  return (
    <div className="bg-[#121316] border border-amber-500/30 rounded-2xl p-3 text-xs shadow-xl">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 text-amber-300 font-bold font-mono">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span>Interactive MT5 Terminal Simulator</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-normal">
            Preview Tool
          </span>
        </div>
        <div className="flex items-center gap-2">
          {statusMsg && <span className="text-emerald-400 font-semibold font-mono">{statusMsg}</span>}
          {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
          <p className="text-[11px] text-zinc-400">
            Simulate live MetaTrader 5 events to preview real-time telemetry, offline detection, and trade management:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono">
            <button
              onClick={() => trigger('heartbeat')}
              className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center gap-1.5 transition-all text-xs"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Simulate Live Signal</span>
            </button>

            <button
              onClick={() => trigger('trade')}
              className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-bold flex items-center justify-center gap-1.5 transition-all text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simulate EA Trade</span>
            </button>

            <button
              onClick={() => trigger('offline')}
              className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold flex items-center justify-center gap-1.5 transition-all text-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulate Offline Drop</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
