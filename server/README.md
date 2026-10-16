# AI Career Coach — Backend Server

A production-grade Node.js/TypeScript/Express backend that compares real job/internship requirements against candidate GitHub repository evidence, validates genuine code excerpts, identifies skill gaps, and automatically reassesses candidates when their repositories are updated.

---

## 🌟 Key Features

1. **Job Requirement Extraction**:
   - Fetches job postings via URL with comprehensive SSRF protection or accepts pasted descriptions.
   - Extracts structured technical skills and requirements using Google Gemini AI with heuristic fallback.

2. **Repository Code Inspection**:
   - Connects to GitHub REST API to inspect metadata, branches, commit trees, and file contents.
   - Strict bounds: up to 50 files, max 100KB per file, 500KB total.
   - Filters out non-source files, binary assets, and lockfiles.

3. **Evidence-Backed Skill Evaluation**:
   - Assesses candidate repository code against extracted job requirements.
   - Strict status classification: `demonstrated`, `partially_demonstrated`, `not_demonstrated_in_scope`, `unable_to_verify`.
   - Server-validated evidence: verifies file paths, verifies exact code excerpts against real file content, generates server UUIDs, and pins permalinks directly to the commit SHA (`https://github.com/:owner/:repo/blob/:commitSha/:filePath#L...`).
   - Anti-hallucination safeguard: strips fabricated code or non-existent files and downgrades unsupported claims.

4. **Continuous Repository Monitoring**:
   - Server-side scheduler powered by `node-cron`.
   - Polls tracked repositories on configurable intervals.
   - Detects commit SHA changes, fetches changed files via GitHub compare API, and triggers automatic reassessment.
   - In-memory mutex prevents overlapping worker executions.
   - Idempotency and duplicate prevention for tracked repositories.
   - Error threshold tracking with fault tolerance (retains previous assessment upon network failure).

5. **Storage Layer**:
   - Default: High-performance `JsonFileStore` persisting locally in `./data/`, enabling instant zero-configuration development and offline testing.
   - Production: `FirestoreStore` powered by Firebase Admin SDK when credentials are configured.

6. **Security & Resilience**:
   - Robust SSRF protection (blocks private IPv4/IPv6, cloud metadata `169.254.169.254`, loopback, max 3 redirects, 10s timeout, 5MB response cap, DNS validation).
   - Helmet HTTP security headers.
   - Granular CORS policies.
   - Rate limiting on public and analysis endpoints.
   - Secret-authenticated internal polling trigger endpoint.
   - Centralized error handling.

---

## 🚀 API Endpoints

| Method | Endpoint | Description | Auth / Limit |
|---|---|---|---|
| `GET` | `/api/v1/health` | Health check, uptime, and integration status | Public |
| `POST` | `/api/v1/jobs/preview` | Preview extracted job skills from URL or text | Rate-limited |
| `POST` | `/api/v1/analyses` | Run full analysis comparing repo to job | Rate-limited (30/15m) |
| `GET` | `/api/v1/analyses` | List all historical analyses | Public |
| `GET` | `/api/v1/analyses/:id` | Get analysis details and latest assessment | Public |
| `GET` | `/api/v1/analyses/:id/history` | Get all assessment versions for an analysis | Public |
| `DELETE` | `/api/v1/analyses/:id` | Delete analysis and stop associated monitoring | Public |
| `POST` | `/api/v1/tracked-repositories` | Start continuous monitoring for an analysis | Public |
| `GET` | `/api/v1/tracked-repositories/:id/status` | Get monitoring status and poll run history | Public |
| `POST` | `/api/v1/tracked-repositories/:id/stop` | Stop monitoring a repository | Public |
| `POST` | `/api/v1/internal/poll` | Trigger manual or webhook poll cycle | Protected (`x-poll-secret`) |

---

## 🛠️ Environment Configuration

Copy `.env.example` to `.env` and fill in optional variables:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP Server port | `3001` |
| `NODE_ENV` | Environment (`development`, `production`, `test`) | `development` |
| `GEMINI_API_KEY` | Google Gemini API Key | *(Optional, falls back to heuristic engine)* |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | *(Optional, falls back to JSON file store)* |
| `FIREBASE_CLIENT_EMAIL`| Firebase Client Email | *(Optional)* |
| `FIREBASE_PRIVATE_KEY` | Firebase Service Account Private Key | *(Optional)* |
| `GITHUB_TOKEN` | GitHub Personal Access Token (for higher API rate limit) | *(Optional)* |
| `POLL_INTERVAL_MINUTES`| Polling interval in minutes | `5` |
| `POLL_SECRET` | Secret token to authenticate `/api/v1/internal/poll` | `dev_poll_secret_12345` |
| `ALLOWED_ORIGINS` | Permitted CORS origins | `http://localhost:5173,http://localhost:3000` |

---

## 🧪 Running Tests & Development

```bash
# Install dependencies
npm install

# Start development server with hot-reload
npm run dev

# Run unit and integration test suite
npm test

# Run TypeScript type check
npm run lint

# Build for production
npm run build

# Start production build
npm start
```
