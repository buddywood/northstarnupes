-- Migration: Add verification fields to sellers and promoters
-- Date: Initial migration
DO $$
BEGIN
  -- Add verification fields to sellers table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='sellers' AND column_name='verification_status') THEN
    ALTER TABLE sellers ADD COLUMN verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'FAILED', 'MANUAL_REVIEW'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='sellers' AND column_name='verification_date') THEN
    ALTER TABLE sellers ADD COLUMN verification_date TIMESTAMP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='sellers' AND column_name='verification_notes') THEN
    ALTER TABLE sellers ADD COLUMN verification_notes TEXT;
  END IF;

  -- Add verification fields to promoters table (only if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='promoters') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='promoters' AND column_name='verification_status') THEN
      ALTER TABLE promoters ADD COLUMN verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'FAILED', 'MANUAL_REVIEW'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='promoters' AND column_name='verification_date') THEN
      ALTER TABLE promoters ADD COLUMN verification_date TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='promoters' AND column_name='verification_notes') THEN
      ALTER TABLE promoters ADD COLUMN verification_notes TEXT;
    END IF;
  END IF;
END $$;

