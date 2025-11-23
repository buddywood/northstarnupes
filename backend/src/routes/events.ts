import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { getActiveEvents, getAllEvents, getEventById, createEvent, getEventsByPromoter, getAllEventTypes, getAllEventAudienceTypes, updateEventStatus } from '../db/queries';
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
  sponsored_chapter_id: z.number().int().positive(),
  event_type_id: z.number().int().positive(),
  event_audience_type_id: z.number().int().positive(),
  all_day: z.boolean().optional(),
  duration_minutes: z.number().int().positive().optional().nullable(),
  event_link: z.string().url().optional().nullable(),
  is_featured: z.boolean().optional(),
  ticket_price_cents: z.number().int().min(0).optional(),
  dress_codes: z.array(z.enum(['business', 'business_casual', 'formal', 'semi_formal', 'kappa_casual', 'greek_encouraged', 'greek_required', 'outdoor', 'athletic', 'comfortable', 'all_white'])).min(1),
  dress_code_notes: z.string().optional().nullable(),
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
    if (!req.body.sponsoring_chapter_id) {
      return res.status(400).json({ error: 'Sponsored chapter is required' });
    }
    
    const body = createEventSchema.parse({
      ...req.body,
      sponsored_chapter_id: parseInt(req.body.sponsoring_chapter_id),
      event_type_id: req.body.event_type_id ? parseInt(req.body.event_type_id) : undefined,
      event_audience_type_id: req.body.event_audience_type_id ? parseInt(req.body.event_audience_type_id) : undefined,
      all_day: req.body.all_day === 'true' || req.body.all_day === true,
      duration_minutes: req.body.duration_minutes ? parseInt(req.body.duration_minutes) : undefined,
      event_link: req.body.event_link || undefined,
      is_featured: req.body.is_featured === 'true' || req.body.is_featured === true,
      ticket_price_cents: req.body.ticket_price_cents ? parseInt(req.body.ticket_price_cents) : 0,
      dress_codes: (() => {
        // Handle array from FormData (dress_codes[] or dress_codes)
        if (Array.isArray(req.body.dress_codes)) {
          return req.body.dress_codes;
        }
        // Handle single value
        if (req.body.dress_codes) {
          return [req.body.dress_codes];
        }
        // Handle FormData array notation (dress_codes[])
        if (req.body['dress_codes[]']) {
          return Array.isArray(req.body['dress_codes[]']) 
            ? req.body['dress_codes[]'] 
            : [req.body['dress_codes[]']];
        }
        return ['business_casual'];
      })(),
      dress_code_notes: req.body.dress_code_notes || undefined,
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
      sponsored_chapter_id: body.sponsored_chapter_id,
      event_type_id: body.event_type_id,
      event_audience_type_id: body.event_audience_type_id,
      all_day: body.all_day ?? false,
      duration_minutes: body.duration_minutes ?? undefined,
      event_link: body.event_link ?? undefined,
      is_featured: body.is_featured ?? false,
      featured_payment_status: body.is_featured ? 'PENDING' : 'UNPAID',
      ticket_price_cents: body.ticket_price_cents || 0,
      dress_codes: body.dress_codes,
      dress_code_notes: body.dress_code_notes ?? undefined,
    });

    // If event is featured, create Stripe checkout session
    let checkoutUrl: string | undefined;
    if (body.is_featured) {
      const { createFeaturedEventCheckoutSession } = await import('../services/stripe-featured-event');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const promoterResult = await pool.query(
        'SELECT email FROM promoters WHERE id = $1',
        [req.user.promoterId]
      );
      const promoterEmail = promoterResult.rows[0]?.email || '';

      const checkoutSession = await createFeaturedEventCheckoutSession({
        eventId: event.id,
        eventTitle: event.title,
        promoterEmail: promoterEmail,
        successUrl: `${frontendUrl}/promoter-dashboard/events?featured=true`,
        cancelUrl: `${frontendUrl}/promoter-dashboard/events/create`,
      });

      // Update event with payment intent ID
      await pool.query(
        `UPDATE events 
         SET stripe_payment_intent_id = $1
         WHERE id = $2`,
        [checkoutSession.id, event.id]
      );

      checkoutUrl = checkoutSession.url || undefined;
    }

    return res.status(201).json({
      ...event,
      checkout_url: checkoutUrl,
      requires_payment: !!checkoutUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Get event types (must come before /:id route)
router.get('/types', async (req: Request, res: Response) => {
  try {
    const eventTypes = await getAllEventTypes();
    res.json(eventTypes);
  } catch (error) {
    console.error('Error fetching event types:', error);
    res.status(500).json({ error: 'Failed to fetch event types' });
  }
});

// Get event audience types (must come before /:id route)
router.get('/audience-types', async (req: Request, res: Response) => {
  try {
    const audienceTypes = await getAllEventAudienceTypes();
    res.json(audienceTypes);
  } catch (error) {
    console.error('Error fetching event audience types:', error);
    res.status(500).json({ error: 'Failed to fetch event audience types' });
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
      WHERE p.status = 'APPROVED' AND e.status = 'ACTIVE' AND e.event_date >= NOW()
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

// Promote an existing event (create payment session for featured promotion)
router.post('/:id/promote', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user is a promoter
    if (!req.user.promoterId) {
      return res.status(403).json({ error: 'Promoter access required' });
    }

    const eventId = parseInt(req.params.id);

    // Verify event exists and belongs to this promoter
    const eventResult = await pool.query(
      'SELECT id, title, promoter_id, is_featured, featured_payment_status FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];

    if (event.promoter_id !== req.user.promoterId) {
      return res.status(403).json({ error: 'You can only promote your own events' });
    }

    // If already featured and paid, return success
    if (event.is_featured && event.featured_payment_status === 'PAID') {
      return res.json({ 
        message: 'Event is already featured',
        is_featured: true,
        featured_payment_status: 'PAID'
      });
    }

    // Create Stripe checkout session
        const { createFeaturedEventCheckoutSession } = await import('../services/stripe-featured-event');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const promoterResult = await pool.query(
      'SELECT email FROM promoters WHERE id = $1',
      [req.user.promoterId]
    );
    const promoterEmail = promoterResult.rows[0]?.email || '';

    const checkoutSession = await createFeaturedEventCheckoutSession({
      eventId: event.id,
      eventTitle: event.title,
      promoterEmail: promoterEmail,
      successUrl: `${frontendUrl}/promoter-dashboard/events?promoted=true`,
      cancelUrl: `${frontendUrl}/promoter-dashboard/events`,
    });

    // Update event with payment intent ID and set status to PENDING
    await pool.query(
      `UPDATE events 
       SET stripe_payment_intent_id = $1, 
           featured_payment_status = 'PENDING',
           is_featured = true
       WHERE id = $2`,
      [checkoutSession.id, event.id]
    );

    res.json({
      checkout_url: checkoutSession.url,
      event_id: event.id,
      requires_payment: true,
    });
  } catch (error: any) {
    console.error('Error promoting event:', error);
    res.status(500).json({ error: error.message || 'Failed to create promotion payment' });
  }
});

export default router;



