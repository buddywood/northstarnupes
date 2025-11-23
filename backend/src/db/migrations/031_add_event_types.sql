-- Migration: Add event_types reference table and event_type_id to events
-- Date: Add event type categorization system
-- 
-- This migration creates an event_types table and adds event_type_id to events

DO $$
BEGIN
  -- Create event_types table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_types') THEN
    CREATE TABLE event_types (
      id SERIAL PRIMARY KEY,
      enum VARCHAR(50) NOT NULL UNIQUE,
      description VARCHAR(255) NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    RAISE NOTICE 'Created event_types table';
  END IF;

  -- Add is_active column if table exists but column doesn't
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_types')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='event_types' AND column_name='is_active') THEN
    ALTER TABLE event_types ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    RAISE NOTICE 'Added is_active column to event_types table';
  END IF;

  -- Add event_type_id to events table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='events' AND column_name='event_type_id') THEN
    ALTER TABLE events ADD COLUMN event_type_id INTEGER REFERENCES event_types(id);
    RAISE NOTICE 'Added event_type_id column to events table';
  END IF;

  -- Create index for event_type_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_events_event_type') THEN
    CREATE INDEX idx_events_event_type ON events(event_type_id);
    RAISE NOTICE 'Created index idx_events_event_type';
  END IF;

  -- Insert event types if they don't exist
  INSERT INTO event_types (enum, description, display_order, is_active) VALUES
    ('SOCIAL', 'Social', 1, true),
    ('NETWORKING', 'Networking / Professional', 2, true),
    ('EDUCATIONAL', 'Educational', 3, true),
    ('FUNDRAISING', 'Fundraising / Charity', 4, true),
    ('COMMUNITY_SERVICE', 'Community Service', 5, true),
    ('WELLNESS_SPORTS', 'Wellness & Sports', 6, true),
    ('VIRTUAL', 'Virtual Events', 7, true),
    ('CREATIVE_WORKSHOP', 'Creative Workshops', 8, true),
    ('EXCLUSIVE_VIP', 'Exclusive / VIP', 9, true)
  ON CONFLICT (enum) DO NOTHING;

  RAISE NOTICE 'Inserted event types';

END $$;

