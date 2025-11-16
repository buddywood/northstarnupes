-- Migration: Remove sponsored_chapter_id from products table
-- Date: Chapter association now comes from seller object (seller.sponsoring_chapter_id)
-- 
-- This migration removes the sponsored_chapter_id column from products table
-- since chapter information is now derived from the seller's sponsoring_chapter_id

DO $$
DECLARE
  constraint_name_var TEXT;
  sponsored_chapter_attnum SMALLINT;
BEGIN
  -- Get attribute number for the column
  SELECT attnum INTO sponsored_chapter_attnum FROM pg_attribute 
  WHERE attrelid = 'products'::regclass AND attname = 'sponsored_chapter_id';

  -- Drop the index if it exists
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_sponsored_chapter') THEN
    DROP INDEX IF EXISTS idx_products_sponsored_chapter;
    RAISE NOTICE 'Dropped index idx_products_sponsored_chapter';
  END IF;

  -- Drop the foreign key constraint if it exists
  IF sponsored_chapter_attnum IS NOT NULL THEN
    SELECT conname INTO constraint_name_var
    FROM pg_constraint
    WHERE conrelid = 'products'::regclass
    AND contype = 'f'
    AND ARRAY[sponsored_chapter_attnum]::int[] <@ conkey::int[];
    
    IF constraint_name_var IS NOT NULL THEN
      EXECUTE format('ALTER TABLE products DROP CONSTRAINT %I', constraint_name_var);
      RAISE NOTICE 'Dropped foreign key constraint %', constraint_name_var;
    END IF;
  END IF;

  -- Drop the column if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='products' 
             AND column_name='sponsored_chapter_id') THEN
    ALTER TABLE products DROP COLUMN sponsored_chapter_id;
    RAISE NOTICE 'Dropped column products.sponsored_chapter_id';
  ELSE
    RAISE NOTICE 'Column products.sponsored_chapter_id does not exist, skipping';
  END IF;

END $$;

