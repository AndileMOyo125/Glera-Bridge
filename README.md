# Glera Bridge

Glera Bridge is a full-stack monitoring and management platform that connects a MetaTrader 5 (MT5) Expert Advisor to a responsive web dashboard. It gives operators a centralized view of account telemetry, open positions, terminal connections, activity history and selected remote EA controls.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/) [![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)

**Live Demo:** Add deployment URL here  
**Repository:** [AndileMOyo125/Glera-Bridge](https://github.com/AndileMOyo125/Glera-Bridge)

## 🎥 Project Demo

[![Glera Bridge Demo](./docs/demo-thumbnail.png)](VIDEO_URL_HERE)

Watch the demo to see the dashboard, MT5 connections, account monitoring, security features and operational workflows.

> Add the demo thumbnail and replace `VIDEO_URL_HERE` when the video is ready.

## ✨ Key Features

- **Account Details** — Monitor account identity, broker, currency, balance, equity and EA status.
- **Open Positions** — View current MT5 positions and position details.
- **Activity & Audit Log** — Track connection events, settings changes and remote commands.
- **MT5 Connections** — Create, name and monitor connected MT5 terminals through heartbeat status.
- **Security Connection Keys** — Manage dashboard API keys and EA connection keys with server-side validation.
- **WhatsApp Key Delivery** — Prepare and send issued EA connection keys through the implemented WhatsApp sharing workflow.
- **Dashboard** — Use a responsive interface for connected accounts, activity, settings and operational controls.
- **Backend/API** — Express endpoints handle registration, heartbeats, account data, connections, settings, activity and queued EA commands.

## 🖼️ Screenshots

_Add the screenshots below to `docs/screenshots/` when they are ready._

### Account Details
![Account Details](./docs/screenshots/account-details.png)

### Open Positions
![Open Positions](./docs/screenshots/positions.png)

### Activity & Audit Log
![Activity Audit Log](./docs/screenshots/activity-audit-log.png)

### MT5 Connections
![MT5 Connections](./docs/screenshots/mt5-connections.png)

### Security Connection Keys
![Security Connection Keys](./docs/screenshots/security-connection-keys.png)

### WhatsApp Key Delivery
![WhatsApp Key Delivery](./docs/screenshots/whatsapp-key-delivery.png)

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | Dashboard UI |
| TypeScript | Frontend and backend application development |
| Node.js | Backend runtime |
| Express | Backend/API server |
| Vite | Frontend development and build tooling |
| Tailwind CSS | UI styling |
| MetaTrader 5 / EA | Trading-terminal telemetry and command integration |
| Capacitor | Android and iOS project integration |
| JSON persistence | Lightweight server-side local data storage |

## 🏗️ How It Works

- The MT5 EA sends authenticated heartbeat data, including account information, positions and configuration, to the Express server.
- The backend validates connection keys, stores the latest account state, records activity and queues supported commands.
- The React dashboard retrieves the data and presents account health, connections, positions and activity.
- Dashboard actions can queue EA commands such as pause, resume and close-all for the terminal to acknowledge.

```text
MT5 EA → Express/Node.js API → React Dashboard
```

## 🔐 Security

- Separate dashboard API keys and EA connection keys are used for application and terminal access.
- Server-side request authentication and input validation protect account, settings and command workflows.
- Connection keys can be copied, shared through the implemented WhatsApp workflow and managed from the dashboard.
- Runtime data is stored in `data/db.json` for the current lightweight deployment model; use appropriate access controls and durable storage for production environments.

**Never commit real credentials, API keys, connection keys or secrets to source control.**

## 🚀 Run Locally

Prerequisite: Node.js 20 or newer and npm.

```bash
git clone https://github.com/AndileMOyo125/Glera-Bridge.git
cd Glera-Bridge
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Useful commands

```bash
npm run lint   # Type-check without emitting files
npm run build  # Build the frontend and production server
npm start      # Run the production server after building
```

The development server starts the Express API and Vite frontend together. Runtime workspace data is persisted to `data/db.json`.

## 👤 Author

Built by [Andile Moyo](https://github.com/AndileMOyo125).
