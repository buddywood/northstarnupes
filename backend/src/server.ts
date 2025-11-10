import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import cron from 'node-cron';
import chaptersRouter from './routes/chapters';
import sellersRouter from './routes/sellers';
import promotersRouter from './routes/promoters';
import membersRouter from './routes/members';
import usersRouter from './routes/users';
import adminRouter from './routes/admin';
import productsRouter from './routes/products';
import eventsRouter from './routes/events';
import checkoutRouter from './routes/checkout';
import webhookRouter from './routes/webhook';
import donationsRouter from './routes/donations';
import { initializeDatabase } from './db/migrations';
import { runVerification } from './scripts/verify-members';

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
  res.json({ message: 'Welcome to 1Kappa API' });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/chapters', chaptersRouter);
app.use('/api/sellers', sellersRouter);
app.use('/api/promoters', promotersRouter);
app.use('/api/members', membersRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/products', productsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/donations', donationsRouter);

// Initialize database on startup
initializeDatabase().catch(console.error);

// Schedule daily member verification at 2 AM
// Cron format: minute hour day month day-of-week
// '0 2 * * *' means: at 2:00 AM every day
cron.schedule('0 2 * * *', async () => {
  console.log('⏰ Scheduled member verification started at', new Date().toISOString());
  try {
    await runVerification();
  } catch (error) {
    console.error('❌ Error in scheduled member verification:', error);
  }
}, {
  scheduled: true,
  timezone: 'America/New_York', // Adjust timezone as needed
});

console.log('📅 Member verification scheduled to run daily at 2:00 AM');

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
