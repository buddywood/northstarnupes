import pool from '../db/connection';

async function verifyCategories() {
  try {
    const result = await pool.query(
      `SELECT p.name, pc.name as category 
       FROM products p 
       LEFT JOIN product_categories pc ON p.category_id = pc.id 
       ORDER BY p.name`
    );
    
    console.log('\n✅ Products with categories:');
    result.rows.forEach(r => {
      const status = r.category ? '✓' : '❌';
      console.log(`  ${status} ${r.name}: ${r.category || 'No category'}`);
    });
    
    console.log(`\nTotal products: ${result.rows.length}`);
    console.log(`Products with categories: ${result.rows.filter(r => r.category).length}`);
    console.log(`Products without categories: ${result.rows.filter(r => !r.category).length}`);
  } catch (error) {
    console.error('Error verifying categories:', error);
  } finally {
    await pool.end();
  }
}

verifyCategories();

