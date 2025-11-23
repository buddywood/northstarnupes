-- Migration: Ensure fraternity_member_id column exists in stewards table and remove it from users table
-- Date: Fix for databases that may have member_id or missing columns
-- 
-- This migration ensures that:
-- 1. stewards table has fraternity_member_id (renames member_id if exists, adds if missing)
-- 2. users table does NOT have fraternity_member_id (drops it if exists - fraternity member IDs are kept on role tables)
-- 3. Updates foreign key constraints to use the correct column name

DO $$
DECLARE
  constraint_name_var TEXT;
BEGIN
  -- Stewards table: Ensure fraternity_member_id exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stewards') THEN
    -- If member_id exists, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'stewards' AND column_name = 'member_id') THEN
      ALTER TABLE stewards RENAME COLUMN member_id TO fraternity_member_id;
      RAISE NOTICE 'Renamed stewards.member_id to fraternity_member_id';
      
      -- Update foreign key constraint if it exists with old name
      IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                WHERE table_name = 'stewards' AND constraint_type = 'FOREIGN KEY'
                AND constraint_name LIKE '%member_id%') THEN
        SELECT conname INTO constraint_name_var
        FROM pg_constraint
        WHERE conrelid = 'stewards'::regclass
        AND contype = 'f'
        AND conname LIKE '%member_id%';
        
        IF constraint_name_var IS NOT NULL THEN
          EXECUTE format('ALTER TABLE stewards DROP CONSTRAINT %I', constraint_name_var);
          ALTER TABLE stewards ADD CONSTRAINT stewards_fraternity_member_id_fkey 
            FOREIGN KEY (fraternity_member_id) REFERENCES fraternity_members(id) ON DELETE RESTRICT;
          RAISE NOTICE 'Recreated stewards foreign key constraint';
        END IF;
      END IF;
    -- If fraternity_member_id doesn't exist and member_id doesn't exist, add it
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'stewards' AND column_name = 'fraternity_member_id') THEN
      -- Check if fraternity_members table exists
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fraternity_members') THEN
        ALTER TABLE stewards ADD COLUMN fraternity_member_id INTEGER NOT NULL REFERENCES fraternity_members(id) ON DELETE RESTRICT;
        CREATE INDEX IF NOT EXISTS idx_stewards_fraternity_member_id ON stewards(fraternity_member_id);
        RAISE NOTICE 'Added stewards.fraternity_member_id column';
      END IF;
    END IF;
  END IF;

  -- Users table: Remove fraternity_member_id (it should not be in users table)
  -- Fraternity member IDs are kept on role-specific tables: sellers, promoters, stewards
  -- For GUEST users who are members, link through email/cognito_sub matching
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    -- Drop foreign key constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
              WHERE table_name = 'users' AND constraint_type = 'FOREIGN KEY'
              AND (constraint_name LIKE '%member_id%' OR constraint_name LIKE '%fraternity_member_id%')) THEN
      SELECT conname INTO constraint_name_var
      FROM pg_constraint
      WHERE conrelid = 'users'::regclass
      AND contype = 'f'
      AND (conname LIKE '%member_id%' OR conname LIKE '%fraternity_member_id%');
      
      IF constraint_name_var IS NOT NULL THEN
        EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', constraint_name_var);
        RAISE NOTICE 'Dropped users foreign key constraint for fraternity_member_id';
      END IF;
    END IF;
    
    -- Drop index if it exists
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_fraternity_member_id' OR indexname = 'idx_users_member_id') THEN
      DROP INDEX IF EXISTS idx_users_fraternity_member_id;
      DROP INDEX IF EXISTS idx_users_member_id;
      RAISE NOTICE 'Dropped users index for fraternity_member_id';
    END IF;
    
    -- Drop the column if it exists (either as member_id or fraternity_member_id)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'fraternity_member_id') THEN
      ALTER TABLE users DROP COLUMN fraternity_member_id;
      RAISE NOTICE 'Dropped users.fraternity_member_id column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'member_id') THEN
      ALTER TABLE users DROP COLUMN member_id;
      RAISE NOTICE 'Dropped users.member_id column';
    END IF;
  END IF;
END $$;

