import pool from '../db/connection';
import { getCategoryAttributeDefinitions } from '../db/queries';

async function verifyAttributes() {
  try {
    const productsResult = await pool.query(
      `SELECT p.id, p.name, p.category_id, pc.name as category_name
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       ORDER BY p.name`
    );
    
    console.log('\n📋 Product Attributes Verification:\n');
    
    for (const product of productsResult.rows) {
      console.log(`\n${product.name} (${product.category_name || 'No category'})`);
      
      if (!product.category_id) {
        console.log('  ⚠️  No category assigned');
        continue;
      }
      
      // Get attribute definitions for this category
      const definitions = await getCategoryAttributeDefinitions(product.category_id);
      
      if (definitions.length === 0) {
        console.log('  ⚠️  No attribute definitions for this category');
        continue;
      }
      
      // Get attribute values for this product
      const valuesResult = await pool.query(
        `SELECT pav.*, cad.attribute_name, cad.attribute_type
         FROM product_attribute_values pav
         JOIN category_attribute_definitions cad ON pav.attribute_definition_id = cad.id
         WHERE pav.product_id = $1`,
        [product.id]
      );
      
      const valueMap = new Map(valuesResult.rows.map(v => [v.attribute_name, v]));
      
      if (valueMap.size === 0) {
        console.log('  ⚠️  No attributes set');
      } else {
        definitions.forEach(def => {
          const value = valueMap.get(def.attribute_name);
          if (value) {
            let displayValue = '';
            if (def.attribute_type === 'BOOLEAN') {
              displayValue = value.value_boolean ? 'Yes' : 'No';
            } else if (def.attribute_type === 'NUMBER') {
              displayValue = value.value_number?.toString() || '';
            } else {
              displayValue = value.value_text || '';
            }
            console.log(`  ✓ ${def.attribute_name}: ${displayValue}`);
          } else if (def.is_required) {
            console.log(`  ❌ ${def.attribute_name}: MISSING (required)`);
          }
        });
      }
    }
    
    console.log('\n✅ Verification completed!\n');
  } catch (error) {
    console.error('Error verifying attributes:', error);
  } finally {
    await pool.end();
  }
}

verifyAttributes();

