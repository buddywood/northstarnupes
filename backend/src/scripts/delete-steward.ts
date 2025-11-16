import pool from '../db/connection';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

async function deleteSteward(emailOrMemberId: string) {
  try {
    console.log(`🔍 Looking for steward...`);
    
    let steward;
    let memberId: number | null = null;
    
    // Try to find by email first (look up fraternity_member by email, then steward by fraternity_member_id)
    const memberResult = await pool.query('SELECT id FROM fraternity_members WHERE email = $1', [emailOrMemberId]);
    if (memberResult.rows.length > 0) {
      memberId = memberResult.rows[0].id;
      const stewardResult = await pool.query('SELECT id, fraternity_member_id FROM stewards WHERE fraternity_member_id = $1', [memberId]);
      if (stewardResult.rows.length > 0) {
        steward = stewardResult.rows[0];
      }
    }
    
    // If not found by email, try as fraternity_member_id directly
    if (!steward) {
      const memberIdNum = parseInt(emailOrMemberId);
      if (!isNaN(memberIdNum)) {
        const stewardResult = await pool.query('SELECT id, fraternity_member_id FROM stewards WHERE fraternity_member_id = $1', [memberIdNum]);
        if (stewardResult.rows.length > 0) {
          steward = stewardResult.rows[0];
          memberId = memberIdNum;
        }
      }
    }
    
    if (!steward) {
      console.log('❌ No steward found with that email or fraternity_member_id');
      return;
    }
    
    console.log(`📋 Found steward (ID: ${steward.id}, fraternity_member_id: ${steward.fraternity_member_id})`);
    
    // Get fraternity_member info for display
    const memberInfo = await pool.query('SELECT name, email FROM fraternity_members WHERE id = $1', [steward.fraternity_member_id]);
    const member = memberInfo.rows[0];
    if (member) {
      console.log(`   Member: ${member.name} (${member.email})`);
    }
    
    // Check for related records
    const listingsResult = await pool.query('SELECT COUNT(*) as count FROM steward_listings WHERE steward_id = $1', [steward.id]);
    const listingCount = parseInt(listingsResult.rows[0].count);
    
    if (listingCount > 0) {
      console.log(`⚠️  Warning: This steward has ${listingCount} listing(s). They will be deleted as well.`);
      
      // Check for claims on those listings
      const claimsResult = await pool.query(
        'SELECT COUNT(*) as count FROM steward_claims WHERE steward_listing_id IN (SELECT id FROM steward_listings WHERE steward_id = $1)',
        [steward.id]
      );
      const claimCount = parseInt(claimsResult.rows[0].count);
      if (claimCount > 0) {
        console.log(`⚠️  Warning: This steward has ${claimCount} claim(s) on their listings. They will be deleted as well.`);
      }
    }
    
    // Check if steward is linked to a user
    const userResult = await pool.query('SELECT id, email, role, fraternity_member_id FROM users WHERE steward_id = $1', [steward.id]);
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`⚠️  Warning: This steward is linked to user account: ${user.email}`);
      console.log(`   User role: ${user.role}`);
    }
    
    // Delete claims first (foreign key constraint)
    if (listingCount > 0) {
      await pool.query(
        'DELETE FROM steward_claims WHERE steward_listing_id IN (SELECT id FROM steward_listings WHERE steward_id = $1)',
        [steward.id]
      );
      console.log(`✅ Deleted claims`);
    }
    
    // Delete listings (foreign key constraint)
    if (listingCount > 0) {
      await pool.query('DELETE FROM steward_listings WHERE steward_id = $1', [steward.id]);
      console.log(`✅ Deleted ${listingCount} listing(s)`);
    }
    
    // Update user account - stewards require fraternity_member_id, so change role to CONSUMER
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      if (user.role === 'STEWARD') {
        // Stewards always have member_id, so change role to CONSUMER
        await pool.query(
          'UPDATE users SET steward_id = NULL, role = $1 WHERE steward_id = $2',
          ['CONSUMER', steward.id]
        );
        console.log(`✅ Changed user role to CONSUMER and cleared steward_id`);
      } else {
        // User has a different role, just clear steward_id
        await pool.query('UPDATE users SET steward_id = NULL WHERE steward_id = $1', [steward.id]);
        console.log(`✅ Cleared steward_id from user account`);
      }
    }
    
    // Delete the steward
    await pool.query('DELETE FROM stewards WHERE id = $1', [steward.id]);
    console.log(`✅ Deleted steward (fraternity_member_id: ${steward.fraternity_member_id})`);
    
  } catch (error: any) {
    console.error('❌ Error deleting steward:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

const identifier = process.argv[2];

if (!identifier) {
  console.error('❌ Please provide an email address or fraternity_member_id');
  console.log('Usage: npm run delete:steward <email_or_fraternity_member_id>');
  process.exit(1);
}

deleteSteward(identifier)
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });

