-- Migration: Remove max_attendees column from events table
-- Date: Remove attendance tracking
--
-- This migration removes the max_attendees column since we don't track attendance

DO $$
BEGIN
  -- Drop max_attendees column if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='events' AND column_name='max_attendees') THEN
    ALTER TABLE events DROP COLUMN max_attendees;
    RAISE NOTICE 'Dropped max_attendees column from events table';
  END IF;
END $$;

