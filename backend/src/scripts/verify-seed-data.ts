import pool from '../db/connection';

async function verifySeedData() {
  try {
    console.log('🔍 Verifying seed data...\n');

    // 1. Check promoters have fraternity_member_id
    console.log('📋 Promoters with fraternity_member_id:');
    const promotersResult = await pool.query(`
      SELECT p.id, p.email, p.name, p.fraternity_member_id, 
             fm.initiated_season, fm.initiated_year, fm.verification_status
      FROM promoters p
      LEFT JOIN fraternity_members fm ON p.fraternity_member_id = fm.id
      WHERE p.email LIKE '%example.com%' OR p.email LIKE 'buddy+%'
      ORDER BY p.id
    `);
    promotersResult.rows.forEach((row: any) => {
      console.log(`  - ${row.name} (${row.email}):`);
      console.log(`    fraternity_member_id: ${row.fraternity_member_id || 'NULL'}`);
      if (row.initiated_season) {
        console.log(`    Initiated: ${row.initiated_season} ${row.initiated_year}`);
      }
      console.log(`    Member verification: ${row.verification_status || 'N/A'}`);
    });
    console.log(`  Total: ${promotersResult.rows.length} promoters\n`);

    // 2. Check stewards with verification_status = VERIFIED
    console.log('🛡️  Stewards with verification status:');
    const stewardsResult = await pool.query(`
      SELECT s.id, s.verification_status, s.verification_date,
             fm.name, fm.email, fm.initiated_season, fm.initiated_year
      FROM stewards s
      LEFT JOIN fraternity_members fm ON s.fraternity_member_id = fm.id
      ORDER BY s.id
      LIMIT 5
    `);
    stewardsResult.rows.forEach((row: any) => {
      console.log(`  - ${row.name || 'Unknown'} (ID: ${row.id}):`);
      console.log(`    verification_status: ${row.verification_status}`);
      console.log(`    verification_date: ${row.verification_date || 'NULL'}`);
      if (row.initiated_season) {
        console.log(`    Initiated: ${row.initiated_season} ${row.initiated_year}`);
      }
    });
    const verifiedStewards = stewardsResult.rows.filter((r: any) => r.verification_status === 'VERIFIED');
    console.log(`  Verified stewards: ${verifiedStewards.length} of ${stewardsResult.rows.length}\n`);

    // 3. Check sellers verification_status and kappa product counts
    console.log('🏪 Sellers verification status and kappa products:');
    const sellersResult = await pool.query(`
      SELECT sel.id, sel.email, sel.name, sel.verification_status,
             COUNT(p.id) FILTER (WHERE p.is_kappa_branded = true) as kappa_product_count,
             COUNT(p.id) as total_product_count
      FROM sellers sel
      LEFT JOIN products p ON sel.id = p.seller_id
      WHERE sel.email LIKE '%example.com%' OR sel.email LIKE 'buddy+%'
      GROUP BY sel.id, sel.email, sel.name, sel.verification_status
      ORDER BY sel.id
      LIMIT 10
    `);
    sellersResult.rows.forEach((row: any) => {
      console.log(`  - ${row.name} (${row.email}):`);
      console.log(`    verification_status: ${row.verification_status}`);
      console.log(`    Kappa products: ${row.kappa_product_count || 0} / Total: ${row.total_product_count || 0}`);
    });
    console.log(`  Total: ${sellersResult.rows.length} sellers\n`);

    // 4. Check fraternity members have initiated_season and initiated_year
    console.log('👥 Fraternity members with initiation data:');
    const membersResult = await pool.query(`
      SELECT id, email, name, initiated_season, initiated_year, verification_status
      FROM fraternity_members
      WHERE email LIKE '%example.com%' OR email LIKE 'buddy+%'
      ORDER BY id
      LIMIT 10
    `);
    membersResult.rows.forEach((row: any) => {
      console.log(`  - ${row.name} (${row.email}):`);
      console.log(`    Initiated: ${row.initiated_season || 'NULL'} ${row.initiated_year || 'NULL'}`);
      console.log(`    Verification: ${row.verification_status}`);
    });
    const membersWithInitiation = membersResult.rows.filter((r: any) => r.initiated_season && r.initiated_year);
    console.log(`  Members with initiation data: ${membersWithInitiation.length} of ${membersResult.rows.length}\n`);

    console.log('✅ Seed data verification complete!');
  } catch (error) {
    console.error('❌ Error verifying seed data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

verifySeedData();

