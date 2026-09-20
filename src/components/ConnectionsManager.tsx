import React, { useState } from 'react';
import { EAConnection } from '../types';
import { Key, Plus, Copy, Check, Server, Lock, MessageSquare, RefreshCw, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { checkBridgeHealth } from '../lib/api';

interface ConnectionsManagerProps {
  connections: EAConnection[];
  onCreateConnection: (name: string) => Promise<void>;
  onOpenHelp: () => void;
  onOpenAdmin?: () => void;
}

export const ConnectionsManager: React.FC<ConnectionsManagerProps> = ({
  connections,
  onCreateConnection,
  onOpenHelp,
  onOpenAdmin,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [connectionName, setConnectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ id: number; message: string; ok: boolean } | null>(null);

  const handleCopy = async (key: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(key);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = key;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {}
  };

  const handleTestConnection = async (connection: EAConnection) => {
    setTestingId(connection.id);
    setTestResult(null);
    try {
      await checkBridgeHealth();
      const isOnline = connection.lastSeen !== null && Date.now() - connection.lastSeen < 60000;
      setTestResult({
        id: connection.id,
        ok: isOnline,
        message: isOnline ? 'Bridge is reachable and this terminal sent a recent heartbeat.' : 'Bridge is reachable, but this terminal has not sent a recent heartbeat.',
      });
    } catch (error) {
      setTestResult({ id: connection.id, ok: false, message: error instanceof Error ? error.message : 'Connection test failed.' });
    } finally {
      setTestingId(null);
    }
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = connectionName.trim();
    if (!name) {
      setCreateError('Enter a name for this MT5 terminal.');
      return;
    }

    setCreateError(null);
    setIsCreating(true);
    try {
      await onCreateConnection(name);
      setConnectionName('');
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create connection.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleContactDevWhatsApp = () => {
    const msg = `Hi Glera Bridge support! 👋 I'm setting up my MT5 terminal with Glera Bridge and need an authorized connection key.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200 font-sans">
      {/* Header Card */}
      <div className="bg-[#121316] border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-mono font-bold text-amber-400 tracking-wider">
              License & Authentication
            </div>
            <h2 className="text-base font-bold text-white tracking-tight mt-0.5">MT5 Connections</h2>
          </div>
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="min-h-11 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all font-mono active:scale-95"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Issue New Key (Admin)</span>
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          Each MT5/EA terminal installation is tied to an authorized license key issued by the developer. One connection key handles all trading symbols on that terminal.
        </p>
        <form onSubmit={handleCreate} className="mt-4 flex flex-col sm:flex-row gap-2">
          <label htmlFor="connection-name" className="sr-only">MT5 terminal name</label>
          <input
            id="connection-name"
            value={connectionName}
            onChange={(event) => setConnectionName(event.target.value)}
            placeholder="e.g. Main VPS"
            maxLength={80}
            disabled={isCreating}
            className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-[#08080A] px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-amber-400 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="w-3.5 h-3.5" />
            {isCreating ? 'Creating...' : 'Add Terminal'}
          </button>
        </form>
        {createError && <p className="mt-2 text-xs text-rose-400" role="alert">{createError}</p>}
      </div>

      {/* Connection Keys List */}
      <div className="space-y-3">
        {connections.length === 0 && (
          <div className="bg-[#121316] border border-zinc-800 rounded-2xl p-6 text-center">
            <Server className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-white">No MT5 terminals connected</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">Create a named terminal above, then copy its key into your EA settings.</p>
          </div>
        )}
        {connections.map((conn) => {
          const isCopied = copiedKey === conn.apiKey;
          const isRecentlyActive = conn.lastSeen && (Date.now() - conn.lastSeen < 60000);

          return (
            <div
              key={conn.id}
              className="bg-[#121316] border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-mono">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{conn.name}</h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {conn.lastSeen
                        ? `Last signal: ${Math.floor((Date.now() - conn.lastSeen) / 1000)}s ago`
                        : 'Waiting for MT5 heartbeat...'}
                    </span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    isRecentlyActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isRecentlyActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                  {isRecentlyActive ? 'ONLINE' : 'STANDBY'}
                </span>
              </div>

              {/* Key Display */}
              <div className="mt-3 bg-[#08080A] border border-zinc-800/90 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="font-mono text-xs text-amber-400 overflow-x-auto whitespace-nowrap select-all pb-1 sm:pb-0">
                  {conn.apiKey}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(conn.apiKey)}
                  className={`min-h-11 w-full sm:w-auto px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0 font-mono ${
                    isCopied
                      ? 'bg-emerald-500 text-black'
                      : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                  }`}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>

              <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Paste into your MT5 bridge parameter <b>InpApiKey</b> in the EA settings</span>
              </div>
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleTestConnection(conn)}
                  disabled={testingId === conn.id}
                  className="min-h-11 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-800 disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingId === conn.id ? 'animate-spin' : ''}`} />
                  {testingId === conn.id ? 'Testing...' : 'Test connection'}
                </button>
                <a href={`${window.location.origin}/api/health`} target="_blank" rel="noreferrer" className="min-h-11 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-800 flex items-center justify-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> Server status
                </a>
              </div>
              {testResult?.id === conn.id && (
                <div className={`mt-2 rounded-xl border p-3 text-xs leading-relaxed ${testResult.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-200'}`} role="status">
                  {testResult.ok ? <CheckCircle2 className="inline w-4 h-4 mr-1.5 align-text-bottom" /> : <AlertCircle className="inline w-4 h-4 mr-1.5 align-text-bottom" />}
                  {testResult.message}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Developer Dispatch Banner */}
      <div className="bg-[#121316] border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-[#25D366]" />
            <h4 className="font-bold text-xs text-white">Need an EA Key or WhatsApp Delivery?</h4>
          </div>
          <p className="text-[11px] text-zinc-400">
            Developer issues verified keys directly to traders via WhatsApp for security.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleContactDevWhatsApp}
            className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-current" />
            <span>WhatsApp Dev</span>
          </button>
          <button
            onClick={onOpenHelp}
            className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors"
          >
            Setup Guide
          </button>
        </div>
      </div>
    </div>
  );
};
