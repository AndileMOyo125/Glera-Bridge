import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, X, CheckCircle2, ShieldCheck, Server, AlertCircle } from 'lucide-react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ isOpen, onClose }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  const faqs = [
    {
      q: 'How do I connect MetaTrader 5 to Glera Bridge?',
      a: (
        <div className="space-y-2 text-xs text-slate-300">
          <p>1. Open MT5 on your VPS or desktop.</p>
          <p>2. Navigate to <b>Tools → Options → Expert Advisors</b> tab.</p>
          <p>3. Check the box <b>"Allow WebRequest for listed URL:"</b> and add this server URL (e.g. {window.location.origin}).</p>
          <p>4. Attach your MT5 expert or bridge client to any chart and enter your <b>InpApiKey</b> and <b>InpServerUrl</b> in the inputs tab.</p>
          <p>5. Click OK and make sure the <b>Algo Trading</b> button is green on the MT5 top toolbar.</p>
        </div>
      )
    },
    {
      q: 'Does one connection key work for all trading pairs?',
      a: (
        <p className="text-xs text-slate-300">
          <b>Yes.</b> Your EA connection key belongs to the MT5 terminal instance, not to a single currency pair. You only enter the key once in that EA. You can then add, remove, and configure multiple markets (e.g. EURUSD, GBPUSD, XAUUSD) directly from this mobile app without changing keys.
        </p>
      )
    },
    {
      q: 'What is the difference between "Saved in App" and "Active on MT5"?',
      a: (
        <p className="text-xs text-slate-300">
          When you click <b>Save & Apply</b>, your configuration is immediately saved to the Glera Bridge cloud server. Within ~5 seconds, your MT5 EA checks in and applies those settings live. Once confirmed by MT5, the status badge turns into a green <b>Verified Live</b> shield.
        </p>
      )
    },
    {
      q: 'What happens when I click "Pause EA"?',
      a: (
        <p className="text-xs text-slate-300">
          <b>Pause</b> prevents the EA from entering any <i>new</i> trades. All existing open positions will continue to be safely managed with their respective Stop Loss, Take Profit, and trailing stops until closed.
        </p>
      )
    },
    {
      q: 'How does "Emergency Close All" work?',
      a: (
        <p className="text-xs text-slate-300">
          Emergency Close All sends an immediate liquidation instruction to the EA. The EA closes every open position across all configured markets at the best available market price. To prevent accidental clicks, you must type <b>CLOSE</b> to execute.
        </p>
      )
    },
    {
      q: 'What should I do if my account shows OFFLINE?',
      a: (
        <p className="text-xs text-slate-300">
          1. Verify that your VPS is powered on and MT5 is running.<br />
          2. Check that the <b>Algo Trading</b> button is turned ON (green icon).<br />
          3. Check the <b>Experts</b> and <b>Journal</b> tabs in MT5 for any WebRequest error codes (e.g. 4014 means WebRequest URL is not whitelisted).
        </p>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-start sm:items-center justify-center overflow-y-auto p-4">
      <div className="bg-[#121316] border border-zinc-800 rounded-2xl max-w-md w-full p-5 my-auto shadow-2xl animate-in zoom-in-95 duration-150 max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Setup Guide & FAQs</h3>
              <p className="text-[11px] text-zinc-400 font-mono">Everything you need to know about Glera Bridge</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Accordions */}
        <div className="mt-4 space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#08080A] border border-zinc-800 rounded-xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-3.5 text-left font-bold text-xs text-white flex items-center justify-between gap-2 hover:bg-zinc-900"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5 pt-1 border-t border-zinc-800 text-zinc-300">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="min-h-11 px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
