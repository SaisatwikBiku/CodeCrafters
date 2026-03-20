# CODECRAFTERS🏫
> Welcome Learners

CodeCrafters is a two-player collaborative educational game that teaches Python programming through a story-driven experience. Players work together to build a virtual school campus — one writes the code, both see the result.

## What is it?

CodeCrafters pairs two players as an **Architect** and a **Builder**. Each stage presents a Python coding challenge tied to a campus building — solve it correctly and the building goes up. Both players must complete their respective tasks before the stage advances, making collaboration the core mechanic rather than an afterthought.

Concepts covered across the five stages include variables, input/output, conditionals, and functions.

## Tech Stack

- **Frontend** — Next.js (React), Monaco Editor, TailwindCSS
- **Backend** — Node.js, Express, Socket.IO
- **Code Execution** — Judge0 (sandboxed Python runner)
- **Database** — PostgreSQL (persistent data), Redis (live game state)
- **Infrastructure** — Docker Compose

## Project Structure

```
codecrafters/
├── client/          # Next.js frontend
│   ├── app/
│   │   ├── (auth)/  # Route group for login/signup
│   │   ├── lobby/
│   │   └── game/
│   └── components/
└── server/          # Express + Socket.IO backend
    ├── index.js
    ├── routes/
    └── socket/
```

## Getting Started

```bash
# Clone the repo
git clone https://github.com/sri-nivas1227/codecrafters.git
cd codecrafters

# Start all services
docker-compose up
```

Client runs on `http://localhost:3000`, server on `http://localhost:4000`.

## Team

Built for CSI 680 — Spring 2026 at the University at Albany.

| Name | GitHub |
|---|---|
| Srinivas Mekala | [@sri-nivas1227](https://github.com/sri-nivas1227) |
| Sai Satwik Bikumandla | — |
| Mehak Seth | — |
| Dileep Reddy Chinneluka | — |

Advised by **Jeff Offutt**.
