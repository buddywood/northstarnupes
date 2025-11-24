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

    -- Add steward_id to users table (only if stewards table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='stewards') THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='users' AND column_name='steward_id') THEN
        ALTER TABLE users ADD COLUMN steward_id INTEGER REFERENCES stewards(id);
        CREATE INDEX IF NOT EXISTS idx_users_steward_id ON users(steward_id);
      END IF;
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
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'SELLER', 'PROMOTER', 'GUEST', 'STEWARD'));

    -- Update check_role_foreign_key constraint to allow role coexistence
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'check_role_foreign_key' 
      AND conrelid = 'users'::regclass
    ) THEN
      ALTER TABLE users DROP CONSTRAINT check_role_foreign_key;
    END IF;
    
    -- Fix common data issues before adding constraint
    -- Ensure GUEST users have proper nulls set
    UPDATE users 
    SET seller_id = NULL, promoter_id = NULL, steward_id = NULL 
    WHERE role = 'GUEST' AND (seller_id IS NOT NULL OR promoter_id IS NOT NULL OR steward_id IS NOT NULL);
    
    -- Ensure SELLER users have proper nulls set (for legacy member_id column only)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='member_id') THEN
      UPDATE users 
      SET member_id = NULL, promoter_id = NULL, steward_id = NULL 
      WHERE role = 'SELLER' 
        AND (member_id IS NOT NULL OR promoter_id IS NOT NULL OR steward_id IS NOT NULL);
    END IF;
    
    -- Ensure PROMOTER users have proper nulls set (for legacy member_id column only)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='member_id') THEN
      UPDATE users 
      SET member_id = NULL, seller_id = NULL, steward_id = NULL 
      WHERE role = 'PROMOTER' 
        AND (member_id IS NOT NULL OR seller_id IS NOT NULL OR steward_id IS NOT NULL);
    END IF;
    
    -- Ensure ADMIN users have proper nulls set (for legacy member_id column only)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='member_id') THEN
      UPDATE users 
      SET member_id = NULL, seller_id = NULL, promoter_id = NULL, steward_id = NULL 
      WHERE role = 'ADMIN' 
        AND (member_id IS NOT NULL OR seller_id IS NOT NULL OR promoter_id IS NOT NULL OR steward_id IS NOT NULL);
    END IF;
    
    -- Add the new constraint allowing role coexistence for STEWARD
    -- Note: fraternity_member_id is NOT in users table - it's kept on role-specific tables
    -- Check if fraternity_member_id or member_id exists (for backward compatibility with old databases)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='users' AND (column_name='fraternity_member_id' OR column_name='member_id')) THEN
      -- Old schema with fraternity_member_id/member_id - use constraint that includes it
      IF EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='fraternity_member_id') THEN
        -- Only add constraint if data doesn't violate it
        IF NOT EXISTS (
          SELECT 1 FROM users WHERE NOT (
            (role = 'GUEST' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL AND (
              (fraternity_member_id IS NOT NULL) OR 
              (fraternity_member_id IS NULL AND onboarding_status != 'ONBOARDING_FINISHED')
            )) OR
            (role = 'SELLER' AND seller_id IS NOT NULL AND fraternity_member_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
            (role = 'PROMOTER' AND promoter_id IS NOT NULL AND fraternity_member_id IS NULL AND seller_id IS NULL AND steward_id IS NULL) OR
            (role = 'STEWARD' AND steward_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND (
              (seller_id IS NULL AND promoter_id IS NULL) OR
              (seller_id IS NOT NULL AND promoter_id IS NULL) OR
              (seller_id IS NULL AND promoter_id IS NOT NULL) OR
              (seller_id IS NOT NULL AND promoter_id IS NOT NULL)
            )) OR
            (role = 'ADMIN' AND fraternity_member_id IS NULL AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL)
          )
        ) THEN
          ALTER TABLE users ADD CONSTRAINT check_role_foreign_key CHECK (
            (role = 'GUEST' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL AND (
              (fraternity_member_id IS NOT NULL) OR 
              (fraternity_member_id IS NULL AND onboarding_status != 'ONBOARDING_FINISHED')
            )) OR
            (role = 'SELLER' AND seller_id IS NOT NULL AND fraternity_member_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
            (role = 'PROMOTER' AND promoter_id IS NOT NULL AND fraternity_member_id IS NULL AND seller_id IS NULL AND steward_id IS NULL) OR
            (role = 'STEWARD' AND steward_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND (
              (seller_id IS NULL AND promoter_id IS NULL) OR
              (seller_id IS NOT NULL AND promoter_id IS NULL) OR
              (seller_id IS NULL AND promoter_id IS NOT NULL) OR
              (seller_id IS NOT NULL AND promoter_id IS NOT NULL)
            )) OR
            (role = 'ADMIN' AND fraternity_member_id IS NULL AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL)
          );
        ELSE
          RAISE NOTICE 'Skipping check_role_foreign_key constraint - existing data would violate it';
        END IF;
      ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='member_id') THEN
        -- Only add constraint if data doesn't violate it
        IF NOT EXISTS (
          SELECT 1 FROM users WHERE NOT (
            (role = 'GUEST' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL AND (
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
          )
        ) THEN
          ALTER TABLE users ADD CONSTRAINT check_role_foreign_key CHECK (
            (role = 'GUEST' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL AND (
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
        ELSE
          RAISE NOTICE 'Skipping check_role_foreign_key constraint - existing data would violate it';
        END IF;
      END IF;
    ELSE
      -- New schema without fraternity_member_id in users table
      -- Only add constraint if there's no existing data that would violate it
      IF NOT EXISTS (
        SELECT 1 FROM users WHERE NOT (
          (role = 'GUEST' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
          (role = 'SELLER' AND seller_id IS NOT NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
          (role = 'PROMOTER' AND promoter_id IS NOT NULL AND seller_id IS NULL AND steward_id IS NULL) OR
          (role = 'STEWARD' AND steward_id IS NOT NULL AND (
            (seller_id IS NULL AND promoter_id IS NULL) OR
            (seller_id IS NOT NULL AND promoter_id IS NULL) OR
            (seller_id IS NULL AND promoter_id IS NOT NULL) OR
            (seller_id IS NOT NULL AND promoter_id IS NOT NULL)
          )) OR
          (role = 'ADMIN' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL)
        )
      ) THEN
        ALTER TABLE users ADD CONSTRAINT check_role_foreign_key CHECK (
          (role = 'GUEST' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
          (role = 'SELLER' AND seller_id IS NOT NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
          (role = 'PROMOTER' AND promoter_id IS NOT NULL AND seller_id IS NULL AND steward_id IS NULL) OR
          (role = 'STEWARD' AND steward_id IS NOT NULL AND (
            (seller_id IS NULL AND promoter_id IS NULL) OR
            (seller_id IS NOT NULL AND promoter_id IS NULL) OR
            (seller_id IS NULL AND promoter_id IS NOT NULL) OR
            (seller_id IS NOT NULL AND promoter_id IS NOT NULL)
          )) OR
          (role = 'ADMIN' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL)
        );
      ELSE
        RAISE NOTICE 'Skipping check_role_foreign_key constraint - existing data would violate it';
      END IF;
    END IF;
  END IF;
END $$;

