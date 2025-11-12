-- Migration: Add stripe_account_id to chapters table
-- Date: Initial migration
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='chapters' AND column_name='stripe_account_id') THEN
    ALTER TABLE chapters ADD COLUMN stripe_account_id VARCHAR(255);
  END IF;
END $$;

