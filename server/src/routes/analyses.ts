import { Router, Request, Response, NextFunction } from 'express';
import { AnalyzerService } from '../services/analyzer';
import { analysisStore } from '../db/analysisStore';
import {
  validateCreateAnalysis,
  validateIdParam,
  handleValidationErrors,
} from '../middleware/validation';
import { analysisRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * POST /api/v1/analyses
 * Creates a new full analysis for a given job and GitHub repository.
 */
router.post(
  '/',
  analysisRateLimiter,
  validateCreateAnalysis,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { jobUrl, jobDescription, repositoryUrl, jobPreviewData } = req.body;

      const result = await AnalyzerService.runInitialAnalysis({
        jobUrl,
        jobDescription,
        repositoryUrl,
        previewedJobSource: jobPreviewData,
        userId: req.userId || 'student-aarav',
      });

      res.status(201).json({
        status: 'success',
        data: {
          analysis: result.analysis,
          latestAssessment: result.assessment,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/analyses
 * Lists all analyses for the authenticated student.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analyses = await analysisStore.getAllAnalyses(req.userId);
    res.status(200).json({
      status: 'success',
      data: analyses,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analyses/:id
 * Fetches analysis details along with its latest assessment version.
 */
router.get(
  '/:id',
  validateIdParam,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const analysis = await analysisStore.getAnalysis(id);

      if (!analysis) {
        res.status(404).json({
          status: 'error',
          message: `Analysis with ID '${id}' not found`,
        });
        return;
      }

      // Authorize access by student userId
      if (req.userId && analysis.userId && analysis.userId !== req.userId) {
        res.status(403).json({
          status: 'error',
          message: 'Access denied: this analysis belongs to another student account',
        });
        return;
      }

      const latestAssessment = await analysisStore.getLatestAssessmentVersion(id);

      res.status(200).json({
        status: 'success',
        data: {
          ...analysis,
          latestAssessment,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/analyses/:id/history
 * Fetches all assessment versions for an analysis.
 */
router.get(
  '/:id/history',
  validateIdParam,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const analysis = await analysisStore.getAnalysis(id);

      if (!analysis) {
        res.status(404).json({
          status: 'error',
          message: `Analysis with ID '${id}' not found`,
        });
        return;
      }

      // Authorize access by student userId
      if (req.userId && analysis.userId && analysis.userId !== req.userId) {
        res.status(403).json({
          status: 'error',
          message: 'Access denied: this analysis belongs to another student account',
        });
        return;
      }

      const versions = await analysisStore.getAssessmentVersions(id);

      res.status(200).json({
        status: 'success',
        data: {
          analysisId: id,
          currentVersion: analysis.currentVersion,
          versions,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/v1/analyses/:id
 * Deletes an analysis, stopping any associated tracking.
 */
router.delete(
  '/:id',
  validateIdParam,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const analysis = await analysisStore.getAnalysis(id);

      if (!analysis) {
        res.status(404).json({
          status: 'error',
          message: `Analysis with ID '${id}' not found`,
        });
        return;
      }

      // Authorize access by student userId
      if (req.userId && analysis.userId && analysis.userId !== req.userId) {
        res.status(403).json({
          status: 'error',
          message: 'Access denied: cannot delete an analysis belonging to another student account',
        });
        return;
      }

      await analysisStore.deleteAnalysis(id);

      res.status(200).json({
        status: 'success',
        message: `Analysis '${id}' and associated monitoring removed successfully`,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
