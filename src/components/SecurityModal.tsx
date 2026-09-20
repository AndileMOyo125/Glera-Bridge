import React, { useState } from 'react';
import { Key, Copy, Check, ShieldCheck, X, Server, AlertTriangle, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { getStoredDashboardKey, getStoredEAKey, getStoredEAConnectionMeta } from '../lib/api';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose }) => {
  const [copiedWhat, setCopiedWhat] = useState<string | null>(null);
  const [revealDashboardKey, setRevealDashboardKey] = useState(false);

  if (!isOpen) return null;

  const dashboardKey = getStoredDashboardKey();
  const eaMeta = getStoredEAConnectionMeta();
  const serverUrl = window.location.origin;

  const handleCopy = async (text: string, id: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedWhat(id);
      setTimeout(() => setCopiedWhat(null), 2500);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121316] border border-zinc-800 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Connection Keys</h3>
              <p className="text-[11px] text-zinc-400 font-mono">MetaTrader 5 & Dashboard Security</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* MT5 EA Connection Key */}
          <div className="bg-[#08080A] border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-mono">
                <Server className="w-3.5 h-3.5" />
                MT5 EA Key (InpApiKey)
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold border border-emerald-500/20">
                For VPS EA
              </span>
            </div>
            <p className="text-xs text-zinc-300">
              Enter this key in the Dennis1.0 EA parameter <b>InpApiKey</b> on your MT5 terminal:
            </p>
            <div className="bg-[#121316] border border-zinc-800 rounded-lg p-2 flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-emerald-400 truncate max-w-[240px]">
                {eaMeta.key}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(eaMeta.key, 'ea')}
                className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold transition-colors shrink-0 flex items-center gap-1"
              >
                {copiedWhat === 'ea' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWhat === 'ea' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Server URL */}
          <div className="bg-[#08080A] border border-amber-500/30 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                Server URL (InpServerUrl)
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono font-bold border border-amber-500/20">
                WebRequest Whitelist
              </span>
            </div>
            <p className="text-xs text-zinc-300">
              Add to MT5 allowed WebRequest URLs and in the EA parameter <b>InpServerUrl</b>:
            </p>
            <div className="bg-[#121316] border border-zinc-800 rounded-lg p-2 flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-amber-400 truncate max-w-[240px]">
                {serverUrl}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(serverUrl, 'url')}
                className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold transition-colors shrink-0 flex items-center gap-1"
              >
                {copiedWhat === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWhat === 'url' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Dashboard Workspace Key */}
          <div className="bg-[#08080A] border border-zinc-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                Workspace Key (gb_live_...)
              </span>
              <button
                onClick={() => setRevealDashboardKey(!revealDashboardKey)}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
              >
                {revealDashboardKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{revealDashboardKey ? 'Hide' : 'Reveal'}</span>
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              This private key unlocks your mobile dashboard session. Keep it confidential.
            </p>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] leading-relaxed text-amber-200">
              <LockKeyhole className="mr-1.5 inline h-3.5 w-3.5 align-text-bottom" />
              Never post these keys in screenshots or send them to support. Rotate the workspace key if it is exposed.
            </div>
            <div className="bg-[#121316] border border-zinc-800 rounded-lg p-2 flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-zinc-300 truncate max-w-[240px]">
                {revealDashboardKey ? dashboardKey : `${dashboardKey.slice(0, 12)}••••••••••••••••`}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(dashboardKey, 'dashboard')}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors shrink-0 flex items-center gap-1"
              >
                {copiedWhat === 'dashboard' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWhat === 'dashboard' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
