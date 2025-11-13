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
      
      if (!user.member_id) {
        console.log('✅ User does not have a member_id set');
        return;
      }
      
      // Check if member exists
      const memberResult = await pool.query('SELECT * FROM members WHERE id = $1', [user.member_id]);
      
      if (memberResult.rows.length === 0) {
        console.log(`⚠️  User has member_id ${user.member_id} but member record doesn't exist`);
        console.log(`🔧 Clearing orphaned member_id...`);
        
        await pool.query(
          `UPDATE users 
           SET member_id = NULL, 
               onboarding_status = 'ONBOARDING_STARTED',
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1 
           RETURNING *`,
          [user.id]
        );
        
        console.log('✅ Cleared orphaned member_id. User can now complete registration.');
      } else {
        console.log('✅ Member record exists. No action needed.');
      }
    } else {
      // Find all orphaned member references
      console.log('🔍 Checking for users with orphaned member_id references...');
      
      const result = await pool.query(`
        SELECT u.id, u.email, u.cognito_sub, u.member_id, u.onboarding_status
        FROM users u
        WHERE u.member_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM members m WHERE m.id = u.member_id
        )
      `);
      
      if (result.rows.length === 0) {
        console.log('✅ No orphaned member references found');
        return;
      }
      
      console.log(`⚠️  Found ${result.rows.length} user(s) with orphaned member_id:`);
      result.rows.forEach((user: any) => {
        console.log(`   - ${user.email} (member_id: ${user.member_id})`);
      });
      
      console.log(`\n🔧 Clearing orphaned member_id references...`);
      
      await pool.query(`
        UPDATE users 
        SET member_id = NULL, 
            onboarding_status = 'ONBOARDING_STARTED',
            updated_at = CURRENT_TIMESTAMP 
        WHERE member_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM members m WHERE m.id = users.member_id
        )
      `);
      
      console.log(`✅ Cleared ${result.rows.length} orphaned member_id reference(s).`);
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

