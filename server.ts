import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface Client {
  id: number;
  client_name: string;
  api_key: string;
  created_at: string;
}

interface EAConnection {
  id: number;
  client_id: number;
  connection_name: string;
  connection_key: string;
  created_at: string;
  last_seen: number | null;
}

interface Position {
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  lots: number;
  openPrice: number;
  profit: number;
}

interface MarketConfig {
  symbol: string;
  lotSize: number;
  maxTrades: number;
  enabled?: boolean;
}

interface EASettings {
  markets: MarketConfig[];
  globalMaxTrades: number;
}

interface Account {
  account_id: string;
  client_id: number;
  connection_id: number | null;
  account_name: string;
  broker: string;
  currency: string;
  balance: number;
  equity: number;
  open_positions: Position[];
  active_markets: string[];
  reported_global_max_trades: number;
  ea_config: { markets: string[]; globalMaxTrades: number; updatedAt?: string } | null;
  status: 'ACTIVE' | 'PAUSED';
  last_heartbeat: number;
  updated_at: string;
}

interface Command {
  id: number;
  account_id: string;
  command: 'PAUSE' | 'RESUME' | 'CLOSE_ALL';
  status: 'PENDING' | 'EXECUTED';
  created_at: string;
  executed_at?: string;
}

interface Activity {
  id: number;
  client_id: number;
  account_id: string | null;
  event_type: string;
  title: string;
  detail: string;
  created_at: string;
}

interface EALicenseRecord {
  id: string;
  client_name: string;
  phone_number: string;
  mt5_account: string; // "Any" or specific account ID e.g. "8820491"
  connection_key: string;
  plan: 'TRIAL_7D' | 'MONTHLY' | 'LIFETIME' | 'CUSTOM';
  expires_at: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  created_at: string;
  last_used_at: string | null;
  notes: string;
}

// In-memory persistent database store (with initial sample data ready for instant preview)
const clients: Client[] = [
  {
    id: 1,
    client_name: 'Demo Workspace',
    api_key: 'gb_live_demo_workspace_key_77a8b9c0d1e2',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  }
];

const connections: EAConnection[] = [
  {
    id: 1,
    client_id: 1,
    connection_name: 'MT5 VPS - IC Markets (Live Scalper)',
    connection_key: 'gb_ea_demo_connection_key_44f5e6d7c8b9',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    last_seen: Date.now() - 2000,
  }
];

const licenses: EALicenseRecord[] = [
  {
    id: 'lic_8820491_vip',
    client_name: 'John Trader (VIP Member)',
    phone_number: '+1 555-0199',
    mt5_account: '8820491',
    connection_key: 'gb_ea_demo_connection_key_44f5e6d7c8b9',
    plan: 'LIFETIME',
    expires_at: null,
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    last_used_at: new Date(Date.now() - 2000).toISOString(),
    notes: 'Approved VIP license for MT5 account 8820491 on IC Markets',
  }
];

const accounts: Account[] = [
  {
    account_id: '8820491',
    client_id: 1,
    connection_id: 1,
    account_name: 'Live Scalper Dennis1.0',
    broker: 'IC Markets Global',
    currency: 'USD',
    balance: 10000.00,
    equity: 10342.50,
    open_positions: [
      { ticket: 1094821, symbol: 'EURUSD', type: 'BUY', lots: 0.02, openPrice: 1.08520, profit: 42.50 },
      { ticket: 1094825, symbol: 'XAUUSD', type: 'BUY', lots: 0.10, openPrice: 2645.10, profit: 300.00 }
    ],
    active_markets: ['EURUSD', 'GBPUSD', 'XAUUSD'],
    reported_global_max_trades: 5,
    ea_config: {
      markets: ['EURUSD', 'GBPUSD', 'XAUUSD'],
      globalMaxTrades: 5,
      updatedAt: new Date(Date.now() - 5000).toISOString(),
    },
    status: 'ACTIVE',
    last_heartbeat: Date.now() - 2000,
    updated_at: new Date(Date.now() - 2000).toISOString(),
  }
];

const accountSettingsMap: Record<string, EASettings> = {
  '8820491': {
    markets: [
      { symbol: 'EURUSD', lotSize: 0.02, maxTrades: 2, enabled: true },
      { symbol: 'GBPUSD', lotSize: 0.03, maxTrades: 2, enabled: true },
      { symbol: 'XAUUSD', lotSize: 0.10, maxTrades: 1, enabled: true },
    ],
    globalMaxTrades: 5,
  }
};

const commands: Command[] = [];
let nextCommandId = 1;

const activities: Activity[] = [
  {
    id: 1,
    client_id: 1,
    account_id: '8820491',
    event_type: 'REGISTER',
    title: 'Workspace Initialized',
    detail: 'Demo Workspace · MT5 VPS - IC Markets (Live Scalper)',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    client_id: 1,
    account_id: '8820491',
    event_type: 'CONNECT',
    title: 'MetaTrader 5 Connected',
    detail: 'Live Scalper Dennis1.0 (#8820491) connected via Dennis1.0 EA',
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 3,
    client_id: 1,
    account_id: '8820491',
    event_type: 'SETTINGS',
    title: 'Multi-Market Strategy Active',
    detail: 'EURUSD (0.02 · max 2) | GBPUSD (0.03 · max 2) | XAUUSD (0.10 · max 1) · Global cap: 5',
    created_at: new Date(Date.now() - 900000).toISOString(),
  }
];

function logActivity(clientId: number, accountId: string | null, eventType: string, title: string, detail = '') {
  activities.unshift({
    id: activities.length + 1,
    client_id: clientId,
    account_id: accountId,
    event_type: eventType,
    title,
    detail,
    created_at: new Date().toISOString(),
  });
}

function normalizeSymbol(sym: unknown): string {
  return String(sym || '').trim().toUpperCase();
}

function validateMarkets(markets: unknown): string | null {
  if (!Array.isArray(markets) || markets.length < 1 || markets.length > 20) {
    return 'Markets must contain between 1 and 20 market configurations.';
  }
  const seen = new Set<string>();
  for (const m of markets) {
    if (!m || typeof m !== 'object') return 'Each market must be an object.';
    const symbol = normalizeSymbol(m.symbol);
    if (!/^[A-Z0-9._-]{3,20}$/.test(symbol)) {
      return `Invalid symbol '${m.symbol}'. Use 3-20 letters, numbers, dots, underscores or hyphens.`;
    }
    if (seen.has(symbol)) {
      return `Duplicate market '${symbol}' is not allowed.`;
    }
    seen.add(symbol);
    const lot = Number(m.lotSize);
    if (!Number.isFinite(lot) || lot < 0.01 || lot > 100) {
      return `Invalid lotSize for ${symbol}. It must be between 0.01 and 100.`;
    }
    const max = Number(m.maxTrades);
    if (!Number.isInteger(max) || max < 1 || max > 50) {
      return `Invalid maxTrades for ${symbol}. It must be an integer between 1 and 50.`;
    }
  }
  return null;
}

function extractApiKey(req: express.Request): string {
  const authHeader = req.headers['x-api-key'] || req.headers['authorization'];
  if (!authHeader) return '';
  return String(authHeader).replace(/^Bearer\s+/i, '').trim();
}

function authenticateDashboardKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const apiKey = extractApiKey(req);
  if (!apiKey) {
    return res.status(401).json({ error: 'Unauthorized: Missing dashboard API key header (x-api-key)' });
  }
  const client = clients.find(c => c.api_key === apiKey);
  if (!client) {
    return res.status(401).json({ error: 'Unauthorized: Invalid dashboard API key' });
  }
  (req as any).client = client;
  next();
}

function authenticateEaConnection(req: express.Request, res: express.Response, next: express.NextFunction) {
  const apiKey = extractApiKey(req);
  if (!apiKey) {
    return res.status(401).json({ error: 'Unauthorized: Missing EA connection key header (x-api-key)' });
  }
  const conn = connections.find(c => c.connection_key === apiKey);
  if (!conn) {
    return res.status(401).json({ error: 'Unauthorized: Invalid EA connection key' });
  }
  const client = clients.find(c => c.id === conn.client_id);
  (req as any).connection = conn;
  (req as any).client = client || { id: conn.client_id, client_name: 'Workspace' };
  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', 1);
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: Date.now() });
  });

  // 1. Workspace Registration
  app.post('/api/register', (req, res) => {
    const { clientName } = req.body || {};
    if (!clientName || typeof clientName !== 'string' || clientName.trim().length === 0 || clientName.trim().length > 50) {
      return res.status(400).json({ error: 'Validation Error: clientName must be a non-empty string between 1 and 50 characters.' });
    }
    const cleanName = clientName.trim();
    const dashboardApiKey = 'gb_live_' + crypto.randomBytes(24).toString('hex');
    const connectionKey = 'gb_ea_' + crypto.randomBytes(24).toString('hex');

    const newClientId = clients.length + 1;
    const newClient: Client = {
      id: newClientId,
      client_name: cleanName,
      api_key: dashboardApiKey,
      created_at: new Date().toISOString(),
    };
    clients.push(newClient);

    const newConnId = connections.length + 1;
    const newConn: EAConnection = {
      id: newConnId,
      client_id: newClientId,
      connection_name: 'MT5 Connection 1',
      connection_key: connectionKey,
      created_at: new Date().toISOString(),
      last_seen: null,
    };
    connections.push(newConn);

    logActivity(newClientId, null, 'REGISTER', 'Workspace created', `${cleanName} · MT5 Connection 1`);

    return res.status(201).json({
      success: true,
      message: 'Workspace registered successfully.',
      client: {
        id: newClient.id,
        clientName: newClient.client_name,
        apiKey: newClient.api_key,
      },
      connection: {
        id: newConn.id,
        name: newConn.connection_name,
        apiKey: newConn.connection_key,
      }
    });
  });

  // 2. MT5 EA Heartbeat
  app.post('/api/heartbeat', authenticateEaConnection, (req, res) => {
    const conn: EAConnection = (req as any).connection;
    const client: Client = (req as any).client;
    const { accountId, accountName, broker, currency, balance, equity, openPositions, activeMarkets, globalMaxTrades } = req.body || {};

    if (!accountId || (typeof accountId !== 'string' && typeof accountId !== 'number')) {
      return res.status(400).json({ error: 'Validation Error: accountId is required and must be a string or number.' });
    }
    const strAccountId = String(accountId).trim();
    if (strAccountId.length === 0 || strAccountId.length > 32 || !/^[a-zA-Z0-9_-]+$/.test(strAccountId)) {
      return res.status(400).json({ error: 'Validation Error: accountId must be alphanumeric (max 32 chars).' });
    }
    if (typeof balance !== 'number' || isNaN(balance) || balance < 0) {
      return res.status(400).json({ error: 'Validation Error: balance must be a non-negative number.' });
    }
    if (typeof equity !== 'number' || isNaN(equity) || equity < 0) {
      return res.status(400).json({ error: 'Validation Error: equity must be a non-negative number.' });
    }

    const positionsArray: Position[] = Array.isArray(openPositions) ? openPositions : [];
    const reportedMarkets = Array.isArray(activeMarkets) ? activeMarkets.map(normalizeSymbol).filter(Boolean).slice(0, 20) : [];
    const reportedGlobal = Number(globalMaxTrades);
    const now = Date.now();

    conn.last_seen = now;

    let account = accounts.find(a => a.account_id === strAccountId);
    if (account && account.client_id !== client.id) {
      return res.status(403).json({ error: 'Forbidden: Account belongs to another workspace.' });
    }
    if (account && account.connection_id && account.connection_id !== conn.id) {
      return res.status(403).json({ error: 'Forbidden: This MT5 account is already bound to another EA connection.' });
    }

    const otherBound = accounts.find(a => a.connection_id === conn.id && a.account_id !== strAccountId);
    if (otherBound) {
      return res.status(409).json({ error: 'This EA connection is already bound to another MT5 account. Create a separate connection for each MT5/EA installation.' });
    }

    // Check if this connection has a restricted EA License
    const matchingLicense = licenses.find(l => l.connection_key === conn.connection_key);
    if (matchingLicense) {
      if (matchingLicense.status === 'SUSPENDED') {
        return res.status(403).json({ error: 'Forbidden: EA License has been suspended by the developer. Contact developer on WhatsApp for reactivation.' });
      }
      if (matchingLicense.expires_at && new Date(matchingLicense.expires_at).getTime() < now) {
        matchingLicense.status = 'EXPIRED';
        return res.status(403).json({ error: 'Forbidden: EA License has expired. Please renew with the developer on WhatsApp.' });
      }
      if (matchingLicense.mt5_account && matchingLicense.mt5_account !== 'Any' && matchingLicense.mt5_account !== strAccountId) {
        return res.status(403).json({ error: `Forbidden: EA License is locked to MT5 Account #${matchingLicense.mt5_account}. Terminal is #${strAccountId}.` });
      }
      matchingLicense.last_used_at = new Date(now).toISOString();
    }

    if (!account) {
      account = {
        account_id: strAccountId,
        client_id: client.id,
        connection_id: conn.id,
        account_name: accountName ? String(accountName).slice(0, 50) : 'MT5 Terminal',
        broker: broker ? String(broker).slice(0, 50) : 'Unknown Broker',
        currency: currency ? String(currency).slice(0, 10) : 'USD',
        balance,
        equity,
        open_positions: positionsArray,
        active_markets: reportedMarkets,
        reported_global_max_trades: Number.isInteger(reportedGlobal) && reportedGlobal > 0 ? reportedGlobal : 6,
        ea_config: reportedMarkets.length > 0 ? {
          markets: reportedMarkets,
          globalMaxTrades: Number.isInteger(reportedGlobal) && reportedGlobal > 0 ? reportedGlobal : 6,
          updatedAt: new Date(now).toISOString(),
        } : null,
        status: 'ACTIVE',
        last_heartbeat: now,
        updated_at: new Date(now).toISOString(),
      };
      accounts.push(account);
      logActivity(client.id, strAccountId, 'CONNECT', 'MetaTrader 5 Connected', `${account.account_name} · ${account.broker}`);
    } else {
      account.balance = balance;
      account.equity = equity;
      account.open_positions = positionsArray;
      account.active_markets = reportedMarkets;
      account.last_heartbeat = now;
      account.updated_at = new Date(now).toISOString();
      if (reportedMarkets.length > 0) {
        account.reported_global_max_trades = Number.isInteger(reportedGlobal) && reportedGlobal > 0 ? reportedGlobal : account.reported_global_max_trades;
        account.ea_config = {
          markets: reportedMarkets,
          globalMaxTrades: account.reported_global_max_trades,
          updatedAt: new Date(now).toISOString(),
        };
      }
    }

    // Default settings if none exist
    if (!accountSettingsMap[strAccountId]) {
      accountSettingsMap[strAccountId] = {
        markets: reportedMarkets.length > 0
          ? reportedMarkets.map(sym => ({ symbol: sym, lotSize: 0.02, maxTrades: 2, enabled: true }))
          : [{ symbol: 'EURUSD', lotSize: 0.02, maxTrades: 2, enabled: true }],
        globalMaxTrades: account.reported_global_max_trades || 6,
      };
    }

    const pendingCmds = commands.filter(c => c.account_id === strAccountId && c.status === 'PENDING');
    const settings = accountSettingsMap[strAccountId];

    return res.json({
      success: true,
      accountId: strAccountId,
      status: account.status,
      commands: pendingCmds.map(c => ({ id: c.id, command: c.command })),
      settings,
      appliedConfig: account.ea_config,
    });
  });

  // 3. Acknowledge Commands
  app.post('/api/commands/ack', authenticateEaConnection, (req, res) => {
    const conn: EAConnection = (req as any).connection;
    const { accountId, commandIds } = req.body || {};
    if (!accountId || !Array.isArray(commandIds)) {
      return res.status(400).json({ error: 'Validation Error: accountId and array of commandIds required.' });
    }
    const strAccountId = String(accountId).trim();
    const account = accounts.find(a => a.account_id === strAccountId && a.connection_id === conn.id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found or access denied.' });
    }

    const acked: number[] = [];
    for (const cid of commandIds) {
      const numId = Number(cid);
      const cmd = commands.find(c => c.id === numId && c.account_id === strAccountId && c.status === 'PENDING');
      if (cmd) {
        cmd.status = 'EXECUTED';
        cmd.executed_at = new Date().toISOString();
        acked.push(numId);
      }
    }

    return res.json({ success: true, acknowledged: acked });
  });

  // 4. List EA Connections for Dashboard
  app.get('/api/connections', authenticateDashboardKey, (req, res) => {
    const client: Client = (req as any).client;
    const userConns = connections
      .filter(c => c.client_id === client.id)
      .map(c => ({
        id: c.id,
        name: c.connection_name,
        apiKey: c.connection_key,
        createdAt: c.created_at,
        lastSeen: c.last_seen,
      }));
    return res.json({ success: true, connections: userConns });
  });

  // 5. Create new EA Connection
  app.post('/api/connections', authenticateDashboardKey, (req, res) => {
    const client: Client = (req as any).client;
    const name = typeof req.body?.name === 'string' && req.body.name.trim()
      ? req.body.name.trim().slice(0, 50)
      : `MT5 Connection ${connections.filter(c => c.client_id === client.id).length + 1}`;
    const connectionKey = 'gb_ea_' + crypto.randomBytes(24).toString('hex');

    const newConn: EAConnection = {
      id: connections.length + 1,
      client_id: client.id,
      connection_name: name,
      connection_key: connectionKey,
      created_at: new Date().toISOString(),
      last_seen: null,
    };
    connections.push(newConn);

    logActivity(client.id, null, 'CONNECTION_CREATED', 'MT5 Connection Created', name);

    return res.status(201).json({
      success: true,
      connection: {
        id: newConn.id,
        name: newConn.connection_name,
        apiKey: newConn.connection_key,
      }
    });
  });

  // 6. Get Specific Connection Key
  app.get('/api/connections/:connectionId/key', authenticateDashboardKey, (req, res) => {
    const client: Client = (req as any).client;
    const id = Number(req.params.connectionId);
    const conn = connections.find(c => c.id === id && c.client_id === client.id);
    if (!conn) return res.status(404).json({ error: 'Connection not found.' });
    return res.json({
      success: true,
      connection: {
        id: conn.id,
        name: conn.connection_name,
        apiKey: conn.connection_key,
      }
    });
  });

  // 7. List Accounts
  app.get('/api/accounts', authenticateDashboardKey, (req, res) => {
    const client: Client = (req as any).client;
    const now = Date.now();
    const userAccounts = accounts
      .filter(a => a.client_id === client.id)
      .map(acc => {
        const secondsSinceHeartbeat = Math.floor((now - acc.last_heartbeat) / 1000);
        const isOnline = secondsSinceHeartbeat < 30;
        const settings = accountSettingsMap[acc.account_id] || { markets: [], globalMaxTrades: 6 };
        return {
          accountId: acc.account_id,
          accountName: acc.account_name,
          connectionId: acc.connection_id,
          broker: acc.broker,
          currency: acc.currency,
          balance: acc.balance,
          equity: acc.equity,
          positionCount: acc.open_positions.length,
          activeMarkets: settings.markets.map(m => m.symbol),
          reportedActiveMarkets: acc.active_markets,
          reportedGlobalMaxTrades: acc.reported_global_max_trades,
          marketCount: settings.markets.length,
          status: acc.status,
          lastHeartbeat: acc.last_heartbeat,
          secondsSinceHeartbeat,
          isOnline,
          eaConfig: acc.ea_config,
        };
      });
    return res.json({ success: true, accounts: userAccounts });
  });

  // 8. Account Details
  app.get('/api/accounts/:accountId', authenticateDashboardKey, (req, res) => {
    const client: Client = (req as any).client;
    const strAccountId = String(req.params.accountId).trim();
    const acc = accounts.find(a => a.account_id === strAccountId && a.client_id === client.id);
    if (!acc) return res.status(404).json({ error: 'Account not found.' });

    const now = Date.now();
    const secondsSinceHeartbeat = Math.floor((now - acc.last_heartbeat) / 1000);
    const isOnline = secondsSinceHeartbeat < 30;
    const settings = accountSettingsMap[strAccountId] || { markets: [], globalMaxTrades: 6 };

    return res.json({
      success: true,
      account: {
        accountId: acc.account_id,
        accountName: acc.account_name,
        connectionId: acc.connection_id,
        broker: acc.broker,
        currency: acc.currency,
        balance: acc.balance,
        equity: acc.equity,
        openPositions: acc.open_positions,
        status: acc.status,
        lastHeartbeat: acc.last_heartbeat,
        secondsSinceHeartbeat,
        isOnline,
        reportedActiveMarkets: acc.active_markets,
        reportedGlobalMaxTrades: acc.reported_global_max_trades,
        eaConfig: acc.ea_config,
        settings,
      }
    });
  });

  // 8b. Delete Account (Dashboard)
  app.delete('/api/accounts/:accountId', authenticateDashboardKey, (req, res) => {
    const client: Client = (req as any).client;
    const strAccountId = String(req.params.accountId).trim();
    const idx = accounts.findIndex(a => a.account_id === strAccountId && a.client_id === client.id);
    if (idx === -1) return res.status(404).json({ error: 'Account not found or access denied.' });

    // remove account record
    const removed = accounts.splice(idx, 1)[0];
    // remove settings, commands and activity for that account
    delete accountSettingsMap[strAccountId];
    for (let i = commands.length - 1; i >= 0; i--) {
      if (commands[i].account_id === strAccountId) commands.splice(i, 1);
    }
    for (let i = activities.length - 1; i >= 0; i--) {
      if (activities[i].account_id === strAccountId) activities.splice(i, 1);
    }

    logActivity(client.id, strAccountId, 'DELETE', 'Account Removed', `${removed.account_name} removed from workspace`);

    return res.json({ success: true, message: `Account ${strAccountId} deleted.` });
  });

  // 9. Dispatch Remote Commands
  app.post('/api/commands', authenticateDashboardKey, (req, res) => {
    const client: Client = (req as any).client;
    const { accountId, command } = req.body || {};
    if (!accountId || !command) {
      return res.status(400).json({ error: 'Validation Error: accountId and command are required.' });
    }
    const strAccountId = String(accountId).trim();
    const acc = accounts.find(a => a.account_id === strAccountId && a.client_id === client.id);
    if (!acc) return res.status(404).json({ error: 'Account not found or access denied.' });

    const ALLOWED_COMMANDS = ['PAUSE', 'RESUME', 'CLOSE_ALL'];
    const upperCommand = String(command).toUpperCase().trim();
    if (!ALLOWED_COMMANDS.includes(upperCommand)) {
      return res.status(400).json({
        error: `Security Violation: Command '${command}' is rejected. Only high-level management commands (PAUSE, RESUME, CLOSE_ALL) are permitted.`
      });
    }

    if (upperCommand === 'PAUSE') {
      acc.status = 'PAUSED';
    } else if (upperCommand === 'RESUME') {
      acc.status = 'ACTIVE';
    } else if (upperCommand === 'CLOSE_ALL') {
      // In CLOSE_ALL, we queue the command
    }

    const newCmd: Command = {
      id: nextCommandId++,
      account_id: strAccountId,
      command: upperCommand as 'PAUSE' | 'RESUME' | 'CLOSE_ALL',
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };
    commands.push(newCmd);

    const activityTitle = upperCommand === 'CLOSE_ALL'
      ? 'Emergency Close Requested'
      : upperCommand === 'PAUSE'
      ? 'EA Trading Paused'
      : 'EA Trading Resumed';

    logActivity(client.id, strAccountId, upperCommand, activityTitle, `Command ${upperCommand} queued for MT5 terminal.`);

    return res.json({
      success: true,
      commandId: newCmd.id,
      message: `Command ${upperCommand} queued successfully for Account ${strAccountId}.`,
    });
  });

  // 10. Save Settings
  app.post('/api/settings', authenticateDashboardKey, (req, res) => {
    const client: Client = (req as any).client;
    const { accountId, markets, globalMaxTrades, symbol, lotSize, maxTrades } = req.body || {};
    if (!accountId) return res.status(400).json({ error: 'Validation Error: accountId is required.' });
    const strAccountId = String(accountId).trim();
    const acc = accounts.find(a => a.account_id === strAccountId && a.client_id === client.id);
    if (!acc) return res.status(404).json({ error: 'Account not found or access denied.' });

    const normalizedMarkets = Array.isArray(markets)
      ? markets
      : (symbol ? [{ symbol, lotSize, maxTrades }] : null);

    const validationError = validateMarkets(normalizedMarkets);
    if (validationError) return res.status(400).json({ error: `Validation Error: ${validationError}` });

    const parsedGlobal = Number(globalMaxTrades ?? Math.max(...normalizedMarkets.map((m: any) => Number(m.maxTrades))));
    if (!Number.isInteger(parsedGlobal) || parsedGlobal < 1 || parsedGlobal > 100) {
      return res.status(400).json({ error: 'Validation Error: globalMaxTrades must be an integer between 1 and 100.' });
    }

    const finalMarkets: MarketConfig[] = normalizedMarkets.map((m: any) => ({
      symbol: normalizeSymbol(m.symbol),
      lotSize: Number(Number(m.lotSize).toFixed(2)),
      maxTrades: Number(m.maxTrades),
      enabled: m.enabled !== false,
    }));

    accountSettingsMap[strAccountId] = {
      markets: finalMarkets,
      globalMaxTrades: parsedGlobal,
    };

    const summary = finalMarkets.map(m => `${m.symbol} (${m.lotSize.toFixed(2)} lots · max ${m.maxTrades})`).join(' | ');
    logActivity(client.id, strAccountId, 'SETTINGS', 'EA Strategy Settings Saved', `${summary} · Global Cap: ${parsedGlobal}`);

    return res.json({
      success: true,
      message: 'EA multi-market settings saved. MT5 will apply them on its next heartbeat.',
      settings: accountSettingsMap[strAccountId],
    });
  });

  // 11. Get Settings
  app.get('/api/settings/:accountId', authenticateDashboardKey, (req, res) => {
    const client: Client = (req as any).client;
    const strAccountId = String(req.params.accountId).trim();
    const acc = accounts.find(a => a.account_id === strAccountId && a.client_id === client.id);
    if (!acc) return res.status(404).json({ error: 'Account not found or access denied.' });

    return res.json({
      success: true,
      settings: accountSettingsMap[strAccountId] || { markets: [], globalMaxTrades: 6 },
    });
  });

  // 12. Activity Log
  app.get('/api/activity', authenticateDashboardKey, (req, res) => {
    const client: Client = (req as any).client;
    const userActivities = activities
      .filter(a => a.client_id === client.id)
      .slice(0, 100);
    return res.json({ success: true, activity: userActivities });
  });

  // 13. Terminal Simulator Helper (Allows immediate interactive preview testing of MT5 EA events)
  app.post('/api/simulator/heartbeat', (req, res) => {
    const { accountId = '8820491', simulateOffline = false, addTrade = false } = req.body || {};
    const account = accounts.find(a => a.account_id === accountId);
    if (!account) return res.status(404).json({ error: 'Account not found.' });

    if (simulateOffline) {
      account.last_heartbeat = Date.now() - 45000;
      return res.json({ success: true, message: 'Account simulated as offline (last heartbeat 45s ago)' });
    }

    account.last_heartbeat = Date.now();
    const settings = accountSettingsMap[accountId];
    if (settings) {
      account.active_markets = settings.markets.map(m => m.symbol);
      account.reported_global_max_trades = settings.globalMaxTrades;
      account.ea_config = {
        markets: settings.markets.map(m => m.symbol),
        globalMaxTrades: settings.globalMaxTrades,
        updatedAt: new Date().toISOString(),
      };
    }

    // Process pending commands if any
    const pending = commands.filter(c => c.account_id === accountId && c.status === 'PENDING');
    for (const cmd of pending) {
      cmd.status = 'EXECUTED';
      cmd.executed_at = new Date().toISOString();
      if (cmd.command === 'CLOSE_ALL') {
        account.open_positions = [];
      }
    }

    if (addTrade && account.status !== 'PAUSED') {
      const symbols = settings ? settings.markets.map(m => m.symbol) : ['EURUSD'];
      const sym = symbols[Math.floor(Math.random() * symbols.length)] || 'EURUSD';
      account.open_positions.push({
        ticket: 1094830 + Math.floor(Math.random() * 1000),
        symbol: sym,
        type: Math.random() > 0.5 ? 'BUY' : 'SELL',
        lots: 0.02,
        openPrice: 1.0850,
        profit: (Math.random() * 80 - 20),
      });
    }

    return res.json({ success: true, message: 'Simulated heartbeat processed', account });
  });

  // 14. Admin Pin Verification
  const ADMIN_MASTER_PIN = '2026'; // Default Developer Master PIN

  app.post('/api/admin/verify-pin', (req, res) => {
    const { pin } = req.body || {};
    if (String(pin).trim() === ADMIN_MASTER_PIN) {
      return res.json({ success: true, token: 'dev_admin_session_token_' + Date.now() });
    }
    return res.status(401).json({ error: 'Invalid Developer PIN' });
  });

  // 15. Admin - List All Issued EA Licenses
  app.get('/api/admin/licenses', (req, res) => {
    const formatted = licenses.map(l => ({
      id: l.id,
      clientName: l.client_name,
      phoneNumber: l.phone_number,
      mt5Account: l.mt5_account,
      connectionKey: l.connection_key,
      plan: l.plan,
      expiresAt: l.expires_at,
      status: l.status,
      createdAt: l.created_at,
      lastUsedAt: l.last_used_at,
      notes: l.notes,
    }));
    return res.json({ success: true, licenses: formatted });
  });

  // 16. Admin - Issue New EA License (and automatic connection)
  app.post('/api/admin/licenses', (req, res) => {
    const { clientName, phoneNumber = '', mt5Account = 'Any', plan = 'MONTHLY', notes = '', customExpiresDays = 30 } = req.body || {};

    if (!clientName || typeof clientName !== 'string' || !clientName.trim()) {
      return res.status(400).json({ error: 'Client Name is required.' });
    }

    const cleanName = clientName.trim();
    const cleanAccount = String(mt5Account || 'Any').trim();
    const cleanPhone = String(phoneNumber || '').trim();

    let expiresAt: string | null = null;
    if (plan === 'TRIAL_7D') {
      expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    } else if (plan === 'MONTHLY') {
      expiresAt = new Date(Date.now() + (Number(customExpiresDays) || 30) * 24 * 3600 * 1000).toISOString();
    } else if (plan === 'LIFETIME') {
      expiresAt = null;
    } else if (plan === 'CUSTOM') {
      expiresAt = new Date(Date.now() + (Number(customExpiresDays) || 30) * 24 * 3600 * 1000).toISOString();
    }

    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const safeAccountTag = cleanAccount !== 'Any' ? cleanAccount.replace(/[^a-zA-Z0-9]/g, '') : 'multi';
    const connectionKey = `gb_ea_${safeAccountTag}_${randomSuffix}`;

    const newLicenseId = 'lic_' + Date.now();
    const newLicense: EALicenseRecord = {
      id: newLicenseId,
      client_name: cleanName,
      phone_number: cleanPhone,
      mt5_account: cleanAccount,
      connection_key: connectionKey,
      plan: plan as any,
      expires_at: expiresAt,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      last_used_at: null,
      notes: notes ? String(notes).trim() : '',
    };
    licenses.unshift(newLicense);

    // Also ensure a corresponding EA Connection exists
    const primaryClient = clients[0] || { id: 1 };
    connections.push({
      id: connections.length + 1,
      client_id: primaryClient.id,
      connection_name: `${cleanName} (MT5 #${cleanAccount})`,
      connection_key: connectionKey,
      created_at: new Date().toISOString(),
      last_seen: null,
    });

    logActivity(1, cleanAccount !== 'Any' ? cleanAccount : null, 'LICENSE_ISSUED', `EA License Issued: ${cleanName}`, `Plan: ${plan} · MT5 Account: ${cleanAccount}`);

    return res.status(201).json({
      success: true,
      message: 'EA License created successfully.',
      license: {
        id: newLicense.id,
        clientName: newLicense.client_name,
        phoneNumber: newLicense.phone_number,
        mt5Account: newLicense.mt5_account,
        connectionKey: newLicense.connection_key,
        plan: newLicense.plan,
        expiresAt: newLicense.expires_at,
        status: newLicense.status,
        createdAt: newLicense.created_at,
        lastUsedAt: newLicense.last_used_at,
        notes: newLicense.notes,
      }
    });
  });

  // 17. Admin - Update License (Suspend, Activate, Extend, Edit)
  app.patch('/api/admin/licenses/:id', (req, res) => {
    const id = String(req.params.id);
    const lic = licenses.find(l => l.id === id);
    if (!lic) return res.status(404).json({ error: 'License not found.' });

    const { status, extendDays, phoneNumber, clientName, notes, mt5Account } = req.body || {};

    if (status && ['ACTIVE', 'SUSPENDED', 'EXPIRED'].includes(status)) {
      lic.status = status;
    }
    if (clientName && typeof clientName === 'string') {
      lic.client_name = clientName.trim();
    }
    if (phoneNumber !== undefined) {
      lic.phone_number = String(phoneNumber).trim();
    }
    if (mt5Account !== undefined) {
      lic.mt5_account = String(mt5Account).trim() || 'Any';
    }
    if (notes !== undefined) {
      lic.notes = String(notes).trim();
    }
    if (typeof extendDays === 'number' && extendDays > 0) {
      const baseTime = lic.expires_at && new Date(lic.expires_at).getTime() > Date.now()
        ? new Date(lic.expires_at).getTime()
        : Date.now();
      lic.expires_at = new Date(baseTime + extendDays * 24 * 3600 * 1000).toISOString();
      lic.status = 'ACTIVE';
    }

    logActivity(1, lic.mt5_account !== 'Any' ? lic.mt5_account : null, 'LICENSE_UPDATED', `License Updated: ${lic.client_name}`, `Status: ${lic.status}`);

    return res.json({
      success: true,
      message: 'License updated successfully.',
      license: {
        id: lic.id,
        clientName: lic.client_name,
        phoneNumber: lic.phone_number,
        mt5Account: lic.mt5_account,
        connectionKey: lic.connection_key,
        plan: lic.plan,
        expiresAt: lic.expires_at,
        status: lic.status,
        createdAt: lic.created_at,
        lastUsedAt: lic.last_used_at,
        notes: lic.notes,
      }
    });
  });

  // 18. Admin - Delete License
  app.delete('/api/admin/licenses/:id', (req, res) => {
    const id = String(req.params.id);
    const index = licenses.findIndex(l => l.id === id);
    if (index === -1) return res.status(404).json({ error: 'License not found.' });

    const deleted = licenses.splice(index, 1)[0];
    logActivity(1, null, 'LICENSE_DELETED', `License Revoked: ${deleted.client_name}`, `Key revoked`);
    return res.json({ success: true, message: 'License revoked and deleted.' });
  });

  // 19. Client - Get Masked License Status
  app.get('/api/client/license-info', (req, res) => {
    const primaryLicense = licenses[0];
    if (!primaryLicense) {
      return res.json({
        success: true,
        hasLicense: false,
      });
    }
    return res.json({
      success: true,
      hasLicense: true,
      license: {
        clientName: primaryLicense.client_name,
        maskedKey: primaryLicense.connection_key.slice(0, 10) + '••••••••••••' + primaryLicense.connection_key.slice(-4),
        mt5Account: primaryLicense.mt5_account,
        plan: primaryLicense.plan,
        status: primaryLicense.status,
        expiresAt: primaryLicense.expires_at,
        lastUsedAt: primaryLicense.last_used_at,
      }
    });
  });

  // Vite Middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Glera Bridge] Full-stack Server running on http://localhost:${PORT}`);
  });
}

startServer();
