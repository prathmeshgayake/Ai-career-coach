import { Router, Request, Response } from 'express';
import { monitorService } from '../services/monitor';
import { config } from '../config';
import { diagnoseGeminiConnection, GEMINI_DEFAULT_MODEL } from '../services/gemini';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const monitorStatus = monitorService.getStatus();

  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    monitoring: monitorStatus,
    integrations: {
      geminiConfigured: Boolean(config.geminiApiKey && config.geminiApiKey !== 'your_gemini_api_key_here'),
      geminiModel: GEMINI_DEFAULT_MODEL,
      githubTokenConfigured: Boolean(config.githubToken && config.githubToken !== 'your_github_token_here'),
      firestoreConfigured: config.isFirebaseConfigured,
      storageType: config.isFirebaseConfigured ? 'firestore' : 'json_file_store',
    },
  });
});

/**
 * Detailed diagnostic check for judge inspection and system verification.
 */
router.get('/diagnostics', async (req: Request, res: Response) => {
  const geminiDiag = await diagnoseGeminiConnection();
  const monitorStatus = monitorService.getStatus();

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    diagnostics: {
      gemini: geminiDiag,
      monitoring: monitorStatus,
      github: {
        tokenConfigured: Boolean(config.githubToken && config.githubToken !== 'your_github_token_here'),
        rateLimitStrategy: config.githubToken ? 'authenticated (5000/hr)' : 'unauthenticated (60/hr)',
      },
      persistence: {
        type: config.isFirebaseConfigured ? 'firestore' : 'json_file_store',
        path: config.isFirebaseConfigured ? 'google_cloud_firestore' : './data/',
      },
    },
  });
});

export default router;
