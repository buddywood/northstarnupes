-- Migration: Ensure sellers.fraternity_member_id column exists
-- Date: Safety check to ensure column exists after all migrations
-- This migration runs after all others to guarantee the column exists

DO $$
BEGIN
  -- Ensure sellers table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sellers') THEN
    RETURN;
  END IF;

  -- Check if fraternity_member_id column exists in sellers table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'sellers' AND column_name = 'fraternity_member_id') THEN
    -- Column doesn't exist, add it
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fraternity_members') THEN
      ALTER TABLE sellers ADD COLUMN fraternity_member_id INTEGER REFERENCES fraternity_members(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_sellers_fraternity_member_id ON sellers(fraternity_member_id);
      RAISE NOTICE 'Added fraternity_member_id column to sellers table';
    ELSE
      RAISE WARNING 'Cannot add fraternity_member_id to sellers: fraternity_members table does not exist';
    END IF;
  ELSE
    RAISE NOTICE 'fraternity_member_id column already exists in sellers table';
  END IF;
END $$;

