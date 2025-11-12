-- 1Kappa Database Schema

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add status and chartered columns if they don't exist (for existing databases)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='chapters' AND column_name='status') THEN
    ALTER TABLE chapters ADD COLUMN status VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='chapters' AND column_name='chartered') THEN
    ALTER TABLE chapters ADD COLUMN chartered INTEGER;
  END IF;
END $$;

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add business_name and vendor_license_number columns if they don't exist (for existing databases)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='sellers' AND column_name='business_name') THEN
    ALTER TABLE sellers ADD COLUMN business_name VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='sellers' AND column_name='vendor_license_number') THEN
    ALTER TABLE sellers ADD COLUMN vendor_license_number VARCHAR(100);
  END IF;

  -- Make sponsoring_chapter_id required if it's currently nullable
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sellers' AND column_name='sponsoring_chapter_id' AND is_nullable='YES') THEN
    -- First, set a default value for any NULL sponsoring_chapter_id
    -- Note: We can't use initiated_chapter_id as fallback anymore since we're dropping it
    -- If there are NULL values, they'll need to be handled manually or we'll need to set a default chapter
    -- For now, we'll just enforce NOT NULL (existing NULL values will cause an error, which is expected)
    ALTER TABLE sellers ALTER COLUMN sponsoring_chapter_id SET NOT NULL;
  END IF;

  -- Add member_id foreign key (sellers can optionally be members)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='sellers' AND column_name='member_id') THEN
    ALTER TABLE sellers ADD COLUMN member_id INTEGER REFERENCES members(id);
    CREATE INDEX IF NOT EXISTS idx_sellers_member_id ON sellers(member_id);
  END IF;

  -- Add store_logo_url column for seller store logos
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='sellers' AND column_name='store_logo_url') THEN
    ALTER TABLE sellers ADD COLUMN store_logo_url TEXT;
  END IF;

  -- Make store_logo_url required (NOT NULL)
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sellers' AND column_name='store_logo_url' AND is_nullable='YES') THEN
    -- First, set a default or handle existing NULL values
    -- For now, we'll allow NULL temporarily during migration, but new records will require it
    -- You may want to add a default logo or handle existing sellers differently
    -- ALTER TABLE sellers ALTER COLUMN store_logo_url SET NOT NULL;
  END IF;

  -- Drop index on initiated_chapter_id before dropping the column
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'sellers' AND indexname = 'idx_sellers_initiated_chapter') THEN
    DROP INDEX IF EXISTS idx_sellers_initiated_chapter;
  END IF;

  -- Drop membership_number column (no longer needed - using member_id foreign key)
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sellers' AND column_name='membership_number') THEN
    ALTER TABLE sellers DROP COLUMN membership_number;
  END IF;

  -- Drop initiated_chapter_id column (no longer needed - using member_id foreign key)
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sellers' AND column_name='initiated_chapter_id') THEN
    ALTER TABLE sellers DROP COLUMN initiated_chapter_id;
  END IF;

  -- Add invitation_token column for seller account setup
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='sellers' AND column_name='invitation_token') THEN
    ALTER TABLE sellers ADD COLUMN invitation_token VARCHAR(255) UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_sellers_invitation_token ON sellers(invitation_token);
  END IF;
END $$;

-- Drop member-specific fields from sellers table (sellers reference members via member_id foreign key)
DO $$
BEGIN
  -- Drop member-specific columns from sellers if they exist
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sellers' AND column_name='location') THEN
    ALTER TABLE sellers DROP COLUMN location;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sellers' AND column_name='initiated_season') THEN
    ALTER TABLE sellers DROP COLUMN initiated_season;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sellers' AND column_name='initiated_year') THEN
    ALTER TABLE sellers DROP COLUMN initiated_year;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sellers' AND column_name='ship_name') THEN
    ALTER TABLE sellers DROP COLUMN ship_name;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sellers' AND column_name='line_name') THEN
    ALTER TABLE sellers DROP COLUMN line_name;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sellers' AND column_name='address') THEN
    ALTER TABLE sellers DROP COLUMN address;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sellers' AND column_name='address_is_private') THEN
    ALTER TABLE sellers DROP COLUMN address_is_private;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sellers' AND column_name='phone_number') THEN
    ALTER TABLE sellers DROP COLUMN phone_number;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sellers' AND column_name='phone_is_private') THEN
    ALTER TABLE sellers DROP COLUMN phone_is_private;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sellers' AND column_name='industry') THEN
    ALTER TABLE sellers DROP COLUMN industry;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sellers' AND column_name='job_title') THEN
    ALTER TABLE sellers DROP COLUMN job_title;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sellers' AND column_name='bio') THEN
    ALTER TABLE sellers DROP COLUMN bio;
  END IF;
END $$;

-- Drop member-specific fields from promoters table (promoters reference members via member_id foreign key)
DO $$
BEGIN
  -- Drop index on initiated_chapter_id before dropping the column
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'promoters' AND indexname = 'idx_promoters_initiated_chapter') THEN
    DROP INDEX IF EXISTS idx_promoters_initiated_chapter;
  END IF;

  -- Drop membership_number and initiated_chapter_id columns
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='promoters' AND column_name='membership_number') THEN
    ALTER TABLE promoters DROP COLUMN membership_number;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='promoters' AND column_name='initiated_chapter_id') THEN
    ALTER TABLE promoters DROP COLUMN initiated_chapter_id;
  END IF;

  -- Add member_id foreign key if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='promoters' AND column_name='member_id') THEN
    ALTER TABLE promoters ADD COLUMN member_id INTEGER REFERENCES members(id);
    CREATE INDEX IF NOT EXISTS idx_promoters_member_id ON promoters(member_id);
  END IF;

  -- Drop member-specific columns from promoters if they exist
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='promoters' AND column_name='location') THEN
    ALTER TABLE promoters DROP COLUMN location;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='promoters' AND column_name='initiated_season') THEN
    ALTER TABLE promoters DROP COLUMN initiated_season;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='promoters' AND column_name='initiated_year') THEN
    ALTER TABLE promoters DROP COLUMN initiated_year;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='promoters' AND column_name='ship_name') THEN
    ALTER TABLE promoters DROP COLUMN ship_name;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='promoters' AND column_name='line_name') THEN
    ALTER TABLE promoters DROP COLUMN line_name;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='promoters' AND column_name='address') THEN
    ALTER TABLE promoters DROP COLUMN address;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='promoters' AND column_name='address_is_private') THEN
    ALTER TABLE promoters DROP COLUMN address_is_private;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='promoters' AND column_name='phone_number') THEN
    ALTER TABLE promoters DROP COLUMN phone_number;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='promoters' AND column_name='phone_is_private') THEN
    ALTER TABLE promoters DROP COLUMN phone_is_private;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='promoters' AND column_name='industry') THEN
    ALTER TABLE promoters DROP COLUMN industry;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='promoters' AND column_name='job_title') THEN
    ALTER TABLE promoters DROP COLUMN job_title;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='promoters' AND column_name='bio') THEN
    ALTER TABLE promoters DROP COLUMN bio;
  END IF;

  -- Add cognito_sub to members table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='members' AND column_name='cognito_sub') THEN
    ALTER TABLE members ADD COLUMN cognito_sub VARCHAR(255) UNIQUE;
  END IF;

  -- Add registration_status to members table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='members' AND column_name='registration_status') THEN
    ALTER TABLE members ADD COLUMN registration_status VARCHAR(20) DEFAULT 'DRAFT' CHECK (registration_status IN ('DRAFT', 'COMPLETE'));
  END IF;

  -- Make initiated_chapter_id nullable if it's currently NOT NULL (for drafts)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='members' AND column_name='initiated_chapter_id' AND is_nullable='NO') THEN
    ALTER TABLE members ALTER COLUMN initiated_chapter_id DROP NOT NULL;
  END IF;

  -- Make name nullable if it's currently NOT NULL (for drafts)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='members' AND column_name='name' AND is_nullable='NO') THEN
    ALTER TABLE members ALTER COLUMN name DROP NOT NULL;
  END IF;

  -- Make membership_number nullable if it's currently NOT NULL (for drafts)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='members' AND column_name='membership_number' AND is_nullable='NO') THEN
    ALTER TABLE members ALTER COLUMN membership_number DROP NOT NULL;
  END IF;

  -- Add onboarding_status to users table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='users' AND column_name='onboarding_status') THEN
    ALTER TABLE users ADD COLUMN onboarding_status VARCHAR(50) DEFAULT 'PRE_COGNITO' CHECK (onboarding_status IN ('PRE_COGNITO', 'COGNITO_CONFIRMED', 'ONBOARDING_STARTED', 'ONBOARDING_FINISHED'));
  END IF;

  -- Add last_login to users table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='users' AND column_name='last_login') THEN
    ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
  END IF;

  -- Add verification fields to members table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='members' AND column_name='verification_status') THEN
    ALTER TABLE members ADD COLUMN verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'FAILED', 'MANUAL_REVIEW'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='members' AND column_name='verification_date') THEN
    ALTER TABLE members ADD COLUMN verification_date TIMESTAMP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='members' AND column_name='verification_notes') THEN
    ALTER TABLE members ADD COLUMN verification_notes TEXT;
  END IF;

  -- Add verification fields to sellers table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='sellers' AND column_name='verification_status') THEN
    ALTER TABLE sellers ADD COLUMN verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'FAILED', 'MANUAL_REVIEW'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='sellers' AND column_name='verification_date') THEN
    ALTER TABLE sellers ADD COLUMN verification_date TIMESTAMP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='sellers' AND column_name='verification_notes') THEN
    ALTER TABLE sellers ADD COLUMN verification_notes TEXT;
  END IF;

  -- Add verification fields to promoters table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='promoters' AND column_name='verification_status') THEN
    ALTER TABLE promoters ADD COLUMN verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'FAILED', 'MANUAL_REVIEW'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='promoters' AND column_name='verification_date') THEN
    ALTER TABLE promoters ADD COLUMN verification_date TIMESTAMP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='promoters' AND column_name='verification_notes') THEN
    ALTER TABLE promoters ADD COLUMN verification_notes TEXT;
  END IF;
END $$;

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

-- Members table - for brothers who register but haven't applied to be sellers/promoters yet
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
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'SELLER', 'PROMOTER', 'CONSUMER')),
  onboarding_status VARCHAR(50) DEFAULT 'PRE_COGNITO' CHECK (onboarding_status IN ('PRE_COGNITO', 'COGNITO_CONFIRMED', 'ONBOARDING_STARTED', 'ONBOARDING_FINISHED')),
  member_id INTEGER REFERENCES members(id),
  seller_id INTEGER REFERENCES sellers(id),
  promoter_id INTEGER REFERENCES promoters(id),
  features JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Ensure only one foreign key is set based on role
  -- CONSUMER can have null member_id during onboarding (before ONBOARDING_FINISHED)
  CONSTRAINT check_role_foreign_key CHECK (
    (role = 'CONSUMER' AND seller_id IS NULL AND promoter_id IS NULL AND (
      (member_id IS NOT NULL) OR 
      (member_id IS NULL AND onboarding_status != 'ONBOARDING_FINISHED')
    )) OR
    (role = 'SELLER' AND seller_id IS NOT NULL AND member_id IS NULL AND promoter_id IS NULL) OR
    (role = 'PROMOTER' AND promoter_id IS NOT NULL AND member_id IS NULL AND seller_id IS NULL) OR
    (role = 'ADMIN' AND member_id IS NULL AND seller_id IS NULL AND promoter_id IS NULL)
  )
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sellers_status ON sellers(status);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_sponsored_chapter ON products(sponsored_chapter_id);
CREATE INDEX IF NOT EXISTS idx_orders_product ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_promoters_status ON promoters(status);
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
CREATE INDEX IF NOT EXISTS idx_industries_active ON industries(is_active);
CREATE INDEX IF NOT EXISTS idx_industries_display_order ON industries(display_order);

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

-- Update check_role_foreign_key constraint to allow CONSUMER with null member_id during onboarding
DO $$
BEGIN
  -- Drop the old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_role_foreign_key' 
    AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users DROP CONSTRAINT check_role_foreign_key;
  END IF;
  
  -- Add the new constraint
  ALTER TABLE users ADD CONSTRAINT check_role_foreign_key CHECK (
    (role = 'CONSUMER' AND seller_id IS NULL AND promoter_id IS NULL AND (
      (member_id IS NOT NULL) OR 
      (member_id IS NULL AND onboarding_status != 'ONBOARDING_FINISHED')
    )) OR
    (role = 'SELLER' AND seller_id IS NOT NULL AND member_id IS NULL AND promoter_id IS NULL) OR
    (role = 'PROMOTER' AND promoter_id IS NOT NULL AND member_id IS NULL AND seller_id IS NULL) OR
    (role = 'ADMIN' AND member_id IS NULL AND seller_id IS NULL AND promoter_id IS NULL)
  );
END $$;

