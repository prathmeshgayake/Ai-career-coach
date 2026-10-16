# AI Career Coach — 3-Minute Q&A Preparation

## Likely Questions & Prepared Answers

### Q1: "How does the AI assessment work? Is it accurate?"
**A:** We use Google Gemini to analyze the actual source code files from the student's GitHub repository against the job requirements. But we don't just trust the AI — every evidence claim is validated server-side. We check that the file path exists, the code excerpt actually appears in the file, and the GitHub link points to the real commit. If the AI fabricates evidence, it gets rejected and the skill is downgraded. The system also has a heuristic fallback that works without an AI key.

### Q2: "What if the student has skills but they're not in the repo?"
**A:** Great question. We explicitly use the status "not_demonstrated_in_scope" — not "lacks skill." We're transparent that we can only assess what's visible in the inspected files. The assessment always shows the commit SHA that was analyzed so the student knows exactly what was evaluated.

### Q3: "How does monitoring work? Does the browser need to stay open?"
**A:** No. Monitoring uses node-cron on the backend server. It polls GitHub independently of any browser session. When a new commit is detected, it fetches the changed files, reassesses affected skills, and saves a new assessment version. The student can close the browser entirely and come back later to see updated results.

### Q4: "What about security? Are you executing code from repos?"
**A:** Absolutely not. We never execute any code from repositories. We only read file contents through the GitHub API. We also have SSRF protection that blocks private IPs, validates DNS, limits redirects and response sizes. All API keys are server-side only, never exposed to the frontend. Internal endpoints are protected with secret-based authentication.

### Q5: "Can it handle private repositories?"
**A:** The current MVP supports public repositories only. Private repository support would require OAuth integration with GitHub, which is a natural next step. The architecture is designed to support this — we'd just add an OAuth flow and pass the user's token to the GitHub API calls.

### Q6: "How do you handle rate limits?"
**A:** We respect GitHub's rate limits by checking the `X-RateLimit-Remaining` header. Without a token, GitHub allows 60 requests/hour; with a personal access token, it's 5,000/hour. We also bound the number of files we inspect (max 50 files, 100KB each, 500KB total) to be efficient with API calls.

### Q7: "What tech stack did you use?"
**A:** Frontend is React with TypeScript and Vite. Backend is Node.js with Express and TypeScript. We use Google Gemini for AI analysis, the GitHub REST API for repository data, and a flexible data store that works with either local JSON files or Google Firestore. Monitoring uses node-cron for server-side scheduling.

### Q8: "How does the job requirements extraction work?"
**A:** Two methods: URL fetching or pasted text. For URLs, we fetch the page with SSRF protection (blocking internal IPs, limiting redirects), extract the text, and use Gemini to parse structured requirements. For pasted text, we send it directly to Gemini. There's also a heuristic parser as fallback. We always report honestly if a URL is inaccessible.

### Q9: "What happens when reassessment fails?"
**A:** The system preserves the previous successful assessment. It tracks consecutive errors and implements exponential backoff. The last successfully assessed commit SHA is only updated after a fully validated reassessment succeeds. This means students never lose their assessment data due to transient failures.

### Q10: "How is the assessment history useful?"
**A:** Students can track their skill development over time. Each assessment version is immutable and tagged with the trigger (initial analysis or commit change), the commit SHA, and changed files. They can see exactly how pushing specific code improved their demonstrated skills — it's a growth journal backed by real evidence.

### Q11: "What would you do next with more time?"
**A:**
1. **Private repo OAuth** — Full GitHub OAuth flow for private repositories
2. **Multiple repo analysis** — Compare skills across several repositories
3. **Learning recommendations** — Suggest specific resources for gap skills
4. **Team/class dashboards** — Aggregate views for educators
5. **Webhook-based detection** — Replace polling with GitHub webhooks for instant detection
6. **Resume generation** — Auto-generate skill sections from verified evidence

### Q12: "How do you prevent the AI from hallucinating?"
**A:** Multiple layers:
1. We fetch actual files and pass them verbatim — the AI can only cite what we give it
2. Server-side validation checks every evidence item: file must exist, excerpt must be present in the file content, commit SHA must match
3. Evidence IDs are generated server-side (UUID), not by the AI
4. GitHub URLs are constructed server-side pinned to the exact commit
5. If validation fails, the skill status is automatically downgraded
6. We treat all AI output as untrusted and validate against a strict schema

---

## Technical Deep-Dive Answers (if asked)

### "Show me the evidence validation code"
→ See `server/src/services/evidence.ts` — `validateEvidenceItem()` and `validateAndSanitizeAssessments()`

### "Show me the monitoring code"
→ See `server/src/services/monitor.ts` — `MonitorService` class with mutex lock and cron scheduling

### "Show me the SSRF protection"
→ See `server/src/utils/ssrf.ts` — `isPrivateIp()`, `validateUrl()`, and `safeFetch()`

### "How many tests do you have?"
→ 71 total: 37 unit tests + 20 integration tests + 14 frontend component tests. All passing. See `TEST_REPORT.md`.
