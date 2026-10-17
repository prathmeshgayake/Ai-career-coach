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

export const PRECONFIGURED_STUDENTS: StudentProfile[] = [];

export function getStudentById(id: string): StudentProfile | null {
  return null;
}

