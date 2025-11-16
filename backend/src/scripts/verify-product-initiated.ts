import pool from '../db/connection';
import { getProductById } from '../db/queries';

async function verify() {
  try {
    const product = await getProductById(1);
    if (product) {
      console.log('\nProduct Data:');
      console.log('  ID:', product.id);
      console.log('  Name:', product.name);
      console.log('  Seller Member ID:', product.seller_member_id);
      console.log('  Seller Initiated Chapter ID:', product.seller_initiated_chapter_id);
      console.log('  Seller Sponsoring Chapter ID:', product.seller_sponsoring_chapter_id);
      
      if (product.seller_member_id) {
        const memberResult = await pool.query(
          'SELECT id, name, initiated_chapter_id FROM members WHERE id = $1',
          [product.seller_member_id]
        );
        if (memberResult.rows.length > 0) {
          const member = memberResult.rows[0];
          console.log('\nMember Data:');
          console.log('  Member ID:', member.id);
          console.log('  Member Name:', member.name);
          console.log('  Initiated Chapter ID:', member.initiated_chapter_id);
          
          if (member.initiated_chapter_id) {
            const chapterResult = await pool.query(
              'SELECT id, name FROM chapters WHERE id = $1',
              [member.initiated_chapter_id]
            );
            if (chapterResult.rows.length > 0) {
              console.log('  Initiated Chapter Name:', chapterResult.rows[0].name);
            }
          }
        }
      }
    } else {
      console.log('Product not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

verify();

