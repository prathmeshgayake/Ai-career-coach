export interface SampleJob {
  id: string;
  title: string;
  company: string;
  category: 'frontend' | 'backend' | 'fullstack';
  sourceUrl: string;
  isLivePosting: boolean;
  verificationStatus: 'verified_active' | 'practice_sample' | 'expired';
  lastVerifiedAt: string;
  summary: string;
  description: string;
  requirements: string[];
}

export const SAMPLE_JOBS: SampleJob[] = [
  {
    id: 'frontend-developer-intern',
    title: 'Frontend Developer Intern',
    company: 'Mozilla Foundation',
    category: 'frontend',
    sourceUrl: 'https://careers.mozilla.org/listings/',
    isLivePosting: false,
    verificationStatus: 'practice_sample',
    lastVerifiedAt: '2026-10-15T00:00:00.000Z',
    summary: 'Curated practice job spec based on modern open-source frontend engineering internships.',
    description: `Frontend Developer Intern - Web Platform & Community Tools
Location: Remote (Global)
Company: Mozilla Foundation

About the Role:
We are looking for an enthusiastic Frontend Developer Intern to join our web platform team. You will build accessible, responsive user interfaces and collaborate with our open-source developer community.

Key Responsibilities:
- Develop modern, responsive UI components using React, TypeScript, and standard Web APIs.
- Collaborate with design and product teams using Figma and GitHub Pull Requests.
- Write modular, semantic HTML and CSS with attention to accessibility (a11y) and performance.
- Write automated unit and integration tests using Vitest, Jest, and React Testing Library.
- Diagnose and resolve cross-browser rendering and layout bugs.

Requirements & Qualifications:
- Proficiency in modern JavaScript (ES2022+) and React (hooks, component lifecycle, state management).
- Experience with TypeScript for static typing and interface design.
- Solid understanding of HTML5 semantic elements and CSS3 (Flexbox, Grid, CSS variables).
- Experience with Git and GitHub (branches, commits, pull requests, issue tracking).
- Familiarity with automated frontend testing frameworks (Jest, Vitest, or Testing Library).
- Familiarity with modern frontend build tools (Vite, Webpack, or npm scripts).`,
    requirements: [
      'Proficiency in modern JavaScript (ES2022+) and React (hooks, component lifecycle, state management)',
      'Experience with TypeScript for static typing and interface design',
      'Solid understanding of HTML5 semantic elements and CSS3 (Flexbox, Grid, CSS variables)',
      'Experience with Git and GitHub (branches, commits, pull requests, issue tracking)',
      'Familiarity with automated frontend testing frameworks (Jest, Vitest, or Testing Library)',
      'Familiarity with modern frontend build tools (Vite, Webpack, or npm scripts)',
    ],
  },
  {
    id: 'backend-developer-intern',
    title: 'Backend Developer Intern',
    company: 'Open Source Web Services',
    category: 'backend',
    sourceUrl: 'https://github.com/nodejs/node',
    isLivePosting: false,
    verificationStatus: 'practice_sample',
    lastVerifiedAt: '2026-10-15T00:00:00.000Z',
    summary: 'Curated practice job spec covering scalable RESTful APIs, databases, and microservices.',
    description: `Backend Developer Intern - Cloud API Platform
Location: Remote
Company: Open Source Web Services

About the Role:
Join our backend engineering team building robust microservices and developer APIs. You will work on database modeling, authentication, REST endpoint design, and asynchronous background processing.

Key Responsibilities:
- Design, implement, and maintain RESTful API endpoints using Node.js and Express or Python.
- Integrate with relational (PostgreSQL, SQLite) and document-oriented databases.
- Write clean, testable code with comprehensive unit and integration test coverage.
- Implement secure authentication, authorization, and input validation middlewares.
- Participate in GitHub code reviews, continuous integration (CI) workflows, and technical discussions.

Requirements & Qualifications:
- Experience building backend REST APIs using Node.js, Express, or TypeScript.
- Working knowledge of relational or document databases (PostgreSQL, SQLite, MongoDB, or Firestore).
- Understanding of asynchronous programming, promises, async/await, and error handling patterns.
- Experience writing backend unit and integration tests (Jest, Mocha, Supertest).
- Proficiency with Git version control, branch management, and collaborative GitHub workflows.
- Basic understanding of containerization concepts (Docker) and CI/CD pipelines.`,
    requirements: [
      'Experience building backend REST APIs using Node.js, Express, or TypeScript',
      'Working knowledge of relational or document databases (PostgreSQL, SQLite, MongoDB, or Firestore)',
      'Understanding of asynchronous programming, promises, async/await, and error handling patterns',
      'Experience writing backend unit and integration tests (Jest, Mocha, Supertest)',
      'Proficiency with Git version control, branch management, and collaborative GitHub workflows',
      'Basic understanding of containerization concepts (Docker) and CI/CD pipelines',
    ],
  },
  {
    id: 'fullstack-developer-intern',
    title: 'Full-Stack Developer Intern',
    company: 'TechStars Open Ecosystem',
    category: 'fullstack',
    sourceUrl: 'https://github.com/facebook/react',
    isLivePosting: false,
    verificationStatus: 'practice_sample',
    lastVerifiedAt: '2026-10-15T00:00:00.000Z',
    summary: 'Curated practice job spec bridging React/TypeScript client apps and Node/Express backend architectures.',
    description: `Full-Stack Developer Intern
Location: Remote
Company: TechStars Open Ecosystem

About the Role:
We are seeking a versatile Full-Stack Developer Intern to help build end-to-end features across our web portal and API layers. You will contribute to frontend user interfaces, backend services, and database queries.

Key Responsibilities:
- Build interactive frontend components in React / TypeScript connected to backend REST APIs.
- Design backend services and data persistence layers with Node.js and SQL/NoSQL stores.
- Implement responsive styles and client-side state management.
- Write automated tests across both frontend (React Testing Library) and backend (Jest / Supertest).
- Maintain documentation and track sprint tasks in GitHub Issues.

Requirements & Qualifications:
- Experience developing full-stack web applications using React, TypeScript, and Node.js.
- Ability to design, document, and consume RESTful HTTP APIs with JSON payloads.
- Understanding of database schema modeling, queries, and persistence (SQL, NoSQL, or ORM/ODM).
- Experience with frontend build systems (Vite), CSS styling, and component state management.
- Experience writing automated tests (unit and integration) across both client and server codebases.
- Strong knowledge of Git version control, pull requests, and code review practices.`,
    requirements: [
      'Experience developing full-stack web applications using React, TypeScript, and Node.js',
      'Ability to design, document, and consume RESTful HTTP APIs with JSON payloads',
      'Understanding of database schema modeling, queries, and persistence (SQL, NoSQL, or ORM/ODM)',
      'Experience with frontend build systems (Vite), CSS styling, and component state management',
      'Experience writing automated tests (unit and integration) across both client and server codebases',
      'Strong knowledge of Git version control, pull requests, and code review practices',
    ],
  },
];
