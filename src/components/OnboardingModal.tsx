import React, { useState } from 'react';
import { Shield, Key, Copy, Check, Server, Radio, ArrowRight, CheckCircle2, Sparkles, X, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { api, checkBridgeHealth } from '../lib/api';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [workspaceName, setWorkspaceName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [createdConnectionKey, setCreatedConnectionKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testPassed, setTestPassed] = useState(false);

  if (!isOpen) return null;

  const serverUrl = window.location.origin;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    setIsRegistering(true);
    setErrorMessage('');
    try {
      const data = await api.registerWorkspace(workspaceName.trim());
      setCreatedConnectionKey(data.connection.apiKey);
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement('textarea');
        input.value = text;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestMessage('');
    try {
      await checkBridgeHealth();
      setTestPassed(true);
      setTestMessage('Bridge is reachable. MT5 can now be configured with this server URL.');
    } catch (error) {
      setTestPassed(false);
      setTestMessage(error instanceof Error ? error.message : 'Connection test failed.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-start sm:items-center justify-center overflow-y-auto p-4">
      <div className="bg-[#121316] border border-zinc-800 rounded-3xl max-w-md w-full p-5 sm:p-6 my-auto shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-amber-500' : 'bg-zinc-800'}`} />
            <span className={`w-6 h-0.5 ${step >= 2 ? 'bg-amber-500' : 'bg-zinc-800'}`} />
            <span className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-amber-500' : 'bg-zinc-800'}`} />
            <span className={`w-6 h-0.5 ${step >= 3 ? 'bg-amber-500' : 'bg-zinc-800'}`} />
            <span className={`w-2.5 h-2.5 rounded-full ${step >= 3 ? 'bg-amber-500' : 'bg-zinc-800'}`} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
            Step {step} of 3
          </span>
        </div>

        {/* Step 1: Name Workspace */}
        {step === 1 && (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black mb-4 shadow-lg shadow-amber-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Welcome to Glera Bridge</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Monitor your MetaTrader 5 Expert Advisor and remotely manage multi-market strategies directly from your phone.
            </p>

            {errorMessage && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleRegister} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Give your workspace a name:
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={workspaceName}
                  onChange={e => setWorkspaceName(e.target.value)}
                  placeholder="e.g. My Trading Accounts"
                  className="w-full bg-[#08080A] border border-zinc-800 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isRegistering || !workspaceName.trim()}
                  className="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isRegistering ? 'Creating Workspace...' : 'Create Workspace →'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: MT5 Setup & Key */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Connect MetaTrader 5</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Copy this key into your MT5 EA parameters. This single key lets your EA connect to the dashboard for this terminal.
              </p>
            </div>

            {/* Credential Card */}
            <div className="bg-[#08080A] border border-emerald-500/30 rounded-2xl p-4 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Your EA Connection Key (InpApiKey)
              </span>
              <div className="bg-[#121316] border border-zinc-800 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-mono text-xs text-emerald-400 overflow-x-auto whitespace-nowrap select-all pb-1 sm:pb-0">
                  {createdConnectionKey}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(createdConnectionKey)}
                  className="min-h-11 w-full sm:w-auto px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold shrink-0 flex items-center justify-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Server URL (InpServerUrl)</span>
                <button type="button" onClick={() => handleCopy(serverUrl)} className="min-h-11 px-3 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-bold flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" /> Copy</button>
              </div>
              <div className="font-mono text-xs text-amber-300 break-all select-all">{serverUrl}</div>
            </div>

            {/* Checklist */}
            <div className="space-y-2 text-xs text-zinc-300">
              <div className="flex items-start gap-2 bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-xl">
                <span className="font-bold text-amber-400 font-mono">1.</span>
                <span>In MT5, open <b>Tools → Options → Expert Advisors</b> and whitelist this URL: <span className="font-mono text-amber-300 text-[10px]">{serverUrl}</span></span>
              </div>
              <div className="flex items-start gap-2 bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-xl">
                <span className="font-bold text-amber-400 font-mono">2.</span>
                <span>Attach your EA to a chart and paste the Connection Key into the EA parameter named <b>InpApiKey</b>.</span>
              </div>
              <div className="flex items-start gap-2 bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-xl">
                <span className="font-bold text-amber-400 font-mono">3.</span>
                <span>Enable <b>Algo Trading</b> on the MT5 toolbar.</span>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              className="min-h-11 w-full py-3 px-4 rounded-xl font-extrabold text-sm bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>✓ I've Configured MT5</span>
            </button>
          </div>
        )}

        {/* Step 3: Waiting for Signal Radar */}
        {step === 3 && (
          <div className="text-center py-4 space-y-4">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black shadow-xl shadow-amber-500/30">
                <Radio className="w-8 h-8 animate-pulse text-black" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Listening for MetaTrader 5...</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                As soon as your EA sends its first heartbeat from the terminal, your account will appear automatically in the dashboard.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-200"><Server className="w-4 h-4 text-amber-400" /> Test the bridge before opening MT5</div>
              <p className="text-xs leading-relaxed text-zinc-400">This confirms the dashboard server is reachable. A terminal heartbeat will appear after the EA is attached and configured.</p>
              <button type="button" onClick={handleTestConnection} disabled={isTesting} className="min-h-11 w-full rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60">
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} /> {isTesting ? 'Testing server...' : 'Test server connection'}
              </button>
              {testMessage && <p className={`text-xs leading-relaxed ${testPassed ? 'text-emerald-300' : 'text-rose-300'}`} role="status">{testPassed ? <CheckCircle2 className="inline w-4 h-4 mr-1 align-text-bottom" /> : <AlertCircle className="inline w-4 h-4 mr-1 align-text-bottom" />}{testMessage}</p>}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  onCompleted();
                  onClose();
                }}
                className="min-h-11 w-full py-3 px-4 rounded-xl font-extrabold text-sm bg-amber-500 hover:bg-amber-400 text-black transition-all shadow-md"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
