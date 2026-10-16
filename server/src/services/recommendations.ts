import { Recommendation, SkillAssessment } from '../models/types';
import { generateId } from '../utils/id';

/**
 * Generates prioritized, actionable recommendations connected to the student's actual skill gaps.
 */
export function generateRecommendations(assessments: SkillAssessment[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Group by status
  const notDemonstrated = assessments.filter(a => a.status === 'not_demonstrated_in_scope');
  const partiallyDemonstrated = assessments.filter(a => a.status === 'partially_demonstrated');
  const unableToVerify = assessments.filter(a => a.status === 'unable_to_verify');

  // 1. High priority: Core missing skills
  for (const item of notDemonstrated) {
    const skillLower = item.skillName.toLowerCase();
    let actionTitle = `Implement ${item.skillName} in your repository`;
    let suggestedTask = `Create a dedicated module or component demonstrating ${item.skillName} to satisfy this job requirement.`;

    if (skillLower.includes('test') || skillLower.includes('jest') || skillLower.includes('vitest')) {
      actionTitle = 'Add automated unit and integration tests';
      suggestedTask = 'Set up a test runner (e.g. Jest or Vitest) with tests targeting core business logic and API endpoints.';
    } else if (skillLower.includes('docker') || skillLower.includes('container')) {
      actionTitle = 'Add Dockerfile and container configuration';
      suggestedTask = 'Create a multi-stage Dockerfile and docker-compose.yml to show containerization and environment isolation.';
    } else if (skillLower.includes('database') || skillLower.includes('sql') || skillLower.includes('postgres') || skillLower.includes('mongo')) {
      actionTitle = 'Add persistent data schema and query models';
      suggestedTask = 'Design database schemas, migration files, and CRUD query functions to provide clear evidence of data modeling.';
    } else if (skillLower.includes('typescript') || skillLower.includes('type')) {
      actionTitle = 'Introduce TypeScript interfaces and strict type definitions';
      suggestedTask = 'Refactor untyped parameters to use explicit TypeScript interfaces, custom types, and return value annotations.';
    } else if (skillLower.includes('api') || skillLower.includes('rest') || skillLower.includes('endpoint')) {
      actionTitle = 'Build RESTful API endpoints with error handling';
      suggestedTask = 'Create well-structured Express route handlers with input validation schemas and standardized HTTP status codes.';
    } else if (skillLower.includes('react') || skillLower.includes('component') || skillLower.includes('ui')) {
      actionTitle = 'Create modular UI components with state management';
      suggestedTask = 'Build reusable React components demonstrating custom hooks, props validation, and responsive CSS styling.';
    } else if (skillLower.includes('ci/cd') || skillLower.includes('github actions') || skillLower.includes('pipeline')) {
      actionTitle = 'Configure GitHub Actions CI workflow';
      suggestedTask = 'Add a .github/workflows/ci.yml file that runs linter, TypeScript check, and automated tests on every push.';
    }

    recommendations.push({
      id: generateId(),
      skillName: item.skillName,
      priority: 'high',
      actionTitle,
      explanation: `Job requirement "${item.skillName}" was not found in the inspected codebase. Demonstrating this directly in your repository will significantly strengthen your candidate profile.`,
      suggestedTask,
    });
  }

  // 2. Medium priority: Partially demonstrated skills
  for (const item of partiallyDemonstrated) {
    const skillLower = item.skillName.toLowerCase();
    let actionTitle = `Deepen implementation of ${item.skillName}`;
    let suggestedTask = `Expand on your existing code to cover edge cases, asynchronous error handling, and unit test coverage.`;

    if (skillLower.includes('typescript')) {
      actionTitle = 'Enable strict TypeScript compiler options';
      suggestedTask = 'Eliminate any `any` types and use generics or branded types to showcase intermediate TypeScript mastery.';
    } else if (skillLower.includes('api') || skillLower.includes('backend')) {
      actionTitle = 'Add comprehensive request validation and middleware';
      suggestedTask = 'Implement schema validation (e.g. Zod or Joi) and central error handling middleware on all endpoints.';
    }

    recommendations.push({
      id: generateId(),
      skillName: item.skillName,
      priority: 'medium',
      actionTitle,
      explanation: `Found initial evidence for "${item.skillName}", but further code depth is needed to fully satisfy the job specification.`,
      suggestedTask,
    });
  }

  // 3. Low priority: Unable to verify / Soft skills
  for (const item of unableToVerify) {
    recommendations.push({
      id: generateId(),
      skillName: item.skillName,
      priority: 'low',
      actionTitle: `Document experience with ${item.skillName} in README`,
      explanation: `"${item.skillName}" is difficult to verify solely through static code analysis. Highlight this experience in your repository README or portfolio documentation.`,
      suggestedTask: `Add a section in your README explaining your experience with ${item.skillName} and relevant project highlights.`,
    });
  }

  // Cap recommendations at top 5 prioritized items
  return recommendations.slice(0, 5);
}
