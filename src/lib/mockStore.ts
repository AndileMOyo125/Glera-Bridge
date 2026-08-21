import { AccountSummary, AccountDetail, EASettings, EAConnection, ActivityItem, Position, MarketConfig, EAAppliedConfig } from '../types';

const STORAGE_STORE_KEY = 'gb_client_store_state_v1';

interface ClientStoreState {
  accounts: Record<string, {
    summary: AccountSummary;
    detail: AccountDetail;
    lastHeartbeat: number;
    pendingCommands: Array<{ id: number; command: string; createdAt: number }>;
  }>;
  connections: EAConnection[];
  activity: ActivityItem[];
}

function getInitialStore(): ClientStoreState {
  const now = Date.now();
  const initialPositions: Position[] = [
    { ticket: 1094821, symbol: 'EURUSD', type: 'BUY', lots: 0.02, openPrice: 1.08520, profit: 42.50 },
    { ticket: 1094825, symbol: 'XAUUSD', type: 'BUY', lots: 0.10, openPrice: 2645.10, profit: 300.00 },
  ];

  const defaultMarkets: MarketConfig[] = [
    { symbol: 'EURUSD', enabled: true, lotSize: 0.02, maxTrades: 2 },
    { symbol: 'GBPUSD', enabled: true, lotSize: 0.03, maxTrades: 2 },
    { symbol: 'XAUUSD', enabled: true, lotSize: 0.10, maxTrades: 1 },
  ];

  const eaConfig: EAAppliedConfig = {
    markets: ['EURUSD', 'GBPUSD', 'XAUUSD'],
    globalMaxTrades: 5,
    updatedAt: new Date(now - 3000).toISOString(),
  };

  const accountId = '8820491';
  const summary: AccountSummary = {
    accountId,
    accountName: 'IC Markets Live Scalper #1',
    connectionId: 1,
    broker: 'IC Markets Ltd',
    currency: 'USD',
    balance: 10000.00,
    equity: 10342.50,
    positionCount: 2,
    activeMarkets: ['EURUSD', 'GBPUSD', 'XAUUSD'],
    reportedActiveMarkets: ['EURUSD', 'GBPUSD', 'XAUUSD'],
    reportedGlobalMaxTrades: 5,
    marketCount: 3,
    status: 'ACTIVE',
    lastHeartbeat: now - 3000,
    secondsSinceHeartbeat: 3,
    isOnline: true,
    eaConfig,
  };

  const detail: AccountDetail = {
    ...summary,
    openPositions: initialPositions,
    settings: {
      markets: defaultMarkets,
      globalMaxTrades: 5,
    },
  };

  return {
    accounts: {
      [accountId]: {
        summary,
        detail,
        lastHeartbeat: now - 3000,
        pendingCommands: [],
      },
    },
    connections: [
      {
        id: 1,
        name: 'MT5 VPS - IC Markets (Live Scalper)',
        apiKey: 'gb_ea_demo_connection_key_44f5e6d7c8b9',
        createdAt: new Date().toISOString(),
        lastSeen: now - 3000,
      },
    ],
    activity: [
      {
        id: 1,
        accountId,
        eventType: 'EA_SYNC',
        title: 'Settings Synchronized',
        detail: 'Settings successfully synchronized with Dennis1.0 MT5 EA',
        createdAt: new Date(now - 30000).toISOString(),
      },
      {
        id: 2,
        accountId,
        eventType: 'SIGNAL',
        title: 'EA Heartbeat Received',
        detail: 'Dennis1.0 EA active heartbeat verified (IC Markets)',
        createdAt: new Date(now - 60000).toISOString(),
      },
    ],
  };
}

class ClientStore {
  private state: ClientStoreState;

  constructor() {
    this.state = this.load();
  }

  private load(): ClientStoreState {
    try {
      const saved = localStorage.getItem(STORAGE_STORE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return getInitialStore();
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_STORE_KEY, JSON.stringify(this.state));
    } catch {}
  }

  public getAccounts(): AccountSummary[] {
    const now = Date.now();
    return Object.values(this.state.accounts).map(item => {
      const secondsSince = Math.floor((now - item.lastHeartbeat) / 1000);
      const isOnline = secondsSince < 30;
      return {
        ...item.summary,
        isOnline,
        secondsSinceHeartbeat: secondsSince,
        status: item.summary.status,
      };
    });
  }

  public getAccountDetail(accountId: string): AccountDetail | null {
    const item = this.state.accounts[accountId];
    if (!item) return null;
    const now = Date.now();
    const secondsSince = Math.floor((now - item.lastHeartbeat) / 1000);
    const isOnline = secondsSince < 30;
    return {
      ...item.detail,
      isOnline,
      secondsSinceHeartbeat: secondsSince,
      status: item.detail.status,
    };
  }

  public getConnections(): EAConnection[] {
    return this.state.connections;
  }

  public createConnection(name: string): EAConnection {
    const newConn: EAConnection = {
      id: this.state.connections.length + 1,
      name,
      apiKey: `gb_ea_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      lastSeen: Date.now(),
    };
    this.state.connections.push(newConn);
    this.save();
    return newConn;
  }

  public getActivity(): ActivityItem[] {
    return this.state.activity;
  }

  public sendCommand(accountId: string, command: 'PAUSE' | 'RESUME' | 'CLOSE_ALL'): number {
    const item = this.state.accounts[accountId];
    const cmdId = Date.now();
    if (item) {
      if (command === 'PAUSE') {
        item.summary.status = 'PAUSED';
        item.detail.status = 'PAUSED';
      } else if (command === 'RESUME') {
        item.summary.status = 'ACTIVE';
        item.detail.status = 'ACTIVE';
      } else if (command === 'CLOSE_ALL') {
        item.detail.openPositions = [];
        item.summary.positionCount = 0;
        item.detail.positionCount = 0;
        item.detail.equity = item.detail.balance;
        item.summary.equity = item.summary.balance;
      }
      item.pendingCommands.push({ id: cmdId, command, createdAt: Date.now() });
      this.state.activity.unshift({
        id: this.state.activity.length + 1,
        accountId,
        eventType: command,
        title: command === 'CLOSE_ALL' ? 'Emergency Close All' : `EA State: ${command}`,
        detail: command === 'CLOSE_ALL' ? 'Emergency Close All positions executed' : `EA state updated to ${command}`,
        createdAt: new Date().toISOString(),
      });
      this.save();
    }
    return cmdId;
  }

  public saveSettings(accountId: string, settings: EASettings): EASettings {
    const item = this.state.accounts[accountId];
    if (item) {
      item.detail.settings = { ...settings };
      setTimeout(() => {
        if (this.state.accounts[accountId]) {
          this.state.accounts[accountId].detail.eaConfig = {
            markets: settings.markets.map(m => m.symbol),
            globalMaxTrades: settings.globalMaxTrades,
            updatedAt: new Date().toISOString(),
          };
          this.state.accounts[accountId].summary.eaConfig = this.state.accounts[accountId].detail.eaConfig;
          this.state.accounts[accountId].summary.activeMarkets = settings.markets
            .filter(m => m.enabled !== false)
            .map(m => m.symbol);
          this.save();
        }
      }, 1500);

      this.state.activity.unshift({
        id: this.state.activity.length + 1,
        accountId,
        eventType: 'SETTINGS_UPDATE',
        title: 'Strategy Updated',
        detail: `Strategy updated (${settings.markets.length} pairs, Max ${settings.globalMaxTrades} trades)`,
        createdAt: new Date().toISOString(),
      });
      this.save();
    }
    return settings;
  }

  public triggerSimulator(accountId: string, action: 'heartbeat' | 'offline' | 'trade'): string {
    const item = this.state.accounts[accountId];
    if (!item) return 'Account not found';
    const now = Date.now();

    if (action === 'heartbeat') {
      item.lastHeartbeat = now;
      item.summary.lastHeartbeat = now;
      item.detail.lastHeartbeat = now;
      item.summary.isOnline = true;
      item.detail.isOnline = true;
      item.detail.equity = item.detail.balance + item.detail.openPositions.reduce((s, p) => s + p.profit, 0);
      item.summary.equity = item.detail.equity;
      this.save();
      return 'Heartbeat signal simulated';
    } else if (action === 'offline') {
      item.lastHeartbeat = now - 45000;
      item.summary.lastHeartbeat = now - 45000;
      item.detail.lastHeartbeat = now - 45000;
      item.summary.isOnline = false;
      item.detail.isOnline = false;
      this.save();
      return 'Offline network drop simulated (45s elapsed)';
    } else if (action === 'trade') {
      const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'];
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const type: 'BUY' | 'SELL' = Math.random() > 0.5 ? 'BUY' : 'SELL';
      const lots = 0.02;
      const profit = Math.round((Math.random() * 80 - 15) * 100) / 100;
      const newPos: Position = {
        ticket: Math.floor(1000000 + Math.random() * 900000),
        symbol: sym,
        type,
        lots,
        openPrice: sym === 'XAUUSD' ? 2645.50 : 1.08500,
        profit,
      };
      item.detail.openPositions.push(newPos);
      item.detail.positionCount = item.detail.openPositions.length;
      item.summary.positionCount = item.detail.positionCount;
      item.detail.equity = item.detail.balance + item.detail.openPositions.reduce((s, p) => s + p.profit, 0);
      item.summary.equity = item.detail.equity;
      item.lastHeartbeat = now;
      this.state.activity.unshift({
        id: this.state.activity.length + 1,
        accountId,
        eventType: 'TRADE_OPEN',
        title: 'New Position Opened',
        detail: `Dennis1.0 opened ${type} ${lots} ${sym} (#${newPos.ticket})`,
        createdAt: new Date().toISOString(),
      });
      this.save();
      return `Simulated new trade on ${sym}`;
    }
    return 'Action processed';
  }
}

export const clientStore = new ClientStore();
