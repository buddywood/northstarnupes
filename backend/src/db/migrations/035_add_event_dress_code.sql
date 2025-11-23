-- Migration: Add dress_code_type and dress_code_notes to events table
-- Date: Add event dress code fields
--
-- This migration adds dress_code_type (required) and dress_code_notes (optional) to the events table

DO $$
BEGIN
  -- Add dress_code_type column to events table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='events' AND column_name='dress_code_type') THEN
    ALTER TABLE events ADD COLUMN dress_code_type VARCHAR(50) NOT NULL DEFAULT 'business_casual';
    RAISE NOTICE 'Added dress_code_type column to events table';
  END IF;

  -- Add dress_code_notes column to events table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='events' AND column_name='dress_code_notes') THEN
    ALTER TABLE events ADD COLUMN dress_code_notes TEXT;
    RAISE NOTICE 'Added dress_code_notes column to events table';
  END IF;

  -- Add check constraint for dress_code_type enum values
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'events' AND constraint_name = 'events_dress_code_type_check'
  ) THEN
    ALTER TABLE events ADD CONSTRAINT events_dress_code_type_check
      CHECK (dress_code_type IN (
        'business', 'business_casual', 'formal', 'semi_formal',
        'kappa_casual', 'greek_encouraged', 'greek_required',
        'outdoor', 'athletic', 'comfortable', 'all_white'
      ));
    RAISE NOTICE 'Added dress_code_type check constraint';
  END IF;
END $$;

