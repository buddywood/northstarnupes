import pool from '../db/connection';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...\n');

    // Get all table names
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    const tables = tablesResult.rows.map((row: any) => row.tablename);

    if (tables.length === 0) {
      console.log('✅ Database is already empty\n');
      return;
    }

    console.log(`📋 Found ${tables.length} tables to drop:`);
    tables.forEach((table: string) => {
      console.log(`   - ${table}`);
    });
    console.log('');

    // Disable foreign key checks by dropping constraints first
    // Drop all tables (CASCADE will handle foreign key constraints)
    for (const table of tables) {
      try {
        await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✓ Dropped table: ${table}`);
      } catch (error: any) {
        console.error(`⚠️  Error dropping table ${table}:`, error.message);
      }
    }

    // Drop all sequences
    const sequencesResult = await pool.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
    `);

    for (const seq of sequencesResult.rows) {
      try {
        await pool.query(`DROP SEQUENCE IF EXISTS ${seq.sequence_name} CASCADE`);
        console.log(`✓ Dropped sequence: ${seq.sequence_name}`);
      } catch (error: any) {
        // Ignore errors for sequences that don't exist
      }
    }

    console.log('\n✅ Database reset complete\n');
  } catch (error: any) {
    console.error('❌ Error resetting database:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('✅ Database reset completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database reset failed:', error);
      process.exit(1);
    });
}

export { resetDatabase };

