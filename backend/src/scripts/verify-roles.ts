import pool from '../db/connection';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

async function verifyRoles() {
  try {
    console.log('🔍 Verifying roles table...\n');

    // Check if roles table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'roles'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Roles table does not exist');
      return;
    }

    console.log('✅ Roles table exists\n');

    // Get all roles
    const roles = await pool.query(`
      SELECT id, name, description, display_order
      FROM roles
      ORDER BY display_order
    `);

    console.log('📋 Available roles:');
    roles.rows.forEach((role: any) => {
      console.log(`   ${role.id}. ${role.name} (order: ${role.display_order})`);
      if (role.description) {
        console.log(`      ${role.description}`);
      }
    });
    console.log('');

    // Check role usage in users table
    const roleUsage = await pool.query(`
      SELECT 
        r.name as role_name,
        COUNT(u.id) as user_count
      FROM roles r
      LEFT JOIN users u ON u.role = r.name
      GROUP BY r.id, r.name
      ORDER BY r.display_order
    `);

    console.log('👥 Role usage in users table:');
    roleUsage.rows.forEach((usage: any) => {
      console.log(`   ${usage.role_name}: ${usage.user_count} users`);
    });
    console.log('');

    // Verify all roles in users table exist in roles table
    const invalidRoles = await pool.query(`
      SELECT DISTINCT u.role
      FROM users u
      LEFT JOIN roles r ON u.role = r.name
      WHERE r.name IS NULL
    `);

    if (invalidRoles.rows.length > 0) {
      console.log('⚠️  Warning: Found users with roles not in roles table:');
      invalidRoles.rows.forEach((row: any) => {
        console.log(`   - ${row.role}`);
      });
    } else {
      console.log('✅ All user roles exist in roles table');
    }
    console.log('');

  } catch (error: any) {
    console.error('❌ Error verifying roles:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  verifyRoles()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

export { verifyRoles };

