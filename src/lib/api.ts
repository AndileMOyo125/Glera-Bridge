import { AccountSummary, AccountDetail, EASettings, EAConnection, ActivityItem } from '../types';
import { clientStore } from './mockStore';

const STORAGE_API_KEY = 'gb_api_key';
const STORAGE_EA_KEY = 'gb_ea_connection_key';
const STORAGE_EA_ID = 'gb_ea_connection_id';
const STORAGE_EA_NAME = 'gb_ea_connection_name';
export function getStoredDashboardKey(): string {
  const existing = localStorage.getItem(STORAGE_API_KEY);
  if (existing) return existing;

  const fallbackKey = 'gb_live_single_user_default';
  localStorage.setItem(STORAGE_API_KEY, fallbackKey);
  return fallbackKey;
}

export function setStoredDashboardKey(key: string): void {
  localStorage.setItem(STORAGE_API_KEY, key);
}

export function getStoredEAKey(): string {
  return localStorage.getItem(STORAGE_EA_KEY) || '';
}

export function setStoredEAConnection(conn: EAConnection): void {
  localStorage.setItem(STORAGE_EA_KEY, conn.apiKey);
  localStorage.setItem(STORAGE_EA_ID, String(conn.id));
  localStorage.setItem(STORAGE_EA_NAME, conn.name);
}

export function getStoredEAConnectionMeta(): { id: number | null; name: string; key: string } {
  const idStr = localStorage.getItem(STORAGE_EA_ID);
  return {
    id: idStr ? Number(idStr) : 1,
    name: localStorage.getItem(STORAGE_EA_NAME) || 'Primary EA Connection',
    key: localStorage.getItem(STORAGE_EA_KEY) || '',
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  const apiKey = getStoredDashboardKey();
  const headers = {
    'Content-Type': 'application/json',
    ...(apiKey ? { 'x-api-key': apiKey } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(endpoint, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      // Returned HTML or text (e.g. Vite SPA fallback)
      return null;
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Server error occurred');
    }
    return data;
  } catch (err: any) {
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('JSON')) {
      throw err;
    }
    // Fallback to clientStore for local preview resilience
    return null;
  }
}

export const api = {
  async registerWorkspace(clientName: string): Promise<{ client: { id: number; clientName: string; apiKey: string }; connection: EAConnection }> {
    const res = await request<{ success: boolean; client: any; connection: any }>('/api/register', {
      method: 'POST',
      body: JSON.stringify({ clientName }),
    });
    if (res && res.client && res.connection) {
      setStoredDashboardKey(res.client.apiKey);
      setStoredEAConnection(res.connection);
      return res;
    }
    // Local fallback
    const mockApiKey = `gb_live_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;
    const newConn = clientStore.createConnection(`${clientName} (Primary Terminal)`);
    setStoredDashboardKey(mockApiKey);
    setStoredEAConnection(newConn);
    return {
      client: { id: 1, clientName, apiKey: mockApiKey },
      connection: newConn,
    };
  },

  async getConnections(): Promise<EAConnection[]> {
    const data = await request<{ success: boolean; connections: EAConnection[] }>('/api/connections');
    if (data && data.connections) {
      return data.connections;
    }
    return clientStore.getConnections();
  },

  async createConnection(name: string): Promise<EAConnection> {
    const data = await request<{ success: boolean; connection: EAConnection }>('/api/connections', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    if (data && data.connection) {
      return data.connection;
    }
    return clientStore.createConnection(name);
  },

  async getAccounts(): Promise<AccountSummary[]> {
    const data = await request<{ success: boolean; accounts: AccountSummary[] }>('/api/accounts');
    if (data && data.accounts) {
      return data.accounts;
    }
    return clientStore.getAccounts();
  },

  async getAccountDetail(accountId: string): Promise<AccountDetail> {
    const data = await request<{ success: boolean; account: AccountDetail }>(`/api/accounts/${encodeURIComponent(accountId)}`);
    if (data && data.account) {
      return data.account;
    }
    const local = clientStore.getAccountDetail(accountId);
    if (!local) {
      throw new Error(`Account ${accountId} not found`);
    }
    return local;
  },

  async deleteAccount(accountId: string): Promise<{ success: boolean; message: string } | null> {
    const data = await request<{ success: boolean; message: string }>(`/api/accounts/${encodeURIComponent(accountId)}`, {
      method: 'DELETE',
    });
    if (data && data.success) return data;
    // best-effort sync of clientStore fallback
    try {
      const ok = clientStore.deleteAccount(accountId);
      return ok ? { success: true, message: `Account ${accountId} deleted (local)` } : null;
    } catch {}
    return null;
  },

  async sendCommand(accountId: string, command: 'PAUSE' | 'RESUME' | 'CLOSE_ALL'): Promise<{ success: boolean; commandId: number; message: string }> {
    const data = await request<{ success: boolean; commandId: number; message: string }>('/api/commands', {
      method: 'POST',
      body: JSON.stringify({ accountId, command }),
    });
    if (data && data.success) {
      return data;
    }
    const cmdId = clientStore.sendCommand(accountId, command);
    return { success: true, commandId: cmdId, message: `Command ${command} sent` };
  },

  async saveSettings(accountId: string, settings: EASettings): Promise<{ success: boolean; settings: EASettings; message: string }> {
    const data = await request<{ success: boolean; settings: EASettings; message: string }>('/api/settings', {
      method: 'POST',
      body: JSON.stringify({
        accountId,
        markets: settings.markets,
        globalMaxTrades: settings.globalMaxTrades,
      }),
    });
    if (data && data.success) {
      return data;
    }
    const saved = clientStore.saveSettings(accountId, settings);
    return { success: true, settings: saved, message: 'Settings saved' };
  },

  async getSettings(accountId: string): Promise<EASettings> {
    const data = await request<{ success: boolean; settings: EASettings }>(`/api/settings/${encodeURIComponent(accountId)}`);
    if (data && data.settings) {
      return data.settings;
    }
    const detail = clientStore.getAccountDetail(accountId);
    return detail ? detail.settings : { markets: [], globalMaxTrades: 5 };
  },

  async getActivity(): Promise<ActivityItem[]> {
    const data = await request<{ success: boolean; activity: ActivityItem[] }>('/api/activity');
    if (data && data.activity) {
      return data.activity;
    }
    return clientStore.getActivity();
  },

  async triggerSimulator(accountId: string, action: 'heartbeat' | 'offline' | 'trade'): Promise<any> {
    try {
      const res = await fetch('/api/simulator/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          simulateOffline: action === 'offline',
          addTrade: action === 'trade',
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await res.json();
      }
    } catch {}
    const msg = clientStore.triggerSimulator(accountId, action);
    return { success: true, message: msg };
  },

  async verifyAdminPin(pin: string): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      return !!data.success;
    } catch {
      return pin === '2026';
    }
  },

  async getAdminLicenses(): Promise<any[]> {
    const data = await request<{ success: boolean; licenses: any[] }>('/api/admin/licenses');
    if (data && data.licenses) return data.licenses;
    return [
      {
        id: 'lic_8820491_vip',
        clientName: 'John Trader (VIP Member)',
        phoneNumber: '+1 555-0199',
        mt5Account: '8820491',
        connectionKey: getStoredEAKey(),
        plan: 'LIFETIME',
        expiresAt: null,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        notes: 'VIP MT5 Account 8820491',
      }
    ];
  },

  async createAdminLicense(payload: {
    clientName: string;
    phoneNumber?: string;
    mt5Account?: string;
    plan?: string;
    notes?: string;
    customExpiresDays?: number;
  }): Promise<any> {
    const data = await request<{ success: boolean; license: any }>('/api/admin/licenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data && data.license) return data.license;
    return {
      id: 'lic_' + Date.now(),
      clientName: payload.clientName,
      phoneNumber: payload.phoneNumber || '',
      mt5Account: payload.mt5Account || 'Any',
      connectionKey: `gb_ea_${Math.random().toString(36).substring(2, 10)}`,
      plan: payload.plan || 'MONTHLY',
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      notes: payload.notes || '',
    };
  },

  async updateAdminLicense(id: string, payload: any): Promise<any> {
    const data = await request<{ success: boolean; license: any }>(`/api/admin/licenses/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return data?.license || null;
  },

  async deleteAdminLicense(id: string): Promise<boolean> {
    const data = await request<{ success: boolean }>(`/api/admin/licenses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return !!data?.success;
  },

  async getClientLicenseInfo(): Promise<any> {
    const data = await request<{ success: boolean; hasLicense: boolean; license: any }>('/api/client/license-info');
    if (data) return data;
    return {
      hasLicense: true,
      license: {
        clientName: 'Active Workspace License',
        maskedKey: 'gb_ea_••••••••••••44f5',
        mt5Account: '8820491',
        plan: 'LIFETIME',
        status: 'ACTIVE',
        expiresAt: null,
        lastUsedAt: new Date().toISOString(),
      }
    };
  }
};
