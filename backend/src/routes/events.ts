import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { getActiveEvents, getAllEvents, getEventById, createEvent } from '../db/queries';
import { uploadToS3 } from '../services/s3';
import { authenticate } from '../middleware/auth';
import pool from '../db/connection';

const router: ExpressRouter = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  event_date: z.string(),
  location: z.string().min(1),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  sponsored_chapter_id: z.number().int().positive().optional().nullable(),
  ticket_price_cents: z.number().int().min(0).optional(),
  max_attendees: z.number().int().positive().optional().nullable(),
});

// Create event - requires authenticated promoter (must come before /:id route)
router.post('/', authenticate, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.promoterId) {
      return res.status(403).json({ error: 'You must be an approved promoter to create events' });
    }

    // Check if promoter is approved
    const promoterResult = await pool.query(
      'SELECT id, status FROM promoters WHERE id = $1',
      [req.user.promoterId]
    );

    if (promoterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Promoter profile not found' });
    }

    if (promoterResult.rows[0].status !== 'APPROVED') {
      return res.status(403).json({ error: 'You must be an approved promoter to create events' });
    }

    // Validate request body
    const body = createEventSchema.parse({
      ...req.body,
      sponsored_chapter_id: req.body.sponsoring_chapter_id ? parseInt(req.body.sponsoring_chapter_id) : undefined,
      ticket_price_cents: req.body.ticket_price_cents ? parseInt(req.body.ticket_price_cents) : 0,
      max_attendees: req.body.max_attendees ? parseInt(req.body.max_attendees) : undefined,
    });

    // Upload image to S3 if provided
    let imageUrl: string | undefined;
    if (req.file) {
      const uploadResult = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'events'
      );
      imageUrl = uploadResult.url;
    }

    // Create event
    const event = await createEvent({
      promoter_id: req.user.promoterId,
      title: body.title,
      description: body.description || null,
      event_date: new Date(body.event_date),
      location: body.location,
      city: body.city || null,
      state: body.state || null,
      image_url: imageUrl || null,
      sponsored_chapter_id: body.sponsored_chapter_id || null,
      ticket_price_cents: body.ticket_price_cents || 0,
      max_attendees: body.max_attendees || null,
    });

    res.status(201).json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

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

    // The query already includes promoter_name and role information
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

export default router;



