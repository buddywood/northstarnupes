import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { getAllProfessions, getProfessionById, createProfession, updateProfession, deleteProfession } from '../db/queries';
import { authenticate, requireAdmin } from '../middleware/auth';

const router: Router = Router();

// GET /api/professions - Get all active professions (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const professions = await getAllProfessions(includeInactive);
    console.log(`Fetched ${professions.length} professions (includeInactive: ${includeInactive})`);
    res.json(professions);
  } catch (error: any) {
    console.error('Error fetching professions:', error);
    // Check if table doesn't exist
    if (error.code === '42P01') {
      return res.status(500).json({ 
        error: 'Professions table does not exist. Please run database migrations.',
        code: 'TABLE_NOT_FOUND'
      });
    }
    res.status(500).json({ 
      error: 'Failed to fetch professions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/professions/:id - Get profession by ID (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid profession ID' });
    }
    const profession = await getProfessionById(id);
    if (!profession) {
      return res.status(404).json({ error: 'Profession not found' });
    }
    res.json(profession);
  } catch (error) {
    console.error('Error fetching profession:', error);
    res.status(500).json({ error: 'Failed to fetch profession' });
  }
});

// POST /api/professions - Create new profession (admin only)
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, display_order, is_active } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Profession name is required' });
    }

    const profession = await createProfession({
      name: name.trim(),
      display_order: display_order !== undefined ? parseInt(display_order) : undefined,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    });

    res.status(201).json(profession);
  } catch (error: any) {
    console.error('Error creating profession:', error);
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({ error: 'Profession with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create profession' });
  }
});

// PUT /api/professions/:id - Update profession (admin only)
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid profession ID' });
    }

    const { name, display_order, is_active } = req.body;
    const updates: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Profession name must be a non-empty string' });
      }
      updates.name = name.trim();
    }

    if (display_order !== undefined) {
      updates.display_order = parseInt(display_order);
      if (isNaN(updates.display_order)) {
        return res.status(400).json({ error: 'Display order must be a number' });
      }
    }

    if (is_active !== undefined) {
      updates.is_active = Boolean(is_active);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const profession = await updateProfession(id, updates);
    if (!profession) {
      return res.status(404).json({ error: 'Profession not found' });
    }

    res.json(profession);
  } catch (error: any) {
    console.error('Error updating profession:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Profession with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to update profession' });
  }
});

// DELETE /api/professions/:id - Delete profession (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid profession ID' });
    }

    const deleted = await deleteProfession(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Profession not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting profession:', error);
    res.status(500).json({ error: 'Failed to delete profession' });
  }
});

export default router;


