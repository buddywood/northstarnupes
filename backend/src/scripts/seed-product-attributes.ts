import pool from '../db/connection';
import { getAllProductCategories, getCategoryAttributeDefinitions, getProductAttributeValues, setProductAttributeValue } from '../db/queries';

// Product attribute mappings - maps product name to attribute values
// Note: Only include attributes that are defined for the product's category
const productAttributes: Record<string, Record<string, string | number | boolean>> = {
  "Kappa Alpha Psi Embroidered Polo": {
    "Size": "L",
    "Color": "Crimson",
    "Material": "100% Cotton"
  },
  "Founders' Day Commemorative Pin": {
    "Color": "Gold" // Accessories category has Color attribute
  },
  "Kappa Alpha Psi Custom Hoodie": {
    "Size": "XL",
    "Color": "Black"
  },
  "Brotherhood T-Shirt Collection": {
    "Size": "M",
    "Color": "Navy",
    "Material": "Premium Cotton"
  },
  "Kappa Alpha Psi Leather Wallet": {
    "Color": "Brown", // Accessories category has Color attribute
    "Material": "Genuine Leather"
  },
  "Chapter Custom Coffee Mug": {
    "Color": "Cream",
    "Material": "Ceramic"
  },
  "Kappa Alpha Psi Baseball Cap": {
    "Color": "Black" // Accessories category has Color attribute
  },
  "Founders' Day Tie": {
    "Size": "L", // Apparel has Size
    "Color": "Crimson"
  },
  "Kappa Alpha Psi Tote Bag": {
    "Color": "Navy" // Accessories category has Color attribute
  },
  "Chapter Custom Water Bottle": {
    "Color": "Silver", // Accessories category has Color attribute
    "Material": "Stainless Steel"
  },
  "Kappa Alpha Psi Keychain": {
    "Color": "Brass" // Accessories category has Color attribute
  },
  "Brotherhood Custom Stickers Pack": {
    "Color": "Other" // Accessories category has Color attribute
  },
  "Kappa Alpha Psi Phone Case": {
    "Model": "iPhone 14", // Electronics has Model (TEXT)
    "Color": "Black"
  },
  "Chapter Custom Notebook": {
    // Books & Media has Dimensions, Medium, Frame Included
    "Dimensions": "8.5 x 11 inches",
    "Medium": "Leather-bound"
  },
  "Kappa Alpha Psi Laptop Sleeve": {
    "Model": "13-15 inch", // Electronics has Model (TEXT)
    "Color": "Black"
  },
  "Founders' Day Commemorative Book": {
    "Dimensions": "8.5 x 11 inches",
    "Medium": "Hardcover"
  }
};

async function seedProductAttributes() {
  console.log('📋 Seeding product attributes...\n');

  try {
    // Get all products
    const productsResult = await pool.query(
      'SELECT id, name, category_id FROM products ORDER BY name'
    );
    const products = productsResult.rows;

    if (products.length === 0) {
      console.log('⚠️  No products found. Please seed products first.');
      return;
    }

    // Get all categories
    const categories = await getAllProductCategories();
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of products) {
      try {
        // Get attribute values for this product
        const attributeValues = productAttributes[product.name];
        
        if (!attributeValues) {
          skipped++;
          continue;
        }

        // Get category attribute definitions
        if (!product.category_id) {
          console.log(`  ⚠️  Product "${product.name}" has no category, skipping`);
          skipped++;
          continue;
        }

        const attributeDefinitions = await getCategoryAttributeDefinitions(product.category_id);
        
        if (attributeDefinitions.length === 0) {
          console.log(`  ⚠️  No attribute definitions found for category of "${product.name}", skipping`);
          skipped++;
          continue;
        }

        // Create a map of attribute definitions by name
        const definitionMap = new Map(
          attributeDefinitions.map(def => [def.attribute_name, def])
        );

        // Set attribute values
        let productUpdated = false;
        for (const [attrName, attrValue] of Object.entries(attributeValues)) {
          const definition = definitionMap.get(attrName);
          
          if (!definition) {
            console.log(`  ⚠️  Attribute "${attrName}" not found in category definitions for "${product.name}"`);
            continue;
          }

          try {
            // Determine value type based on attribute definition
            let valueToSet: { text?: string; number?: number; boolean?: boolean } = {};
            
            if (definition.attribute_type === 'BOOLEAN') {
              valueToSet.boolean = attrValue === true || attrValue === 'true' || attrValue === 'Yes';
            } else if (definition.attribute_type === 'NUMBER') {
              valueToSet.number = typeof attrValue === 'number' ? attrValue : parseFloat(String(attrValue));
            } else {
              // TEXT or SELECT
              valueToSet.text = String(attrValue);
            }

            await setProductAttributeValue(
              product.id,
              definition.id,
              valueToSet
            );
            
            productUpdated = true;
          } catch (error: any) {
            console.error(`  ❌ Error setting attribute "${attrName}" for "${product.name}":`, error.message);
            errors++;
          }
        }

        if (productUpdated) {
          updated++;
          console.log(`  ✓ Set attributes for: ${product.name}`);
        }
      } catch (error: any) {
        console.error(`  ❌ Error processing product "${product.name}":`, error.message);
        errors++;
      }
    }

    console.log(`\n✅ Attribute seeding completed:`);
    console.log(`  - Updated: ${updated} products`);
    console.log(`  - Skipped: ${skipped} products`);
    console.log(`  - Errors: ${errors}`);
  } catch (error) {
    console.error('❌ Error seeding product attributes:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedProductAttributes()
    .then(() => {
      console.log('\n✅ Product attribute seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Product attribute seeding failed:', error);
      process.exit(1);
    });
}

export { seedProductAttributes };

