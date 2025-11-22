import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { getActiveEvents, getAllEvents, getEventById, createEvent, getEventsByPromoter } from '../db/queries';
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
      description: body.description || undefined,
      event_date: new Date(body.event_date),
      location: body.location,
      city: body.city || undefined,
      state: body.state || undefined,
      image_url: imageUrl,
      sponsored_chapter_id: body.sponsored_chapter_id ?? undefined,
      ticket_price_cents: body.ticket_price_cents || 0,
      max_attendees: body.max_attendees ?? undefined,
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

// Get upcoming events (next 5 events)
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        e.id,
        e.promoter_id,
        e.title,
        e.description,
        e.event_date,
        e.location,
        e.city,
        e.state,
        e.image_url,
        e.sponsored_chapter_id,
        e.ticket_price_cents,
        e.max_attendees,
        e.created_at,
        e.updated_at,
        p.name as promoter_name,
        p.email as promoter_email,
        p.fraternity_member_id as promoter_fraternity_member_id,
        p.sponsoring_chapter_id as promoter_sponsoring_chapter_id,
        c.name as chapter_name,
        CASE WHEN p.fraternity_member_id IS NOT NULL THEN true ELSE false END as is_fraternity_member
      FROM events e
      JOIN promoters p ON e.promoter_id = p.id
      LEFT JOIN chapters c ON e.sponsored_chapter_id = c.id
      WHERE p.status = 'APPROVED' AND e.event_date >= NOW()
      ORDER BY e.event_date ASC
      LIMIT 5`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
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

// Get promoter's events (authenticated promoter)
router.get('/promoter/me', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.promoterId) {
      return res.status(403).json({ error: 'Promoter access required' });
    }

    const events = await getEventsByPromoter(req.user.promoterId);
    res.json(events);
  } catch (error) {
    console.error('Error fetching promoter events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get promoter's metrics
router.get('/promoter/me/metrics', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.promoterId) {
      return res.status(403).json({ error: 'Promoter access required' });
    }

    // Get total events count
    const totalEventsResult = await pool.query(
      'SELECT COUNT(*) as total_events FROM events WHERE promoter_id = $1',
      [req.user.promoterId]
    );
    const totalEvents = parseInt(totalEventsResult.rows[0]?.total_events || '0');

    // Get upcoming events count
    const upcomingEventsResult = await pool.query(
      'SELECT COUNT(*) as upcoming_events FROM events WHERE promoter_id = $1 AND event_date >= CURRENT_DATE',
      [req.user.promoterId]
    );
    const upcomingEvents = parseInt(upcomingEventsResult.rows[0]?.upcoming_events || '0');

    // Get past events count
    const pastEventsResult = await pool.query(
      'SELECT COUNT(*) as past_events FROM events WHERE promoter_id = $1 AND event_date < CURRENT_DATE',
      [req.user.promoterId]
    );
    const pastEvents = parseInt(pastEventsResult.rows[0]?.past_events || '0');

    // Get total potential revenue (sum of ticket prices * max attendees)
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(ticket_price_cents * COALESCE(max_attendees, 0)), 0) as potential_revenue_cents
       FROM events
       WHERE promoter_id = $1 AND event_date >= CURRENT_DATE`,
      [req.user.promoterId]
    );
    const potentialRevenueCents = parseInt(revenueResult.rows[0]?.potential_revenue_cents || '0');

    res.json({
      totalEvents,
      upcomingEvents,
      pastEvents,
      potentialRevenueCents,
    });
  } catch (error) {
    console.error('Error fetching promoter metrics:', error);
    res.status(500).json({ error: 'Failed to fetch promoter metrics' });
  }
});

export default router;



