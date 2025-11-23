import pool from '../db/connection';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

async function verifyDatabaseSetup() {
  try {
    console.log('🔍 Verifying database setup...\n');

    // Check users table structure
    console.log('📋 Checking users table structure:');
    const usersColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name IN ('id', 'email', 'role', 'fraternity_member_id', 'seller_id', 'promoter_id', 'steward_id')
      ORDER BY column_name
    `);
    console.log('   Columns:');
    usersColumns.rows.forEach((col: any) => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    console.log('');

    // Check total users and users with fraternity_member_id
    console.log('📊 User statistics:');
    const userStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(fraternity_member_id) as users_with_member_id,
        COUNT(CASE WHEN role = 'GUEST' THEN 1 END) as guest_users,
        COUNT(CASE WHEN role = 'GUEST' AND fraternity_member_id IS NOT NULL THEN 1 END) as guest_users_with_member_id,
        COUNT(CASE WHEN role = 'SELLER' THEN 1 END) as seller_users,
        COUNT(CASE WHEN role = 'SELLER' AND fraternity_member_id IS NULL THEN 1 END) as seller_users_without_member_id
      FROM users
    `);
    const stats = userStats.rows[0];
    console.log(`   Total users: ${stats.total_users}`);
    console.log(`   Users with fraternity_member_id: ${stats.users_with_member_id}`);
    console.log(`   GUEST users: ${stats.guest_users}`);
    console.log(`   GUEST users with fraternity_member_id: ${stats.guest_users_with_member_id}`);
    console.log(`   SELLER users: ${stats.seller_users}`);
    console.log(`   SELLER users without fraternity_member_id (expected): ${stats.seller_users_without_member_id}`);
    console.log('');

    // Check sample users with their member info
    console.log('👤 Sample users with fraternity_member_id:');
    const sampleUsers = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.fraternity_member_id,
        fm.name as member_name,
        fm.membership_number,
        fm.verification_status
      FROM users u
      LEFT JOIN fraternity_members fm ON u.fraternity_member_id = fm.id
      WHERE u.fraternity_member_id IS NOT NULL
      ORDER BY u.id
      LIMIT 10
    `);
    sampleUsers.rows.forEach((user: any) => {
      console.log(`   - ${user.email} (${user.role}): member_id=${user.fraternity_member_id}, name="${user.member_name}", membership_number="${user.membership_number}", verified=${user.verification_status}`);
    });
    console.log('');

    // Check sellers and their fraternity_member_id (from sellers table)
    console.log('🏪 Sample sellers (checking sellers table for fraternity_member_id):');
    const sampleSellers = await pool.query(`
      SELECT 
        u.id as user_id,
        u.email,
        u.role,
        u.fraternity_member_id as user_fraternity_member_id,
        s.id as seller_id,
        s.fraternity_member_id as seller_fraternity_member_id,
        fm.name as member_name
      FROM users u
      JOIN sellers s ON u.seller_id = s.id
      LEFT JOIN fraternity_members fm ON s.fraternity_member_id = fm.id
      ORDER BY u.id
      LIMIT 5
    `);
    sampleSellers.rows.forEach((seller: any) => {
      console.log(`   - ${seller.email}: user.fraternity_member_id=${seller.user_fraternity_member_id}, seller.fraternity_member_id=${seller.seller_fraternity_member_id}, member="${seller.member_name}"`);
    });
    console.log('');

    // Check test users (buddy@ emails)
    console.log('🧪 Test users (buddy@ emails):');
    const testUsers = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.fraternity_member_id,
        fm.name as member_name,
        fm.membership_number,
        fm.verification_status
      FROM users u
      LEFT JOIN fraternity_members fm ON u.fraternity_member_id = fm.id
      WHERE u.email LIKE 'buddy%@%'
      ORDER BY u.email
    `);
    testUsers.rows.forEach((user: any) => {
      console.log(`   - ${user.email} (${user.role}):`);
      console.log(`     fraternity_member_id: ${user.fraternity_member_id || 'NULL'}`);
      if (user.member_name) {
        console.log(`     member: ${user.member_name} (${user.membership_number})`);
        console.log(`     verification_status: ${user.verification_status}`);
      }
    });
    console.log('');

    // Verify constraint: SELLER users should have fraternity_member_id = NULL
    console.log('✅ Verifying constraints:');
    const constraintCheck = await pool.query(`
      SELECT 
        COUNT(*) as seller_users_with_member_id
      FROM users
      WHERE role = 'SELLER' AND fraternity_member_id IS NOT NULL
    `);
    if (constraintCheck.rows[0].seller_users_with_member_id > 0) {
      console.log(`   ⚠️  WARNING: Found ${constraintCheck.rows[0].seller_users_with_member_id} SELLER users with fraternity_member_id (should be NULL)`);
    } else {
      console.log(`   ✓ All SELLER users have fraternity_member_id = NULL (correct)`);
    }

    // Verify: GUEST users who are members should have fraternity_member_id set
    const guestCheck = await pool.query(`
      SELECT 
        COUNT(*) as guest_users_without_member_id
      FROM users u
      WHERE role = 'GUEST' 
      AND fraternity_member_id IS NULL
      AND EXISTS (
        SELECT 1 FROM fraternity_members fm 
        WHERE (fm.email = u.email OR fm.cognito_sub = u.cognito_sub)
      )
    `);
    if (constraintCheck.rows[0].seller_users_with_member_id === 0) {
      console.log(`   ✓ All GUEST users who are members have fraternity_member_id set`);
    }

    console.log('\n✅ Database verification complete!\n');
  } catch (error: any) {
    console.error('❌ Error verifying database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  verifyDatabaseSetup()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

export { verifyDatabaseSetup };

