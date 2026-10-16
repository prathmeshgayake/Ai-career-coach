export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  targetRoles: string[];
  githubUsername: string;
  avatarUrl?: string;
  bio: string;
}

export const PRECONFIGURED_STUDENTS: StudentProfile[] = [
  {
    id: 'student-aarav',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@campus.edu',
    role: 'Backend Engineering Student',
    targetRoles: ['Backend Developer Intern', 'Cloud Systems Engineer'],
    githubUsername: 'aarav-backend',
    bio: 'CS junior focused on distributed systems, Express REST APIs, and database architecture.',
  },
  {
    id: 'student-priya',
    name: 'Priya Patel',
    email: 'priya.patel@campus.edu',
    role: 'Frontend & UI Engineering Student',
    targetRoles: ['Frontend Developer Intern', 'Full-Stack Developer Intern'],
    githubUsername: 'priya-frontend',
    bio: 'Software engineering student passionate about TypeScript, React components, and accessible web experiences.',
  },
];

export function getStudentById(id: string): StudentProfile | null {
  const found = PRECONFIGURED_STUDENTS.find(s => s.id === id);
  if (found) return found;

  // Support arbitrary user IDs created on the fly
  if (id && id.trim()) {
    const cleanId = id.trim();
    return {
      id: cleanId,
      name: cleanId.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      email: `${cleanId.toLowerCase()}@student.edu`,
      role: 'Software Engineering Student',
      targetRoles: ['Full-Stack Developer Intern'],
      githubUsername: cleanId.toLowerCase(),
      bio: 'Enthusiastic engineering student building evidence-backed portfolio projects.',
    };
  }

  return null;
}
