-- Rename CONSUMER role to GUEST
-- This migration updates both the roles reference table and all user records

DO $$
BEGIN
  -- Step 1: Drop constraints temporarily to allow updates
  ALTER TABLE users DROP CONSTRAINT IF EXISTS check_role_foreign_key;
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

  -- Step 2: Update all users with CONSUMER role to GUEST first
  UPDATE users 
  SET role = 'GUEST',
      updated_at = CURRENT_TIMESTAMP
  WHERE role = 'CONSUMER';

  -- Step 3: Update roles table - delete CONSUMER and ensure GUEST exists
  DELETE FROM roles WHERE name = 'CONSUMER';
  
  -- Insert GUEST if it doesn't exist
  INSERT INTO roles (name, description, display_order) 
  VALUES ('GUEST', 'Regular user who can browse and purchase', 4)
  ON CONFLICT (name) DO UPDATE 
    SET description = 'Regular user who can browse and purchase',
        updated_at = CURRENT_TIMESTAMP;

  -- Step 4: Re-add constraints with GUEST instead of CONSUMER
  -- Add new role check constraint with GUEST
  ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('ADMIN', 'SELLER', 'PROMOTER', 'GUEST', 'STEWARD'));

  -- Re-add check_role_foreign_key constraint with GUEST
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

  RAISE NOTICE 'Successfully renamed CONSUMER role to GUEST';
END $$;

