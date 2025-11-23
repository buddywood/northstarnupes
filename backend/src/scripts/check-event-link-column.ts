import pool from '../db/connection';

async function checkEventLinkColumn() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'events' 
      AND column_name IN ('event_link', 'event_url')
      ORDER BY column_name;
    `);

    if (result.rows.length === 0) {
      console.log('❌ event_link column does NOT exist in events table');
      console.log('\nTo add it, run: npm run migrate');
      return false;
    }

    console.log('✅ Found column(s):');
    result.rows.forEach((row) => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    return true;
  } catch (error: any) {
    console.error('Error checking column:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

checkEventLinkColumn();

