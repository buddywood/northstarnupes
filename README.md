# 1Kappa MVP

A verified fraternity member marketplace for selling branded merchandise with automated donation tracking.

## Architecture

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: Neon PostgreSQL
- **Storage**: AWS S3
- **Payments**: Stripe Connect (Express accounts)
- **Auth**: NextAuth.js
- **Hosting**: Vercel (frontend) + Heroku (backend)

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon)
- AWS S3 bucket
- Stripe account with Connect enabled
- Environment variables configured

### Installation

1. Install dependencies:
```bash
npm run install:all
```

2. Set up environment variables:

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
ADMIN_KEY=your-admin-key
```

**Backend** (`backend/.env`):
```
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=...
AWS_REGION=us-east-1
ADMIN_KEY=your-admin-key
```

3. Initialize database:
The database schema will be automatically created on backend startup.

4. Run development servers:
```bash
npm run dev
```

This will start both frontend (http://localhost:3000) and backend (http://localhost:3001).

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Backend (Heroku)

1. Create a Heroku app
2. Set environment variables:
```bash
heroku config:set DATABASE_URL=...
heroku config:set STRIPE_SECRET_KEY=...
# ... etc
```

3. Deploy:
```bash
git push heroku main
```

4. Run database migrations:
```bash
heroku run npm run migrate
```

## API Endpoints

- `GET /api/chapters` - List all chapters
- `POST /api/sellers/apply` - Submit seller application
- `GET /api/admin/sellers/pending` - Get pending sellers (requires admin key)
- `PUT /api/admin/sellers/:id` - Approve/reject seller (requires admin key)
- `GET /api/products` - List active products
- `POST /api/products` - Create product
- `POST /api/checkout/:productId` - Create Stripe checkout session
- `POST /api/webhook/stripe` - Stripe webhook handler

## Features

- Seller application and approval workflow
- Stripe Connect integration with 8% fee split (5% platform + 3% donation)
- Product listing and checkout
- Admin dashboard for seller management and order tracking
- Chapter donation tracking and CSV export
- Image upload to S3

## License

ISC
