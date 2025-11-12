-- Migration: Add status and chartered columns to chapters table
-- Date: Initial migration
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='chapters' AND column_name='status') THEN
    ALTER TABLE chapters ADD COLUMN status VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='chapters' AND column_name='chartered') THEN
    ALTER TABLE chapters ADD COLUMN chartered INTEGER;
  END IF;
END $$;

