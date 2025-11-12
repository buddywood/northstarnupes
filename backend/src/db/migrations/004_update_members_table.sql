-- Migration: Update members table structure
-- Date: Initial migration
-- Adds cognito_sub, registration_status, makes fields nullable for drafts, adds verification fields
DO $$
BEGIN
  -- Add cognito_sub to members table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='members' AND column_name='cognito_sub') THEN
    ALTER TABLE members ADD COLUMN cognito_sub VARCHAR(255) UNIQUE;
  END IF;

  -- Add registration_status to members table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='members' AND column_name='registration_status') THEN
    ALTER TABLE members ADD COLUMN registration_status VARCHAR(20) DEFAULT 'DRAFT' CHECK (registration_status IN ('DRAFT', 'COMPLETE'));
  END IF;

  -- Make initiated_chapter_id nullable if it's currently NOT NULL (for drafts)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='members' AND column_name='initiated_chapter_id' AND is_nullable='NO') THEN
    ALTER TABLE members ALTER COLUMN initiated_chapter_id DROP NOT NULL;
  END IF;

  -- Make name nullable if it's currently NOT NULL (for drafts)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='members' AND column_name='name' AND is_nullable='NO') THEN
    ALTER TABLE members ALTER COLUMN name DROP NOT NULL;
  END IF;

  -- Make membership_number nullable if it's currently NOT NULL (for drafts)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='members' AND column_name='membership_number' AND is_nullable='NO') THEN
    ALTER TABLE members ALTER COLUMN membership_number DROP NOT NULL;
  END IF;

  -- Add verification fields to members table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='members' AND column_name='verification_status') THEN
    ALTER TABLE members ADD COLUMN verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'FAILED', 'MANUAL_REVIEW'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='members' AND column_name='verification_date') THEN
    ALTER TABLE members ADD COLUMN verification_date TIMESTAMP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='members' AND column_name='verification_notes') THEN
    ALTER TABLE members ADD COLUMN verification_notes TEXT;
  END IF;
END $$;

