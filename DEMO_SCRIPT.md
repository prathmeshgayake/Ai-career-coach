# AI Career Coach — 5-Minute Competition Demo Script

**Project:** AI Career Coach (W-PS-2)  
**Sponsor:** Worcflow  
**Demo Target Time:** 5 Minutes  

---

## Pre-Demo Checklist

1. Application is running live:
   - Backend: `http://localhost:3001`
   - Frontend: `http://localhost:5173`
2. Browser open at `http://localhost:5173`
3. Have a public test GitHub repo ready: e.g. `https://github.com/octocat/Hello-World` or candidate repository
4. Have sample job description ready on clipboard

---

## Timed Demo Walkthrough (5:00)

### Minute 0:00–0:45 — The Value Proposition (Landing Page: `/`)
- **Visual**: Show the Landing Page at `http://localhost:5173`. Point to the live system engine badge at the top.
- **Narrative**:
  > "Judges, the hardest problem for students and junior developers is proving they can actually write production code, not just list keywords on a resume. AI Career Coach solves this with one central promise: **Prove your skills with your code, not just your resume**."
- **Visual**: Scroll past the illustrative preview card showing verified evidence with commit-pinned line anchors and the 3-step continuous cycle.
- **Action**: Click the primary CTA button **"Analyze My Skills"** (routes to `/new`).

### Minute 0:45–1:45 — Guided 3-Step Setup (`/new`)
- **Step 1 — Job Requirements**:
  - Paste job requirements into the text box (or enter a live job URL):
    ```text
    Requirements:
    - Experience in Python and Node.js backend development
    - Relational database design with PostgreSQL or MySQL
    - RESTful API design with Express or FastAPI
    - Version control with Git and documentation in README
    ```
  - Click **"Preview Requirements"**.
  - *Show judges*: The system safely extracts discrete requirements with SSRF protection and preserves retrieval timestamps.
  - Click **"Next: Repository Setup"**.
- **Step 2 — Repository Validation**:
  - Enter public GitHub URL: `https://github.com/octocat/Hello-World`.
  - Click **"Validate Repository"**.
  - *Show judges*: The system calls the live GitHub API, retrieving real metadata: owner (`octocat`), repository name (`Hello-World`), 3,800+ stars, default branch (`master`), and latest push date.
  - Click **"Next: Run Analysis"**.
- **Step 3 — Analysis Execution**:
  - Review the summary and click **"Run Full Analysis"**.
  - Watch the live 4-stage pipeline:
    1. Fetching repository files via GitHub tree API...
    2. Analyzing code with Gemini AI...
    3. Validating evidence excerpts and generating UUIDs...
    4. Saving immutable assessment version 1...

### Minute 1:45–3:00 — Assessment Report & Verified Evidence (`/analysis/:id`)
- **Visual**: The assessment report loads with the repository header, commit SHA, and version badge.
- **Key Talking Points**:
  - **Engine Transparency**: Point out the engine badge (`Gemini 1.5 Flash` or `Heuristic Rules Engine`). Explain our commitment to honesty—we never pretend a fallback is a live AI call.
  - **Commit SHA Pinned**: Show the commit SHA badge (`7fd1a60`). Every claim is tied to this immutable state of the code.
  - **Strict Status Taxonomy**: Point out the 4 status cards:
    - `Demonstrated` (Green)
    - `Partially Demonstrated` (Amber)
    - `Not Demonstrated In Scope` (Gray)
    - `Unable to Verify` (Blue)
  - **Evidence Integrity**: Expand a demonstrated skill card. Show:
    - Real file path
    - Exact verbatim code excerpt
    - Permalink anchor pointing directly to GitHub at that specific commit SHA
    - Contextual explanation
  - **Honest Gaps & Growth Actions**: Scroll to the *"Skill Gaps & Recommended Growth Actions"* card at the bottom.
    > "Notice we don't assume missing evidence means a student lacks the skill. We classify it as `not_demonstrated_in_scope` and give them a concrete action: 'Add a PostgreSQL query or schema file to prove database skills.'"

### Minute 3:00–4:00 — Continuous Autonomous Monitoring
- **Action**: Click **"Start Monitoring"** on the report header.
- **Visual**: The green pulsing monitoring badge activates: *"Monitoring Active — next poll in 5 min"*.
- **Narrative**:
  > "Here is our core differentiator. This is not a browser timer or a manual refresh. An independent **node-cron worker** runs on the server. If I close this browser right now, the server will continue polling the GitHub commit API every 5 minutes."
- **The Commit Reassessment Story**:
  > "When a developer pushes a new commit containing SQL or Python code:
  > 1. The server detects the new SHA.
  > 2. It compares commits to extract changed files.
  > 3. It reassesses the affected skills.
  > 4. It saves Version 2 without touching or overwriting Version 1.
  > 5. A student can prove their growth over time."

### Minute 4:00–4:30 — Version History Timeline (`/analysis/:id/history`)
- **Action**: Click **"View History"**.
- **Visual**: Show the version timeline with version dots, trigger types (`Initial` vs `Commit Change`), commit SHA badges, and changed file diff lists.
- **Narrative**:
  > "Every assessment version is immutable. Students and recruiters have an undeniable proof-of-work timeline."

### Minute 4:30–5:00 — Workspace Dashboard (`/dashboard`) & Conclusion
- **Action**: Click **"Workspace"** in the top navigation.
- **Visual**: The Workspace Dashboard displays real metrics: Total Analyses, Demonstrated Skills Count, and Active Server Monitoring Status, along with the filterable search table.
- **Closing Statement**:
  > "AI Career Coach replaces guesswork and keyword-stuffed resumes with factual, commit-pinned code evidence and autonomous verification. Thank you, and I welcome your questions!"

---

## Demo Evidence Checklist for Judges

| Evidence Item | Location in App | Verification Method |
|---|---|---|
| Real Job Extraction | `/new` (Step 1) | Shows parsed skills, retrieval method, and timestamp |
| Real GitHub API Metadata | `/new` (Step 2) | Displays live stars, language, default branch from GitHub |
| Verifiable Code Excerpt | `/analysis/:id` | Card with monospace snippet and commit permalink |
| Pinned Commit SHA | Header of `/analysis/:id` | Displays exact 40-char SHA matching GitHub |
| Strict 4-Status Taxonomy | `/analysis/:id` | Status breakdown cards |
| Actionable Gap Advice | Bottom of `/analysis/:id` | "Skill Gaps & Recommended Growth Actions" panel |
| Autonomous Server Poller | Header / Status pill | node-cron scheduler independent of browser |
| Immutable Version History | `/analysis/:id/history` | Timeline showing version increments and triggers |
| Real Metrics Dashboard | `/dashboard` | Computed exclusively from real analysis records |
