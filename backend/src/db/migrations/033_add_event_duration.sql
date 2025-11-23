-- Migration: Add duration and all_day fields to events table
-- Date: Add event duration tracking
-- 
-- This migration adds duration_minutes and all_day fields to events

DO $$
BEGIN
  -- Add all_day boolean to events table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='events' AND column_name='all_day') THEN
    ALTER TABLE events ADD COLUMN all_day BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Added all_day column to events table';
  END IF;

  -- Add duration_minutes integer to events table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='events' AND column_name='duration_minutes') THEN
    ALTER TABLE events ADD COLUMN duration_minutes INTEGER;
    RAISE NOTICE 'Added duration_minutes column to events table';
  END IF;

  -- Add check constraint to ensure duration_minutes is provided when all_day is false
  -- Note: This is a soft constraint - we'll validate in application code
  -- PostgreSQL doesn't support conditional NOT NULL constraints easily

END $$;

