import pool from '../db/connection';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

async function deletePromoter(email: string) {
  try {
    console.log(`🔍 Looking for promoter with email: ${email}`);
    
    // First, check if promoter exists
    const promoterResult = await pool.query('SELECT id, name, email FROM promoters WHERE email = $1', [email]);
    
    if (promoterResult.rows.length === 0) {
      console.log('❌ No promoter found with that email');
      return;
    }
    
    const promoter = promoterResult.rows[0];
    console.log(`📋 Found promoter: ${promoter.name} (ID: ${promoter.id})`);
    
    // Check for related records
    const eventsResult = await pool.query('SELECT COUNT(*) as count FROM events WHERE promoter_id = $1', [promoter.id]);
    const eventCount = parseInt(eventsResult.rows[0].count);
    
    if (eventCount > 0) {
      console.log(`⚠️  Warning: This promoter has ${eventCount} event(s). They will be deleted as well.`);
    }
    
    // Check if promoter is linked to a user
    const userResult = await pool.query('SELECT id, email, role, seller_id, promoter_id, steward_id FROM users WHERE promoter_id = $1', [promoter.id]);
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const { getFraternityMemberId } = await import('../utils/getFraternityMemberId');
      const fraternityMemberId = await getFraternityMemberId(user);
      console.log(`⚠️  Warning: This promoter is linked to user account: ${user.email}`);
      console.log(`   User role: ${user.role}, has fraternity_member_id: ${fraternityMemberId ? 'yes' : 'no'}`);
    }
    
    // Delete events first (foreign key constraint)
    if (eventCount > 0) {
      await pool.query('DELETE FROM events WHERE promoter_id = $1', [promoter.id]);
      console.log(`✅ Deleted ${eventCount} event(s)`);
    }
    
    // Update user account - change role to GUEST if they have fraternity_member_id, otherwise delete user
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const { getFraternityMemberId } = await import('../utils/getFraternityMemberId');
      const fraternityMemberId = await getFraternityMemberId(user);
      if (user.role === 'PROMOTER') {
        if (fraternityMemberId) {
          // User has fraternity_member_id, change role to GUEST
          await pool.query(
            'UPDATE users SET promoter_id = NULL, role = $1 WHERE promoter_id = $2',
            ['GUEST', promoter.id]
          );
          console.log(`✅ Changed user role to GUEST and cleared promoter_id`);
        } else {
          // User doesn't have fraternity_member_id, delete the user since they were likely created just for promoter
          await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
          console.log(`✅ Deleted user account (no fraternity_member_id, was created for promoter)`);
        }
      } else {
        // User has a different role, just clear promoter_id
        await pool.query('UPDATE users SET promoter_id = NULL WHERE promoter_id = $1', [promoter.id]);
        console.log(`✅ Cleared promoter_id from user account`);
      }
    }
    
    // Delete the promoter
    await pool.query('DELETE FROM promoters WHERE id = $1', [promoter.id]);
    console.log(`✅ Deleted promoter: ${promoter.name} (${promoter.email})`);
    
  } catch (error: any) {
    console.error('❌ Error deleting promoter:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: npm run delete:promoter <email>');
  process.exit(1);
}

deletePromoter(email)
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });

