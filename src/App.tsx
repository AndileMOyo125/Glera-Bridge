import React, { useState, useEffect, useCallback } from 'react';
import { AccountSummary, AccountDetail as AccountDetailType, EASettings, EAConnection, ActivityItem } from './types';
import { api, getStoredDashboardKey } from './lib/api';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { AccountCard } from './components/AccountCard';
import { AccountDetail } from './components/AccountDetail';
import { ActivityFeed } from './components/ActivityFeed';
import { ConnectionsManager } from './components/ConnectionsManager';
import { EmergencyCloseModal } from './components/EmergencyCloseModal';
import { SecurityModal } from './components/SecurityModal';
import { HelpCenterModal } from './components/HelpCenterModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AdminLicenseModal } from './components/AdminLicenseModal';
import { ClientLicenseViewModal } from './components/ClientLicenseViewModal';
import { SimulatedTerminalWidget } from './components/SimulatedTerminalWidget';
import { Plus, ArrowUpRight, ArrowDownRight, Layers, ShieldCheck, Radio, Sparkles, Lock, MessageSquare } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedAccountDetail, setSelectedAccountDetail] = useState<AccountDetailType | null>(null);
  const [connections, setConnections] = useState<EAConnection[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isClientLicenseModalOpen, setIsClientLicenseModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  // Notification toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Accounts & Connections data
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [accs, conns, acts] = await Promise.all([
        api.getAccounts(),
        api.getConnections(),
        api.getActivity(),
      ]);
      setAccounts(accs);
      setConnections(conns);
      setActivities(acts);

      // If viewing an account detail, refresh it too
      if (selectedAccountId) {
        try {
          const detail = await api.getAccountDetail(selectedAccountId);
          setSelectedAccountDetail(detail);
        } catch {
          // Account might have been deleted/reset
        }
      }
    } catch (err: any) {
      console.error('[Glera Bridge] Polling error:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [selectedAccountId]);

  // Initial load + interval polling every 3 seconds for live MT5 telemetry
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  // When selected account changes
  const handleSelectAccount = async (accountId: string) => {
    setSelectedAccountId(accountId);
    try {
      const detail = await api.getAccountDetail(accountId);
      setSelectedAccountDetail(detail);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      showToast(err.message || 'Failed to load account', 'error');
    }
  };

  // Pause / Resume EA
  const handlePauseResume = async () => {
    if (!selectedAccountDetail) return;
    const cmd = selectedAccountDetail.status === 'PAUSED' ? 'RESUME' : 'PAUSE';
    try {
      const res = await api.sendCommand(selectedAccountDetail.accountId, cmd);
      showToast(cmd === 'PAUSE' ? 'EA Pause command dispatched' : 'EA Resume command dispatched', 'success');
      loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Command failed', 'error');
    }
  };

  // Emergency Close All
  const handleEmergencyClose = async () => {
    if (!selectedAccountDetail) return;
    try {
      await api.sendCommand(selectedAccountDetail.accountId, 'CLOSE_ALL');
      showToast('🚨 Emergency Close All dispatched to MT5 queue', 'success');
      loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Emergency close failed', 'error');
    }
  };

  // Save Multi-Market Strategy
  const handleSaveSettings = async (settings: EASettings) => {
    if (!selectedAccountDetail) return;
    try {
      await api.saveSettings(selectedAccountDetail.accountId, settings);
      showToast('Settings saved to Bridge · Syncing with MT5...', 'success');
      loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
      throw err;
    }
  };

  // Create Connection
  const handleCreateConnection = async (name: string) => {
    try {
      const newConn = await api.createConnection(name);
      showToast(`Connection "${newConn.name}" created`, 'success');
      loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to create connection', 'error');
      throw err;
    }
  };

  const totalBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);
  const totalEquity = accounts.reduce((acc, a) => acc + (a.equity || 0), 0);
  const totalPnl = totalEquity - totalBalance;
  const isOverallProfit = totalPnl >= 0;
  const onlineCount = accounts.filter(a => a.isOnline).length;
  const isAnyOnline = onlineCount > 0;

  return (
    <div className="relative min-h-screen bg-[#08080A] text-zinc-100 font-sans antialiased selection:bg-amber-500 selection:text-black">
      {/* Ambient Metallic GAS Luxury Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <img
          src="/icon-192.png"
          alt="Glera Bridge Background"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-12 filter brightness-95 contrast-110"
        />
        {/* Soft Vignette & Carbon Shading to keep high contrast for charts & cards */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#08080A]/90 via-[#08080A]/70 to-[#08080A]/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#08080A]/40 to-[#08080A]/90" />
      </div>

      {/* Top Header */}
      <div className="relative z-40">
        <Header
          onOpenSecurity={() => setIsClientLicenseModalOpen(true)}
          onOpenHelp={() => setIsHelpModalOpen(true)}
         
          isOnline={isAnyOnline}
          activeAccountCount={onlineCount}
        />
      </div>
      {/* Main Content Area */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-4 pb-28">
        {/* TAB 1: ACCOUNTS / HOME */}
        {currentTab === 'home' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {!selectedAccountId ? (
              <>
                {/* Hero Portfolio Summary Card - Terminal Obsidian */}
                <div className="bg-gradient-to-br from-[#15171C] via-[#111215] to-[#0A0B0D] border border-zinc-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                    <span className="uppercase font-mono font-bold tracking-wider text-[10px] text-zinc-400">Net Portfolio Telemetry</span>
                    <span className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
                    <div>
                      <div className="text-[11px] font-bold text-zinc-400 uppercase font-mono">Total Equity</div>
                      <div className="text-2xl font-extrabold text-white tracking-tight mt-0.5 font-mono">
                        ${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-zinc-400 uppercase font-mono">Total Balance</div>
                      <div className="text-2xl font-extrabold text-zinc-300 tracking-tight mt-0.5 font-mono">
                        ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-zinc-800/80 pt-3 sm:pt-0 sm:pl-4">
                      <div className="text-[11px] font-bold text-zinc-400 uppercase font-mono">Net Floating P/L</div>
                      <div className={`text-xl font-bold mt-0.5 flex items-center gap-1 font-mono ${isOverallProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isOverallProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {isOverallProfit ? '+' : ''}${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accounts List Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-white tracking-tight">Connected Trading Accounts</h2>
                      <p className="text-xs text-zinc-400">Select an account to view telemetry and remote controls</p>
                    </div>
                    <button
                      onClick={() => setIsOnboardingModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-400 text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Setup MT5</span>
                    </button>
                  </div>

                  {isLoading && accounts.length === 0 ? (
                    <div className="space-y-3">
                      {[1, 2].map(i => (
                        <div key={i} className="h-36 rounded-2xl bg-zinc-900/60 animate-pulse border border-zinc-800/50" />
                      ))}
                    </div>
                  ) : accounts.length === 0 ? (
                    <div className="bg-[#121316] border border-zinc-800 rounded-2xl p-8 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                        <Radio className="w-6 h-6 animate-pulse" />
                      </div>
                      <h3 className="font-bold text-base text-white">No Trading Accounts Connected</h3>
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                        Connect your MetaTrader 5 terminal to Glera Bridge using your connection key to start live monitoring.
                      </p>
                      <button
                        onClick={() => setIsOnboardingModalOpen(true)}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all"
                      >
                        Start MT5 Setup Guide
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {accounts.map(acc => (
                        <AccountCard
                          key={acc.accountId}
                          account={acc}
                          onSelect={handleSelectAccount}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Preview Interactive Terminal Simulator Widget */}
                <div className="pt-2">
                  <SimulatedTerminalWidget
                    currentAccountId={accounts[0]?.accountId || '8820491'}
                    onEventTriggered={() => loadData(true)}
                  />
                </div>
              </>
            ) : (
              selectedAccountDetail && (
                <AccountDetail
                  account={selectedAccountDetail}
                  onBack={() => {
                    setSelectedAccountId(null);
                    setSelectedAccountDetail(null);
                  }}
                  onPauseResume={handlePauseResume}
                  onRequestCloseAll={() => setIsCloseModalOpen(true)}
                  onSaveSettings={handleSaveSettings}
                  onRefresh={() => loadData(true)}
                />
              )
            )}
          </div>
        )}

        {/* TAB 2: ACTIVITY AUDIT FEED */}
        {currentTab === 'activity' && (
          <ActivityFeed
            activities={activities}
            onRefresh={() => loadData(true)}
          />
        )}

        {/* TAB 3: CONNECTIONS / SETTINGS */}
        {currentTab === 'settings' && (
          <ConnectionsManager
            connections={connections}
            onCreateConnection={handleCreateConnection}
            onOpenHelp={() => setIsHelpModalOpen(true)}
            onOpenAdmin={() => setIsAdminModalOpen(true)}
          />
        )}
      </main>

      {/* Persistent Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={(t) => {
          setCurrentTab(t);
          if (t !== 'home') {
            setSelectedAccountId(null);
            setSelectedAccountDetail(null);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Floating Notification Toast */}
      {toast && (
        <div
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 border animate-in slide-in-from-bottom duration-150 max-w-[90vw] ${
            toast.type === 'error'
              ? 'bg-rose-900/90 text-rose-100 border-rose-500/50 shadow-rose-950/50'
              : toast.type === 'info'
              ? 'bg-blue-900/90 text-blue-100 border-blue-500/50 shadow-blue-950/50'
              : 'bg-emerald-900/90 text-emerald-100 border-emerald-500/50 shadow-emerald-950/50'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Emergency Close Confirmation Modal */}
      <EmergencyCloseModal
        isOpen={isCloseModalOpen}
        accountId={selectedAccountId || ''}
        onClose={() => setIsCloseModalOpen(false)}
        onConfirm={handleEmergencyClose}
      />

      {/* Developer Master License Vault & WhatsApp Dispatch Modal */}
      <AdminLicenseModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onLicenseChanged={() => {
          loadData(true);
          showToast('License state updated', 'info');
        }}
      />

      {/* Client-Facing Protected License Modal */}
      <ClientLicenseViewModal
        isOpen={isClientLicenseModalOpen}
        onClose={() => setIsClientLicenseModalOpen(false)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />

      {/* Setup Guide & Help Center Modal */}
      <HelpCenterModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* Onboarding Wizard Modal */}
      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        onCompleted={() => loadData(true)}
      />
    </div>
  );
}
