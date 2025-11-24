-- Migration: Add ON DELETE SET NULL to foreign key constraints
-- Date: Prevent orphaned references when records are deleted
-- 
-- This migration updates foreign key constraints to automatically set
-- references to NULL when the referenced record is deleted, preventing
-- orphaned foreign key references.

DO $$
DECLARE
  constraint_name_var TEXT;
  member_id_attnum SMALLINT;
  seller_id_attnum SMALLINT;
  promoter_id_attnum SMALLINT;
  steward_id_attnum SMALLINT;
BEGIN
  -- Get attribute numbers for the columns
  SELECT attnum INTO member_id_attnum FROM pg_attribute 
  WHERE attrelid = 'users'::regclass AND attname = 'member_id';
  
  SELECT attnum INTO seller_id_attnum FROM pg_attribute 
  WHERE attrelid = 'users'::regclass AND attname = 'seller_id';
  
  SELECT attnum INTO promoter_id_attnum FROM pg_attribute 
  WHERE attrelid = 'users'::regclass AND attname = 'promoter_id';
  
  SELECT attnum INTO steward_id_attnum FROM pg_attribute 
  WHERE attrelid = 'users'::regclass AND attname = 'steward_id';

  -- Update member_id foreign key constraint
  IF member_id_attnum IS NOT NULL THEN
    SELECT conname INTO constraint_name_var
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
    AND contype = 'f'
    AND ARRAY[member_id_attnum]::int[] <@ conkey::int[];
    
    IF constraint_name_var IS NOT NULL THEN
      EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', constraint_name_var);
      ALTER TABLE users ADD CONSTRAINT users_member_id_fkey 
        FOREIGN KEY (member_id) REFERENCES fraternity_members(id) ON DELETE SET NULL;
      RAISE NOTICE 'Updated users.member_id foreign key (%) with ON DELETE SET NULL', constraint_name_var;
    ELSE
      -- Constraint doesn't exist, add it
      ALTER TABLE users ADD CONSTRAINT users_member_id_fkey 
        FOREIGN KEY (member_id) REFERENCES fraternity_members(id) ON DELETE SET NULL;
      RAISE NOTICE 'Added users.member_id foreign key with ON DELETE SET NULL';
    END IF;
  END IF;

  -- Update seller_id foreign key constraint
  IF seller_id_attnum IS NOT NULL THEN
    SELECT conname INTO constraint_name_var
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
    AND contype = 'f'
    AND ARRAY[seller_id_attnum]::int[] <@ conkey::int[];
    
    IF constraint_name_var IS NOT NULL THEN
      EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', constraint_name_var);
      ALTER TABLE users ADD CONSTRAINT users_seller_id_fkey 
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL;
      RAISE NOTICE 'Updated users.seller_id foreign key (%) with ON DELETE SET NULL', constraint_name_var;
    ELSE
      ALTER TABLE users ADD CONSTRAINT users_seller_id_fkey 
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL;
      RAISE NOTICE 'Added users.seller_id foreign key with ON DELETE SET NULL';
    END IF;
  END IF;

  -- Update promoter_id foreign key constraint
  IF promoter_id_attnum IS NOT NULL THEN
    SELECT conname INTO constraint_name_var
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
    AND contype = 'f'
    AND ARRAY[promoter_id_attnum]::int[] <@ conkey::int[];
    
    IF constraint_name_var IS NOT NULL THEN
      EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', constraint_name_var);
      ALTER TABLE users ADD CONSTRAINT users_promoter_id_fkey 
        FOREIGN KEY (promoter_id) REFERENCES promoters(id) ON DELETE SET NULL;
      RAISE NOTICE 'Updated users.promoter_id foreign key (%) with ON DELETE SET NULL', constraint_name_var;
    ELSE
      ALTER TABLE users ADD CONSTRAINT users_promoter_id_fkey 
        FOREIGN KEY (promoter_id) REFERENCES promoters(id) ON DELETE SET NULL;
      RAISE NOTICE 'Added users.promoter_id foreign key with ON DELETE SET NULL';
    END IF;
  END IF;

  -- Update steward_id foreign key constraint
  IF steward_id_attnum IS NOT NULL THEN
    SELECT conname INTO constraint_name_var
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
    AND contype = 'f'
    AND ARRAY[steward_id_attnum]::int[] <@ conkey::int[];
    
    IF constraint_name_var IS NOT NULL THEN
      EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', constraint_name_var);
      ALTER TABLE users ADD CONSTRAINT users_steward_id_fkey 
        FOREIGN KEY (steward_id) REFERENCES stewards(id) ON DELETE SET NULL;
      RAISE NOTICE 'Updated users.steward_id foreign key (%) with ON DELETE SET NULL', constraint_name_var;
    ELSE
      ALTER TABLE users ADD CONSTRAINT users_steward_id_fkey 
        FOREIGN KEY (steward_id) REFERENCES stewards(id) ON DELETE SET NULL;
      RAISE NOTICE 'Added users.steward_id foreign key with ON DELETE SET NULL';
    END IF;
  END IF;

END $$;
