import React, { useState } from 'react';
import { AlertOctagon, X } from 'lucide-react';

interface EmergencyCloseModalProps {
  isOpen: boolean;
  accountId: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const EmergencyCloseModal: React.FC<EmergencyCloseModalProps> = ({
  isOpen,
  accountId,
  onClose,
  onConfirm,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === 'CLOSE';

  const handleExecute = async () => {
    if (!isConfirmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsSubmitting(false);
      setConfirmText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121316] border border-rose-500/30 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 text-rose-400">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
              <AlertOctagon className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-rose-400">Confirm Emergency Close All</h3>
              <span className="text-xs text-zinc-400 font-mono">Account #{accountId}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            This action will instruct the Dennis1.0 EA on MetaTrader 5 to <b>immediately close all open positions</b> across all traded markets on this account.
          </p>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono">
            ⚠️ <b>Irreversible Action:</b> Once the EA processes this command, any open trades will be liquidated at market price.
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-[11px] font-bold text-zinc-300 mb-1.5">
            Type <span className="text-rose-400 font-mono font-bold">CLOSE</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="Type CLOSE"
            className="w-full bg-[#08080A] border border-rose-500/30 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-rose-500 uppercase"
            autoFocus
          />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800"
          >
            Cancel / Keep Trades
          </button>
          <button
            type="button"
            disabled={!isConfirmed || isSubmitting}
            onClick={handleExecute}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-rose-950/50 transition-all flex items-center gap-1.5 font-mono"
          >
            {isSubmitting ? (
              <span>Dispatching Command...</span>
            ) : (
              <span>Close All Positions Now</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
