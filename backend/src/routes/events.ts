import { Router, Request, Response } from 'express';
import { getActiveEvents, getAllEvents, getEventById } from '../db/queries';
import pool from '../db/connection';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Support 'all' query parameter to get all events (including past)
    const includeAll = req.query.all === 'true';
    const events = includeAll ? await getAllEvents() : await getActiveEvents();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const event = await getEventById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get promoter name
    const promoterResult = await pool.query(
      'SELECT name FROM promoters WHERE id = $1',
      [event.promoter_id]
    );
    const promoterName = promoterResult.rows[0]?.name || null;

    res.json({
      ...event,
      promoter_name: promoterName,
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

export default router;

