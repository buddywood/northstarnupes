import pool from '../db/connection';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

async function deleteTestUser(email: string) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Find the user
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      console.log('✅ No user found in database with that email');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`📋 Found user:`, {
      id: user.id,
      email: user.email,
      role: user.role,
      fraternity_member_id: user.fraternity_member_id,
      seller_id: user.seller_id,
      promoter_id: user.promoter_id,
    });
    
    // Store IDs before deleting user
    const memberId = user.fraternity_member_id;
    const sellerId = user.seller_id;
    const promoterId = user.promoter_id;
    
    // Delete the user record first (this will break foreign key references)
    console.log(`🗑️  Deleting user record (id: ${user.id})...`);
    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
    console.log('✅ User record deleted');
    
    // Now delete associated records
    if (memberId) {
      console.log(`🗑️  Deleting member record (id: ${memberId})...`);
      await pool.query('DELETE FROM fraternity_members WHERE id = $1', [memberId]);
      console.log('✅ Member record deleted');
    }
    
    if (sellerId) {
      console.log(`🗑️  Deleting seller record (id: ${sellerId})...`);
      await pool.query('DELETE FROM sellers WHERE id = $1', [sellerId]);
      console.log('✅ Seller record deleted');
    }
    
    if (promoterId) {
      console.log(`🗑️  Deleting promoter record (id: ${promoterId})...`);
      await pool.query('DELETE FROM promoters WHERE id = $1', [promoterId]);
      console.log('✅ Promoter record deleted');
    }
    
    console.log('✅ Test user successfully deleted from database');
  } catch (error) {
    console.error('❌ Error deleting test user:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

const email = process.argv[2] || 'test@example.com';

deleteTestUser(email)
  .then(() => {
    console.log('✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });


