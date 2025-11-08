import { Router, Request, Response } from 'express';
import multer from 'multer';
import { createPromoter } from '../db/queries';
import { uploadToS3 } from '../services/s3';
import { z } from 'zod';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const promoterApplicationSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  membership_number: z.string().min(1),
  initiated_chapter_id: z.number().int().positive(),
  sponsoring_chapter_id: z.number().int().positive().optional(),
  social_links: z.record(z.string()).optional(),
});

router.post('/apply', upload.single('headshot'), async (req: Request, res: Response) => {
  try {
    // Validate request body
    const body = promoterApplicationSchema.parse({
      ...req.body,
      initiated_chapter_id: parseInt(req.body.initiated_chapter_id),
      sponsoring_chapter_id: req.body.sponsoring_chapter_id ? parseInt(req.body.sponsoring_chapter_id) : undefined,
      social_links: req.body.social_links ? JSON.parse(req.body.social_links) : {},
    });

    // Upload headshot to S3
    let headshotUrl: string | undefined;
    if (req.file) {
      const uploadResult = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'headshots'
      );
      headshotUrl = uploadResult.url;
    }

    // Create promoter record
    const promoter = await createPromoter({
      ...body,
      headshot_url: headshotUrl,
      social_links: body.social_links || {},
    });

    res.status(201).json(promoter);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating promoter application:', error);
    res.status(500).json({ error: 'Failed to create promoter application' });
  }
});

export default router;

