import pool from '../db/connection';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

async function grantAdminAccess(emailOrCognitoSub: string) {
  try {
    console.log(`🔍 Looking for user with email or cognito_sub: ${emailOrCognitoSub}`);
    
    // Try to find user by email first
    let userResult = await pool.query('SELECT * FROM users WHERE email = $1', [emailOrCognitoSub]);
    
    // If not found by email, try cognito_sub
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
    
    console.log(`📋 Found user:`, {
      id: user.id,
      email: user.email,
      cognito_sub: user.cognito_sub,
      current_role: user.role,
      fraternity_member_id: fraternityMemberId,
      seller_id: user.seller_id,
      promoter_id: user.promoter_id,
    });
    
    if (user.role === 'ADMIN') {
      console.log('✅ User already has ADMIN role');
      return;
    }
    
    // Update role to ADMIN
    // Note: According to schema, ADMIN users must have member_id, seller_id, and promoter_id all NULL
    console.log(`🔧 Updating user role to ADMIN...`);
    
    // First, clear any foreign key references (required for ADMIN role)
    await pool.query(
      `UPDATE users 
       SET role = 'ADMIN', 
           fraternity_member_id = NULL, 
           seller_id = NULL, 
           promoter_id = NULL,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [user.id]
    );
    
    console.log('✅ User role successfully updated to ADMIN');
    console.log(`\n📝 User Details:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Cognito Sub: ${user.cognito_sub}`);
    console.log(`   Role: ADMIN`);
    console.log(`\n💡 You can now log in with this account to access the admin dashboard.`);
  } catch (error: any) {
    console.error('❌ Error granting admin access:', error.message);
    if (error.code === '23514') {
      console.error('   This error indicates a constraint violation. Make sure the user does not have active member/seller/promoter associations.');
    }
    throw error;
  } finally {
    await pool.end();
  }
}

const identifier = process.argv[2];

if (!identifier) {
  console.error('❌ Please provide an email or cognito_sub as an argument');
  console.log('\nUsage:');
  console.log('  npm run grant-admin -- <email>');
  console.log('  npm run grant-admin -- <cognito_sub>');
  console.log('\nExample:');
  console.log('  npm run grant-admin -- test@example.com');
  process.exit(1);
}

grantAdminAccess(identifier)
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });

