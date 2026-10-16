import { ActionPlan, ActionPlanPhase, ActionPlanTask, SkillAssessment } from '../models/types';
import { StudentProfile } from '../data/students';
import { generateId } from '../utils/id';

/**
 * Builds a personalized, phased career action plan based on the student's profile
 * and their actual repository skill assessments.
 */
export function generateActionPlan(
  student: StudentProfile,
  assessments: SkillAssessment[] = []
): ActionPlan {
  const notDemonstrated = assessments.filter((a) => a.status === 'not_demonstrated_in_scope');
  const partiallyDemonstrated = assessments.filter((a) => a.status === 'partially_demonstrated');
  const demonstrated = assessments.filter((a) => a.status === 'demonstrated');

  const total = assessments.length;
  const readinessScore = total > 0 ? Math.round((demonstrated.length / total) * 100) : 0;
  const targetRole = student.targetRoles?.[0] || 'Software Engineer Intern';

  // --- Phase 1: Urgent Skill Gaps (Week 1-2) ---
  const phase1Tasks: ActionPlanTask[] = [];

  if (notDemonstrated.length > 0) {
    notDemonstrated.forEach((item, index) => {
      const lower = item.skillName.toLowerCase();
      let codeTask = `Implement a dedicated service or module covering ${item.skillName}.`;
      let githubGuidance = `Commit to a new branch, add unit tests, and open a pull request.`;
      let estimatedHours = 4;

      if (lower.includes('test') || lower.includes('jest') || lower.includes('vitest')) {
        codeTask = 'Set up Jest/Vitest with unit tests for core controllers and utility functions.';
        githubGuidance = 'Add a `test` script in package.json and commit tests in `__tests__/` directory.';
        estimatedHours = 3;
      } else if (lower.includes('docker') || lower.includes('container')) {
        codeTask = 'Write a multi-stage Dockerfile and docker-compose.yml file for the repository.';
        githubGuidance = 'Verify `docker compose up` starts the service cleanly and commit the config files.';
        estimatedHours = 3;
      } else if (lower.includes('database') || lower.includes('sql') || lower.includes('mongo') || lower.includes('postgres')) {
        codeTask = 'Implement schema models, database connection pool, and parameterized queries.';
        githubGuidance = 'Add migration scripts or seed files showing data modeling best practices.';
        estimatedHours = 5;
      } else if (lower.includes('typescript') || lower.includes('types')) {
        codeTask = 'Add TypeScript configuration and replace untyped variables with explicit interfaces.';
        githubGuidance = 'Enable strict type-checking in tsconfig.json and fix all compiler warnings.';
        estimatedHours = 4;
      } else if (lower.includes('api') || lower.includes('rest')) {
        codeTask = 'Develop RESTful endpoints with input validation middleware and HTTP error handling.';
        githubGuidance = 'Provide test curl commands or Swagger/OpenAPI documentation in docs/api.md.';
        estimatedHours = 4;
      }

      phase1Tasks.push({
        id: generateId(),
        title: `Remediate ${item.skillName} Deficiency`,
        skillName: item.skillName,
        priority: 'high',
        estimatedHours,
        description: `This requirement was not found in your repository. Adding concrete evidence directly addresses what recruiters for ${targetRole} look for.`,
        codeTask,
        githubGuidance,
      });
    });
  } else {
    // If student already has demonstrated skills, provide core enhancement tasks
    phase1Tasks.push({
      id: generateId(),
      title: 'Review Core Algorithms & Code Quality',
      skillName: 'Code Quality',
      priority: 'high',
      estimatedHours: 3,
      description: 'Audit repository architecture for modularity, clean code principles, and separation of concerns.',
      codeTask: 'Refactor monolithic routines into cohesive, single-responsibility helper modules.',
      githubGuidance: 'Tag commit as `refactor: improve modularity and clean architecture`.',
    });
  }

  // --- Phase 2: Depth, Reliability & CI/CD (Week 3-4) ---
  const phase2Tasks: ActionPlanTask[] = [];

  if (partiallyDemonstrated.length > 0) {
    partiallyDemonstrated.forEach((item) => {
      phase2Tasks.push({
        id: generateId(),
        title: `Deepen ${item.skillName} Implementation`,
        skillName: item.skillName,
        priority: 'medium',
        estimatedHours: 4,
        description: `You have initial code related to ${item.skillName}. Deepening it with error boundaries, edge case handling, and integration tests turns partial credit into verified mastery.`,
        codeTask: `Refactor ${item.skillName} code to handle network drops, unexpected nulls, and boundary values.`,
        githubGuidance: 'Add automated regression tests ensuring robustness under abnormal inputs.',
      });
    });
  }

  // Always include CI/CD & Security in Phase 2
  phase2Tasks.push({
    id: generateId(),
    title: 'Automate CI/CD Pipeline with GitHub Actions',
    skillName: 'CI/CD & DevOps',
    priority: 'medium',
    estimatedHours: 3,
    description: 'Recruiters favor candidates whose repositories demonstrate continuous integration pipelines.',
    codeTask: 'Create `.github/workflows/ci.yml` running lint, build, and test steps on pull request.',
    githubGuidance: 'Ensure your GitHub Actions check passes with a green badge in README.',
  });

  // --- Phase 3: Portfolio, Documentation & Interview Prep (Week 5+) ---
  const phase3Tasks: ActionPlanTask[] = [
    {
      id: generateId(),
      title: 'Craft a Professional Technical README',
      skillName: 'Technical Communication',
      priority: 'low',
      estimatedHours: 2,
      description: 'Your repository is your portfolio centerpiece. Document architecture, decisions, and setup instructions.',
      codeTask: 'Include architecture diagrams, live demo links, environment setup guide, and tech stack badges.',
      githubGuidance: 'Commit `README.md` with clear screenshots or GIF demo.',
    },
    {
      id: generateId(),
      title: 'Prepare Technical Interview Talking Points',
      skillName: 'System Design & Interviewing',
      priority: 'low',
      estimatedHours: 3,
      description: `Prepare to explain why you chose your specific architecture, trade-offs made, and how you verified ${targetRole} requirements.`,
      codeTask: 'Draft a 2-minute elevator pitch and 3 challenge-resolution stories (STAR method).',
      githubGuidance: 'Record a 2-minute Loom demo or write a brief case study post on LinkedIn.',
    },
  ];

  // Tailored advice based on student target role
  const keyAdvice: string[] = [
    `Focus on verified evidence: Every skill you claim for ${targetRole} should have a corresponding commit in GitHub.`,
    'Write clean, readable commits with conventional prefixes (feat:, fix:, test:, refactor:).',
    'Automated monitoring watches your repo: as soon as you commit changes for any task above, the career engine will reassess your skills automatically.',
  ];

  if (targetRole.toLowerCase().includes('frontend')) {
    keyAdvice.push('Prioritize responsive layouts, accessibility (WCAG), and clean component hierarchy with React/TypeScript.');
  } else if (targetRole.toLowerCase().includes('backend')) {
    keyAdvice.push('Prioritize database indexing, SQL query optimization, API contract design, and end-to-end integration tests.');
  } else {
    keyAdvice.push('Highlight seamless communication between front-end UI state and back-end RESTful controllers.');
  }

  return {
    studentId: student.id,
    studentName: student.name,
    targetRole,
    overallReadinessScore: readinessScore,
    generatedAt: new Date().toISOString(),
    phases: [
      {
        phaseNumber: 1,
        phaseTitle: 'Phase 1: Urgent Skill Gaps',
        timeframe: 'Weeks 1 – 2',
        objective: 'Close missing core requirements that directly eliminate you from candidate shortlists.',
        tasks: phase1Tasks,
      },
      {
        phaseNumber: 2,
        phaseTitle: 'Phase 2: Depth, Robustness & CI/CD',
        timeframe: 'Weeks 3 – 4',
        objective: 'Elevate partial code to production quality with automated testing and pipelines.',
        tasks: phase2Tasks,
      },
      {
        phaseNumber: 3,
        phaseTitle: 'Phase 3: Portfolio Polish & Interview Readiness',
        timeframe: 'Week 5 Onwards',
        objective: 'Transform your verified repository into a standout interview showcase.',
        tasks: phase3Tasks,
      },
    ],
    keyAdvice,
  };
}
