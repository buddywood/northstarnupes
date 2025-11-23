-- Fix the check_role_foreign_key constraint to allow promoters to have fraternity_member_id
-- Promoters must be fraternity members (fraternity_member_id NOT NULL)
-- Sellers can optionally be members (fraternity_member_id can be NULL)

DO $$
BEGIN
  -- Ensure users table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    RETURN;
  END IF;

  -- Ensure fraternity_member_id column exists (add it if it doesn't)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'fraternity_member_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'users' AND column_name = 'member_id') THEN
    -- Add fraternity_member_id if neither column exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fraternity_members') THEN
      ALTER TABLE users ADD COLUMN fraternity_member_id INTEGER REFERENCES fraternity_members(id);
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
      ALTER TABLE users ADD COLUMN member_id INTEGER REFERENCES members(id);
    END IF;
  END IF;

  -- Drop existing constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'users' AND constraint_name = 'check_role_foreign_key') THEN
    ALTER TABLE users DROP CONSTRAINT check_role_foreign_key;
  END IF;

  -- Check which column name exists (member_id or fraternity_member_id)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'users' AND column_name = 'fraternity_member_id') THEN
    -- Use fraternity_member_id (after migration 016 or fresh schema)
    ALTER TABLE users ADD CONSTRAINT check_role_foreign_key CHECK (
      (role = 'GUEST' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL AND (
        (fraternity_member_id IS NOT NULL) OR 
        (fraternity_member_id IS NULL AND onboarding_status != 'ONBOARDING_FINISHED')
      )) OR
      (role = 'SELLER' AND seller_id IS NOT NULL AND fraternity_member_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
      (role = 'PROMOTER' AND promoter_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND seller_id IS NULL AND steward_id IS NULL) OR
      (role = 'STEWARD' AND steward_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND (
        (seller_id IS NULL AND promoter_id IS NULL) OR
        (seller_id IS NOT NULL AND promoter_id IS NULL) OR
        (seller_id IS NULL AND promoter_id IS NOT NULL) OR
        (seller_id IS NOT NULL AND promoter_id IS NOT NULL)
      )) OR
      (role = 'ADMIN' AND fraternity_member_id IS NULL AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL)
    );
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'member_id') THEN
    -- Use member_id (before migration 016)
    ALTER TABLE users ADD CONSTRAINT check_role_foreign_key CHECK (
      (role = 'GUEST' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL AND (
        (member_id IS NOT NULL) OR 
        (member_id IS NULL AND onboarding_status != 'ONBOARDING_FINISHED')
      )) OR
      (role = 'SELLER' AND seller_id IS NOT NULL AND member_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
      (role = 'PROMOTER' AND promoter_id IS NOT NULL AND member_id IS NOT NULL AND seller_id IS NULL AND steward_id IS NULL) OR
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



