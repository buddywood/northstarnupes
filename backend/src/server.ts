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
import locationRouter from './routes/location';
import industriesRouter from './routes/industries';
import professionsRouter from './routes/professions';
import sellerSetupRouter from './routes/seller-setup';
import stewardsRouter from './routes/stewards';
import stewardCheckoutRouter from './routes/steward-checkout';
import favoritesRouter from './routes/favorites';
import notificationsRouter from './routes/notifications';
import { initializeDatabase } from './db/migrations';
import { runVerification, runSellerVerification } from './scripts/verify-members';

// Load .env.local first, then .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS configuration
// Allow production frontend, Vercel preview deployments, and localhost
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  // Allow all Vercel preview deployments (pattern: *.vercel.app)
  /^https:\/\/.*\.vercel\.app$/,
  // Allow Vercel production if different from FRONTEND_URL
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean) as (string | RegExp)[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Webhook route needs raw body for Stripe signature verification
app.use('/api/webhook', express.raw({ type: 'application/json' }), webhookRouter);

// Regular JSON middleware for other routes (only parse JSON, not multipart/form-data)
// Increase body size limit to 10MB for image uploads
// Only apply JSON parser to requests that are actually JSON (skip multipart/form-data)
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const contentType = req.headers['content-type'] || '';
  // Skip JSON parsing for multipart/form-data (handled by multer) and other non-JSON content types
  if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
    return next();
  }
  if (contentType.includes('application/json')) {
    express.json({ limit: '10mb' })(req, res, next);
  } else {
    next();
  }
});

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const contentType = req.headers['content-type'] || '';
  // Skip URL-encoded parsing for multipart/form-data
  if (contentType.includes('multipart/form-data')) {
    return next();
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
  } else {
    next();
  }
});

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
app.use('/api/location', locationRouter);
app.use('/api/industries', industriesRouter);
app.use('/api/professions', professionsRouter);
app.use('/api/seller-setup', sellerSetupRouter);
app.use('/api/stewards', stewardsRouter);
app.use('/api/steward-checkout', stewardCheckoutRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/notifications', notificationsRouter);

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

// Schedule daily seller verification at 3 AM (separate from member verification)
// Seller verification searches vendor program page - no login required
cron.schedule('0 3 * * *', async () => {
  console.log('⏰ Scheduled seller verification started at', new Date().toISOString());
  try {
    await runSellerVerification();
  } catch (error) {
    console.error('❌ Error in scheduled seller verification:', error);
  }
}, {
  scheduled: true,
  timezone: 'America/New_York', // Adjust timezone as needed
});

console.log('📅 Member verification scheduled to run daily at 2:00 AM');
console.log('📅 Seller verification scheduled to run daily at 3:00 AM');

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
