-- Migration: Rename members table to fraternity_members and member_id columns to fraternity_member_id
-- Date: Breaking change to clarify that "members" refers to fraternity membership, not general website users
-- 
-- This migration:
-- 1. Renames the members table to fraternity_members
-- 2. Renames all member_id foreign key columns to fraternity_member_id
-- 3. Updates all foreign key constraints
-- 4. Updates all indexes

DO $$
DECLARE
  constraint_name_var TEXT;
BEGIN
  -- Step 1: Rename the members table to fraternity_members
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
    ALTER TABLE members RENAME TO fraternity_members;
    RAISE NOTICE 'Renamed table members to fraternity_members';
  END IF;

  -- Step 2: Rename member_id columns in all referencing tables
  -- Sellers table
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'sellers' AND column_name = 'member_id') THEN
    ALTER TABLE sellers RENAME COLUMN member_id TO fraternity_member_id;
    RAISE NOTICE 'Renamed sellers.member_id to fraternity_member_id';
  END IF;

  -- Promoters table
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'promoters' AND column_name = 'member_id') THEN
    ALTER TABLE promoters RENAME COLUMN member_id TO fraternity_member_id;
    RAISE NOTICE 'Renamed promoters.member_id to fraternity_member_id';
  END IF;

  -- Stewards table
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'stewards' AND column_name = 'member_id') THEN
    ALTER TABLE stewards RENAME COLUMN member_id TO fraternity_member_id;
    RAISE NOTICE 'Renamed stewards.member_id to fraternity_member_id';
  END IF;

  -- Users table
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'users' AND column_name = 'member_id') THEN
    ALTER TABLE users RENAME COLUMN member_id TO fraternity_member_id;
    RAISE NOTICE 'Renamed users.member_id to fraternity_member_id';
  END IF;

  -- Steward claims table
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'steward_claims' AND column_name = 'claimed_by_member_id') THEN
    ALTER TABLE steward_claims RENAME COLUMN claimed_by_member_id TO claimed_by_fraternity_member_id;
    RAISE NOTICE 'Renamed steward_claims.claimed_by_member_id to claimed_by_fraternity_member_id';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'steward_claims' AND column_name = 'claimant_member_id') THEN
    ALTER TABLE steward_claims RENAME COLUMN claimant_member_id TO claimant_fraternity_member_id;
    RAISE NOTICE 'Renamed steward_claims.claimant_member_id to claimant_fraternity_member_id';
  END IF;

  -- Step 3: Drop and recreate foreign key constraints with new column names
  -- Sellers foreign key
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'sellers' AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%member_id%') THEN
    SELECT conname INTO constraint_name_var
    FROM pg_constraint
    WHERE conrelid = 'sellers'::regclass
    AND contype = 'f'
    AND conname LIKE '%member_id%';
    
    IF constraint_name_var IS NOT NULL THEN
      EXECUTE format('ALTER TABLE sellers DROP CONSTRAINT %I', constraint_name_var);
      ALTER TABLE sellers ADD CONSTRAINT sellers_fraternity_member_id_fkey 
        FOREIGN KEY (fraternity_member_id) REFERENCES fraternity_members(id) ON DELETE SET NULL;
      RAISE NOTICE 'Recreated sellers foreign key constraint';
    END IF;
  END IF;

  -- Promoters foreign key
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'promoters' AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%member_id%') THEN
    SELECT conname INTO constraint_name_var
    FROM pg_constraint
    WHERE conrelid = 'promoters'::regclass
    AND contype = 'f'
    AND conname LIKE '%member_id%';
    
    IF constraint_name_var IS NOT NULL THEN
      EXECUTE format('ALTER TABLE promoters DROP CONSTRAINT %I', constraint_name_var);
      ALTER TABLE promoters ADD CONSTRAINT promoters_fraternity_member_id_fkey 
        FOREIGN KEY (fraternity_member_id) REFERENCES fraternity_members(id) ON DELETE SET NULL;
      RAISE NOTICE 'Recreated promoters foreign key constraint';
    END IF;
  END IF;

  -- Stewards foreign key
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

  -- Users foreign key
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'users' AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%member_id%') THEN
    SELECT conname INTO constraint_name_var
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
    AND contype = 'f'
    AND conname LIKE '%member_id%';
    
    IF constraint_name_var IS NOT NULL THEN
      EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', constraint_name_var);
      ALTER TABLE users ADD CONSTRAINT users_fraternity_member_id_fkey 
        FOREIGN KEY (fraternity_member_id) REFERENCES fraternity_members(id) ON DELETE SET NULL;
      RAISE NOTICE 'Recreated users foreign key constraint';
    END IF;
  END IF;

  -- Steward claims foreign keys
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'steward_claims' AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%member_id%') THEN
    -- claimed_by_fraternity_member_id
    SELECT conname INTO constraint_name_var
    FROM pg_constraint
    WHERE conrelid = 'steward_claims'::regclass
    AND contype = 'f'
    AND conname LIKE '%claimed_by_member_id%';
    
    IF constraint_name_var IS NOT NULL THEN
      EXECUTE format('ALTER TABLE steward_claims DROP CONSTRAINT %I', constraint_name_var);
      ALTER TABLE steward_claims ADD CONSTRAINT steward_claims_claimed_by_fraternity_member_id_fkey 
        FOREIGN KEY (claimed_by_fraternity_member_id) REFERENCES fraternity_members(id) ON DELETE CASCADE;
      RAISE NOTICE 'Recreated steward_claims.claimed_by foreign key constraint';
    END IF;

    -- claimant_fraternity_member_id
    SELECT conname INTO constraint_name_var
    FROM pg_constraint
    WHERE conrelid = 'steward_claims'::regclass
    AND contype = 'f'
    AND conname LIKE '%claimant_member_id%';
    
    IF constraint_name_var IS NOT NULL THEN
      EXECUTE format('ALTER TABLE steward_claims DROP CONSTRAINT %I', constraint_name_var);
      ALTER TABLE steward_claims ADD CONSTRAINT steward_claims_claimant_fraternity_member_id_fkey 
        FOREIGN KEY (claimant_fraternity_member_id) REFERENCES fraternity_members(id) ON DELETE RESTRICT;
      RAISE NOTICE 'Recreated steward_claims.claimant foreign key constraint';
    END IF;
  END IF;

  -- Step 4: Rename or create indexes
  -- Sellers
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sellers_member_id') THEN
    ALTER INDEX idx_sellers_member_id RENAME TO idx_sellers_fraternity_member_id;
    RAISE NOTICE 'Renamed index idx_sellers_member_id';
  ELSE
    CREATE INDEX IF NOT EXISTS idx_sellers_fraternity_member_id ON sellers(fraternity_member_id);
    RAISE NOTICE 'Created index idx_sellers_fraternity_member_id';
  END IF;

  -- Promoters
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_promoters_member_id') THEN
    ALTER INDEX idx_promoters_member_id RENAME TO idx_promoters_fraternity_member_id;
    RAISE NOTICE 'Renamed index idx_promoters_member_id';
  ELSE
    CREATE INDEX IF NOT EXISTS idx_promoters_fraternity_member_id ON promoters(fraternity_member_id);
    RAISE NOTICE 'Created index idx_promoters_fraternity_member_id';
  END IF;

  -- Stewards
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stewards_member_id') THEN
    ALTER INDEX idx_stewards_member_id RENAME TO idx_stewards_fraternity_member_id;
    RAISE NOTICE 'Renamed index idx_stewards_member_id';
  ELSE
    CREATE INDEX IF NOT EXISTS idx_stewards_fraternity_member_id ON stewards(fraternity_member_id);
    RAISE NOTICE 'Created index idx_stewards_fraternity_member_id';
  END IF;

  -- Users
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_member_id') THEN
    ALTER INDEX idx_users_member_id RENAME TO idx_users_fraternity_member_id;
    RAISE NOTICE 'Renamed index idx_users_member_id';
  ELSE
    CREATE INDEX IF NOT EXISTS idx_users_fraternity_member_id ON users(fraternity_member_id);
    RAISE NOTICE 'Created index idx_users_fraternity_member_id';
  END IF;

  -- Steward claims claimant
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_steward_claims_claimant') THEN
    ALTER INDEX idx_steward_claims_claimant RENAME TO idx_steward_claims_claimant_fraternity_member;
    RAISE NOTICE 'Renamed index idx_steward_claims_claimant';
  ELSE
    CREATE INDEX IF NOT EXISTS idx_steward_claims_claimant_fraternity_member ON steward_claims(claimant_fraternity_member_id);
    RAISE NOTICE 'Created index idx_steward_claims_claimant_fraternity_member';
  END IF;

  -- Step 5: Update CHECK constraints in users table that reference member_id
  -- Drop the existing check constraint
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'users' AND constraint_name = 'check_role_foreign_key') THEN
    ALTER TABLE users DROP CONSTRAINT check_role_foreign_key;
    RAISE NOTICE 'Dropped check_role_foreign_key constraint';
  END IF;

  -- Recreate with new column name
  ALTER TABLE users ADD CONSTRAINT check_role_foreign_key CHECK (
    (role = 'CONSUMER' AND 
      (fraternity_member_id IS NOT NULL) OR 
      (fraternity_member_id IS NULL AND onboarding_status != 'ONBOARDING_FINISHED')
    ) OR
    (role = 'SELLER' AND seller_id IS NOT NULL AND fraternity_member_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
    (role = 'PROMOTER' AND promoter_id IS NOT NULL AND fraternity_member_id IS NULL AND seller_id IS NULL AND steward_id IS NULL) OR
    (role = 'STEWARD' AND steward_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND (
      seller_id IS NULL AND promoter_id IS NULL
    )) OR
    (role = 'ADMIN' AND fraternity_member_id IS NULL AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL)
  );
  RAISE NOTICE 'Recreated check_role_foreign_key constraint with fraternity_member_id';

END $$;

