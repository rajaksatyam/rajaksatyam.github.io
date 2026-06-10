# KB — Content Analyser

> **Stop watching. Start knowing.**
> KB turns any YouTube or Instagram URL into a structured intelligence report — AI-generated summary, word-for-word transcription, fact-check verdict, and curated resources — delivered in under a minute.

[![TypeScript](https://img.shields.io/badge/TypeScript-94.7%25-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
  - [Docker Deployment](#docker-deployment)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Analysis](#analysis)
  - [History](#history)
- [Frontend Architecture](#frontend-architecture)
- [Security](#security)
- [Error Handling](#error-handling)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Most people watch a 40-minute video to extract three minutes of insight. **KB eliminates that tax.**

Paste a URL — YouTube, Instagram, or similar — and KB's pipeline kicks in: `yt-dlp` pulls the raw video, Google Gemini 2.5 Flash processes every frame and word, and within a minute you have a production-quality intelligence report back in your browser. Not a generic transcript dump — a structured, machine-verified breakdown:

- A sharp, AI-generated **title**
- A **narrative overview** and distilled **key points**
- A **timestamped transcription** you can actually navigate
- A **fact-check verdict** (`accurate` / `inaccurate` / `partially accurate`) with a full report
- A curated list of **external resources** for every claim worth following up on

Every report is tied to your account and stored in MongoDB — searchable, browsable, and paginated across an infinite-scroll sidebar so your analysis history is always one click away.

The stack is built for the real world: JWT auth with `httpOnly` cookies and token blacklisting, Argon2id password hashing, Zod validation on every boundary, Helmet security headers, rate limiting, Pino structured logging, and a centralised error handler. Deployed on Oracle Cloud using Docker with OCI Vault for secret management.

---

## Features

| Feature | Description |
|---|---|
| **Multi-platform analysis** | YouTube and Instagram URLs supported out of the box |
| **AI-generated output** | Title, overview, key points, timestamped transcription, fact-check verdict, and resource links |
| **Per-user history** | Every analysis is saved, paginated (10/page), and accessible via infinite scroll |
| **Secure authentication** | JWT in `httpOnly` cookies; tokens are blacklisted on sign-out |
| **Input validation** | Zod validation on all request bodies on both client and server |
| **Rate limiting** | Auth routes capped at 5 req / 15 min; general 60 req/min limiter available |
| **Structured logging** | Pino + pino-http write JSON logs on every request |
| **Production-ready error handling** | Centralised middleware covers all operational, DB, and JWT error types |
| **Docker + OCI deployment** | Single `docker-compose.yml`; secrets fetched from Oracle Cloud Vault at runtime |

---

## Tech Stack

### Backend

| Concern | Library |
|---|---|
| Runtime | Node.js (ESM, TypeScript) |
| Framework | Express 5 |
| Database | MongoDB via Mongoose 9 |
| Auth | JSON Web Tokens (`jsonwebtoken`) |
| Password hashing | Argon2id (`@node-rs/argon2`) with pepper |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Video download | `yt-dlp-exec` |
| Validation | Zod |
| Logging | Pino + pino-http |
| Security headers | Helmet |
| Rate limiting | express-rate-limit |
| CORS | cors |

### Frontend

| Concern | Library |
|---|---|
| Framework | React 19 |
| Build tool | Vite 6 |
| Language | TypeScript |
| State management | Zustand 5 |
| HTTP client | Axios |
| Routing | React Router DOM 7 |
| Validation | Zod |

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                         Browser                            │
│  React + Vite (port 5173 in dev)                           │
│                                                            │
│  ┌──────────┐   ┌──────────┐   ┌────────────────────────┐ │
│  │ AuthPage │   │ HomePage │   │HistoryList (∞ scroll)  │ │
│  └──────────┘   └──────────┘   └────────────────────────┘ │
│         │              │                    │              │
│         └──────────────┴────────────────────┘              │
│                        │  Axios (withCredentials)          │
└────────────────────────┼───────────────────────────────────┘
                         │ HTTP + httpOnly cookie
┌────────────────────────▼───────────────────────────────────┐
│                     Express 5 API                          │
│              (port 5214 in dev)                            │
│                                                            │
│  Helmet → CORS → Pino → cookie-parser → body-parser        │
│                                                            │
│  ┌─────────────────┐   ┌──────────────────────────────┐   │
│  │ /api/auth/*     │   │ /api/*  (verifyUser JWT)     │   │
│  │  signUp signIn  │   │  analyze  history            │   │
│  │  signOut        │   │                              │   │
│  └────────┬────────┘   └──────────────┬───────────────┘   │
│           │                           │                    │
│  ┌────────▼──────────────────────────▼────────────────┐   │
│  │              Service Layer                          │   │
│  │  auth.service   history.service   ydl.service       │   │
│  │                                  summery.LLM.service│   │
│  └────────┬──────────────────────────▼────────────────┘   │
│           │                           │                    │
└───────────┼───────────────────────────┼────────────────────┘
            │                           │
┌───────────▼───────┐       ┌───────────▼──────────────────┐
│     MongoDB        │       │   Google Gemini 2.5 Flash    │
│  users collection  │       │   (video upload → JSON)      │
│  history collection│       └──────────────────────────────┘
│  tokenBlackList    │
└────────────────────┘
```

### Request Lifecycle for `/api/analyze`

1. Client sends `POST /api/analyze` with `{ url }` — the JWT cookie is attached automatically
2. `verifyUser` middleware decodes and validates the JWT, checks it is not blacklisted, and attaches `req.user`
3. `ydl.service` calls `yt-dlp` to download the video to `src/downloads/`
4. `summery.LLM.service` uploads the file to the Gemini Files API, waits for processing, generates content, parses the JSON response, then deletes the local file
5. `app.controller` fires `saveHistoryService` in the background (non-blocking) to persist the result under the user's ID
6. The structured `GeminiAnalysis` object is returned to the client immediately

---

## Project Structure

```
KB/
├── .gitignore
├── docker-compose.yml             # Production deployment (OCI)
├── backend/
│   ├── server.ts                  # Entry point — connects DB, starts server
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── app.ts                 # Express app setup (middleware, routes)
│       ├── config/
│       │   ├── db.config.ts       # Mongoose connection
│       │   └── env.config.ts      # Zod-validated environment schema
│       ├── controllers/
│       │   ├── app.controller.ts  # POST /api/analyze
│       │   ├── auth.controller.ts # signUp / signIn / signOut
│       │   └── history.controller.ts
│       ├── errors/
│       │   └── AppErrors.errors.ts  # Operational AppError class
│       ├── middleware/
│       │   ├── errorHandle.middleware.ts  # Global error handler + 404
│       │   ├── ratelimiter.middleware.ts
│       │   ├── userVerification.middleware.ts  # JWT auth guard
│       │   └── validate.middleware.ts          # Zod body validator
│       ├── models/
│       │   ├── auth.model.ts      # User + TokenBlackList schemas
│       │   └── history.model.ts   # History schema (userId, url, result)
│       ├── repository/
│       │   └── auth.repo.ts       # DB queries for auth
│       ├── routes/
│       │   ├── app.routes.ts      # /api routes
│       │   └── auth.routes.ts     # /api/auth routes
│       ├── service/
│       │   ├── auth.services.ts
│       │   ├── history.service.ts
│       │   ├── summery.LLM.service.ts  # Gemini upload + analysis
│       │   └── ydl.service.ts          # yt-dlp wrapper
│       ├── utility/
│       │   ├── encryption.utility.ts
│       │   ├── hashing.utility.ts  # Argon2id hash/verify
│       │   └── logger.utility.ts   # Pino logger instance
│       └── validate/
│           └── auth.validate.ts    # Zod schemas for auth payloads
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── package.json
    └── src/
        ├── App.tsx                 # Router root
        ├── main.tsx
        ├── types.ts                # Shared TypeScript interfaces
        ├── api/
        │   ├── client.ts           # Axios instance (withCredentials)
        │   ├── analyse.ts          # analyseApi.analyse()
        │   ├── auth.ts             # authApi.signUp/signIn/signOut
        │   └── history.ts          # historyApi.getPage/deleteItem/clearAll
        ├── components/
        │   ├── AnalyseForm.tsx
        │   ├── AuthForm.tsx
        │   ├── HistoryList.tsx     # IntersectionObserver infinite scroll
        │   ├── ResultCard.tsx
        │   └── ui/
        │       ├── Button.tsx
        │       └── Input.tsx
        ├── hooks/
        │   └── useAnalyse.ts       # analyse() action + loading/error state
        ├── pages/
        │   ├── AuthPage.tsx
        │   └── HomePage.tsx
        ├── store/
        │   ├── auth.store.ts       # Zustand + persist (userName, isAuth)
        │   └── history.store.ts    # Server-backed paginated history store
        ├── styles/
        │   └── globals.css
        └── validate/
            └── auth.validate.ts    # Zod schemas mirroring the backend
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| npm | ≥ 10 |
| MongoDB | Atlas or local ≥ 7 |
| yt-dlp | Latest (must be on `PATH`) |
| Google Gemini API key | Gemini 2.5 Flash access |

Install yt-dlp:

```bash
# macOS / Linux via pip
pip install yt-dlp

# or via Homebrew
brew install yt-dlp
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/rajaksatyam/rajaksatyam.github.io.git
cd rajaksatyam.github.io

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

#### Backend — `backend/.env`

Create the file by copying the example below. **Never commit this file.**

```env
# Server
PORT=5214
NODE_ENV=development          # development | production | test

# Database
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>

# Auth
JWT_SECRET=<at-least-32-random-characters>
ARGON2_PEPPER=<64-char-hex-string>     # Used to pepper Argon2id hashes

# CORS — must match the frontend origin
CLIENT_URI=http://localhost:5173

# AI
GEMINI_KEY=<your-google-gemini-api-key>

# Instagram cookies (required for Instagram URLs)
# Export your browser cookies for instagram.com as a Netscape cookie file
# and place it at backend/cookies-instagram-com.txt
INSTA_KEY=<optional-instagram-auth-key>
```

> **Note:** The server validates every variable at startup using Zod. If any required variable is absent or malformed, the process exits with a clear error message indicating which field failed.

#### Frontend — `frontend/.env`

```env
# Vite proxies /api/* to this origin in development
VITE_API_BASE_URL=http://localhost:5214
```

### Running the App

**Development (two terminals):**

```bash
# Terminal 1 — backend
cd backend
npm run dev          # tsx watch — auto-restarts on file changes

# Terminal 2 — frontend
cd frontend
npm run dev          # Vite dev server with HMR
```

**Production build:**

```bash
# Backend
cd backend
npm run build        # tsc → dist/
npm start            # node dist/server.js

# Frontend
cd frontend
npm run build        # tsc + vite build → dist/
npm run preview      # local preview of production build
```

### Docker Deployment

The project ships with a `docker-compose.yml` configured for Oracle Cloud Infrastructure (OCI). Secrets are resolved from OCI Vault at container startup, keeping credentials out of the image and environment files entirely.

```bash
# Set required OCI variables before deploying
export OCI_REGISTRY=<your-region>.ocir.io
export OCI_NAMESPACE=<your-tenancy-namespace>

# Pull and start
docker compose up -d
```

**`docker-compose.yml` overview:**

```yaml
services:
  backend:
    image: ${OCI_REGISTRY}/${OCI_NAMESPACE}/backend:latest
    container_name: backend
    restart: unless-stopped
    ports:
      - "5214:5214"
    mem_limit: 600m
    environment:
      - NODE_ENV=production
      - SECRET_OCID_MONGO_URI=ocid1.vaultsecret...
      - SECRET_OCID_JWT_SECRET=ocid1.vaultsecret...
      - SECRET_OCID_CLIENT_URI=ocid1.vaultsecret...
      - SECRET_OCID_ARGON2_PEPPER=ocid1.vaultsecret...
      - SECRET_OCID_GEMINI_KEY=ocid1.vaultsecret...
```

Each `SECRET_OCID_*` variable is the OCID of an OCI Vault secret. The backend resolves them at startup before the server begins accepting requests.

---

## API Reference

All endpoints are prefixed with `/api`. Request/response bodies are JSON. Authenticated routes require a valid `token` cookie (set automatically after sign-in).

### Authentication

Authentication uses `httpOnly`, `SameSite=strict` cookies. Tokens expire after **15 minutes**. Sign-out blacklists the current token so it cannot be reused even before expiry.

---

#### `POST /api/auth/signUp`

Register a new account.

**Request body**

```json
{
  "userName": "alice",
  "email": "alice@example.com",
  "password": "Str0ng@Pass!"
}
```

| Field | Type | Rules |
|---|---|---|
| `userName` | string | 3–10 chars, alphanumeric only |
| `email` | string | Valid email format |
| `password` | string | ≥ 8 chars; must contain uppercase, lowercase, digit, and special character |

**Response `201`**

```json
{
  "msg": "You are Register Successfully.",
  "User": { "userName": "alice" }
}
```

Sets `Set-Cookie: token=<jwt>; HttpOnly; SameSite=Strict`

| Status | Condition |
|---|---|
| `401` | Username or email already exists |
| `400` | Validation error (Zod) |
| `429` | Rate limit exceeded (5 attempts / 15 min) |

---

#### `POST /api/auth/signIn`

Sign in to an existing account.

**Request body**

```json
{
  "userName": "alice",
  "password": "Str0ng@Pass!"
}
```

**Response `200`**

```json
{
  "msg": "User SignIn Sucessfully.",
  "user": { "userName": "alice" }
}
```

Sets `Set-Cookie: token=<jwt>; HttpOnly; SameSite=Strict`

| Status | Condition |
|---|---|
| `401` | Incorrect username or password |
| `429` | Rate limit exceeded (5 attempts / 15 min) |

---

#### `GET /api/auth/signOut`

Invalidate the current session. The JWT is added to a blacklist TTL collection in MongoDB.

**Response `200`**

```json
{ "msg": "LogOut Sucessfully" }
```

Clears the `token` cookie.

---

### Analysis

#### `POST /api/analyze`

Download and analyse a video URL. **Requires authentication.**

**Request body**

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "title": "🎵 Video Title Here",
    "summary": {
      "overview": "2–3 sentence overview of the video content.",
      "keyPoints": [
        "First key point extracted from the video.",
        "Second key point."
      ]
    },
    "transcription": [
      { "timestamp": "00:05", "text": "What was said or shown at this moment." },
      { "timestamp": "01:22", "text": "..." }
    ],
    "verification": {
      "factCheckReport": "Claim X was confirmed by source Y.",
      "verdict": "partially accurate"
    },
    "resources": [
      {
        "platform": "Wikipedia",
        "url": "https://en.wikipedia.org/wiki/...",
        "relevance": "Primary background on the topic discussed."
      }
    ]
  }
}
```

| Field | Type | Description |
|---|---|---|
| `title` | string | Video title with a leading emoji |
| `summary.overview` | string | 2–3 sentence narrative summary |
| `summary.keyPoints` | string[] | Bullet-point highlights |
| `transcription` | object[] | `timestamp` (MM:SS) + `text` pairs |
| `verification.factCheckReport` | string | Narrative fact-check result |
| `verification.verdict` | string | `accurate` \| `inaccurate` \| `partially accurate` |
| `resources` | object[] | `platform`, `url`, `relevance` per entry |

> **Note:** This endpoint triggers a video download followed by a Gemini AI upload. Expect a response time of **20–60 seconds** depending on video length and network conditions. The analysis is saved to the user's history automatically in the background.

| Status | Condition |
|---|---|
| `401` | Missing or invalid JWT cookie |
| `500` | Video download failed or Gemini returned invalid JSON |

---

### History

All history endpoints require authentication. Results are sorted by `createdAt` descending (newest first).

---

#### `GET /api/history?page=<n>`

Retrieve a paginated page of the current user's analysis history.

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | 1-based page number |

**Response `200`**

```json
{
  "success": true,
  "items": [
    {
      "_id": "664f1a2b3c4d5e6f7a8b9c0d",
      "userId": "664e0011223344556677aabb",
      "url": "https://www.youtube.com/watch?v=...",
      "result": { "..." : "..." },
      "createdAt": "2026-05-24T18:30:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 47,
  "hasMore": true
}
```

---

#### `DELETE /api/history/:id`

Delete a single history entry. The entry must belong to the authenticated user.

**Response `200`** — `{ "success": true }`

| Status | Condition |
|---|---|
| `404` | Item not found or does not belong to this user |

---

#### `DELETE /api/history`

Delete **all** history entries for the authenticated user.

**Response `200`** — `{ "success": true }`

---

## Frontend Architecture

### State Management

State is managed with **Zustand** stores.

**`auth.store.ts`** — persisted to `localStorage`

| State | Type | Description |
|---|---|---|
| `userName` | `string \| null` | Currently signed-in user |
| `isAuth` | `boolean` | Whether the user is authenticated |

Actions: `signUp()`, `signIn()`, `signOut()` — each calls the corresponding API and updates state.

**`history.store.ts`** — server-backed, no local persistence

| State | Type | Description |
|---|---|---|
| `items` | `HistoryItemAPI[]` | Loaded history entries |
| `page` | `number` | Last fetched page |
| `hasMore` | `boolean` | Whether more pages exist |
| `loading` | `boolean` | Fetch in progress |
| `initialLoaded` | `boolean` | First page has loaded |
| `query` | `string` | Client-side search filter |

Actions: `loadFirstPage()`, `loadNextPage()`, `remove(id)`, `clear()`, `setQuery(q)`, `filtered()`.

### Infinite Scroll

`HistoryList` mounts an `IntersectionObserver` on an invisible sentinel `<div>` at the bottom of the scrollable list. When the sentinel enters the viewport, `loadNextPage()` is called automatically. The observer is disconnected and reconnected whenever `hasMore` or `loading` changes.

### API Client

`src/api/client.ts` creates a single Axios instance with:

- `baseURL: '/'` — the Vite dev server proxies `/api/*` to the backend
- `withCredentials: true` — ensures the JWT cookie is sent on every request
- A response interceptor that normalises error messages from `err.response.data.msg`

### Routing

| Path | Component | Guard |
|---|---|---|
| `/` | `AuthPage` | Redirect to `/home` if authenticated |
| `/home` | `HomePage` | Redirect to `/` if not authenticated |

---

## Security

| Mechanism | Implementation |
|---|---|
| **Password hashing** | Argon2id via `@node-rs/argon2` with a server-side pepper stored in `ARGON2_PEPPER` |
| **JWT storage** | Tokens stored exclusively in `httpOnly` cookies — inaccessible to JavaScript |
| **Token expiry** | JWTs expire after 15 minutes |
| **Token blacklisting** | On sign-out, the token is persisted to a `tokenBlackList` MongoDB TTL collection; every protected request checks this collection |
| **Security headers** | Helmet sets `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, and other hardening headers |
| **CORS** | Explicit `origin` whitelist (`CLIENT_URI`) with `credentials: true` |
| **Rate limiting** | Auth endpoints: 5 req / 15 min. General limiter (60 req/min) available — enable by uncommenting in `app.ts` |
| **Input validation** | All request bodies validated by Zod schemas before reaching the controller layer |
| **Env validation** | `env.config.ts` validates every environment variable at startup; process exits on missing or malformed values |
| **Request body limit** | `express.json({ limit: '10kb' })` prevents large-payload DoS attacks |
| **Cookie flags** | `SameSite: strict` prevents CSRF; `Secure: true` is set automatically in production |
| **OCI Vault (production)** | All secrets resolved from Oracle Cloud Vault OCIDs at container startup — no plaintext secrets in images or compose files |

---

## Error Handling

All errors flow through the global error handler in `errorHandle.middleware.ts`.

| Error type | HTTP status | Trigger |
|---|---|---|
| `AppError` (operational) | As set by the thrower | Business logic errors (wrong password, item not found, etc.) |
| MongoDB duplicate key (`code 11000`) | `409 Conflict` | Duplicate `userName` or `email` on sign-up |
| Mongoose `CastError` | `400 Bad Request` | Invalid ObjectId or field type |
| `JsonWebTokenError` | `401 Unauthorized` | Malformed token |
| `TokenExpiredError` | `401 Unauthorized` | Expired token |
| Unknown / unhandled | `500 Internal Server Error` | Any uncaught exception |

Stack traces are included in the response body only when `NODE_ENV=development`.

**Error response shape:**

```json
{
  "success": false,
  "message": "Human-readable error message",
  "stack": "Error: ...\n    at ..."
}
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m "feat: add X"`
4. Push to your fork: `git push origin feat/your-feature`
5. Open a Pull Request against `main`

Please ensure:

- All TypeScript compiles without errors (`npm run build` in both `backend/` and `frontend/`)
- New environment variables are added to the Zod schema in `env.config.ts` and documented in the [Environment Variables](#environment-variables) section
- New API endpoints are documented in the [API Reference](#api-reference) section

---

<p align="center">
  Built with Node.js · Express · React · MongoDB · Google Gemini · Oracle Cloud
</p>
