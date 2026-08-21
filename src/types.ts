export interface Position {
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  lots: number;
  openPrice: number;
  profit: number;
}

export interface MarketConfig {
  symbol: string;
  lotSize: number;
  maxTrades: number;
  enabled?: boolean;
}

export interface EASettings {
  markets: MarketConfig[];
  globalMaxTrades: number;
}

export interface EAAppliedConfig {
  markets: string[];
  globalMaxTrades: number;
  updatedAt?: string;
}

export interface AccountSummary {
  accountId: string;
  accountName: string;
  connectionId: number | null;
  broker: string;
  currency: string;
  balance: number;
  equity: number;
  positionCount: number;
  activeMarkets: string[];
  reportedActiveMarkets?: string[];
  reportedGlobalMaxTrades?: number;
  marketCount: number;
  status: 'ACTIVE' | 'PAUSED';
  lastHeartbeat: number;
  secondsSinceHeartbeat: number;
  isOnline: boolean;
  eaConfig: EAAppliedConfig | null;
}

export interface AccountDetail extends AccountSummary {
  openPositions: Position[];
  settings: EASettings;
}

export interface EAConnection {
  id: number;
  name: string;
  apiKey: string;
  createdAt?: string;
  lastSeen: number | null;
}

export interface ActivityItem {
  id: number;
  accountId: string | null;
  eventType: string;
  title: string;
  detail: string;
  createdAt: string;
}

export interface ClientWorkspace {
  id: number;
  clientName: string;
  apiKey: string;
}

export type LicensePlan = 'TRIAL_7D' | 'MONTHLY' | 'LIFETIME' | 'CUSTOM';
export type LicenseStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';

export interface EALicense {
  id: string;
  clientName: string;
  phoneNumber?: string;
  mt5Account: string; // Specific MT5 account number or "Any"
  connectionKey: string;
  plan: LicensePlan;
  expiresAt: string | null;
  status: LicenseStatus;
  createdAt: string;
  lastUsedAt: string | null;
  notes?: string;
}
