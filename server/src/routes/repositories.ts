import { Router, Request, Response, NextFunction } from 'express';
import { GithubService } from '../services/github';

const router = Router();

/**
 * POST /api/v1/repositories/validate
 * Validates a GitHub repository URL and returns real metadata from GitHub API.
 */
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { repositoryUrl } = req.body || {};

    if (!repositoryUrl || typeof repositoryUrl !== 'string') {
      res.status(400).json({
        status: 'error',
        message: 'repositoryUrl is required and must be a string',
      });
      return;
    }

    let parsed;
    try {
      parsed = GithubService.parseRepoUrl(repositoryUrl);
    } catch (parseErr: any) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid GitHub repository URL. Format must be https://github.com/owner/repo',
      });
      return;
    }

    try {
      const metadata = await GithubService.getRepoMetadata(parsed.owner, parsed.repo);
      res.status(200).json({
        status: 'success',
        data: {
          owner: metadata.owner,
          name: metadata.repo,
          fullName: `${metadata.owner}/${metadata.repo}`,
          description: metadata.description || 'No description provided.',
          stars: metadata.stars || 0,
          language: metadata.language || 'Codebase',
          defaultBranch: metadata.defaultBranch || 'main',
          lastPush: metadata.lastPush || new Date().toISOString(),
        },
      });
    } catch (apiErr: any) {
      const message = apiErr?.message || 'An error occurred while inspecting GitHub repository';
      const isRateLimit = message.includes('rate limit exceeded') || message.includes('API rate limit');
      const isNotFound = message.includes('not found');
      
      const statusCode = isRateLimit ? 429 : isNotFound ? 404 : 502;
      res.status(statusCode).json({
        status: 'error',
        message,
        isRateLimit,
      });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
