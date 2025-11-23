-- Migration: Add fraternity_member_id column back to users table
-- Date: Users table should have fraternity_member_id populated during member registration
-- 
-- This migration:
-- 1. Adds fraternity_member_id column to users table if it doesn't exist
-- 2. Creates foreign key constraint to fraternity_members table
-- 3. Creates index for performance
-- 4. Updates check_role_foreign_key constraint to allow GUEST users to have fraternity_member_id

DO $$
DECLARE
  constraint_name_var TEXT;
BEGIN
  -- Add fraternity_member_id column to users table if it doesn't exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'fraternity_member_id') THEN
      -- Check if fraternity_members table exists
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fraternity_members') THEN
        ALTER TABLE users ADD COLUMN fraternity_member_id INTEGER REFERENCES fraternity_members(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_users_fraternity_member_id ON users(fraternity_member_id);
        RAISE NOTICE 'Added users.fraternity_member_id column';
      ELSE
        RAISE EXCEPTION 'fraternity_members table does not exist. Migration 016 must be run first.';
      END IF;
    ELSE
      RAISE NOTICE 'users.fraternity_member_id column already exists';
    END IF;

    -- Update check_role_foreign_key constraint to allow GUEST users to have fraternity_member_id
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
              WHERE table_name = 'users' AND constraint_name = 'check_role_foreign_key') THEN
      ALTER TABLE users DROP CONSTRAINT check_role_foreign_key;
      RAISE NOTICE 'Dropped check_role_foreign_key constraint';
    END IF;

    -- Recreate constraint allowing GUEST users to have fraternity_member_id
    ALTER TABLE users ADD CONSTRAINT check_role_foreign_key CHECK (
      (role = 'GUEST' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
      (role = 'SELLER' AND seller_id IS NOT NULL AND fraternity_member_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
      (role = 'PROMOTER' AND promoter_id IS NOT NULL AND fraternity_member_id IS NULL AND seller_id IS NULL AND steward_id IS NULL) OR
      (role = 'STEWARD' AND steward_id IS NOT NULL AND (
        (seller_id IS NULL AND promoter_id IS NULL) OR
        (seller_id IS NOT NULL AND promoter_id IS NULL) OR
        (seller_id IS NULL AND promoter_id IS NOT NULL) OR
        (seller_id IS NOT NULL AND promoter_id IS NOT NULL)
      )) OR
      (role = 'ADMIN' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL)
    );
    RAISE NOTICE 'Recreated check_role_foreign_key constraint allowing GUEST users to have fraternity_member_id';
  END IF;
END $$;

