import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import chaptersRouter from './routes/chapters';
import sellersRouter from './routes/sellers';
import promotersRouter from './routes/promoters';
import adminRouter from './routes/admin';
import productsRouter from './routes/products';
import eventsRouter from './routes/events';
import checkoutRouter from './routes/checkout';
import webhookRouter from './routes/webhook';
import { initializeDatabase } from './db/migrations';

// Load .env.local first, then .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Webhook route needs raw body for Stripe signature verification
app.use('/api/webhook', express.raw({ type: 'application/json' }), webhookRouter);

// Regular JSON middleware for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to NorthStar Nupes API' });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/chapters', chaptersRouter);
app.use('/api/sellers', sellersRouter);
app.use('/api/promoters', promotersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/products', productsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/checkout', checkoutRouter);

// Initialize database on startup
initializeDatabase().catch(console.error);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
