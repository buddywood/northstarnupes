import pool from '../db/connection';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

async function fixOrphanedMember(emailOrCognitoSub?: string) {
  try {
    if (emailOrCognitoSub) {
      // Fix specific user
      console.log(`🔍 Looking for user with email or cognito_sub: ${emailOrCognitoSub}`);
      
      let userResult = await pool.query('SELECT * FROM users WHERE email = $1', [emailOrCognitoSub]);
      
      if (userResult.rows.length === 0) {
        userResult = await pool.query('SELECT * FROM users WHERE cognito_sub = $1', [emailOrCognitoSub]);
      }
      
      if (userResult.rows.length === 0) {
        console.log('❌ No user found with that email or cognito_sub');
        return;
      }
      
      const user = userResult.rows[0];
      
      if (!user.fraternity_member_id) {
        console.log('✅ User does not have a fraternity_member_id set');
        return;
      }
      
      // Check if fraternity_member exists
      const memberResult = await pool.query('SELECT * FROM fraternity_members WHERE id = $1', [user.fraternity_member_id]);
      
      if (memberResult.rows.length === 0) {
        console.log(`⚠️  User has fraternity_member_id ${user.fraternity_member_id} but fraternity_member record doesn't exist`);
        console.log(`🔧 Clearing orphaned fraternity_member_id...`);
        
        await pool.query(
          `UPDATE users 
           SET fraternity_member_id = NULL, 
               onboarding_status = 'ONBOARDING_STARTED',
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1 
           RETURNING *`,
          [user.id]
        );
        
        console.log('✅ Cleared orphaned fraternity_member_id. User can now complete registration.');
      } else {
        console.log('✅ Member record exists. No action needed.');
      }
    } else {
      // Find all orphaned fraternity_member references
      console.log('🔍 Checking for users with orphaned fraternity_member_id references...');
      
      const result = await pool.query(`
        SELECT u.id, u.email, u.cognito_sub, u.fraternity_member_id, u.onboarding_status
        FROM users u
        WHERE u.fraternity_member_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM fraternity_members m WHERE m.id = u.fraternity_member_id
        )
      `);
      
      if (result.rows.length === 0) {
        console.log('✅ No orphaned fraternity_member references found');
        return;
      }
      
      console.log(`⚠️  Found ${result.rows.length} user(s) with orphaned fraternity_member_id:`);
      result.rows.forEach((user: any) => {
        console.log(`   - ${user.email} (fraternity_member_id: ${user.fraternity_member_id})`);
      });
      
      console.log(`\n🔧 Clearing orphaned fraternity_member_id references...`);
      
      await pool.query(`
        UPDATE users 
        SET fraternity_member_id = NULL, 
            onboarding_status = 'ONBOARDING_STARTED',
            updated_at = CURRENT_TIMESTAMP 
        WHERE fraternity_member_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM fraternity_members m WHERE m.id = users.fraternity_member_id
        )
      `);
      
      console.log(`✅ Cleared ${result.rows.length} orphaned fraternity_member_id reference(s).`);
      console.log(`   Users can now complete registration again.`);
    }
  } catch (error: any) {
    console.error('❌ Error fixing orphaned member:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

const identifier = process.argv[2];

fixOrphanedMember(identifier)
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });

