# 🚀 AI Career Coach — Production-Grade SaaS Platform

> **An AI-powered career accelerator that bridges the gap between students' GitHub codebases and real-world job requirements using Google Gemini AI, verified evidence extraction, visual analytics, continuous Git monitoring, and personalized career action plans.**

---

## 📑 Table of Contents

- [Overview & Problem Statement](#-overview--problem-statement)
- [System Architecture](#-system-architecture)
- [Core Features](#-core-features)
  - [1. Production Authentication & Multi-Tenancy](#1-production-authentication--multi-tenancy)
  - [2. Job Input & Curated Sample Library](#2-job-input--curated-sample-library)
  - [3. Evidence-Backed AI Skill Gap Analysis](#3-evidence-backed-ai-skill-gap-analysis)
  - [4. Interactive Visual Analytics & Charts](#4-interactive-visual-analytics--charts)
  - [5. Personalized 3-Phase Career Action Plan](#5-personalized-3-phase-career-action-plan)
  - [6. Autonomous Continuous Repository Monitoring](#6-autonomous-continuous-repository-monitoring)
- [User Journey Workflow](#-user-journey-workflow)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [API Reference](#-api-reference)
- [Database Schema & Multi-Tenancy](#-database-schema--multi-tenancy)
- [Installation & Quick Start](#-installation--quick-start)
- [Running Automated Tests](#-running-automated-tests)
- [Production Deployment Guide](#-production-deployment-guide)
- [Security & Quality Standards](#-security--quality-standards)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview & Problem Statement

Most students and early-career software engineers struggle to know whether their portfolio repositories genuinely demonstrate what hiring managers and automated applicant tracking systems (ATS) look for. Résumés claim skills like *"TypeScript"*, *"REST APIs"*, *"Docker"*, or *"Jest"*, but candidates lack proof.

**AI Career Coach** solves this:
1. **Parses Target Job Descriptions**: Extracts hard engineering requirements from any URL or pasted text.
2. **Audits Actual GitHub Repositories**: Fetches relevant source code files, filtering out boilerplate and binaries.
3. **Validates Concrete Evidence**: Gemini AI analyzes code excerpts; our server-side engine validates file paths, commit SHAs, and permalinks before granting credit.
4. **Delivers Visual Analytics & Action Plans**: Visual donut charts, skill-by-skill coverage bars, prioritized recommendations, and a phased weekly checklist roadmap.
5. **Auto-Reassesses on Git Commit**: A background cron engine watches the student's repository and recalculates their skill match automatically whenever they push new code.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 18 + Vite + TypeScript)"]
        UI["Modern Responsive UI / SaaS Portal"]
        AuthContext["AuthContext (JWT + Session State)"]
        Routes["React Router (Protected Routes + Public)"]
        Charts["Recharts Visual Analytics (Donut, Bar, Progress)"]
        ActionPlanUI["Interactive Action Plan Checklist"]
    end

    subgraph Server ["Server Layer (Node.js + Express + TypeScript)"]
        AuthMiddleware["JWT & Multi-Tenant Auth Middleware"]
        RateLimiter["Rate Limiters (General + Analysis)"]
        
        subgraph Services ["Core Engine Services"]
            Analyzer["Analyzer Service (Orchestrator + 7-Stage Profiler)"]
            Gemini["Gemini AI Service (Model: gemini-1.5-flash / gemini-2.0-flash)"]
            GitHub["GitHub API Client (SSRF Safe, Concurrency-limited)"]
            EvidenceVal["Evidence Validator (SHA Permalinks + Code Matching)"]
            JobExtractor["Job Extractor (Cheerio + URL Fetch + SSRF Filter)"]
            ActionPlanSvc["Action Plan Generator (Phased Roadmap)"]
            MonitorSvc["Autonomous Monitor Service (node-cron @ 5-min intervals)"]
        end
    end

    subgraph Data ["Data Layer (Dual Support)"]
        Firestore["Google Cloud Firestore (Production)"]
        JsonStore["Local JSON File Store (Development & Testing)"]
    end

    subgraph External ["External Integrations"]
        GeminiAPI["Google AI Studio (Gemini 1.5/2.0 API)"]
        GitHubAPI["GitHub REST API (Public Repositories)"]
    end

    Client -->|REST API + Bearer JWT| Server
    Server --> Services
    Services --> Data
    Gemini --> GeminiAPI
    GitHub --> GitHubAPI
    MonitorSvc -.->|Polls every 5 min| GitHubAPI
```

---

## ✨ Core Features

### 1. Production Authentication & Multi-Tenancy
- **Real User Registration (`/signup`)**: Name, Email, Password, Target Role, and GitHub Username.
- **Bcrypt Password Hashing**: Passwords are salted and hashed (10 rounds) before persistence.
- **JWT Authentication**: Secure 7-day tokens transmitted via `Authorization: Bearer <token>`.
- **Protected Routes**: Unauthenticated users visiting `/dashboard`, `/new`, or `/analysis/:id` are redirected to `/login`.
- **Data Isolation**: Every user record, analysis, tracked repo, and action plan is strictly authorized by verified `userId`.
- **Truthful Empty State**: Brand new accounts start with a clean slate (0 fake metrics, 0 fabricated demo rows).

### 2. Job Input & Curated Sample Library
- **Three Ways to Enter Jobs**:
  1. **One-Click Curated Sample Jobs**: Pre-verified internships for Frontend Developer Intern, Backend Developer Intern, and Full-Stack Developer Intern.
  2. **Job Posting URL Fetch**: SSRF-protected HTTP retrieval and parsing of public company career postings.
  3. **Direct Paste**: Paste any custom job description text directly.
- **Interactive Requirement Preview**: Extracted requirements are reviewed and confirmed before launching analysis.

### 3. Evidence-Backed AI Skill Gap Analysis
- **7-Stage Server-Side Profiler**: Logs exact stage durations for job retrieval, requirement extraction, GitHub retrieval, evidence selection, LLM inference, evidence validation, and DB persistence.
- **Strict Evidence Validation**: Every claimed skill requires:
  - Repository file path.
  - Verifiable code excerpt.
  - Pinned commit SHA.
  - Clickable GitHub permalink (`https://github.com/owner/repo/blob/<sha>/path#L...`).
- **Four Standard Assessment Statuses**:
  - `demonstrated`: Clear, cited code evidence found.
  - `partially_demonstrated`: Peripheral evidence or incomplete implementation.
  - `not_demonstrated_in_scope`: Not found in inspected files (does not claim absence).
  - `unable_to_verify`: Non-code credentials or outside repository scope.

### 4. Interactive Visual Analytics & Charts
- **Skill Match Donut Chart (`SkillMatchChart.tsx`)**: Recharts-powered distribution of Demonstrated vs Partially Demonstrated vs Not in Scope with center percentage score.
- **Coverage & Gap Breakdown (`CoverageGapChart.tsx`)**: Horizontal bars showing requirement-level coverage with expandable code evidence view.
- **Progress Over Time (`ProgressChart.tsx`)**: Line chart illustrating match score changes across sequential Git commits.
- **Prioritized Recommendations (`RecommendationsPanel.tsx`)**: High, Medium, and Low priority action items linked directly to detected skill gaps.

### 5. Personalized 3-Phase Career Action Plan
- **Dynamically Generated Roadmap (`PersonalizedActionPlan.tsx`)**:
  - **Phase 1: Urgent Skill Gaps (Weeks 1 – 2)**: Core missing skills (Unit testing, Docker, DB models, API validation).
  - **Phase 2: Depth & CI/CD (Weeks 3 – 4)**: Edge case handling, TypeScript strictness, GitHub Actions automation.
  - **Phase 3: Portfolio & Interview Readiness (Week 5+)**: README architecture documentation, STAR method interview talking points.
- **Interactive Checklists**: Checkboxes persist state per student in `localStorage`, calculating real-time phase completion %.

### 6. Autonomous Continuous Repository Monitoring
- **Server-Side Node-Cron Scheduler**: Runs continuously in the background on the server (independent of browser window state).
- **Commit Change Detection**: Periodically polls GitHub for the latest commit SHA.
- **Automatic Reassessment**: When a new commit is detected, only affected files and skills are re-evaluated, appending a new immutable version to the history.

---

## 🔄 User Journey Workflow

```text
[ 1. Sign Up / Sign In ]
       │
       ▼
[ 2. Student Dashboard ] ──── (Fresh account: 0 analyses, Clean empty state)
       │
       ▼ Click "New Assessment"
[ 3. New Analysis Page ]
       ├─ Choose a Curated Sample Job OR Paste Job URL / Text
       ├─ Enter Public GitHub Repository URL
       └─ Click "Validate & Analyze"
       │
       ▼ AI Engine runs 7-stage evidence-backed pipeline
[ 4. Detailed Analysis Report ]
       ├─ Donut Chart (% Verified Match)
       ├─ Evidence Cards with verified GitHub code permalinks
       ├─ Prioritized Actionable Recommendations
       └─ Click "Start Monitoring"
       │
       ▼ Background server scheduler activated
[ 5. Student Pushes Commit to GitHub ]
       │
       ▼ Server detects SHA change within 5 minutes
[ 6. Automatic Skill Reassessment ]
       ├─ New Assessment Version created (v2, v3...)
       ├─ Progress-over-time trend updated
       └─ Action Plan updates automatically on Dashboard
```

---

## 💻 Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Routing**: React Router v6 (Protected routes, redirect handling)
- **Visual Analytics**: Recharts (Donut, Line, and Bar charts)
- **Icons**: Lucide React
- **HTTP Client**: Axios with JWT Bearer request interceptors
- **Testing**: Vitest + React Testing Library

### Backend
- **Runtime**: Node.js v20+ with TypeScript
- **Web Framework**: Express.js with Helmet security headers and CORS
- **AI Engine**: `@google/generative-ai` (Gemini 1.5 Flash / Gemini 2.0 Flash)
- **Authentication**: `jsonwebtoken` (JWT) + `bcryptjs` (Password hashing)
- **Database**: Dual Store:
  - Google Cloud Firestore (`firebase-admin`)
  - Local JSON Store (`JsonFileStore` for zero-setup dev & offline tests)
- **Automation / Scheduler**: `node-cron` (Continuous 5-minute background polling)
- **Web Scraping & SSRF Defense**: Cheerio, Axios, Custom DNS resolution validator
- **Testing**: Jest + Supertest (67 unit & integration tests)

---

## 📁 Project Directory Structure

```text
Abhimanyu/
├── client/                                 # Frontend React Application
│   ├── src/
│   │   ├── api/client.ts                   # Axios client with JWT & multi-tenant interceptors
│   │   ├── context/AuthContext.tsx         # User session, login, signup & logout state
│   │   ├── components/                     # Reusable UI & Visual Components
│   │   │   ├── Header.tsx                  # Navbar with Auth buttons & StudentSwitcher
│   │   │   ├── ProtectedRoute.tsx          # Route guard redirecting unauthenticated users
│   │   │   ├── SkillMatchChart.tsx         # Donut chart for skill demonstration %
│   │   │   ├── CoverageGapChart.tsx        # Horizontal bar breakdown with code viewer
│   │   │   ├── ProgressChart.tsx           # Line chart for commit-over-commit progress
│   │   │   ├── RecommendationsPanel.tsx    # Prioritized actionable recommendations
│   │   │   ├── PersonalizedActionPlan.tsx  # 3-phase interactive career action plan
│   │   │   ├── StudentSwitcher.tsx         # Account switcher for testing & demo access
│   │   │   ├── SkillCard.tsx               # Individual requirement assessment card
│   │   │   ├── EvidenceCard.tsx            # Code excerpt & GitHub permalink card
│   │   │   ├── StatusBadge.tsx             # Demonstrated / Gap status badges
│   │   │   ├── MonitoringBadge.tsx         # Background polling status badge
│   │   │   ├── LoadingSpinner.tsx          # Accessible loader
│   │   │   └── ErrorBoundary.tsx           # React crash error boundary
│   │   ├── pages/                          # Application Route Pages
│   │   │   ├── LandingPage.tsx             # Public landing & feature introduction
│   │   │   ├── LoginPage.tsx               # Production login with demo sandbox
│   │   │   ├── SignupPage.tsx              # Student registration with target roles
│   │   │   ├── DashboardPage.tsx           # Personalized multi-tenant dashboard
│   │   │   ├── NewAnalysisPage.tsx         # Analysis launcher with sample jobs library
│   │   │   ├── AnalysisDetailPage.tsx      # Comprehensive report & charts view
│   │   │   ├── HistoryPage.tsx             # Version-by-version commit history
│   │   │   └── NotFoundPage.tsx            # 404 handler
│   │   ├── types/index.ts                  # Shared TypeScript interfaces
│   │   └── App.tsx                         # Route configuration & AuthProvider
│   ├── package.json
│   └── vite.config.ts
│
├── server/                                 # Backend Express Application
│   ├── src/
│   │   ├── config/index.ts                 # Environment variables & Firebase auto-detect
│   │   ├── data/
│   │   │   ├── sampleJobs.ts               # Verified public curated intern jobs
│   │   │   └── students.ts                 # Preconfigured student demo profiles
│   │   ├── db/                             # Data Access Layer
│   │   │   ├── store.ts                    # DataStore interface & JsonFileStore
│   │   │   ├── firestore.ts                # Google Cloud Firestore implementation
│   │   │   ├── analysisStore.ts            # Analyses & assessment versions store
│   │   │   ├── trackingStore.ts            # Repository monitoring tracking store
│   │   │   ├── userStore.ts                # User registration & profile store
│   │   │   └── pollStore.ts                # Background poll run logs store
│   │   ├── middleware/                     # Express Middlewares
│   │   │   ├── auth.ts                     # JWT verification & multi-tenant resolver
│   │   │   ├── errorHandler.ts             # Central sanitized error handler
│   │   │   ├── rateLimiter.ts              # IP-based rate limiting
│   │   │   ├── pollAuth.ts                 # Secret auth for internal polling trigger
│   │   │   └── validation.ts               # Input validation schemas (express-validator)
│   │   ├── models/types.ts                 # Server domain data models
│   │   ├── routes/                         # API Route Controllers
│   │   │   ├── auth.ts                     # Signup, login, logout, me, action-plan
│   │   │   ├── analyses.ts                 # CRUD for analyses & history
│   │   │   ├── jobs.ts                     # Job preview & sample jobs library
│   │   │   ├── repositories.ts             # Repo metadata & file inspection
│   │   │   ├── trackedRepos.ts             # Start, stop, and inspect monitoring
│   │   │   ├── health.ts                   # Health check & diagnostics
│   │   │   └── internal.ts                 # Cron trigger endpoint
│   │   ├── services/                       # Business Logic Layer
│   │   │   ├── analyzer.ts                 # Pipeline orchestrator with 7-stage profiler
│   │   │   ├── gemini.ts                   # Google Gemini AI prompts & parsing
│   │   │   ├── github.ts                   # GitHub API wrapper with concurrency limits
│   │   │   ├── evidence.ts                 # Code matching & permalink validator
│   │   │   ├── jobExtractor.ts             # URL fetcher with SSRF defense
│   │   │   ├── actionPlan.ts               # Personalized action plan generator
│   │   │   ├── recommendations.ts          # Prioritized recommendation engine
│   │   │   ├── monitor.ts                  # Background polling coordinator
│   │   │   └── cache.ts                    # Multi-layer caching service
│   │   └── utils/
│   │       ├── ssrf.ts                     # IP validation & private subnet blocker
│   │       ├── sanitize.ts                 # HTML & input sanitization
│   │       └── id.ts                       # UUID generation
│   ├── tests/                              # Automated Test Suites
│   │   ├── unit/                           # Analyzer, Gemini, GitHub, Jobs tests
│   │   └── integration/                    # API, Monitoring, Pipeline tests
│   ├── package.json
│   └── tsconfig.json
│
├── BUILD_STATUS.md
├── TEST_REPORT.md
└── README.md
```

---

## 📡 API Reference

All API routes are prefixed with `/api/v1`.

### Authentication & Users
| Method | Endpoint | Auth Required | Description |
|:---|:---|:---:|:---|
| `POST` | `/auth/signup` | No | Register new user with hashed password & receive JWT |
| `POST` | `/auth/login` | No | Authenticate with email/password & receive JWT |
| `POST` | `/auth/logout` | No | Clear user session |
| `GET` | `/auth/me` | Yes (`Bearer <token>`) | Return authenticated user profile |
| `GET` | `/auth/action-plan` | Yes (`Bearer <token>`) | Generate personalized 3-phase action plan |
| `GET` | `/auth/students` | No | List registered students and test accounts |
| `POST` | `/auth/switch` | No | Switch active testing profile |

### Jobs & Samples
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/jobs/samples` | List curated public intern roles |
| `GET` | `/jobs/samples/:id` | Get specific curated job details |
| `POST` | `/jobs/preview` | Preview extracted requirements from URL or pasted text |

### Repository Validation & Analysis
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/repositories/validate` | Validate repository existence and fetch metadata |
| `POST` | `/analyses` | Run full evidence-backed analysis for job + repo |
| `GET` | `/analyses` | List all analyses for authenticated user |
| `GET` | `/analyses/:id` | Get analysis details with latest assessment version |
| `GET` | `/analyses/:id/history` | Get all version revisions for an analysis |
| `DELETE` | `/analyses/:id` | Delete analysis and stop associated monitoring |

### Continuous Monitoring
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/tracked-repositories` | Start monitoring repository on 5-min server cron |
| `GET` | `/tracked-repositories` | List active monitored repositories for user |
| `GET` | `/tracked-repositories/:id/status` | Get monitoring status and recent poll logs |
| `POST` | `/tracked-repositories/:id/stop` | Stop monitoring repository |
| `POST` | `/internal/poll` | Internal trigger (requires `x-poll-secret`) |

### System Health
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/health` | System uptime, Gemini status, and DB status |
| `GET` | `/health/diagnostics` | In-depth diagnostic report for all integrations |

---

## 💾 Database Schema & Multi-Tenancy

The application operates seamlessly with **Google Cloud Firestore** in production, with transparent fallback to **JsonFileStore** for local zero-dependency testing.

### Collections:

1. **`users`**:
   - `id`: string (UUID)
   - `name`: string
   - `email`: string (unique, indexed)
   - `passwordHash`: string (bcrypt salted hash)
   - `role`: string (e.g., "Full Stack Developer")
   - `targetRoles`: string[] (e.g., `["Backend Developer Intern", "Cloud Systems"]`)
   - `githubUsername`: string
   - `bio`: string
   - `createdAt` / `updatedAt`: ISO timestamp strings

2. **`analyses`**:
   - `id`: string (UUID)
   - `userId`: string (foreign key to `users.id`, multi-tenant isolated)
   - `jobSource`: `{ url, requirements: string[], retrievalMethod, fetchedAt }`
   - `repositoryUrl` / `repositoryOwner` / `repositoryName`: string
   - `currentVersion`: number (1, 2, 3...)
   - `latestCommitSha`: string
   - `status`: `'pending' | 'analyzing' | 'completed' | 'failed'`

3. **`assessments`** (Subcollection or Linked):
   - `id`: string (UUID)
   - `analysisId`: string
   - `version`: number
   - `commitSha`: string
   - `assessments`: Array of `{ skillName, status, reasoning, evidence: [{ filePath, excerpt, commitSha, githubUrl, explanation }] }`
   - `recommendations`: Array of `{ skillName, priority, actionTitle, explanation, suggestedTask }`
   - `stageDurations`: Profiling object with millisecond breakdowns

4. **`tracked_repos`**:
   - `id`: string (UUID)
   - `userId`: string
   - `analysisId`: string
   - `status`: `'active' | 'stopped' | 'error'`
   - `lastKnownSha`: string
   - `pollIntervalMinutes`: number (default: 5)

---

## ⚡ Installation & Quick Start

### Prerequisites
- **Node.js** v18+ (tested on v20.16.0)
- **npm** v9+
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)
- Optional: A **GitHub Personal Access Token** (increases API rate limits from 60 to 5,000 req/hr)
- Optional: A **Firebase Service Account** (auto-detected if `firebase-key.json` exists in project root)

### Step 1: Install Dependencies
```bash
# 1. Install Backend Dependencies
cd server
npm install

# 2. Install Frontend Dependencies
cd ../client
npm install
```

### Step 2: Environment Configuration
Create `server/.env`:
```env
PORT=3001
NODE_ENV=development

# Google Gemini API Key (Required for AI analysis)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# GitHub Token (Optional, recommended for rate limits)
GITHUB_TOKEN=your_github_personal_access_token_here

# JWT Secret for Session Authentication (Required in production)
JWT_SECRET=your_super_secret_jwt_key_here

# Internal Polling Cron Secret
POLL_SECRET=your_internal_poll_secret_here
POLL_INTERVAL_MINUTES=5

# Allowed CORS Origins
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Firebase Firestore (Optional - auto-falls back to local JSON store if omitted)
# FIREBASE_PROJECT_ID=ai-career-coach-xxxxx
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### Step 3: Run the Development Servers

#### Terminal 1 (Backend Server):
```bash
cd server
npm run dev
# Server starts at http://localhost:3001
```

#### Terminal 2 (Frontend Client):
```bash
cd client
npm run dev
# Client starts at http://localhost:5173
```

---

## 🧪 Running Automated Tests

The application includes a comprehensive test suite of **82 tests** across both backend and frontend:

```bash
# Run Server Tests (67 tests across 10 test suites via Jest)
cd server
npm test

# Run Client Tests (15 tests across 5 test suites via Vitest)
cd client
npm test
```

### Test Coverage Highlights:
- **Unit Tests**: GitHub API parser, Job requirement extractor, SSRF filter, Gemini prompt encoder, Cache service, Recommendations engine.
- **Integration Tests**: Full end-to-end analysis pipeline, Multi-tenant authentication, Password hashing, Commit reassessment, 5-minute background monitoring scheduler.

---

## 🌐 Production Deployment Guide

### Option A: Standard Node.js Production Build
```bash
# Build backend
cd server
npm run build

# Build frontend
cd ../client
npm run build

# Start production server (serves API and background scheduler)
cd ../server
NODE_ENV=production node dist/src/index.js
```

### Option B: Cloud Deployment (Render / Railway / AWS / GCP)
1. Set the Root Directory to the repository root.
2. Provide Environment Variables:
   - `GEMINI_API_KEY`
   - `JWT_SECRET`
   - `POLL_SECRET`
   - `NODE_ENV=production`
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (or mount `firebase-key.json`)
3. The Express server in production automatically serves the static Vite build from `client/dist`.

---

## 🔒 Security & Quality Standards

- **Zero Hardcoded Secrets**: All keys, passwords, and tokens are read strictly from environment variables.
- **SSRF Defense**: Outbound URL fetching performs DNS pre-resolution and blocks RFC-1918 private subnets, loopbacks (`127.0.0.1`), metadata IP (`169.254.169.254`), and non-HTTP protocols.
- **Rate Limiting**: `express-rate-limit` prevents brute-force attempts on auth and analysis endpoints.
- **Bcrypt Security**: Passwords hashed with standard 10 salt rounds.
- **Sanitized Error Responses**: Internal database errors, stack traces, and API keys are never leaked to client responses.

---

## ❓ Troubleshooting

| Symptom | Cause | Resolution |
|:---|:---|:---|
| `GEMINI_API_KEY is not configured` | Missing env variable in `server/.env` | Add `GEMINI_API_KEY=AIza...` in `server/.env` |
| `GitHub API rate limit exceeded` | Unauthenticated GitHub requests hit 60/hr limit | Add `GITHUB_TOKEN=ghp_...` in `server/.env` to get 5,000 req/hr |
| `Invalid email or password` | Incorrect login credentials | Check your email/password or use `/signup` to register |
| `CORS Error` | Request origin not allowed | Add your frontend URL to `ALLOWED_ORIGINS` in `server/.env` |
| `Monitoring not reassessing` | No new commit pushed or interval not elapsed | Verify repository has a new commit SHA; polling runs every 5 min |

---

## 📄 License

This project is licensed under the MIT License.
