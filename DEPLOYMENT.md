# AI Career Coach — Cloud Deployment Guide

This guide details how to deploy the **AI Career Coach** so anyone (hackathon judges, recruiters, users) can access it online via a public URL.

---

## Architecture Overview

* **Frontend**: React 18 + Vite + TypeScript (Single Page Application)
* **Backend API**: Node.js 20 + Express + TypeScript (`0.0.0.0:${PORT}`)
* **Continuous Monitor**: Autonomous background polling scheduler (`node-cron`)
* **Live Static Serving**: In production, the Express backend automatically serves the compiled `client/dist/` bundle on the same domain and port, eliminating all CORS issues.

---

## Method 1: Deploy on Vercel (Frontend) + Render (Backend) ⭐ Recommended

This is the standard, 100% free architecture used by major web applications.

### Step 1: Deploy the Backend to Render (2 minutes)
1. Push your repository to GitHub.
2. Sign in to [render.com](https://render.com) (free).
3. Click **New +** → **Web Service**.
4. Connect your GitHub repository.
5. Fill in the settings:
   * **Name**: `ai-career-coach-api`
   * **Region**: Oregon (or nearest to you)
   * **Branch**: `main`
   * **Root Directory**: Leave blank (uses repo root)
   * **Runtime**: `Node`
   * **Build Command**: `npm run build`
   * **Start Command**: `npm start`
   * **Instance Type**: `Free`
6. Under **Environment Variables**, add:
   * `NODE_ENV` = `production`
   * `ALLOWED_ORIGINS` = `*`
   * `GITHUB_TOKEN` = `ghp_your_token_here` (from your `server/.env`)
   * `GEMINI_API_KEY` = `your_gemini_api_key_here` (optional, for Gemini AI)
7. Click **Deploy Web Service**.
8. Render will provide a free HTTPS URL, for example: `https://ai-career-coach-api.onrender.com`.

### Step 2: Deploy the Frontend to Vercel (1 minute)
1. Sign in to [vercel.com](https://vercel.com) (free).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository.
4. In the configuration screen:
   * **Framework Preset**: `Vite`
   * **Root Directory**: Click `Edit` and select `client`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   * `VITE_API_URL` = `https://ai-career-coach-api.onrender.com` *(your Render backend URL from Step 1)*
6. Click **Deploy**.
7. Vercel will deploy your site in ~30 seconds and give you a fast, global URL: `https://ai-career-coach.vercel.app`!

---

## Method 2: Single-Service Full Stack on Render (Simplest 1-Click)

The Express server serves both the React UI and API from a single domain.

1. Sign in to [render.com](https://render.com).
2. Click **New +** → **Blueprint** and connect your repo (Render reads `render.yaml` automatically).
   * **OR** click **New +** → **Web Service**:
     - **Build Command**: `npm run build`
     - **Start Command**: `npm start`
3. Add environment variables:
   * `NODE_ENV` = `production`
   * `ALLOWED_ORIGINS` = `*`
   * `GITHUB_TOKEN` = `ghp_your_token_here`
4. Click **Create Web Service**. Both your UI and API will run on a single Render URL!

---

## Method 3: Deploy with Docker (Any Cloud Host)

For deployment to Railway, Fly.io, DigitalOcean, AWS, or Azure:

```bash
# Build the production Docker image
docker build -t ai-career-coach .

# Run the container locally or on your cloud VPS
docker run -d -p 3001:3001 \
  -e NODE_ENV=production \
  -e GITHUB_TOKEN=your_token_here \
  -e GEMINI_API_KEY=your_key_here \
  ai-career-coach
```

---

## Production Health & Verification Checklist

Once deployed to your public URL:
* Visit `https://<your-domain>/api/v1/health` → should return `{"status":"ok"}`.
* Visit `https://<your-domain>/api/v1/health/diagnostics` → should show active GitHub token and scheduler.
* Visit `https://<your-domain>/` → should render the clean landing page.
* Test `/new` → paste a job description and public GitHub repo to verify end-to-end evidence generation.
