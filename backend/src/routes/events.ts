import { Router, Request, Response } from 'express';
import { getActiveEvents } from '../db/queries';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const events = await getActiveEvents();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

export default router;

