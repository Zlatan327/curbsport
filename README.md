# Inside Life ⚽ (Sports Edition)

Hyper-local football pitch directory and matchmaking app for Anambra State, Nigeria.

## Quick Start

### Prerequisites
- Node.js 20+
- Docker (for PostgreSQL)

### Setup

1. Start the database:
```bash
docker compose up -d
```

2. Set up the server:
```bash
cd server
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

3. Set up the client:
```bash
cd client
npm install
npm run dev
```

Server: http://localhost:4000
Client: http://localhost:3000
