# CODECRAFTERS🏫
> Welcome Learners

CodeCrafters is a two-player collaborative educational game that teaches Python programming through a story-driven experience. Players work together to build a virtual school campus — one writes the code, both see the result.

## What is it?

CodeCrafters pairs two players as an **Architect** and a **Builder**. Each stage presents a Python coding challenge tied to a campus building — solve it correctly and the building goes up. Both players must complete their respective tasks before the stage advances, making collaboration the core mechanic rather than an afterthought.

Concepts covered across the five stages include variables, input/output, conditionals, and functions.

## Tech Stack

- Backend: Node.js, Express, Socket.IO
- Database: PostgreSQL
- Frontend workspace: Next.js 16 + React 19 + TypeScript
- Infrastructure: Docker + Docker Compose

## Repository Structure

```text
.
├── client/                 # Next.js app and static client assets
│   ├── app/                # App Router pages and layouts
│   └── public/             # Static game UI files (index.html/css/js)
├── server/
│   ├── db/                 # Postgres and in-memory session helpers
│   ├── routes/             # REST APIs for game + code execution
│   ├── socket/             # Socket event handlers
│   └── server.js           # Express + Socket.IO bootstrap
├── Dockerfile
└── docker-compose.yml
```

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop (for containerized setup)

## Quick Start (Docker)

This is the easiest way to run the app with PostgreSQL.

```bash
docker compose up --build
```

App URL:

- http://localhost:3000

Stop services:

```bash
docker compose down
```

Remove volumes (reset database):

```bash
docker compose down -v
```

## Local Development (Without Docker)

1. Install dependencies:

```bash
npm install
```

2. Start PostgreSQL locally and create a database named codecrafters.

3. Set environment variables in a .env file at the repository root:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/codecrafters
```

4. Run the development server:

```bash
npm run dev
```

## API Overview

Base URL: http://localhost:3000

- POST /api/game/create
    - Body: { "playerName": "Alice" }
- POST /api/game/join
    - Body: { "sessionId": "AB12CD34", "playerName": "Bob" }
- GET /api/game/:sessionId
- POST /api/code/run
    - Body: { "source_code": "print('hi')", "expected_output": "hi" }

## Socket.IO

Socket.IO is initialized on the same HTTP server as Express.

- Default CORS is currently open for development.
- Event handlers are defined in server/socket/handlers.js.

## Scripts

Root scripts:

- npm run dev: Starts server with nodemon
- npm start: Starts server with node

Client scripts (inside client):

- npm run dev
- npm run build
- npm run start
- npm run lint

## Notes

- The backend currently serves static files from client/public.
- The Next.js workspace under client is available for modern frontend development and iteration.

## Team

Built for CSI 680 — Spring 2026 at the University at Albany.

| Name | GitHub |
|---|---|
| Srinivas Mekala | [@sri-nivas1227](https://github.com/sri-nivas1227) |
| Sai Satwik Bikumandla | [@SaisatwikBiku](https://github.com/SaisatwikBiku) |
| Mehak Seth | [@Mehak005](https://github.com/Mehak005) |
| Dileep Reddy Chinneluka | [@Dileepreddy-01](https://github.com/Dileepreddy-01) |

Advised by **Jeff Offutt**.
