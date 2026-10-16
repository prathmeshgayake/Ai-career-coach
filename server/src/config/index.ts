import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Check for .env in server directory, cwd, or relative to current file
const envCandidates = [
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../server/.env'),
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  geminiApiKey?: string;
  geminiModel: string;
  firebase: {
    projectId?: string;
    clientEmail?: string;
    privateKey?: string;
  };
  githubToken?: string;
  pollIntervalMinutes: number;
  pollSecret: string;
  jwtSecret: string;
  allowedOrigins: string[];
  isFirebaseConfigured: boolean;
}


let firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
let firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

// Auto-detect firebase-key.json or serviceAccountKey.json if placed in server or root folder
const candidateKeyFiles = [
  path.resolve(process.cwd(), 'firebase-key.json'),
  path.resolve(process.cwd(), 'serviceAccountKey.json'),
  path.resolve(__dirname, '../../firebase-key.json'),
  path.resolve(__dirname, '../../serviceAccountKey.json'),
  path.resolve(__dirname, '../../../firebase-key.json'),
];

for (const candidate of candidateKeyFiles) {
  if (fs.existsSync(candidate)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        firebaseProjectId = firebaseProjectId || parsed.project_id;
        firebaseClientEmail = firebaseClientEmail || parsed.client_email;
        firebasePrivateKey = firebasePrivateKey || parsed.private_key;
        break;
      }
    } catch {
      // ignore parsing error
    }
  }
}

const isFirebaseConfigured = Boolean(
  firebaseProjectId &&
  firebaseClientEmail &&
  firebasePrivateKey
);

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || undefined,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  firebase: {
    projectId: firebaseProjectId || undefined,
    clientEmail: firebaseClientEmail || undefined,
    privateKey: firebasePrivateKey,
  },
  githubToken: process.env.GITHUB_TOKEN || undefined,
  pollIntervalMinutes: Math.max(1, parseInt(process.env.POLL_INTERVAL_MINUTES || '5', 10)),
  pollSecret: process.env.POLL_SECRET || 'dev_poll_secret_12345',
  jwtSecret: process.env.JWT_SECRET || 'ai-career-coach-production-jwt-secret-2026',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean),
  isFirebaseConfigured,
};
