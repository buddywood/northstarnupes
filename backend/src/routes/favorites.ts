import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { 
  addFavorite, 
  removeFavorite, 
  getFavoritesByUser, 
  isFavorite,
  getFavoriteProductsByUser 
} from '../db/queries';
import { z } from 'zod';

const router: ExpressRouter = Router();

const favoriteSchema = z.object({
  user_email: z.string().email(),
});

// Get all favorites for a user
router.get('/:userEmail', async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.params;
    const favorites = await getFavoritesByUser(userEmail);
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Get favorite products for a user (with product details)
router.get('/:userEmail/products', async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.params;
    const products = await getFavoriteProductsByUser(userEmail);
    res.json(products);
  } catch (error) {
    console.error('Error fetching favorite products:', error);
    res.status(500).json({ error: 'Failed to fetch favorite products' });
  }
});

// Check if a product is favorited by a user
router.get('/:userEmail/:productId', async (req: Request, res: Response) => {
  try {
    const { userEmail, productId } = req.params;
    const productIdNum = parseInt(productId);
    
    if (isNaN(productIdNum)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const favorited = await isFavorite(userEmail, productIdNum);
    res.json({ favorited });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({ error: 'Failed to check favorite status' });
  }
});

// Add a favorite
router.post('/:userEmail/:productId', async (req: Request, res: Response) => {
  try {
    const { userEmail, productId } = req.params;
    const productIdNum = parseInt(productId);
    
    if (isNaN(productIdNum)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const favorite = await addFavorite(userEmail, productIdNum);
    res.json(favorite);
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// Remove a favorite
router.delete('/:userEmail/:productId', async (req: Request, res: Response) => {
  try {
    const { userEmail, productId } = req.params;
    const productIdNum = parseInt(productId);
    
    if (isNaN(productIdNum)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const removed = await removeFavorite(userEmail, productIdNum);
    res.json({ removed });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

export default router;




