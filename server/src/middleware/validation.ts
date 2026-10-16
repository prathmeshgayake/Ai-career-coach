import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult, ValidationChain } from 'express-validator';
import { parseGithubUrl } from '../models/schemas';

/**
 * Checks express-validator results and returns 400 Bad Request if validation failed.
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }
  next();
}

/**
 * Validations for POST /api/v1/jobs/preview
 */
export const validateJobPreview: ValidationChain[] = [
  body().custom((value, { req }) => {
    const hasUrl = typeof req.body.url === 'string' && req.body.url.trim().length > 0;
    const hasDesc = typeof req.body.description === 'string' && req.body.description.trim().length > 0;
    if (!hasUrl && !hasDesc) {
      throw new Error('Either url or description must be provided');
    }
    return true;
  }),
  body('url')
    .optional()
    .isURL()
    .withMessage('Must be a valid URL'),
  body('description')
    .optional()
    .isString()
    .isLength({ min: 10, max: 50000 })
    .withMessage('Job description must be between 10 and 50,000 characters'),
];

/**
 * Validations for POST /api/v1/analyses
 */
export const validateCreateAnalysis: ValidationChain[] = [
  body('repositoryUrl')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('repositoryUrl is required')
    .custom((value) => {
      if (!parseGithubUrl(value)) {
        throw new Error('Must be a valid GitHub repository URL (e.g. https://github.com/owner/repo)');
      }
      return true;
    }),
  body().custom((value, { req }) => {
    const hasJobUrl = typeof req.body.jobUrl === 'string' && req.body.jobUrl.trim().length > 0;
    const hasJobDesc = typeof req.body.jobDescription === 'string' && req.body.jobDescription.trim().length > 0;
    if (!hasJobUrl && !hasJobDesc) {
      throw new Error('Either jobUrl or jobDescription must be provided');
    }
    return true;
  }),
  body('jobUrl')
    .optional()
    .isURL()
    .withMessage('jobUrl must be a valid URL'),
  body('jobDescription')
    .optional()
    .isString()
    .isLength({ min: 10, max: 50000 })
    .withMessage('jobDescription must be between 10 and 50,000 characters'),
];

/**
 * Validations for POST /api/v1/tracked-repositories
 */
export const validateTrackRepo: ValidationChain[] = [
  body('analysisId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('analysisId is required')
    .isUUID()
    .withMessage('analysisId must be a valid UUID'),
];

/**
 * Validations for UUID :id param
 */
export const validateIdParam: ValidationChain[] = [
  param('id')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('id is required')
    .isUUID()
    .withMessage('id must be a valid UUID'),
];
