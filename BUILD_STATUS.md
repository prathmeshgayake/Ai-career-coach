# AI Career Coach — Build Status

## Project Overview
AI Career Coach (Track W-PS-2, sponsored by Worcflow) is an evidence-based career intelligence platform for students and junior developers that compares real job/internship requirements against actual GitHub repository code, identifies demonstrated and missing skills, and autonomously reassesses progress on every commit.

## Build Status: ✅ COMPETITION-READY & LIVE (74/74 Tests Passing)

Both frontend and backend are actively running in the local workspace.

- **Frontend**: [http://localhost:5173](http://localhost:5173) (Vite + React 18 + TS — 14/14 Vitest tests passing)
- **Backend**: [http://localhost:3001](http://localhost:3001) (Express + TS + node-cron — 60/60 Jest tests passing)
- **Diagnostics**: [http://localhost:3001/api/v1/health/diagnostics](http://localhost:3001/api/v1/health/diagnostics)
- **Automated Tests**: **74/74 Passed (100%)** across 12 test suites (8 backend, 4 frontend)

---

## Task Checklist & Execution Log

### Phase 1: Architecture & Project Setup ✅
- [x] Workspace structure and unified root runner (`run.bat`, `package.json`, `scripts/dev.js`)
- [x] Backend TypeScript + Express with strict typings
- [x] Frontend React + Vite + TypeScript
- [x] Durable persistence: JsonFileStore (`./server/data/`) + Google FirestoreStore (`firebase-admin`)
- [x] Environment configuration templates (`server/.env.example`)

### Phase 2: Backend Core & Security Hardening ✅
- [x] Express middleware: Helmet, CORS, general & analysis rate limiters
- [x] Request validation schemas via `express-validator`
- [x] Centralized error handling with sanitized client responses
- [x] SSRF Protection: blocks private/loopback/link-local IPv4 & IPv6, validates DNS, limits redirects, bounds response payloads to 5MB
- [x] Internal polling endpoint secured via `x-poll-secret`

### Phase 3: External Integrations & Diagnostics ✅
- [x] GitHub REST API client: repo metadata, recursive git trees, file contents, commit comparison
- [x] GitHub safety bounds: max 50 files, 100KB per file, 500KB total, binary file filtering, zero code execution
- [x] Google Gemini integration (`gemini-1.5-flash`) with structured JSON schema enforcement
- [x] Connection diagnostic engine: distinguishes missing config, verified auth, quota exceeded, model issues, transient errors
- [x] Deterministic heuristic fallback engine with verbatim code snippet extraction
- [x] Transparent engine labeling (`gemini` vs `heuristic_fallback`) saved on every assessment snapshot

### Phase 4: Core Product Features ✅
- [x] Job requirements extraction from live URLs (SSRF-safe) and pasted text
- [x] Repository URL validation endpoint (`POST /api/v1/repositories/validate`) with real GitHub stars, language, and push date
- [x] Evidence validation: server-generated UUIDs, commit-pinned permalinks, anti-fabrication guards, automatic status downgrades
- [x] Strict 4-status taxonomy: `demonstrated`, `partially_demonstrated`, `not_demonstrated_in_scope`, `unable_to_verify`
- [x] Immutable versioning history on every analysis

### Phase 5: Autonomous Server-Side Monitoring (Highest Priority) ✅
- [x] Server-side scheduler running independently of the browser via `node-cron`
- [x] In-memory mutex locking to prevent overlapping poll workers
- [x] Idempotent commit detection: fetches latest SHA, compares with last known SHA
- [x] Changed-file extraction via GitHub compare API
- [x] Reassessment of affected skills and automatic generation of new `AssessmentVersion`
- [x] Fault recovery: retains previous successful version on network/API failure

### Phase 6: Competition-Winning Frontend ✅
- [x] **Executive Landing Page (`/`)**: Value proposition ("Prove your skills with your code, not just your resume"), live system status pill, illustrative interactive preview, 3-step breakdown, privacy & limitations statement, call-to-action
- [x] **Workspace Dashboard (`/dashboard`)**: Real metrics (never fabricated), next recommended action banner, active tracking management, filterable assessments list
- [x] **Guided Assessment Flow (`/new`)**: 3-step wizard with live requirements preview and real repository metadata validation
- [x] **Assessment Report (`/analysis/:id`)**: Status breakdown, engine badge, commit SHA link, grouped skill cards with code evidence, identified gaps & recommended growth actions, monitoring controls
- [x] **Version History Timeline (`/analysis/:id/history`)**: Chronological timeline, changed files diff, commit comparisons
- [x] **Error Boundary**: Catches runtime errors gracefully, eliminating blank white screens

### Phase 7: Verification & Test Suite ✅
- [x] 37 Unit Tests (SSRF, evidence anti-fabrication, job parser, GitHub client, schemas)
- [x] 23 Integration Tests (API endpoints, health diagnostics, repo validation, monitoring scheduler, mutex)
- [x] 14 Frontend Component Tests (StatusBadge, EvidenceCard, MonitoringBadge, SkillCard)
- [x] Total: **74 passed, 0 failed (100%)**
- [x] TypeScript compilation: Clean (0 errors across server and client)
- [x] Production builds: Clean (`server/dist/` and `client/dist/`)

---

## Summary of Active Processes

- Background Process: Node.js Backend Server (`port 3001`, node-cron active)
- Background Process: Vite Frontend Dev Server (`port 5173`, bound to `0.0.0.0`)
