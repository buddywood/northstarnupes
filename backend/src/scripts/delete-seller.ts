import pool from '../db/connection';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

async function deleteSeller(email: string) {
  try {
    console.log(`🔍 Looking for seller with email: ${email}`);
    
    // First, check if seller exists
    const sellerResult = await pool.query('SELECT id, name, email FROM sellers WHERE email = $1', [email]);
    
    if (sellerResult.rows.length === 0) {
      console.log('❌ No seller found with that email');
      return;
    }
    
    const seller = sellerResult.rows[0];
    console.log(`📋 Found seller: ${seller.name} (ID: ${seller.id})`);
    
    // Check for related records
    const productsResult = await pool.query('SELECT COUNT(*) as count FROM products WHERE seller_id = $1', [seller.id]);
    const productCount = parseInt(productsResult.rows[0].count);
    
    if (productCount > 0) {
      console.log(`⚠️  Warning: This seller has ${productCount} product(s). They will be deleted as well.`);
    }
    
    // Check if seller is linked to a user
    const userResult = await pool.query('SELECT id, email, role, seller_id, promoter_id, steward_id FROM users WHERE seller_id = $1', [seller.id]);
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const { getFraternityMemberId } = await import('../utils/getFraternityMemberId');
      const fraternityMemberId = await getFraternityMemberId(user);
      console.log(`⚠️  Warning: This seller is linked to user account: ${user.email}`);
      console.log(`   User role: ${user.role}, has fraternity_member_id: ${fraternityMemberId ? 'yes' : 'no'}`);
    }
    
    // Delete products first (foreign key constraint)
    if (productCount > 0) {
      await pool.query('DELETE FROM products WHERE seller_id = $1', [seller.id]);
      console.log(`✅ Deleted ${productCount} product(s)`);
    }
    
    // Update user account - change role to GUEST if they have fraternity_member_id, otherwise we'll need to handle differently
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const { getFraternityMemberId } = await import('../utils/getFraternityMemberId');
      const fraternityMemberId = await getFraternityMemberId(user);
      if (user.role === 'SELLER') {
        if (fraternityMemberId) {
          // User has fraternity_member_id, change role to GUEST
          await pool.query(
            'UPDATE users SET seller_id = NULL, role = $1 WHERE seller_id = $2',
            ['GUEST', seller.id]
          );
          console.log(`✅ Changed user role to GUEST and cleared seller_id`);
        } else {
          // User doesn't have fraternity_member_id, we need to delete the user or set onboarding_status
          // For safety, let's just clear seller_id and change role - but this might fail
          // Actually, let's delete the user if they don't have fraternity_member_id since they were likely created just for seller
          await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
          console.log(`✅ Deleted user account (no fraternity_member_id, was created for seller)`);
        }
      } else {
        // User has a different role, just clear seller_id
        await pool.query('UPDATE users SET seller_id = NULL WHERE seller_id = $1', [seller.id]);
        console.log(`✅ Cleared seller_id from user account`);
      }
    }
    
    // Delete the seller
    await pool.query('DELETE FROM sellers WHERE id = $1', [seller.id]);
    console.log(`✅ Deleted seller: ${seller.name} (${seller.email})`);
    
  } catch (error: any) {
    console.error('❌ Error deleting seller:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: npm run delete:seller <email>');
  process.exit(1);
}

deleteSeller(email)
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });

