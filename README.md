# Glera Bridge

Glera Bridge is a real-time web dashboard for monitoring and controlling MetaTrader 5 (MT5) trading accounts. It connects an MT5 Expert Advisor (EA) to a React dashboard through a small TypeScript and Express bridge server.

The application is designed for a single operator or trading workspace. It provides live account telemetry, connection management, activity history, strategy configuration, remote pause and resume commands, and an emergency close workflow.

> Built by **Andile Moyo**, software developer.

## What It Demonstrates

- React 19 and TypeScript application design
- Vite development and production builds
- Express API development with typed request and response flows
- Real-time style telemetry using MT5 heartbeats and polling
- Secure API-key and EA connection-key authentication
- JSON-backed persistence for a lightweight deployment
- Responsive dashboard UX for desktop and mobile screens
- Capacitor Android and iOS project integration
- Production-oriented error, loading, empty, and offline states

## How Glera Bridge Works

The system has three parts:

1. **MT5 Expert Advisor** sends authenticated heartbeat requests containing account balance, equity, open positions, active markets, and EA configuration data.
2. **Express bridge server** validates the connection key, stores the latest account state, records activity, and queues dashboard commands for the EA.
3. **React dashboard** polls the API for current telemetry and displays account health, live status, positions, activity, connection keys, and controls.

An account is considered live while its most recent heartbeat is within the server's 30-second heartbeat window. The dashboard exposes clear `LIVE`, `DEGRADED`, `OFFLINE`, and account-level status states so operators can distinguish a healthy terminal from a stale connection.

### Why this project matters

Glera Bridge is designed to demonstrate practical engineering in a real-world operational system: secure key handling, event-driven telemetry, stateful backend validation, live monitoring, and remote control workflows. It is a good portfolio project because it shows the ability to move from interface design into infrastructure thinking, trust boundaries, and system reliability.

### Why WhatsApp-based key delivery is intentional

This is a personal, owner-controlled trading operations system, not a shared SaaS product. The WhatsApp API is used as a secure delivery channel for the operator's credentials and operational messages, not as the primary trust boundary of the platform. In practical terms, the bridge authenticates access using the workspace-scoped connection key, server-side validation, and the operator's own dashboard credentials—not by trusting the phone number or device identity of the WhatsApp account itself.

That design is intentional: the user can send or receive an MT5 connection key through WhatsApp because the system belongs to them, and the bot can be registered under a separate WhatsApp account or companion device while still reporting telemetry into the same private dashboard and monitoring workflow on the user's own devices. The app remains centralized to the user's environment, while the message transport layer is decoupled from the actual access control model.

This is a technically sound architecture for a self-hosted trading stack. WhatsApp handles message delivery and operational notifications, while the bridge server remains the authority for account ownership, session state, heartbeat validation, and command execution. The result is a portable control plane where the user can operate the bot from a different account context without losing visibility, auditing, or control over the actual MT5 terminal and account data.

## Features

### Account monitoring

- Portfolio balance, equity, floating profit and loss, and P/L percentage
- Per-account broker, currency, active markets, open positions, and EA status
- Heartbeat age and live connection indicators
- Detailed account view with current positions and strategy configuration

### MT5 connection management

- Create and name multiple MT5 terminal connections
- Copy EA connection keys for use in MT5
- View terminal heartbeat activity and setup state
- Test bridge availability and open server health status
- Setup guidance for the EA, WebRequest permissions, and Algo Trading

### Remote operations

- Pause and resume the EA
- Save market and global trade-limit settings
- Queue an emergency close-all command
- Review command and connection activity in the audit feed

### Security and reliability

- Dashboard API keys and separate EA connection keys
- Masked private key display with deliberate reveal and copy actions
- Server-side request authentication and input validation
- Actionable network errors and retry controls
- Responsive modal layouts and safe mobile touch targets

## Prerequisites

- Node.js 20 or newer
- npm
- An MT5 terminal with the compatible Glera Bridge EA installed
- A reachable deployment URL if the EA is running on a remote VPS

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The development server starts the Express API and Vite frontend together. Open `http://localhost:3000` in a browser.

PowerShell example with explicit single-user mode:

```powershell
$env:SINGLE_USER = '1'
npm run dev
```

Single-user mode is enabled by default unless `SINGLE_USER` is set to `0`, `false`, `off`, or `no`.

## Connect an MT5 Terminal

1. Open the dashboard and go to the **Connections** tab.
2. Create or select a terminal connection and copy its EA connection key.
3. Attach the compatible Glera Bridge EA to a chart in MT5.
4. Set the EA's `InpApiKey` parameter to the connection key.
5. Set `InpServerUrl` to the URL where Glera Bridge is running.
6. In MT5, add that URL under **Tools -> Options -> Expert Advisors -> Allow WebRequest for listed URL**.
7. Enable **Algo Trading** and allow the EA to run.
8. Confirm that the dashboard shows a recent heartbeat and a live account status.

Each connection is intended for one MT5/EA installation. Use a separate connection key for each terminal or VPS.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Express and Vite development server |
| `npm run build` | Build the frontend and bundle the production server |
| `npm start` | Run the bundled production server from `dist/server.cjs` |
| `npm run preview` | Preview the Vite frontend build |
| `npm run lint` | Run the TypeScript compiler without emitting files |

Before opening a pull request or deploying, run:

```bash
npm run lint
npm run build
```

## API Overview

The bridge server exposes the following main endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Check whether the bridge server is responding |
| `POST /api/register` | Register or retrieve a workspace and primary connection |
| `POST /api/heartbeat` | Receive authenticated MT5 account telemetry |
| `GET /api/accounts` | List current account summaries |
| `GET /api/accounts/:accountId` | Retrieve detailed account telemetry |
| `GET /api/connections` | List workspace MT5 connections |
| `POST /api/connections` | Create a new MT5 connection |
| `POST /api/commands` | Queue pause, resume, or close-all commands |
| `GET /api/activity` | Read the workspace audit activity feed |

Dashboard requests use the `x-api-key` header. MT5 heartbeat requests use the EA connection key in the same header. The server validates account identifiers, balances, equity, markets, commands, and connection ownership before changing state.

## Persistence and Deployment

The server stores workspace data in `data/db.json`, which is created at runtime. This keeps local and small single-operator deployments simple, but production deployments should use durable storage and secret management when scaling beyond this project scope.

For a production build:

```bash
npm run build
npm start
```

The project also contains Vercel configuration and Capacitor Android/iOS projects. When deploying the web application, configure the deployment to run the Node server and ensure the server's JSON data directory is backed by durable storage if persistence across instances is required.

## Project Structure

```text
src/
  App.tsx                 Main dashboard state and navigation
  components/             Account, connection, activity, modal, and control views
  lib/api.ts              Typed client API and browser key storage
  lib/mockStore.ts        Local development fallback store
  types.ts                Shared frontend domain types
server.ts                 Express API, validation, persistence, and command queue
public/                   Branding, PWA manifest, and static assets
android/                  Capacitor Android project
ios/                      Capacitor iOS project
```

## Security Notes

- Treat dashboard and EA connection keys as secrets.
- Do not commit `data/db.json`, production credentials, or private keys.
- Use HTTPS whenever an MT5 terminal connects to a remotely deployed server.
- Restrict production access and replace JSON persistence with a managed database for multi-user or high-availability deployments.
- Review all emergency trading commands before enabling them in a live account.

## Author

Glera Bridge was made by **Andile Moyo**, a software developer focused on building practical, reliable web applications and integrations.
