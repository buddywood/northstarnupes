import pool from "../db/connection";
import { createStewardListing, getAllProductCategories } from "../db/queries";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env.local") });

// Sample steward listing data
const sampleListings = [
  {
    name: "Vintage Kappa Alpha Psi Letterman Jacket",
    description:
      "Authentic vintage letterman jacket from the 1980s. Features embroidered Kappa Alpha Psi letters and chapter designation. Excellent condition with minor wear consistent with age.",
    image_url:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop",
    shipping_cost_cents: 1500, // $15.00
    chapter_donation_cents: 5000, // $50.00
  },
  {
    name: "Founders' Day Commemorative Plaque",
    description:
      "Limited edition commemorative plaque from 1995 Founders' Day celebration. Bronze finish with engraved details. Perfect for chapter house or personal collection.",
    image_url:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500&h=500&fit=crop",
    shipping_cost_cents: 2000, // $20.00
    chapter_donation_cents: 3000, // $30.00
  },
  {
    name: "Classic Kappa Alpha Psi Paddle",
    description:
      "Traditional wooden paddle with hand-painted Kappa Alpha Psi design. Dates back to the 1970s. Shows signs of use but maintains structural integrity. A true piece of fraternity history.",
    image_url:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&h=500&fit=crop",
    shipping_cost_cents: 1200, // $12.00
    chapter_donation_cents: 4000, // $40.00
  },
  {
    name: "Vintage Kappa Alpha Psi Badge",
    description:
      "Original fraternity badge from the 1960s. Gold-plated with intricate detailing. Includes original case. Rare find for collectors.",
    image_url:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500&h=500&fit=crop",
    shipping_cost_cents: 800, // $8.00
    chapter_donation_cents: 6000, // $60.00
  },
  {
    name: "Heritage Chapter Photo Album",
    description:
      "Collection of historical chapter photos from the 1980s-1990s. Includes candid shots from events, initiations, and social gatherings. Preserves important chapter history.",
    image_url:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&h=500&fit=crop",
    shipping_cost_cents: 1000, // $10.00
    chapter_donation_cents: 2500, // $25.00
  },
  {
    name: "Vintage Kappa Alpha Psi Sweater",
    description:
      "Classic wool sweater with embroidered fraternity letters. From the 1990s, excellent condition. Perfect for chapter events and cold weather.",
    image_url:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=500&fit=crop",
    shipping_cost_cents: 1100, // $11.00
    chapter_donation_cents: 3500, // $35.00
  },
  {
    name: "Historical Chapter Documents",
    description:
      "Collection of original chapter meeting minutes, newsletters, and correspondence from the 1970s-1980s. Provides valuable insight into chapter history and traditions.",
    image_url:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&h=500&fit=crop",
    shipping_cost_cents: 900, // $9.00
    chapter_donation_cents: 2000, // $20.00
  },
  {
    name: "Vintage Kappa Alpha Psi Ring",
    description:
      "Original fraternity ring from the 1980s. Gold with engraved fraternity letters and chapter designation. Size 10.5. Includes original box.",
    image_url:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500&h=500&fit=crop",
    shipping_cost_cents: 700, // $7.00
    chapter_donation_cents: 4500, // $45.00
  },
  {
    name: "Legacy Chapter Banner",
    description:
      "Hand-sewn chapter banner from the 1990s. Features fraternity colors and chapter name. Excellent condition, perfect for display at chapter events.",
    image_url:
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=500&h=500&fit=crop",
    shipping_cost_cents: 1300, // $13.00
    chapter_donation_cents: 3000, // $30.00
  },
  {
    name: "Vintage Kappa Alpha Psi T-Shirt Collection",
    description:
      "Collection of 5 vintage t-shirts from various chapter events spanning the 1980s-2000s. Each shirt features unique designs and chapter-specific graphics. Great for collectors.",
    image_url:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
    shipping_cost_cents: 1000, // $10.00
    chapter_donation_cents: 4000, // $40.00
  },
];

async function seedStewardListings(): Promise<void> {
  console.log("📦 Seeding steward listings...");

  try {
    // Get all approved stewards
    const stewardsResult = await pool.query(
      "SELECT id, sponsoring_chapter_id FROM stewards WHERE status = 'APPROVED'"
    );

    if (stewardsResult.rows.length === 0) {
      console.warn(
        "⚠️  No approved stewards found. Please seed stewards first using: npm run seed:test"
      );
      return;
    }

    const stewards = stewardsResult.rows;
    console.log(`  Found ${stewards.length} approved steward(s)`);

    // Get product categories
    const categories = await getAllProductCategories();
    const heritageCategory = categories.find(
      (cat) => cat.name === "Heritage / Legacy Item"
    );

    if (!heritageCategory) {
      console.warn(
        "⚠️  'Heritage / Legacy Item' category not found. Listings will be created without category."
      );
    }

    let createdCount = 0;
    let skippedCount = 0;

    // Create listings for each steward
    for (const steward of stewards) {
      // Create 2-4 listings per steward
      const listingsPerSteward = 2 + Math.floor(Math.random() * 3); // 2-4 listings

      for (let i = 0; i < listingsPerSteward; i++) {
        const listingData =
          sampleListings[Math.floor(Math.random() * sampleListings.length)];

        // Check if listing already exists (by name and steward_id)
        const existingListing = await pool.query(
          "SELECT id FROM steward_listings WHERE steward_id = $1 AND name = $2",
          [steward.id, listingData.name]
        );

        if (existingListing.rows.length > 0) {
          skippedCount++;
          continue;
        }

        try {
          await createStewardListing({
            steward_id: steward.id,
            name: listingData.name,
            description: listingData.description,
            image_url: listingData.image_url,
            shipping_cost_cents: listingData.shipping_cost_cents,
            chapter_donation_cents: listingData.chapter_donation_cents,
            sponsoring_chapter_id: steward.sponsoring_chapter_id,
            category_id: heritageCategory?.id || null,
          });

          createdCount++;
          console.log(
            `  ✓ Created listing: "${listingData.name}" for steward ${steward.id}`
          );
        } catch (error) {
          console.error(
            `  ✗ Error creating listing "${listingData.name}":`,
            error
          );
        }
      }
    }

    console.log(
      `\n✅ Steward listings seeding completed! Created: ${createdCount}, Skipped: ${skippedCount}`
    );
  } catch (error) {
    console.error("❌ Error seeding steward listings:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedStewardListings()
    .then(() => {
      console.log("✅ Seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error seeding:", error);
      process.exit(1);
    })
    .finally(() => {
      pool.end();
    });
}

export default seedStewardListings;

