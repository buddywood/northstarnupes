import pool from '../db/connection';
import { createProduct, getAllProductCategories } from '../db/queries';
import { createSeller } from '../db/queries';
import { getAllChapters } from '../db/queries';

// Sample product data with category mappings
const sampleProducts = [
  {
    name: "Kappa Alpha Psi Embroidered Polo",
    description: "Premium cotton polo shirt with embroidered Kappa Alpha Psi logo. Perfect for chapter events and casual wear. Available in multiple colors.",
    price_cents: 4500, // $45.00
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
    category: "Apparel",
  },
  {
    name: "Founders' Day Commemorative Pin",
    description: "Limited edition commemorative pin celebrating the founding of Kappa Alpha Psi. Gold-plated with intricate detailing.",
    price_cents: 2500, // $25.00
    image_url: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500&h=500&fit=crop",
    category: "Accessories",
  },
  {
    name: "Kappa Alpha Psi Custom Hoodie",
    description: "Comfortable fleece hoodie with screen-printed Kappa Alpha Psi design. Perfect for chilly chapter meetings and casual outings.",
    price_cents: 5500, // $55.00
    image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=500&fit=crop",
    category: "Outerwear",
  },
  {
    name: "Brotherhood T-Shirt Collection",
    description: "Set of 3 premium cotton t-shirts featuring different Kappa Alpha Psi designs. Great for everyday wear and chapter events.",
    price_cents: 3500, // $35.00
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
    category: "Apparel",
  },
  {
    name: "Kappa Alpha Psi Leather Wallet",
    description: "Genuine leather wallet with embossed Kappa Alpha Psi letters. Features multiple card slots and cash compartment.",
    price_cents: 4500, // $45.00
    image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop",
    category: "Accessories",
  },
  {
    name: "Chapter Custom Coffee Mug",
    description: "Ceramic coffee mug with custom chapter name and Kappa Alpha Psi logo. Microwave and dishwasher safe.",
    price_cents: 1800, // $18.00
    image_url: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&h=500&fit=crop",
    category: "Home Goods",
  },
  {
    name: "Kappa Alpha Psi Baseball Cap",
    description: "Adjustable snapback cap with embroidered Kappa Alpha Psi logo. One size fits all. Perfect for outdoor events.",
    price_cents: 2800, // $28.00
    image_url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&h=500&fit=crop",
    category: "Accessories",
  },
  {
    name: "Founders' Day Tie",
    description: "Elegant silk tie featuring Kappa Alpha Psi colors and subtle pattern. Perfect for formal chapter events and banquets.",
    price_cents: 3800, // $38.00
    image_url: "https://images.unsplash.com/photo-1594938291220-94d21225f65a?w=500&h=500&fit=crop",
    category: "Apparel",
  },
  {
    name: "Kappa Alpha Psi Tote Bag",
    description: "Durable canvas tote bag with screen-printed Kappa Alpha Psi design. Perfect for carrying books, gym gear, or groceries.",
    price_cents: 2200, // $22.00
    image_url: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=500&h=500&fit=crop",
    category: "Accessories",
  },
  {
    name: "Chapter Custom Water Bottle",
    description: "Stainless steel insulated water bottle with custom chapter engraving. Keeps drinks cold for 24 hours or hot for 12 hours.",
    price_cents: 3200, // $32.00
    image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop",
    category: "Accessories",
  },
  {
    name: "Kappa Alpha Psi Keychain",
    description: "Brass keychain with engraved Kappa Alpha Psi letters. Makes a great gift for brothers or pledges.",
    price_cents: 1200, // $12.00
    image_url: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=500&h=500&fit=crop",
    category: "Accessories",
  },
  {
    name: "Brotherhood Custom Stickers Pack",
    description: "Set of 20 vinyl stickers featuring various Kappa Alpha Psi designs. Waterproof and weather-resistant.",
    price_cents: 1500, // $15.00
    image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&h=500&fit=crop",
    category: "Accessories",
  },
  {
    name: "Kappa Alpha Psi Phone Case",
    description: "Protective phone case with Kappa Alpha Psi logo. Compatible with iPhone and Samsung models. Available in multiple colors.",
    price_cents: 2500, // $25.00
    image_url: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=500&h=500&fit=crop",
    category: "Electronics",
  },
  {
    name: "Chapter Custom Notebook",
    description: "Premium leather-bound notebook with custom chapter name embossed on the cover. Perfect for taking notes at meetings.",
    price_cents: 2800, // $28.00
    image_url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop",
    category: "Books & Media",
  },
  {
    name: "Kappa Alpha Psi Laptop Sleeve",
    description: "Protective laptop sleeve with Kappa Alpha Psi design. Fits 13-15 inch laptops. Padded interior for extra protection.",
    price_cents: 4200, // $42.00
    image_url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop",
    category: "Electronics",
  },
  {
    name: "Founders' Day Commemorative Book",
    description: "Hardcover book chronicling the history of Kappa Alpha Psi. Includes photos, stories, and important milestones.",
    price_cents: 3500, // $35.00
    image_url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop",
    category: "Books & Media",
  },
];

// Sample sellers data
const sampleSellers = [
  {
    name: "Marcus Johnson",
    email: "marcus.johnson@example.com",
    membership_number: "KAP-2020-001",
    business_name: "Kappa Gear Co.",
    vendor_license_number: "VL-2024-001",
  },
  {
    name: "David Carter",
    email: "david.carter@example.com",
    membership_number: "KAP-2019-045",
    business_name: "Brotherhood Apparel",
    vendor_license_number: "VL-2024-002",
  },
  {
    name: "James Williams",
    email: "james.williams@example.com",
    membership_number: "KAP-2021-123",
    business_name: null,
    vendor_license_number: "VL-2024-003",
  },
];

async function seedProducts(): Promise<void> {
  console.log('Starting product seeding...');

  try {
    // Get all chapters to use for initiated/sponsoring chapters
    const chapters = await getAllChapters();
    const collegiateChapters = chapters.filter(c => c.type === 'Collegiate' && c.status === 'Active');
    
    if (collegiateChapters.length === 0) {
      console.error('No active collegiate chapters found. Please seed chapters first.');
      return;
    }

    // Get product categories
    const categories = await getAllProductCategories();
    const categoryMap = new Map(categories.map(cat => [cat.name, cat.id]));

    // Get or create sellers
    const sellers = [];
    for (const sellerData of sampleSellers) {
      // Check if seller already exists
      const existingSeller = await pool.query(
        'SELECT id FROM sellers WHERE email = $1',
        [sellerData.email]
      );

      if (existingSeller.rows.length > 0) {
        console.log(`Seller ${sellerData.email} already exists, using existing seller`);
        sellers.push(existingSeller.rows[0]);
      } else {
        // Create new seller
        const randomChapter = collegiateChapters[Math.floor(Math.random() * collegiateChapters.length)];
        const newSeller = await createSeller({
          email: sellerData.email,
          name: sellerData.name,
          sponsoring_chapter_id: randomChapter.id,
          business_name: sellerData.business_name,
          vendor_license_number: sellerData.vendor_license_number,
          social_links: {
            instagram: `@${sellerData.name.toLowerCase().replace(' ', '')}`,
          },
        });

        // Approve the seller
        await pool.query(
          'UPDATE sellers SET status = $1 WHERE id = $2',
          ['APPROVED', newSeller.id]
        );

        console.log(`Created and approved seller: ${sellerData.name}`);
        sellers.push(newSeller);
      }
    }

    // Create products
    let inserted = 0;
    let skipped = 0;

    for (const productData of sampleProducts) {
      try {
        // Check if product already exists
        const existing = await pool.query(
          'SELECT id FROM products WHERE name = $1',
          [productData.name]
        );

        if (existing.rows.length > 0) {
          console.log(`Skipping duplicate product: ${productData.name}`);
          skipped++;
          continue;
        }

        // Assign to random seller
        const seller = sellers[Math.floor(Math.random() * sellers.length)];
        
        // Get category ID from category name
        const categoryId = productData.category ? categoryMap.get(productData.category) || null : null;
        
        await createProduct({
          seller_id: seller.id,
          name: productData.name,
          description: productData.description,
          price_cents: productData.price_cents,
          image_url: productData.image_url,
          category_id: categoryId || undefined,
        });

        inserted++;
        if (inserted % 5 === 0) {
          console.log(`Inserted ${inserted} products...`);
        }
      } catch (error) {
        console.error(`Error inserting product ${productData.name}:`, error);
      }
    }

    console.log('\n=== Product Seeding Summary ===');
    console.log(`Total products in data: ${sampleProducts.length}`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped (duplicates): ${skipped}`);
    console.log(`Sellers used: ${sellers.length}`);
  } catch (error) {
    console.error('Error seeding products:', error);
    throw error;
  }
}

seedProducts()
  .then(() => {
    console.log('Product seeding completed.');
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Product seeding failed:', error);
    pool.end();
    process.exit(1);
  });

