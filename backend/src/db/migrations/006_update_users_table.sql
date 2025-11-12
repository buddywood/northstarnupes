-- Migration: Update users table structure
-- Date: Initial migration
-- Adds onboarding_status, last_login, steward_id, updates role enum and constraints
DO $$
BEGIN
  -- Add onboarding_status to users table if it doesn't exist (only if users table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='onboarding_status') THEN
      ALTER TABLE users ADD COLUMN onboarding_status VARCHAR(50) DEFAULT 'PRE_COGNITO' CHECK (onboarding_status IN ('PRE_COGNITO', 'COGNITO_CONFIRMED', 'ONBOARDING_STARTED', 'ONBOARDING_FINISHED'));
    END IF;

    -- Add last_login to users table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='last_login') THEN
      ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
    END IF;

    -- Add steward_id to users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='steward_id') THEN
      ALTER TABLE users ADD COLUMN steward_id INTEGER REFERENCES stewards(id);
      CREATE INDEX IF NOT EXISTS idx_users_steward_id ON users(steward_id);
    END IF;

    -- Update users role enum to include STEWARD
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'users_role_check' 
      AND conrelid = 'users'::regclass
    ) THEN
      ALTER TABLE users DROP CONSTRAINT users_role_check;
    END IF;
    
    -- Add the new constraint with STEWARD role
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'SELLER', 'PROMOTER', 'CONSUMER', 'STEWARD'));

    -- Update check_role_foreign_key constraint to allow role coexistence
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'check_role_foreign_key' 
      AND conrelid = 'users'::regclass
    ) THEN
      ALTER TABLE users DROP CONSTRAINT check_role_foreign_key;
    END IF;
    
    -- Add the new constraint allowing role coexistence for STEWARD
    ALTER TABLE users ADD CONSTRAINT check_role_foreign_key CHECK (
      (role = 'CONSUMER' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL AND (
        (member_id IS NOT NULL) OR 
        (member_id IS NULL AND onboarding_status != 'ONBOARDING_FINISHED')
      )) OR
      (role = 'SELLER' AND seller_id IS NOT NULL AND member_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
      (role = 'PROMOTER' AND promoter_id IS NOT NULL AND member_id IS NULL AND seller_id IS NULL AND steward_id IS NULL) OR
      (role = 'STEWARD' AND steward_id IS NOT NULL AND member_id IS NOT NULL AND (
        (seller_id IS NULL AND promoter_id IS NULL) OR
        (seller_id IS NOT NULL AND promoter_id IS NULL) OR
        (seller_id IS NULL AND promoter_id IS NOT NULL) OR
        (seller_id IS NOT NULL AND promoter_id IS NOT NULL)
      )) OR
      (role = 'ADMIN' AND member_id IS NULL AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL)
    );
  END IF;
END $$;

