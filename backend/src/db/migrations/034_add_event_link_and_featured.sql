-- Migration: Add event_link and featured promotion fields to events table
-- Date: Add event discovery and featured promotion
-- 
-- This migration adds event_link, is_featured, and featured_payment_status fields

DO $$
BEGIN
  -- Add event_link to events table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='events' AND column_name='event_link') THEN
    ALTER TABLE events ADD COLUMN event_link TEXT;
    RAISE NOTICE 'Added event_link column to events table';
  END IF;

  -- Add is_featured boolean to events table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='events' AND column_name='is_featured') THEN
    ALTER TABLE events ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Added is_featured column to events table';
  END IF;

  -- Add featured_payment_status to events table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='events' AND column_name='featured_payment_status') THEN
    ALTER TABLE events ADD COLUMN featured_payment_status VARCHAR(50) DEFAULT 'UNPAID';
    -- Possible values: UNPAID, PENDING, PAID, FAILED, REFUNDED
    RAISE NOTICE 'Added featured_payment_status column to events table';
  END IF;

  -- Add stripe_payment_intent_id to track Stripe payments
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='events' AND column_name='stripe_payment_intent_id') THEN
    ALTER TABLE events ADD COLUMN stripe_payment_intent_id VARCHAR(255);
    RAISE NOTICE 'Added stripe_payment_intent_id column to events table';
  END IF;

END $$;

