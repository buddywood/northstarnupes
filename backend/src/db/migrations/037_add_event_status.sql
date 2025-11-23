-- Migration: Add status field to events table
-- Date: Add event status (ACTIVE, CLOSED, CANCELLED)
--
-- This migration adds a status column to the events table to allow promoters to close events

DO $$
BEGIN
  -- Add status column to events table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='events' AND column_name='status') THEN
    ALTER TABLE events ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'CANCELLED'));
    RAISE NOTICE 'Added status column to events table';
  END IF;

  -- Create index for status if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_events_status') THEN
    CREATE INDEX idx_events_status ON events(status);
    RAISE NOTICE 'Created index idx_events_status';
  END IF;
END $$;

