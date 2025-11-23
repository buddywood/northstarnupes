import pool from '../db/connection';

async function fixExistingMembers() {
  try {
    console.log('🔧 Fixing existing members...\n');

    // Update existing members without initiated_season/year
    const result = await pool.query(`
      UPDATE fraternity_members
      SET initiated_season = CASE 
          WHEN RANDOM() < 0.5 THEN 'Fall' 
          ELSE 'Spring' 
        END,
        initiated_year = 2015 + FLOOR(RANDOM() * 10)::INTEGER
      WHERE (initiated_season IS NULL OR initiated_year IS NULL)
        AND (email LIKE '%example.com%' OR email LIKE 'buddy+%')
      RETURNING id, email, name, initiated_season, initiated_year
    `);

    console.log(`✓ Updated ${result.rows.length} members with initiation data:`);
    result.rows.forEach((row: any) => {
      console.log(`  - ${row.name} (${row.email}): ${row.initiated_season} ${row.initiated_year}`);
    });

    // Update existing promoters without fraternity_member_id
    const promotersResult = await pool.query(`
      UPDATE promoters p
      SET fraternity_member_id = (
        SELECT id FROM fraternity_members fm 
        WHERE fm.email = p.email 
        LIMIT 1
      )
      WHERE p.fraternity_member_id IS NULL
        AND (p.email LIKE '%example.com%' OR p.email LIKE 'buddy+%')
      RETURNING p.id, p.email, p.name, p.fraternity_member_id
    `);

    console.log(`\n✓ Updated ${promotersResult.rows.length} promoters with fraternity_member_id:`);
    promotersResult.rows.forEach((row: any) => {
      console.log(`  - ${row.name} (${row.email}): fraternity_member_id = ${row.fraternity_member_id}`);
    });

    console.log('\n✅ Fix complete!');
  } catch (error) {
    console.error('❌ Error fixing members:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixExistingMembers();

