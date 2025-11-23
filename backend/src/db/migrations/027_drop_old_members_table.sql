-- Migration: Drop old members table if it still exists
-- Date: Cleanup after migration 016 renamed members to fraternity_members
-- 
-- This migration:
-- 1. Ensures fraternity_members table exists (migration 016 should have created it)
-- 2. Drops the old members table if it still exists (shouldn't exist after migration 016, but cleanup just in case)

DO $$
BEGIN
  -- Check if fraternity_members table exists (it should after migration 016)
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fraternity_members') THEN
    RAISE EXCEPTION 'fraternity_members table does not exist. Migration 016 must be run first.';
  END IF;

  -- Drop the old members table if it still exists
  -- This shouldn't exist after migration 016, but we'll clean it up just in case
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
    -- Check if there's any data in the old members table
    DECLARE
      member_count INTEGER;
    BEGIN
      EXECUTE 'SELECT COUNT(*) FROM members' INTO member_count;
      
      IF member_count > 0 THEN
        RAISE WARNING 'Old members table still exists with % rows. This should not happen after migration 016. Please investigate.', member_count;
        -- Don't drop if there's data - something went wrong
        RAISE EXCEPTION 'Old members table still exists with data. Migration 016 may have failed. Please investigate before dropping.';
      ELSE
        -- Safe to drop if empty
        DROP TABLE IF EXISTS members CASCADE;
        RAISE NOTICE 'Dropped old members table (was empty)';
      END IF;
    END;
  ELSE
    RAISE NOTICE 'Old members table does not exist (already cleaned up)';
  END IF;

END $$;

