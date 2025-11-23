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
      
      // Get fraternity_member_id from role-specific tables
      const { getFraternityMemberId } = await import('../utils/getFraternityMemberId');
      const fraternityMemberId = await getFraternityMemberId(user);
      
      if (!fraternityMemberId) {
        console.log('✅ User does not have a fraternity_member_id (not a member or member ID not found in role tables)');
        return;
      }
      
      // Check if fraternity_member exists
      const memberResult = await pool.query('SELECT * FROM fraternity_members WHERE id = $1', [fraternityMemberId]);
      
      if (memberResult.rows.length === 0) {
        console.log(`⚠️  User has fraternity_member_id ${fraternityMemberId} in role table but fraternity_member record doesn't exist`);
        console.log(`⚠️  This is a data integrity issue - the role table references a non-existent member`);
        console.log(`⚠️  Manual cleanup required - check sellers/promoters/stewards tables`);
      } else {
        console.log('✅ Member record exists. No action needed.');
      }
    } else {
      // Find all orphaned fraternity_member references in role tables
      console.log('🔍 Checking for orphaned fraternity_member_id references in role tables...');
      
      // Check sellers
      const sellersResult = await pool.query(`
        SELECT s.id, s.email, s.fraternity_member_id
        FROM sellers s
        WHERE s.fraternity_member_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM fraternity_members m WHERE m.id = s.fraternity_member_id
        )
      `);
      
      // Check promoters
      const promotersResult = await pool.query(`
        SELECT p.id, p.email, p.fraternity_member_id
        FROM promoters p
        WHERE p.fraternity_member_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM fraternity_members m WHERE m.id = p.fraternity_member_id
        )
      `);
      
      // Check stewards
      const stewardsResult = await pool.query(`
        SELECT st.id, st.fraternity_member_id
        FROM stewards st
        WHERE st.fraternity_member_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM fraternity_members m WHERE m.id = st.fraternity_member_id
        )
      `);
      
      const totalOrphaned = sellersResult.rows.length + promotersResult.rows.length + stewardsResult.rows.length;
      
      if (totalOrphaned === 0) {
        console.log('✅ No orphaned fraternity_member references found in role tables');
        return;
      }
      
      console.log(`⚠️  Found ${totalOrphaned} orphaned fraternity_member_id reference(s):`);
      sellersResult.rows.forEach((row: any) => {
        console.log(`   - Seller ${row.email} (fraternity_member_id: ${row.fraternity_member_id})`);
      });
      promotersResult.rows.forEach((row: any) => {
        console.log(`   - Promoter ${row.email} (fraternity_member_id: ${row.fraternity_member_id})`);
      });
      stewardsResult.rows.forEach((row: any) => {
        console.log(`   - Steward id: ${row.id} (fraternity_member_id: ${row.fraternity_member_id})`);
      });
      
      console.log(`\n⚠️  Manual cleanup required - these are data integrity issues in role tables`);
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

