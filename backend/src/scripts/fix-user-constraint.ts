import pool from '../db/connection';

async function fixUserConstraint() {
  try {
    console.log('Dropping old check_role_foreign_key constraint...');
    
    // Drop the old constraint if it exists
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'check_role_foreign_key' 
          AND conrelid = 'users'::regclass
        ) THEN
          ALTER TABLE users DROP CONSTRAINT check_role_foreign_key;
        END IF;
      END $$;
    `);
    
    console.log('Adding new check_role_foreign_key constraint...');
    
    // Add the new constraint that allows GUEST with null member_id during onboarding
    await pool.query(`
      ALTER TABLE users ADD CONSTRAINT check_role_foreign_key CHECK (
        (role = 'GUEST' AND seller_id IS NULL AND promoter_id IS NULL AND (
          (member_id IS NOT NULL) OR 
          (member_id IS NULL AND onboarding_status != 'ONBOARDING_FINISHED')
        )) OR
        (role = 'SELLER' AND seller_id IS NOT NULL AND member_id IS NULL AND promoter_id IS NULL) OR
        (role = 'PROMOTER' AND promoter_id IS NOT NULL AND member_id IS NULL AND seller_id IS NULL) OR
        (role = 'ADMIN' AND member_id IS NULL AND seller_id IS NULL AND promoter_id IS NULL)
      );
    `);
    
    console.log('✅ Constraint updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating constraint:', error);
    process.exit(1);
  }
}

fixUserConstraint();

