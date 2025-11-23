-- Migration: Drop dress_code_type column from events table
-- Date: Remove old dress_code_type column (replaced by dress_codes)
--
-- This migration explicitly drops the dress_code_type column if it still exists
-- after migration 036 renamed it to dress_codes

DO $$
BEGIN
  -- Check if dress_code_type column still exists (shouldn't after migration 036, but just in case)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'dress_code_type'
  ) THEN
    -- Drop any constraints on the column first
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'events' AND constraint_name = 'events_dress_code_type_check'
    ) THEN
      ALTER TABLE events DROP CONSTRAINT events_dress_code_type_check;
      RAISE NOTICE 'Dropped events_dress_code_type_check constraint';
    END IF;

    -- Drop the column
    ALTER TABLE events DROP COLUMN dress_code_type;
    RAISE NOTICE 'Dropped dress_code_type column from events table';
  ELSE
    RAISE NOTICE 'dress_code_type column does not exist - migration 036 already renamed it to dress_codes';
  END IF;
END $$;

