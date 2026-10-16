import { Router, Request, Response, NextFunction } from 'express';
import { pollAuth } from '../middleware/pollAuth';
import { monitorService } from '../services/monitor';

const router = Router();

/**
 * GET or POST /api/v1/internal/poll
 * Protected endpoint to trigger manual, webhook, or cron-based polling.
 */
const handlePoll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trackingId = (req.body?.trackingId || req.query?.trackingId) as string | undefined;

    if (trackingId && typeof trackingId === 'string') {
      const pollRun = await monitorService.pollById(trackingId);
      res.status(200).json({
        status: 'success',
        message: `Polled repository ${trackingId}`,
        data: pollRun,
      });
      return;
    }

    const summary = await monitorService.pollAll();
    res.status(200).json({
      status: 'success',
      message: 'Triggered polling cycle for all active repositories',
      data: summary,
    });
  } catch (err) {
    next(err);
  }
};

router.post('/poll', pollAuth, handlePoll);
router.get('/poll', pollAuth, handlePoll);

export default router;
