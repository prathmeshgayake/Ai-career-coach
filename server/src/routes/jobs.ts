import { Router, Request, Response, NextFunction } from 'express';
import { extractJobSource } from '../services/jobExtractor';
import { validateJobPreview, handleValidationErrors } from '../middleware/validation';

import { SAMPLE_JOBS } from '../data/sampleJobs';

const router = Router();

/**
 * GET /api/v1/jobs/samples
 * Returns curated sample jobs library for common student roles.
 */
router.get('/samples', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: SAMPLE_JOBS,
  });
});

/**
 * GET /api/v1/jobs/samples/:id
 * Returns a specific sample job by ID.
 */
router.get('/samples/:id', (req: Request, res: Response) => {
  const sample = SAMPLE_JOBS.find(j => j.id === req.params.id);
  if (!sample) {
    res.status(404).json({
      status: 'error',
      message: `Sample job with ID '${req.params.id}' not found.`,
    });
    return;
  }
  res.status(200).json({
    status: 'success',
    data: sample,
  });
});

/**
 * POST /api/v1/jobs/preview
 * Accepts { url?: string, description?: string } and returns parsed requirements.
 */
router.post(
  '/preview',
  validateJobPreview,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { url, description } = req.body;
      const jobSource = await extractJobSource({ url, description });

      res.status(200).json({
        status: 'success',
        data: jobSource,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
