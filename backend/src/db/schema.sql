-- 1Kappa Database Schema - Initial Creation Only
-- This file contains only CREATE TABLE statements for a fresh database
-- For schema changes, use migration files in the migrations/ directory

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(100),
  chartered INTEGER,
  province VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(100),
  contact_email VARCHAR(255),
  stripe_account_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Members table - must be created before sellers/promoters that reference it
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  membership_number VARCHAR(100) UNIQUE,
  cognito_sub VARCHAR(255) UNIQUE, -- AWS Cognito user ID
  registration_status VARCHAR(20) DEFAULT 'DRAFT' CHECK (registration_status IN ('DRAFT', 'COMPLETE')), -- Track registration completion
  initiated_chapter_id INTEGER REFERENCES chapters(id), -- Nullable for drafts, required for COMPLETE registrations
  initiated_season VARCHAR(50),
  initiated_year INTEGER,
  ship_name VARCHAR(255),
  line_name VARCHAR(255),
  location VARCHAR(255),
  address TEXT,
  address_is_private BOOLEAN DEFAULT false,
  phone_number VARCHAR(50),
  phone_is_private BOOLEAN DEFAULT false,
  industry VARCHAR(255),
  job_title VARCHAR(255),
  bio TEXT,
  headshot_url TEXT,
  social_links JSONB DEFAULT '{}',
  verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'FAILED', 'MANUAL_REVIEW')),
  verification_date TIMESTAMP,
  verification_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sellers table
CREATE TABLE IF NOT EXISTS sellers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  member_id INTEGER REFERENCES members(id),
  sponsoring_chapter_id INTEGER NOT NULL REFERENCES chapters(id),
  business_name VARCHAR(255),
  vendor_license_number VARCHAR(100) NOT NULL,
  headshot_url TEXT,
  store_logo_url TEXT,
  social_links JSONB DEFAULT '{}',
  stripe_account_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  invitation_token VARCHAR(255) UNIQUE,
  business_email VARCHAR(255),
  website VARCHAR(500),
  verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'FAILED', 'MANUAL_REVIEW')),
  verification_date TIMESTAMP,
  verification_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES sellers(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  image_url TEXT,
  sponsored_chapter_id INTEGER REFERENCES chapters(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  buyer_email VARCHAR(255) NOT NULL,
  amount_cents INTEGER NOT NULL,
  stripe_session_id VARCHAR(255) UNIQUE,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED')),
  chapter_id INTEGER REFERENCES chapters(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Promoters table
CREATE TABLE IF NOT EXISTS promoters (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  member_id INTEGER REFERENCES members(id),
  sponsoring_chapter_id INTEGER REFERENCES chapters(id),
  headshot_url TEXT,
  social_links JSONB DEFAULT '{}',
  stripe_account_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'FAILED', 'MANUAL_REVIEW')),
  verification_date TIMESTAMP,
  verification_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  promoter_id INTEGER NOT NULL REFERENCES promoters(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMP NOT NULL,
  location VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  image_url TEXT,
  sponsored_chapter_id INTEGER REFERENCES chapters(id),
  ticket_price_cents INTEGER DEFAULT 0,
  max_attendees INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Industries table - for professional industries
CREATE TABLE IF NOT EXISTS industries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table - for authentication and role management
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  cognito_sub VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'SELLER', 'PROMOTER', 'CONSUMER', 'STEWARD')),
  onboarding_status VARCHAR(50) DEFAULT 'PRE_COGNITO' CHECK (onboarding_status IN ('PRE_COGNITO', 'COGNITO_CONFIRMED', 'ONBOARDING_STARTED', 'ONBOARDING_FINISHED')),
  member_id INTEGER REFERENCES members(id),
  seller_id INTEGER REFERENCES sellers(id),
  promoter_id INTEGER REFERENCES promoters(id),
  steward_id INTEGER REFERENCES stewards(id),
  features JSONB DEFAULT '{}',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Ensure only one foreign key is set based on role
  CONSTRAINT check_role_foreign_key CHECK (
    (role = 'CONSUMER' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL AND (
      (member_id IS NOT NULL) OR 
      (member_id IS NULL AND onboarding_status != 'ONBOARDING_FINISHED')
    )) OR
    (role = 'SELLER' AND seller_id IS NOT NULL AND member_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
    (role = 'PROMOTER' AND promoter_id IS NOT NULL AND member_id IS NULL AND seller_id IS NULL AND steward_id IS NULL) OR
    (role = 'STEWARD' AND steward_id IS NOT NULL AND member_id IS NOT NULL AND (
      (seller_id IS NULL AND promoter_id IS NULL) OR
      (seller_id IS NOT NULL AND promoter_id IS NULL) OR
      (seller_id IS NULL AND promoter_id IS NOT NULL) OR
      (seller_id IS NOT NULL AND promoter_id IS NOT NULL)
    )) OR
    (role = 'ADMIN' AND member_id IS NULL AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL)
  )
);

-- Stewards table
CREATE TABLE IF NOT EXISTS stewards (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL UNIQUE REFERENCES members(id),
  sponsoring_chapter_id INTEGER NOT NULL REFERENCES chapters(id),
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'FAILED', 'MANUAL_REVIEW')),
  verification_date TIMESTAMP,
  verification_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Steward listings table
CREATE TABLE IF NOT EXISTS steward_listings (
  id SERIAL PRIMARY KEY,
  steward_id INTEGER NOT NULL REFERENCES stewards(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  shipping_cost_cents INTEGER NOT NULL CHECK (shipping_cost_cents >= 0),
  chapter_donation_cents INTEGER NOT NULL CHECK (chapter_donation_cents >= 0),
  sponsoring_chapter_id INTEGER NOT NULL REFERENCES chapters(id),
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLAIMED', 'REMOVED')),
  claimed_by_member_id INTEGER REFERENCES members(id),
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Steward claims table
CREATE TABLE IF NOT EXISTS steward_claims (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES steward_listings(id),
  claimant_member_id INTEGER NOT NULL REFERENCES members(id),
  stripe_session_id VARCHAR(255) UNIQUE,
  total_amount_cents INTEGER NOT NULL CHECK (total_amount_cents >= 0),
  shipping_cents INTEGER NOT NULL CHECK (shipping_cents >= 0),
  platform_fee_cents INTEGER NOT NULL CHECK (platform_fee_cents >= 0),
  chapter_donation_cents INTEGER NOT NULL CHECK (chapter_donation_cents >= 0),
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sellers_status ON sellers(status);
CREATE INDEX IF NOT EXISTS idx_sellers_member_id ON sellers(member_id);
CREATE INDEX IF NOT EXISTS idx_sellers_invitation_token ON sellers(invitation_token);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_sponsored_chapter ON products(sponsored_chapter_id);
CREATE INDEX IF NOT EXISTS idx_orders_product ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_promoters_status ON promoters(status);
CREATE INDEX IF NOT EXISTS idx_promoters_member_id ON promoters(member_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_membership_number ON members(membership_number);
CREATE INDEX IF NOT EXISTS idx_members_initiated_chapter ON members(initiated_chapter_id);
CREATE INDEX IF NOT EXISTS idx_events_promoter ON events(promoter_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_sponsored_chapter ON events(sponsored_chapter_id);
CREATE INDEX IF NOT EXISTS idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_member_id ON users(member_id);
CREATE INDEX IF NOT EXISTS idx_users_seller_id ON users(seller_id);
CREATE INDEX IF NOT EXISTS idx_users_promoter_id ON users(promoter_id);
CREATE INDEX IF NOT EXISTS idx_users_steward_id ON users(steward_id);
CREATE INDEX IF NOT EXISTS idx_industries_active ON industries(is_active);
CREATE INDEX IF NOT EXISTS idx_industries_display_order ON industries(display_order);
CREATE INDEX IF NOT EXISTS idx_stewards_member_id ON stewards(member_id);
CREATE INDEX IF NOT EXISTS idx_stewards_sponsoring_chapter ON stewards(sponsoring_chapter_id);
CREATE INDEX IF NOT EXISTS idx_stewards_status ON stewards(status);
CREATE INDEX IF NOT EXISTS idx_steward_listings_steward ON steward_listings(steward_id);
CREATE INDEX IF NOT EXISTS idx_steward_listings_status ON steward_listings(status);
CREATE INDEX IF NOT EXISTS idx_steward_listings_sponsoring_chapter ON steward_listings(sponsoring_chapter_id);
CREATE INDEX IF NOT EXISTS idx_steward_claims_listing ON steward_claims(listing_id);
CREATE INDEX IF NOT EXISTS idx_steward_claims_claimant ON steward_claims(claimant_member_id);
CREATE INDEX IF NOT EXISTS idx_steward_claims_status ON steward_claims(status);
CREATE INDEX IF NOT EXISTS idx_steward_claims_stripe_session ON steward_claims(stripe_session_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_chapters_updated_at ON chapters;
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sellers_updated_at ON sellers;
CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON sellers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_promoters_updated_at ON promoters;
CREATE TRIGGER update_promoters_updated_at BEFORE UPDATE ON promoters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_industries_updated_at ON industries;
CREATE TRIGGER update_industries_updated_at BEFORE UPDATE ON industries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stewards_updated_at ON stewards;
CREATE TRIGGER update_stewards_updated_at BEFORE UPDATE ON stewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_steward_listings_updated_at ON steward_listings;
CREATE TRIGGER update_steward_listings_updated_at BEFORE UPDATE ON steward_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_steward_claims_updated_at ON steward_claims;
CREATE TRIGGER update_steward_claims_updated_at BEFORE UPDATE ON steward_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON platform_settings;
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
