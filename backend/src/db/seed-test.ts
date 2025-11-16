import pool from './connection';
import { createPromoter, createProduct, createSeller, getAllChapters, createEvent, getAllProductCategories } from './queries';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

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

// Test promoters for local development
const testPromoters = [
  {
    email: 'promoter1@example.com',
    name: 'Michael Brown',
    membership_number: 'PROM-001',
    social_links: {
      instagram: '@michaelbrown',
      twitter: '@michaelbrown',
    },
    status: 'APPROVED' as const,
  },
  {
    email: 'promoter2@example.com',
    name: 'Robert Davis',
    membership_number: 'PROM-002',
    social_links: {
      instagram: '@robertdavis',
      linkedin: 'robert-davis',
    },
    status: 'APPROVED' as const,
  },
  {
    email: 'promoter3@example.com',
    name: 'William Taylor',
    membership_number: 'PROM-003',
    status: 'PENDING' as const,
  },
];

// Sample events data - using future dates
function getFutureDate(daysFromNow: number, hours: number = 18): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hours, 0, 0, 0);
  return date;
}

const sampleEvents = [
  {
    title: "Founders' Day Banquet",
    description: "Join us for an elegant evening celebrating the founding of Kappa Alpha Psi. This formal event features dinner, guest speakers, and recognition of outstanding brothers. Black tie optional.",
    event_date: getFutureDate(15, 19),
    location: "Minneapolis Convention Center",
    city: "Minneapolis",
    state: "MN",
    image_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop",
    ticket_price_cents: 7500, // $75.00
    max_attendees: 200,
  },
  {
    title: "Spring Brotherhood Mixer",
    description: "A casual networking event for brothers to connect, share experiences, and build stronger bonds. Light refreshments and music provided. All chapters welcome!",
    event_date: getFutureDate(30, 18),
    location: "St. Paul Event Center",
    city: "St. Paul",
    state: "MN",
    image_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop",
    ticket_price_cents: 2500, // $25.00
    max_attendees: 150,
  },
  {
    title: "Community Service Drive",
    description: "Join us for a day of giving back to our community. We'll be collecting donations, organizing food drives, and volunteering at local shelters. All brothers and friends welcome to participate.",
    event_date: getFutureDate(45, 10),
    location: "University of Minnesota Campus",
    city: "Minneapolis",
    state: "MN",
    image_url: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=600&fit=crop",
    ticket_price_cents: 0, // Free event
    max_attendees: 100,
  },
  {
    title: "Kappa Leadership Summit",
    description: "A comprehensive leadership development workshop featuring keynote speakers, breakout sessions, and networking opportunities. Designed for current and aspiring chapter leaders.",
    event_date: getFutureDate(60, 9),
    location: "Hilton Downtown",
    city: "Minneapolis",
    state: "MN",
    image_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop",
    ticket_price_cents: 5000, // $50.00
    max_attendees: 75,
  },
  {
    title: "Alumni Chapter Golf Tournament",
    description: "Annual golf tournament bringing together brothers from across the region. Includes 18 holes, lunch, awards ceremony, and networking reception. All skill levels welcome!",
    event_date: getFutureDate(75, 8),
    location: "Prestige Golf Club",
    city: "Bloomington",
    state: "MN",
    image_url: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop",
    ticket_price_cents: 10000, // $100.00
    max_attendees: 120,
  },
  {
    title: "Holiday Celebration & Toy Drive",
    description: "Celebrate the holiday season with your brothers while giving back to the community. Bring an unwrapped toy for our annual toy drive. Food, music, and fellowship included.",
    event_date: getFutureDate(90, 17),
    location: "Community Center",
    city: "St. Paul",
    state: "MN",
    image_url: "https://images.unsplash.com/photo-1482517967863-00e15c9b44be?w=800&h=600&fit=crop",
    ticket_price_cents: 2000, // $20.00
    max_attendees: 80,
  },
];

async function seedProducts(): Promise<void> {
  console.log('📦 Seeding products and sellers...');

  try {
    // Get all chapters to use for initiated/sponsoring chapters
    const chapters = await getAllChapters();
    const collegiateChapters = chapters.filter(c => c.type === 'Collegiate' && c.status === 'Active');
    
    if (collegiateChapters.length === 0) {
      console.warn('⚠️  No active collegiate chapters found. Using any available chapters...');
    }

    const availableChapters = collegiateChapters.length > 0 ? collegiateChapters : chapters;
    
    if (availableChapters.length === 0) {
      console.error('❌ No chapters found. Please seed chapters first using: npm run seed:chapters');
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
        console.log(`  Seller ${sellerData.email} already exists, using existing seller`);
        sellers.push(existingSeller.rows[0]);
      } else {
        // Create new seller
        const randomChapter = availableChapters[Math.floor(Math.random() * availableChapters.length)];
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

        console.log(`  ✓ Created and approved seller: ${sellerData.name}`);
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
      } catch (error) {
        console.error(`  ❌ Error inserting product ${productData.name}:`, error);
      }
    }

    console.log(`  ✓ Inserted ${inserted} products (${skipped} skipped)`);
    console.log(`  ✓ Used ${sellers.length} sellers\n`);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
}

async function seedPromoters(): Promise<void> {
  console.log('🎤 Seeding promoters...');
  
  // Get all chapters
  const chapters = await getAllChapters();
  if (chapters.length === 0) {
    console.warn('⚠️  No chapters found. Please seed chapters first using: npm run seed:chapters');
    return;
  }
  
  const collegiateChapters = chapters.filter(c => c.type === 'Collegiate' && c.status === 'Active');
  if (collegiateChapters.length === 0) {
    console.warn('⚠️  No active collegiate chapters found. Using any available chapters...');
  }
  
  const availableChapters = collegiateChapters.length > 0 ? collegiateChapters : chapters;
  
  let inserted = 0;
  let skipped = 0;
  
  for (const promoterData of testPromoters) {
    try {
      // Check if promoter already exists
      const existing = await pool.query(
        'SELECT id FROM promoters WHERE email = $1',
        [promoterData.email]
      );
      
      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }
      
      // Get random chapter
      const randomChapter = availableChapters[Math.floor(Math.random() * availableChapters.length)];
      
      // Create promoter
      const promoter = await createPromoter({
        email: promoterData.email,
        name: promoterData.name,
        sponsoring_chapter_id: randomChapter.id,
        headshot_url: undefined,
        social_links: Object.fromEntries(
          Object.entries(promoterData.social_links || {}).filter(([_, v]) => v !== undefined)
        ) as Record<string, string>,
      });
      
      // Update status if not PENDING
      if (promoterData.status && promoterData.status !== 'PENDING') {
        await pool.query(
          'UPDATE promoters SET status = $1 WHERE id = $2',
          [promoterData.status, promoter.id]
        );
      }
      
      inserted++;
      console.log(`  ✓ Created promoter: ${promoterData.name} (${promoterData.status || 'PENDING'})`);
    } catch (error) {
      console.error(`  ❌ Error seeding promoter ${promoterData.email}:`, error);
    }
  }
  
  console.log(`  ✓ Inserted ${inserted} promoters (${skipped} skipped)\n`);
}

async function seedEvents(): Promise<void> {
  console.log('📅 Seeding events...');
  
  // Get all chapters for sponsored chapter assignment
  const chapters = await getAllChapters();
  const availableChapters = chapters.length > 0 ? chapters : [];
  
  // Get approved promoters
  const promotersResult = await pool.query(
    "SELECT id FROM promoters WHERE status = 'APPROVED' AND (email LIKE '%example.com' OR email LIKE 'test%@%')"
  );
  const promoters = promotersResult.rows;
  
  if (promoters.length === 0) {
    console.warn('  ⚠️  No approved promoters found. Please seed promoters first.');
    return;
  }
  
  let inserted = 0;
  let skipped = 0;
  
  for (const eventData of sampleEvents) {
    try {
      // Check if event already exists
      const existing = await pool.query(
        'SELECT id FROM events WHERE title = $1 AND event_date = $2',
        [eventData.title, eventData.event_date]
      );
      
      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }
      
      // Assign to random approved promoter
      const promoter = promoters[Math.floor(Math.random() * promoters.length)];
      
      // Randomly assign sponsored chapter (50% chance)
      const sponsoredChapter = availableChapters.length > 0 && Math.random() > 0.5
        ? availableChapters[Math.floor(Math.random() * availableChapters.length)].id
        : undefined;
      
      await createEvent({
        promoter_id: promoter.id,
        title: eventData.title,
        description: eventData.description,
        event_date: eventData.event_date,
        location: eventData.location,
        city: eventData.city,
        state: eventData.state,
        image_url: eventData.image_url,
        sponsored_chapter_id: sponsoredChapter,
        ticket_price_cents: eventData.ticket_price_cents,
        max_attendees: eventData.max_attendees,
      });
      
      inserted++;
      console.log(`  ✓ Created event: ${eventData.title}`);
    } catch (error) {
      console.error(`  ❌ Error seeding event ${eventData.title}:`, error);
    }
  }
  
  console.log(`  ✓ Inserted ${inserted} events (${skipped} skipped)\n`);
}

async function seedOrders(): Promise<void> {
  console.log('💰 Seeding orders for impact banner...');
  
  try {
    // Get some products with their sellers to create orders
    const productsResult = await pool.query(
      `SELECT p.id, p.price_cents, s.sponsoring_chapter_id 
       FROM products p 
       JOIN sellers s ON p.seller_id = s.id 
       LIMIT 10`
    );
    const products = productsResult.rows;
    
    const chaptersResult = await pool.query('SELECT id FROM chapters LIMIT 5');
    const chapters = chaptersResult.rows;
    
    if (products.length === 0) {
      console.log('  ⚠️  No products found. Skipping order seeding.');
      return;
    }
    
    if (chapters.length === 0) {
      console.log('  ⚠️  No chapters found. Skipping order seeding.');
      return;
    }
    
    // Create some paid orders with various amounts
    const orderAmounts = [
      4500,  // $45.00
      5500,  // $55.00
      3500,  // $35.00
      2800,  // $28.00
      1800,  // $18.00
      2500,  // $25.00
      4500,  // $45.00
      5500,  // $55.00
      3500,  // $35.00
      2800,  // $28.00
      1800,  // $18.00
      4500,  // $45.00
      5500,  // $55.00
      3500,  // $35.00
      2800,  // $28.00
    ];
    
    let inserted = 0;
    for (let i = 0; i < Math.min(orderAmounts.length, products.length); i++) {
      const product = products[i % products.length];
      const chapter = chapters[i % chapters.length];
      const amount = orderAmounts[i];
      
      // Use seller's sponsoring_chapter_id if available, otherwise use random chapter
      const chapterId = product.sponsoring_chapter_id || chapter.id;
      
      try {
        // Check if order already exists
        const existing = await pool.query(
          'SELECT id FROM orders WHERE stripe_session_id = $1',
          [`test_session_${i}`]
        );
        
        if (existing.rows.length > 0) {
          continue; // Skip if already exists
        }
        
        await pool.query(
          `INSERT INTO orders (product_id, buyer_email, amount_cents, stripe_session_id, chapter_id, status, created_at)
           VALUES ($1, $2, $3, $4, $5, 'PAID', NOW() - INTERVAL '${Math.floor(Math.random() * 90)} days')`,
          [
            product.id,
            `buyer${i + 1}@example.com`,
            amount,
            `test_session_${i}`,
            chapterId,
          ]
        );
        inserted++;
      } catch (error: any) {
        console.error(`  Error inserting order ${i + 1}:`, error.message);
      }
    }
    
    console.log(`  ✓ Inserted ${inserted} paid orders\n`);
  } catch (error) {
    console.error('  ❌ Error seeding orders:', error);
    throw error;
  }
}

async function clearTestData() {
  console.log('🧹 Clearing test data...');
  
  // Delete in reverse order of dependencies
  await pool.query('DELETE FROM events WHERE promoter_id IN (SELECT id FROM promoters WHERE email LIKE \'%example.com\' OR email LIKE \'test%@%\')');
  await pool.query('DELETE FROM promoters WHERE email LIKE \'%example.com\' OR email LIKE \'test%@%\'');
  await pool.query('DELETE FROM orders WHERE buyer_email LIKE \'%example.com\' OR stripe_session_id LIKE \'test_session_%\'');
  await pool.query('DELETE FROM products WHERE seller_id IN (SELECT id FROM sellers WHERE email LIKE \'%example.com\' OR email LIKE \'test%@%\')');
  await pool.query('DELETE FROM sellers WHERE email LIKE \'%example.com\' OR email LIKE \'test%@%\'');
  
  console.log('✓ Test data cleared\n');
}

async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');
  
  try {
    console.log('🌱 Starting database seeding (products & promoters)...\n');
    
    if (shouldClear) {
      await clearTestData();
    }
    
    // Seed products and sellers
    await seedProducts();
    
    // Seed promoters
    await seedPromoters();
    
    // Seed events (requires promoters to be seeded first)
    await seedEvents();
    
    // Seed orders for impact banner
    await seedOrders();
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\nNote: For chapters, use:');
    console.log('  - npm run seed:chapters (scrapes Wikipedia for chapters)');
    console.log('  - npm run seed:alumni (seeds alumni chapters)');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { seedProducts, seedPromoters, seedEvents, clearTestData };
