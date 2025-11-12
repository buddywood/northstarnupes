-- Migration: Update sellers table structure
-- Date: Initial migration
-- Adds business fields, removes member-specific fields, adds verification fields
DO $$
BEGIN
  -- Add business_name and vendor_license_number columns if they don't exist
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

  -- Add business_email column (for members who want a different business email)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='sellers' AND column_name='business_email') THEN
    ALTER TABLE sellers ADD COLUMN business_email VARCHAR(255);
  END IF;

  -- Add website column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='sellers' AND column_name='website') THEN
    ALTER TABLE sellers ADD COLUMN website VARCHAR(500);
  END IF;

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

