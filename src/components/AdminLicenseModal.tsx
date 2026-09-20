import React, { useState, useEffect } from 'react';
import { EALicense, LicensePlan, LicenseStatus } from '../types';
import { api, getStoredEAKey } from '../lib/api';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { 
  Key, Plus, Shield, ShieldCheck, Lock, Unlock, MessageSquare, 
  Copy, Check, AlertTriangle, RefreshCw, Trash2, PauseCircle, 
  PlayCircle, Clock, Search, X, User, PhoneCall, Terminal, CheckCircle2
} from 'lucide-react';

interface AdminLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLicenseChanged?: () => void;
}

export const AdminLicenseModal: React.FC<AdminLicenseModalProps> = ({
  isOpen,
  onClose,
  onLicenseChanged,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [licenses, setLicenses] = useState<EALicense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // New License Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newMt5Account, setNewMt5Account] = useState('');
  const [newPlan, setNewPlan] = useState<LicensePlan>('MONTHLY');
  const [newCustomDays, setNewCustomDays] = useState(30);
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // WhatsApp Dispatch Modal State
  const [whatsAppLicense, setWhatsAppLicense] = useState<EALicense | null>(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const serverUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/heartbeat` : 'https://glera-bridge.app/api/heartbeat';

  const loadLicenses = async () => {
    setIsLoading(true);
    try {
      const list = await api.getAdminLicenses();
      setLicenses(list);
    } catch (err) {
      console.error('Failed to load admin licenses', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isUnlocked) {
      loadLicenses();
    }
  }, [isOpen, isUnlocked]);

  if (!isOpen) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    const isValid = await api.verifyAdminPin(pinInput);
    if (isValid) {
      setIsUnlocked(true);
      setPinInput('');
    } else {
      setPinError('Invalid Developer PIN. Try: 2026');
    }
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    setIsSubmitting(true);
    setActionError(null);
    try {
      const created = await api.createAdminLicense({
        clientName: newClientName.trim(),
        phoneNumber: newPhone.trim(),
        mt5Account: newMt5Account.trim() || 'Any',
        plan: newPlan,
        customExpiresDays: newPlan === 'MONTHLY' ? 30 : newPlan === 'TRIAL_7D' ? 7 : newCustomDays,
        notes: newNotes.trim(),
      });

      // Reset form
      setNewClientName('');
      setNewPhone('');
      setNewMt5Account('');
      setNewPlan('MONTHLY');
      setNewNotes('');
      setIsCreating(false);

      await loadLicenses();
      onLicenseChanged?.();

      // Automatically open WhatsApp Dispatch Modal for the freshly created license!
      if (created) {
        setWhatsAppLicense(created);
        setIsWhatsAppOpen(true);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to issue license. Check the server and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (lic: EALicense) => {
    const nextStatus: LicenseStatus = lic.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      setActionError(null);
      await api.updateAdminLicense(lic.id, { status: nextStatus });
      await loadLicenses();
      onLicenseChanged?.();
    } catch (err: any) {
      setActionError(err.message || 'Status update failed. Refresh and try again.');
    }
  };

  const handleExtend = async (lic: EALicense, days: number) => {
    try {
      setActionError(null);
      await api.updateAdminLicense(lic.id, { extendDays: days });
      await loadLicenses();
      onLicenseChanged?.();
    } catch (err: any) {
      setActionError(err.message || 'Renewal failed. Refresh and try again.');
    }
  };

  const handleDelete = async (lic: EALicense) => {
    if (!confirm(`Revoke and delete EA license for ${lic.clientName}? The client's MT5 EA will be disconnected immediately.`)) {
      return;
    }
    try {
      setActionError(null);
      await api.deleteAdminLicense(lic.id);
      await loadLicenses();
      onLicenseChanged?.();
    } catch (err: any) {
      setActionError(err.message || 'Deletion failed. Refresh and try again.');
    }
  };

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {}
  };

  const filteredLicenses = licenses.filter(l => {
    const q = searchQuery.toLowerCase();
    return (
      l.clientName.toLowerCase().includes(q) ||
      l.mt5Account.toLowerCase().includes(q) ||
      (l.phoneNumber && l.phoneNumber.includes(q)) ||
      l.connectionKey.toLowerCase().includes(q)
    );
  });

  const activeCount = licenses.filter(l => l.status === 'ACTIVE').length;
  const suspendedCount = licenses.filter(l => l.status === 'SUSPENDED').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4">
      <div className="bg-[#121316] border border-zinc-800 rounded-3xl max-w-2xl w-full my-auto shadow-2xl animate-in zoom-in-95 duration-150 max-h-[calc(100dvh-1.5rem)] flex flex-col overflow-hidden">
        {/* Modal Topbar */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#0e0f12]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-mono">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Workspace Admin Control</h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  Connection Manager
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">Issue, manage, and dispatch MT5 connection keys for your workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {actionError && <div className="mx-5 mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-200" role="alert"><b className="text-rose-300">Action failed:</b> {actionError}</div>}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {!isUnlocked ? (
            /* PIN Protection Screen */
            <div className="max-w-sm mx-auto py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-zinc-900 border border-zinc-800 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Developer Authentication Required</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Enter your master developer PIN to access the EA License generator and client WhatsApp dispatcher.
                </p>
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                  {pinError}
                </div>
              )}

              <form onSubmit={handleUnlock} className="space-y-3">
                <div>
                  <input
                    type="password"
                    maxLength={10}
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value)}
                    placeholder="Enter Developer PIN"
                    className="w-full text-center text-lg font-mono font-bold tracking-widest bg-[#08080A] border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 placeholder:text-zinc-600"
                    autoFocus
                  />
                  <span className="text-[11px] text-zinc-500 font-mono mt-1.5 block">
                    Default PIN: <b className="text-amber-400">2026</b>
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl font-extrabold text-sm bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Admin Panel</span>
                </button>
              </form>
            </div>
          ) : (
            /* Unlocked Admin Portal */
            <div className="space-y-4">
              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-3 rounded-2xl bg-[#08080A] border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 uppercase block">Total Issued</span>
                  <span className="text-lg font-bold text-white mt-0.5 block">{licenses.length}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#08080A] border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 uppercase block">Active Licenses</span>
                  <span className="text-lg font-bold text-emerald-400 mt-0.5 block">{activeCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#08080A] border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 uppercase block">Suspended / Paused</span>
                  <span className="text-lg font-bold text-amber-400 mt-0.5 block">{suspendedCount}</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search client, MT5 #, phone..."
                    className="w-full bg-[#08080A] border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={() => setIsCreating(!isCreating)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Issue New EA Key</span>
                </button>
              </div>

              {/* New License Generator Form */}
              {isCreating && (
                <div className="p-4 rounded-2xl bg-[#08080A] border border-amber-500/30 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1.5">
                      <Key className="w-4 h-4" />
                      Generate New EA License for Client
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="text-xs text-zinc-500 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleCreateLicense} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1 font-mono">
                          Client / Trader Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newClientName}
                          onChange={e => setNewClientName(e.target.value)}
                          placeholder="e.g. John Doe (FTMO 100k)"
                          className="w-full bg-[#121316] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1 font-mono">
                          Client WhatsApp Number
                        </label>
                        <input
                          type="text"
                          value={newPhone}
                          onChange={e => setNewPhone(e.target.value)}
                          placeholder="e.g. +27 71 234 5678"
                          className="w-full bg-[#121316] border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1 font-mono">
                          Lock to MT5 Account #
                        </label>
                        <input
                          type="text"
                          value={newMt5Account}
                          onChange={e => setNewMt5Account(e.target.value)}
                          placeholder="e.g. 8820491 or leave blank for Any"
                          className="w-full bg-[#121316] border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                        />
                        <span className="text-[10px] text-zinc-500 font-mono">
                          Prevents client from sharing your EA on other accounts.
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1 font-mono">
                          License Plan / Validity
                        </label>
                        <select
                          value={newPlan}
                          onChange={e => setNewPlan(e.target.value as LicensePlan)}
                          className="w-full bg-[#121316] border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="MONTHLY">30-Day Monthly License</option>
                          <option value="TRIAL_7D">7-Day Free Trial</option>
                          <option value="LIFETIME">Lifetime VIP Access (No Expiry)</option>
                          <option value="CUSTOM">Custom Duration</option>
                        </select>
                      </div>
                    </div>

                    {newPlan === 'CUSTOM' && (
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1 font-mono">
                          Validity in Days:
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={3650}
                          value={newCustomDays}
                          onChange={e => setNewCustomDays(Number(e.target.value))}
                          className="w-full bg-[#121316] border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 mb-1 font-mono">
                        Notes / Broker Tag (Optional)
                      </label>
                      <input
                        type="text"
                        value={newNotes}
                        onChange={e => setNewNotes(e.target.value)}
                        placeholder="e.g. Paid via crypto / IC Markets Raw"
                        className="w-full bg-[#121316] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="submit"
                        disabled={isSubmitting || !newClientName.trim()}
                        className="w-full py-2.5 px-4 rounded-xl font-extrabold text-xs text-black bg-[#25D366] hover:bg-[#22c55e] transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4 fill-current" />
                        <span>{isSubmitting ? 'Generating...' : 'Generate Key & Open WhatsApp Dispatch'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* License List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>Issued Client Keys ({filteredLicenses.length})</span>
                  <button
                    onClick={loadLicenses}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {filteredLicenses.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-[#08080A] border border-zinc-800/80 text-zinc-400 text-xs font-mono">
                    No issued licenses found. Click <b>"Issue New EA Key"</b> to hand out your first EA license on WhatsApp.
                  </div>
                ) : (
                  filteredLicenses.map(lic => {
                    const isCopied = copiedKey === lic.connectionKey;
                    const isExpired = lic.expiresAt && new Date(lic.expiresAt).getTime() < Date.now();
                    const isActive = lic.status === 'ACTIVE' && !isExpired;

                    return (
                      <div
                        key={lic.id}
                        className={`bg-[#08080A] border rounded-2xl p-4 transition-all ${
                          isActive ? 'border-zinc-800 hover:border-zinc-700' : 'border-rose-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white tracking-tight">
                                {lic.clientName}
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                  isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : lic.status === 'SUSPENDED'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}
                              >
                                {isActive ? 'ACTIVE' : lic.status === 'SUSPENDED' ? 'SUSPENDED' : 'EXPIRED'}
                              </span>
                              <span className="text-[10px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                                {lic.plan}
                              </span>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 font-mono">
                              <span>MT5: <b className="text-amber-400">{lic.mt5Account}</b></span>
                              {lic.phoneNumber && <span>Phone: {lic.phoneNumber}</span>}
                              <span>
                                {lic.expiresAt
                                  ? `Valid until: ${new Date(lic.expiresAt).toLocaleDateString()}`
                                  : 'Lifetime Access'}
                              </span>
                            </div>
                          </div>

                          {/* Primary WhatsApp Dispatch Action */}
                          <button
                            onClick={() => {
                              setWhatsAppLicense(lic);
                              setIsWhatsAppOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] font-bold text-xs flex items-center gap-1.5 transition-all shrink-0"
                            title="Send on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 fill-current" />
                            <span>WhatsApp</span>
                          </button>
                        </div>

                        {/* Masked Key Row */}
                        <div className="mt-3 bg-[#121316] border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-amber-400 truncate max-w-[280px]">
                            {lic.connectionKey}
                          </span>
                          <button
                            onClick={() => handleCopyKey(lic.connectionKey)}
                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono flex items-center gap-1 shrink-0 px-2"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>

                        {/* License Controls Row */}
                        <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleStatus(lic)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${
                                lic.status === 'ACTIVE'
                                  ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              }`}
                            >
                              {lic.status === 'ACTIVE' ? (
                                <>
                                  <PauseCircle className="w-3.5 h-3.5" />
                                  <span>Suspend Key</span>
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="w-3.5 h-3.5" />
                                  <span>Reactivate</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleExtend(lic, 30)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition-colors flex items-center gap-1"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>+30 Days</span>
                            </button>
                          </div>

                          <button
                            onClick={() => handleDelete(lic)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                            title="Revoke & Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-[#0e0f12] flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>Dennis1.0 Licensing Gateway</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Embedded WhatsApp Dispatch Modal */}
      <WhatsAppShareModal
        license={whatsAppLicense}
        serverUrl={serverUrl}
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
      />
    </div>
  );
};
