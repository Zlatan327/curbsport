<div align="center">
  <h1>curbsport ⚽🏀 (Sports Edition)</h1>
  <p><strong>A hyper-local sports ground map, real-time matchmaking lobby, and reputation tracking app for university campuses across Nigeria.</strong></p>
</div>

## 🌟 The Vision
Curbsport maps out the hidden and popular playing grounds across universities. It solves the biggest problem in pickup sports: **"Where are people playing right now, and do they need an extra player?"**

By bridging the gap between physical courts and digital coordination, players can find matches, build their reputation, and compete for the title of "King of the Ground."

## 🚀 Key Features

### 📍 Campus-Specific Discovery
* **10+ Supported Universities:** Switch your view to UNILAG, OAU, ABU, UNN, Covenant, UNILORIN, UI, and more.
* **Football & Basketball:** Discover both pitches and indoor/outdoor basketball courts.
* **Live Status:** See if a pitch is `DRY`, `BUILDING` (players gathering), or `LIVE`.

### 🤝 Real-Time Matchmaking Lobbies
* **Join Sets:** Hosts can schedule a pickup game (e.g., "5-a-side at Moremi Car Park, 4 PM").
* **Live Updates:** Uses WebSockets (Socket.IO) to update lobby member counts instantly.
* **Campus Alerts:** Automatically broadcasts "New set building!" to everyone browsing that specific campus.

### 👑 Stat King & Reputation System
* **Submit Results:** After a match, players submit durations and detailed stats (Goals, Assists, 3-Pointers, Rebounds, etc.).
* **Peer Confirmation:** At least 2 opponents must confirm the stats to prevent cheating.
* **Anti-Cheat Slashing:** Fraudulent stat submissions can be disputed and "slashed" by peers, resulting in severe reputation penalties and bans.
* **King of the Ground:** The player with the highest stats on a specific pitch gets crowned on the pitch's page.

### 🧬 Player Biometrics
* **Progressive Profiling:** Quick sign-up, with the ability to add Height (cm) and Weight (kg) later.
* **Medical History:** Private medical/injury tracking.
* **Stat Tracking:** All historical biometric updates are tracked chronologically on the profile.

---

## 🏗️ Architecture

### Frontend (Client)
* **Framework:** Next.js 14 (App Router)
* **Styling:** Custom CSS with CSS Variables for consistent theming
* **State Management:** Zustand (for Auth and Session)
* **Icons:** Lucide React
* **Deployment:** Vercel

### Backend (Server)
* **Framework:** Express.js (v5) + Node.js
* **Database:** PostgreSQL (Hosted on Neon)
* **ORM:** Prisma
* **Real-time:** Socket.IO
* **Auth:** JWT (JSON Web Tokens) + bcrypt
* **Validation:** Zod
* **Deployment:** Render (Starter Tier for persistent WebSockets)

---

## 🛠️ Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL (or Docker to run it locally)

### 1. Database Setup
Ensure you have a Postgres instance running, or use Docker:
```bash
docker compose up -d
```

### 2. Server Setup
```bash
cd server
npm install

# Copy env example and set your DATABASE_URL
cp .env.example .env

# Push the schema and seed the nationwide universities
npx prisma db push
npm run db:seed

# Start the development server
npm run dev
```
The server will start at `http://localhost:4000`.

### 3. Client Setup
```bash
cd client
npm install

# Start the Next.js development client
npm run dev
```
The client will start at `http://localhost:3000`.

---

## 🛡️ Security & Anti-Exploit Measures
This MVP was rigorously audited and secured against gamification exploits:
- **Reputation Farming Prevented:** Vote toggling on pitch verifications does not yield infinite reputation.
- **Strict Slashing Authorization:** Only verified match participants who explicitly denied a match can execute a slash penalty against a fraudulent submitter.
- **Time-Travel Farming Blocked:** Backend constraints prevent users from submitting a 45-minute match result if the lobby was created less than 45 minutes ago.
- **Device-Bound Sessions:** Secure JWT handling tailored for mobile web.

---
*Built for the culture. Ball knows.*
