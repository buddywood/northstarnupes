import pool from "./connection";
import {
  createPromoter,
  createProduct,
  createSeller,
  getAllChapters,
  createEvent,
  getAllProductCategories,
  createSteward,
  updateStewardStatus,
} from "./queries";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env.local") });

// Sample product data with category mappings
const sampleProducts = [
  {
    name: "Kappa Alpha Psi Embroidered Polo",
    description:
      "Premium cotton polo shirt with embroidered Kappa Alpha Psi logo. Perfect for chapter events and casual wear. Available in multiple colors.",
    price_cents: 4500, // $45.00
    image_url:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
    category: "Apparel",
  },
  {
    name: "Founders' Day Commemorative Pin",
    description:
      "Limited edition commemorative pin celebrating the founding of Kappa Alpha Psi. Gold-plated with intricate detailing.",
    price_cents: 2500, // $25.00
    image_url:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500&h=500&fit=crop",
    category: "Accessories",
  },
  {
    name: "Kappa Alpha Psi Custom Hoodie",
    description:
      "Comfortable fleece hoodie with screen-printed Kappa Alpha Psi design. Perfect for chilly chapter meetings and casual outings.",
    price_cents: 5500, // $55.00
    image_url:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=500&fit=crop",
    category: "Outerwear",
  },
  {
    name: "Brotherhood T-Shirt Collection",
    description:
      "Set of 3 premium cotton t-shirts featuring different Kappa Alpha Psi designs. Great for everyday wear and chapter events.",
    price_cents: 3500, // $35.00
    image_url:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
    category: "Apparel",
  },
  {
    name: "Kappa Alpha Psi Leather Wallet",
    description:
      "Genuine leather wallet with embossed Kappa Alpha Psi letters. Features multiple card slots and cash compartment.",
    price_cents: 4500, // $45.00
    image_url:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop",
    category: "Accessories",
  },
  {
    name: "Chapter Custom Coffee Mug",
    description:
      "Ceramic coffee mug with custom chapter name and Kappa Alpha Psi logo. Microwave and dishwasher safe.",
    price_cents: 1800, // $18.00
    image_url:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&h=500&fit=crop",
    category: "Home Goods",
  },
  {
    name: "Kappa Alpha Psi Baseball Cap",
    description:
      "Adjustable snapback cap with embroidered Kappa Alpha Psi logo. One size fits all. Perfect for outdoor events.",
    price_cents: 2800, // $28.00
    image_url:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&h=500&fit=crop",
    category: "Accessories",
  },
  {
    name: "Founders' Day Tie",
    description:
      "Elegant silk tie featuring Kappa Alpha Psi colors and subtle pattern. Perfect for formal chapter events and banquets.",
    price_cents: 3800, // $38.00
    image_url:
      "https://images.unsplash.com/photo-1594938291220-94d21225f65a?w=500&h=500&fit=crop",
    category: "Apparel",
  },
  {
    name: "Kappa Alpha Psi Tote Bag",
    description:
      "Durable canvas tote bag with screen-printed Kappa Alpha Psi design. Perfect for carrying books, gym gear, or groceries.",
    price_cents: 2200, // $22.00
    image_url:
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=500&h=500&fit=crop",
    category: "Accessories",
  },
  {
    name: "Chapter Custom Water Bottle",
    description:
      "Stainless steel insulated water bottle with custom chapter engraving. Keeps drinks cold for 24 hours or hot for 12 hours.",
    price_cents: 3200, // $32.00
    image_url:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop",
    category: "Accessories",
  },
  {
    name: "Kappa Alpha Psi Keychain",
    description:
      "Brass keychain with engraved Kappa Alpha Psi letters. Makes a great gift for brothers or pledges.",
    price_cents: 1200, // $12.00
    image_url:
      "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=500&h=500&fit=crop",
    category: "Accessories",
  },
  {
    name: "Brotherhood Custom Stickers Pack",
    description:
      "Set of 20 vinyl stickers featuring various Kappa Alpha Psi designs. Waterproof and weather-resistant.",
    price_cents: 1500, // $15.00
    image_url:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&h=500&fit=crop",
    category: "Accessories",
  },
  {
    name: "Kappa Alpha Psi Phone Case",
    description:
      "Protective phone case with Kappa Alpha Psi logo. Compatible with iPhone and Samsung models. Available in multiple colors.",
    price_cents: 2500, // $25.00
    image_url:
      "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=500&h=500&fit=crop",
    category: "Electronics",
  },
  {
    name: "Chapter Custom Notebook",
    description:
      "Premium leather-bound notebook with custom chapter name embossed on the cover. Perfect for taking notes at meetings.",
    price_cents: 2800, // $28.00
    image_url:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop",
    category: "Books & Media",
  },
  {
    name: "Kappa Alpha Psi Laptop Sleeve",
    description:
      "Protective laptop sleeve with Kappa Alpha Psi design. Fits 13-15 inch laptops. Padded interior for extra protection.",
    price_cents: 4200, // $42.00
    image_url:
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop",
    category: "Electronics",
  },
  {
    name: "Founders' Day Commemorative Book",
    description:
      "Hardcover book chronicling the history of Kappa Alpha Psi. Includes photos, stories, and important milestones.",
    price_cents: 3500, // $35.00
    image_url:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop",
    category: "Books & Media",
  },
  // Additional products for non-member sellers (non-kappa branded)
  {
    name: "Crimson & Cream Tote Bag",
    description:
      "Stylish canvas tote bag featuring Kappa Alpha Psi colors. Perfect for everyday use.",
    price_cents: 2800, // $28.00
    image_url:
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=500&h=500&fit=crop",
    category: "Accessories",
    seller_email: "sarah.mitchell@example.com", // Assign to non-member seller
    is_kappa_branded: false, // Not explicitly branded
  },
  {
    name: "Vintage Kappa Pin Collection",
    description:
      "Set of 5 vintage-style Kappa Alpha Psi pins. Collectible items perfect for display.",
    price_cents: 3200, // $32.00
    image_url:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500&h=500&fit=crop",
    category: "Accessories",
    seller_email: "sarah.mitchell@example.com",
    is_kappa_branded: true, // Has "Kappa" in name, so branded
  },
  {
    name: "Heritage Coffee Table Book",
    description:
      "Beautiful hardcover coffee table book showcasing Kappa Alpha Psi history and achievements.",
    price_cents: 4500, // $45.00
    image_url:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop",
    category: "Books & Media",
    seller_email: "michael.chen@example.com", // Assign to non-member seller
    is_kappa_branded: true, // Mentions Kappa Alpha Psi
  },
  {
    name: "Custom Engraved Watch",
    description:
      "Elegant timepiece with custom Kappa Alpha Psi engraving. Perfect gift for special occasions.",
    price_cents: 8500, // $85.00
    image_url:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
    category: "Accessories",
    seller_email: "michael.chen@example.com",
  },
];

// Sample sellers data
const sampleSellers = [
  {
    name: "Marcus Johnson",
    email: "marcus.johnson@example.com",
    membership_number: "KAP-2020-001",
    business_name: "Kappa Gear Co.",
    kappa_vendor_id: "VL-2024-001",
    is_member: true,
    headshot_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    website: "https://kappagearco.example.com",
    social_links: {
      instagram: "@kappagearco",
      twitter: "@kappagearco",
      linkedin: "marcus-johnson-kappa",
      website: "https://kappagearco.example.com",
    },
  },
  {
    name: "David Carter",
    email: "david.carter@example.com",
    membership_number: "KAP-2019-045",
    business_name: "Brotherhood Apparel",
    kappa_vendor_id: "VL-2024-002",
    is_member: true,
    headshot_url:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    website: "https://brotherhoodapparel.example.com",
    social_links: {
      instagram: "@brotherhoodapparel",
      twitter: "@brotherhoodapp",
      linkedin: "david-carter-kappa",
      website: "https://brotherhoodapparel.example.com",
    },
  },
  {
    name: "James Williams",
    email: "james.williams@example.com",
    membership_number: "KAP-2021-123",
    business_name: null,
    kappa_vendor_id: "VL-2024-003",
    is_member: true,
    headshot_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    website: null,
    social_links: {
      instagram: "@jameswilliams",
      twitter: "@jwilliams",
      linkedin: "james-williams-kappa",
    },
  },
  // Non-member sellers
  {
    name: "Sarah Mitchell",
    email: "sarah.mitchell@example.com",
    membership_number: null,
    business_name: "Crimson Threads",
    kappa_vendor_id: "VL-2024-004",
    is_member: false,
    headshot_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    website: "https://crimsonthreads.example.com",
    social_links: {
      instagram: "@crimsonthreads",
      twitter: "@crimsonthreads",
      linkedin: "sarah-mitchell",
      website: "https://crimsonthreads.example.com",
    },
  },
  {
    name: "Michael Chen",
    email: "michael.chen@example.com",
    membership_number: null,
    business_name: "Heritage Goods Co.",
    kappa_vendor_id: "VL-2024-005",
    is_member: false,
    headshot_url:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    website: "https://heritagegoods.example.com",
    social_links: {
      instagram: "@heritagegoods",
      twitter: "@heritagegoodsco",
      linkedin: "michael-chen",
      website: "https://heritagegoods.example.com",
    },
  },
];

// Test promoters for local development
const testPromoters = [
  {
    email: "promoter1@example.com",
    name: "Michael Brown",
    membership_number: "PROM-001",
    initiated_season: "Fall",
    initiated_year: 2018,
    social_links: {
      instagram: "@michaelbrown",
      twitter: "@michaelbrown",
    },
    status: "APPROVED" as const,
  },
  {
    email: "promoter2@example.com",
    name: "Robert Davis",
    membership_number: "PROM-002",
    initiated_season: "Spring",
    initiated_year: 2019,
    social_links: {
      instagram: "@robertdavis",
      linkedin: "robert-davis",
    },
    status: "APPROVED" as const,
  },
  {
    email: "promoter3@example.com",
    name: "William Taylor",
    membership_number: "PROM-003",
    initiated_season: "Fall",
    initiated_year: 2020,
    status: "PENDING" as const,
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
    description:
      "Join us for an elegant evening celebrating the founding of Kappa Alpha Psi. This formal event features dinner, guest speakers, and recognition of outstanding brothers. Black tie optional.",
    event_date: getFutureDate(15, 19),
    location: "Minneapolis Convention Center",
    city: "Minneapolis",
    state: "MN",
    image_url:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop",
    ticket_price_cents: 7500, // $75.00
    max_attendees: 200,
  },
  {
    title: "Spring Brotherhood Mixer",
    description:
      "A casual networking event for brothers to connect, share experiences, and build stronger bonds. Light refreshments and music provided. All chapters welcome!",
    event_date: getFutureDate(30, 18),
    location: "St. Paul Event Center",
    city: "St. Paul",
    state: "MN",
    image_url:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop",
    ticket_price_cents: 2500, // $25.00
    max_attendees: 150,
  },
  {
    title: "Community Service Drive",
    description:
      "Join us for a day of giving back to our community. We'll be collecting donations, organizing food drives, and volunteering at local shelters. All brothers and friends welcome to participate.",
    event_date: getFutureDate(45, 10),
    location: "University of Minnesota Campus",
    city: "Minneapolis",
    state: "MN",
    image_url:
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=600&fit=crop",
    ticket_price_cents: 0, // Free event
    max_attendees: 100,
  },
  {
    title: "Kappa Leadership Summit",
    description:
      "A comprehensive leadership development workshop featuring keynote speakers, breakout sessions, and networking opportunities. Designed for current and aspiring chapter leaders.",
    event_date: getFutureDate(60, 9),
    location: "Hilton Downtown",
    city: "Minneapolis",
    state: "MN",
    image_url:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop",
    ticket_price_cents: 5000, // $50.00
    max_attendees: 75,
  },
  {
    title: "Alumni Chapter Golf Tournament",
    description:
      "Annual golf tournament bringing together brothers from across the region. Includes 18 holes, lunch, awards ceremony, and networking reception. All skill levels welcome!",
    event_date: getFutureDate(75, 8),
    location: "Prestige Golf Club",
    city: "Bloomington",
    state: "MN",
    image_url:
      "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop",
    ticket_price_cents: 10000, // $100.00
    max_attendees: 120,
  },
  {
    title: "Holiday Celebration & Toy Drive",
    description:
      "Celebrate the holiday season with your brothers while giving back to the community. Bring an unwrapped toy for our annual toy drive. Food, music, and fellowship included.",
    event_date: getFutureDate(90, 17),
    location: "Community Center",
    city: "St. Paul",
    state: "MN",
    image_url:
      "https://images.unsplash.com/photo-1482517967863-00e15c9b44be?w=800&h=600&fit=crop",
    ticket_price_cents: 2000, // $20.00
    max_attendees: 80,
  },
];

// Sample steward sellers data
const stewardSellers = [
  {
    name: "Robert Thompson",
    email: "robert.thompson@example.com",
    membership_number: "KAP-2018-089",
    business_name: "Steward Heritage Goods",
    kappa_vendor_id: "VL-2024-006",
  },
  {
    name: "Christopher Anderson",
    email: "christopher.anderson@example.com",
    membership_number: "KAP-2017-156",
    business_name: "Legacy Steward Shop",
    kappa_vendor_id: "VL-2024-007",
  },
  {
    name: "Daniel Martinez",
    email: "daniel.martinez@example.com",
    membership_number: "KAP-2019-234",
    business_name: null,
    kappa_vendor_id: "VL-2024-008",
  },
];

// Sample products for steward sellers
const stewardProducts = [
  {
    name: "Vintage Kappa Letterman Jacket",
    description:
      "Authentic vintage letterman jacket from the 1980s. Features original Kappa Alpha Psi embroidery. Excellent condition with minor wear.",
    price_cents: 12500, // $125.00
    image_url:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop",
    category: "Heritage / Legacy Item",
    seller_email: "robert.thompson@example.com",
    is_kappa_branded: true,
  },
  {
    name: "Founders' Day Commemorative Plaque",
    description:
      "Handcrafted wooden plaque commemorating the founding of Kappa Alpha Psi. Features brass engraving and custom frame.",
    price_cents: 8500, // $85.00
    image_url:
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&h=500&fit=crop",
    category: "Heritage / Legacy Item",
    seller_email: "robert.thompson@example.com",
    is_kappa_branded: true,
  },
  {
    name: "Vintage Wool Sweater",
    description:
      "Vintage wool sweater with embroidered design. From the 1990s, excellent condition. Perfect for collectors.",
    price_cents: 9500, // $95.00
    image_url:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=500&fit=crop",
    category: "Outerwear",
    seller_email: "christopher.anderson@example.com",
    is_kappa_branded: false,
  },
  {
    name: "Historic Chapter Photo Collection",
    description:
      "Rare collection of vintage chapter photos from the 1970s-1990s. Professionally preserved and framed. Limited availability.",
    price_cents: 15000, // $150.00
    image_url:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=500&h=500&fit=crop",
    category: "Art & Prints",
    seller_email: "christopher.anderson@example.com",
    is_kappa_branded: false,
  },
  {
    name: "Kappa Alpha Psi Antique Pocket Watch",
    description:
      "Beautiful antique pocket watch with Kappa Alpha Psi engraving. Gold-plated, fully functional. A true collector's item.",
    price_cents: 18000, // $180.00
    image_url:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
    category: "Heritage / Legacy Item",
    seller_email: "daniel.martinez@example.com",
    is_kappa_branded: true,
  },
  {
    name: "Vintage Silk Ties Collection",
    description:
      "Set of 3 vintage silk ties from different eras. Each features unique patterns. Perfect for formal events.",
    price_cents: 6500, // $65.00
    image_url:
      "https://images.unsplash.com/photo-1594938291220-94d21225f65a?w=500&h=500&fit=crop",
    category: "Apparel",
    seller_email: "daniel.martinez@example.com",
    is_kappa_branded: false,
  },
];

async function seedStewardSellers(): Promise<void> {
  console.log("🛡️  Seeding steward sellers...");

  try {
    // Get all chapters to use for initiated/sponsoring chapters
    const chapters = await getAllChapters();
    const collegiateChapters = chapters.filter(
      (c) => c.type === "Collegiate" && c.status === "Active"
    );

    if (collegiateChapters.length === 0) {
      console.warn(
        "⚠️  No active collegiate chapters found. Using any available chapters..."
      );
    }

    const availableChapters =
      collegiateChapters.length > 0 ? collegiateChapters : chapters;

    if (availableChapters.length === 0) {
      console.error(
        "❌ No chapters found. Please seed chapters first using: npm run seed:chapters"
      );
      return;
    }

    // Get product categories
    const categories = await getAllProductCategories();
    const categoryMap = new Map(categories.map((cat) => [cat.name, cat.id]));

    // Get or create steward sellers
    const stewardSellersList = [];
    let stewardIndex = 0; // Track which steward this is (0-indexed)
    for (const stewardData of stewardSellers) {
      try {
        // Check if member already exists
        const existingMember = await pool.query(
          "SELECT id FROM fraternity_members WHERE email = $1",
          [stewardData.email]
        );

        let memberId: number;
        if (existingMember.rows.length > 0) {
          memberId = existingMember.rows[0].id;
          // Update member with initiated chapter if not set
          const initiatedChapter =
            availableChapters[
              Math.floor(Math.random() * availableChapters.length)
            ];
          await pool.query(
            "UPDATE fraternity_members SET initiated_chapter_id = COALESCE(initiated_chapter_id, $1) WHERE id = $2",
            [initiatedChapter.id, memberId]
          );
        } else {
          // Create new member
          const initiatedChapter =
            availableChapters[
              Math.floor(Math.random() * availableChapters.length)
            ];
          // Generate random initiation season and year
          const seasons = ["Fall", "Spring"];
          const season = seasons[Math.floor(Math.random() * seasons.length)];
          const year = 2015 + Math.floor(Math.random() * 10); // Random year between 2015-2024
          
          const memberResult = await pool.query(
            `INSERT INTO fraternity_members (
              email, name, membership_number, registration_status, 
              initiated_chapter_id, initiated_season, initiated_year, verification_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'VERIFIED')
            RETURNING id`,
            [
              stewardData.email,
              stewardData.name,
              stewardData.membership_number,
              "COMPLETE",
              initiatedChapter.id,
              season,
              year,
            ]
          );
          memberId = memberResult.rows[0]?.id;
        }

        // Ensure memberId is defined before proceeding
        if (!memberId) {
          throw new Error(`Failed to get or create fraternity_member_id for steward ${stewardData.email}`);
        }

        // Check if steward already exists
        const existingSteward = await pool.query(
          "SELECT id FROM stewards WHERE fraternity_member_id = $1",
          [memberId]
        );

        let stewardId: number;
        if (existingSteward.rows.length > 0) {
          stewardId = existingSteward.rows[0].id;
          // Approve first two stewards with verification status and date
          if (stewardIndex < 2) {
            await updateStewardStatus(stewardId, "APPROVED");
            // Set verification_status to VERIFIED and verification_date for approved stewards
            await pool.query(
              "UPDATE stewards SET verification_status = 'VERIFIED', verification_date = CURRENT_TIMESTAMP WHERE id = $1",
              [stewardId]
            );
          } else {
            await updateStewardStatus(stewardId, "APPROVED");
          }
        } else {
          // Create new steward
          const sponsoringChapter =
            availableChapters[
              Math.floor(Math.random() * availableChapters.length)
            ];
          const steward = await createSteward({
            fraternity_member_id: memberId,
            sponsoring_chapter_id: sponsoringChapter.id,
          });
          stewardId = steward.id;
          // Approve first two stewards with verification status and date
          if (stewardIndex < 2) {
            await updateStewardStatus(stewardId, "APPROVED");
            // Set verification_status to VERIFIED and verification_date for approved stewards
            await pool.query(
              "UPDATE stewards SET verification_status = 'VERIFIED', verification_date = CURRENT_TIMESTAMP WHERE id = $1",
              [stewardId]
            );
          } else {
            await updateStewardStatus(stewardId, "APPROVED");
          }
        }
        
        stewardIndex++; // Increment for next iteration

        // Check if seller already exists
        const existingSeller = await pool.query(
          "SELECT id FROM sellers WHERE email = $1",
          [stewardData.email]
        );

        let sellerId: number;
        if (existingSeller.rows.length > 0) {
          sellerId = existingSeller.rows[0].id;
          // Update seller to ensure it's linked to the member
          await pool.query(
            "UPDATE sellers SET fraternity_member_id = $1, status = $2 WHERE id = $3",
            [memberId, "APPROVED", sellerId]
          );
        } else {
          // Create new seller
          const sponsoringChapter =
            availableChapters[
              Math.floor(Math.random() * availableChapters.length)
            ];
          const seller = await createSeller({
            email: stewardData.email,
            name: stewardData.name,
            fraternity_member_id: memberId,
            sponsoring_chapter_id: sponsoringChapter.id,
            business_name: stewardData.business_name,
            kappa_vendor_id: stewardData.kappa_vendor_id,
            social_links: {
              instagram: `@${stewardData.name.toLowerCase().replace(" ", "")}`,
            },
          });
          sellerId = seller.id;
          // Approve the seller and set verification_status to VERIFIED
          await pool.query("UPDATE sellers SET status = $1, verification_status = $2 WHERE id = $3", [
            "APPROVED",
            "VERIFIED",
            sellerId,
          ]);
        }

        const memberResult = await pool.query(
          "SELECT initiated_chapter_id FROM fraternity_members WHERE id = $1",
          [memberId]
        );
        const chapterId = memberResult.rows[0]?.initiated_chapter_id;
        const chapterResult = await pool.query(
          "SELECT name FROM chapters WHERE id = $1",
          [chapterId]
        );
        const chapterName = chapterResult.rows[0]?.name || "Unknown";

        console.log(
          `  ✓ Created/updated steward seller: ${stewardData.name} (steward ID: ${stewardId}, seller ID: ${sellerId}, initiated at ${chapterName})`
        );

        stewardSellersList.push({
          stewardId,
          sellerId,
          email: stewardData.email,
        });
      } catch (error) {
        console.error(
          `  ❌ Error seeding steward seller ${stewardData.email}:`,
          error
        );
      }
    }

    // Create products for steward sellers
    let inserted = 0;
    let skipped = 0;

    for (const productData of stewardProducts) {
      try {
        // Check if product already exists
        const existing = await pool.query(
          "SELECT id FROM products WHERE name = $1",
          [productData.name]
        );

        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }

        // Find seller by email
        const seller = stewardSellersList.find(
          (s) => s.email === productData.seller_email
        );
        if (!seller) {
          console.warn(
            `  ⚠️  Seller not found for product ${productData.name}, skipping...`
          );
          skipped++;
          continue;
        }

        // Get category ID from category name
        const categoryId = productData.category
          ? categoryMap.get(productData.category) || null
          : null;

        // Determine if product is Kappa branded - use explicit value if provided, otherwise check name/description
        const productDataWithBranding = productData as typeof productData & {
          is_kappa_branded?: boolean;
        };
        const isKappaBranded =
          productDataWithBranding.is_kappa_branded !== undefined
            ? productDataWithBranding.is_kappa_branded
            : productData.name.toLowerCase().includes("kappa alpha psi") ||
              productData.name.toLowerCase().includes("founders' day") ||
              productData.name.toLowerCase().includes("kappa");

        await createProduct({
          seller_id: seller.sellerId,
          name: productData.name,
          description: productData.description,
          price_cents: productData.price_cents,
          image_url: productData.image_url,
          category_id: categoryId || undefined,
          is_kappa_branded: isKappaBranded,
        });

        inserted++;
      } catch (error) {
        console.error(
          `  ❌ Error inserting steward product ${productData.name}:`,
          error
        );
      }
    }

    console.log(
      `  ✓ Inserted ${inserted} steward products (${skipped} skipped)`
    );
    console.log(
      `  ✓ Created/updated ${stewardSellersList.length} steward sellers\n`
    );
  } catch (error) {
    console.error("❌ Error seeding steward sellers:", error);
    throw error;
  }
}

async function seedProducts(): Promise<void> {
  console.log("📦 Seeding products and sellers...");

  try {
    // Get all chapters to use for initiated/sponsoring chapters
    const chapters = await getAllChapters();
    const collegiateChapters = chapters.filter(
      (c) => c.type === "Collegiate" && c.status === "Active"
    );

    if (collegiateChapters.length === 0) {
      console.warn(
        "⚠️  No active collegiate chapters found. Using any available chapters..."
      );
    }

    const availableChapters =
      collegiateChapters.length > 0 ? collegiateChapters : chapters;

    if (availableChapters.length === 0) {
      console.error(
        "❌ No chapters found. Please seed chapters first using: npm run seed:chapters"
      );
      return;
    }

    // Get product categories
    const categories = await getAllProductCategories();
    const categoryMap = new Map(categories.map((cat) => [cat.name, cat.id]));

    // Get or create sellers
    const sellers = [];
    for (const sellerData of sampleSellers) {
      // Check if seller already exists
      const existingSeller = await pool.query(
        "SELECT id, fraternity_member_id FROM sellers WHERE email = $1",
        [sellerData.email]
      );

      if (existingSeller.rows.length > 0) {
        const seller = existingSeller.rows[0];
        // Add email to seller object for matching
        (seller as any).email = sellerData.email;

        // Ensure existing seller is approved (products require APPROVED sellers to display)
        if (seller.status !== "APPROVED") {
          await pool.query("UPDATE sellers SET status = $1 WHERE id = $2", [
            "APPROVED",
            seller.id,
          ]);
          seller.status = "APPROVED";
          console.log(`  ✓ Approved existing seller: ${sellerData.name}`);
        }
        // Also ensure verification_status is VERIFIED if not already set (sellers start as VERIFIED)
        if (seller.verification_status !== "VERIFIED") {
          await pool.query("UPDATE sellers SET verification_status = $1 WHERE id = $2", [
            "VERIFIED",
            seller.id,
          ]);
        }

        // If seller exists but doesn't have a fraternity_member_id and should be a member, create/update member
        if (!seller.fraternity_member_id && sellerData.is_member) {
          const initiatedChapter =
            availableChapters[
              Math.floor(Math.random() * availableChapters.length)
            ];

          // Check if member already exists
          const existingMember = await pool.query(
            "SELECT id FROM fraternity_members WHERE email = $1",
            [sellerData.email]
          );

          let memberId: number | null = null;
          if (existingMember.rows.length > 0) {
            memberId = existingMember.rows[0].id;
            // Update member with initiated chapter if not set
            await pool.query(
              "UPDATE fraternity_members SET initiated_chapter_id = COALESCE(initiated_chapter_id, $1) WHERE id = $2",
              [initiatedChapter.id, memberId]
            );
          } else {
            // Create new member
            const memberResult = await pool.query(
              `INSERT INTO fraternity_members (
                email, name, membership_number, registration_status, 
                initiated_chapter_id, verification_status
              ) VALUES ($1, $2, $3, $4, $5, 'VERIFIED')
              RETURNING id`,
              [
                sellerData.email,
                sellerData.name,
                sellerData.membership_number,
                "COMPLETE",
                initiatedChapter.id,
              ]
            );
            memberId = memberResult.rows[0].id;
          }

          // Update seller with fraternity_member_id
          await pool.query(
            "UPDATE sellers SET fraternity_member_id = $1 WHERE id = $2",
            [memberId, seller.id]
          );
          console.log(
            `  ✓ Updated seller ${sellerData.name} with member (initiated at ${initiatedChapter.name})`
          );
        }
        sellers.push(seller);
      } else {
        const sponsoringChapter =
          availableChapters[
            Math.floor(Math.random() * availableChapters.length)
          ];
        let memberId: number | null = null;

        // Only create member if seller should be a member
        if (sellerData.is_member) {
          const initiatedChapter =
            availableChapters[
              Math.floor(Math.random() * availableChapters.length)
            ];

          // Check if member already exists
          const existingMember = await pool.query(
            "SELECT id FROM fraternity_members WHERE email = $1",
            [sellerData.email]
          );

          if (existingMember.rows.length > 0) {
            memberId = existingMember.rows[0].id;
            // Update member with initiated chapter if not set
            await pool.query(
              "UPDATE fraternity_members SET initiated_chapter_id = COALESCE(initiated_chapter_id, $1) WHERE id = $2",
              [initiatedChapter.id, memberId]
            );
          } else {
            // Create new member
            // Generate random initiation season and year
            const seasons = ["Fall", "Spring"];
            const season = seasons[Math.floor(Math.random() * seasons.length)];
            const year = 2015 + Math.floor(Math.random() * 10); // Random year between 2015-2024
            
            const memberResult = await pool.query(
              `INSERT INTO fraternity_members (
                email, name, membership_number, registration_status, 
                initiated_chapter_id, initiated_season, initiated_year, verification_status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'VERIFIED')
              RETURNING id`,
              [
                sellerData.email,
                sellerData.name,
                sellerData.membership_number,
                "COMPLETE",
                initiatedChapter.id,
                season,
                year,
              ]
            );
            memberId = memberResult.rows[0].id;
          }
        }

        // Create new seller (with or without fraternity_member_id)
        const newSeller = await createSeller({
          email: sellerData.email,
          name: sellerData.name,
          sponsoring_chapter_id: sponsoringChapter.id,
          business_name: sellerData.business_name,
          kappa_vendor_id: sellerData.kappa_vendor_id,
          headshot_url: (sellerData as any).headshot_url || null,
          website: (sellerData as any).website || null,
          social_links: (sellerData as any).social_links || {
            instagram: `@${sellerData.name.toLowerCase().replace(" ", "")}`,
          },
          fraternity_member_id: memberId,
        });

        // Approve the seller and set verification_status to VERIFIED
        await pool.query("UPDATE sellers SET status = $1, verification_status = $2 WHERE id = $3", [
          "APPROVED",
          "VERIFIED",
          newSeller.id,
        ]);

        // Update headshot_url and store_logo_url if provided (in case they weren't set during creation)
        if ((sellerData as any).headshot_url) {
          await pool.query(
            "UPDATE sellers SET headshot_url = $1 WHERE id = $2",
            [(sellerData as any).headshot_url, newSeller.id]
          );
        }

        // Update seller object in memory to reflect approval
        newSeller.status = "APPROVED";

        // Add email to seller object for matching
        (newSeller as any).email = sellerData.email;

        if (sellerData.is_member) {
          const memberResult = await pool.query(
            "SELECT initiated_chapter_id FROM fraternity_members WHERE id = $1",
            [memberId]
          );
          const chapterId = memberResult.rows[0]?.initiated_chapter_id;
          const chapterResult = await pool.query(
            "SELECT name FROM chapters WHERE id = $1",
            [chapterId]
          );
          const chapterName = chapterResult.rows[0]?.name || "Unknown";
          console.log(
            `  ✓ Created and approved seller: ${sellerData.name} (member, initiated at ${chapterName})`
          );
        } else {
          console.log(
            `  ✓ Created and approved seller: ${sellerData.name} (non-member)`
          );
        }
        sellers.push(newSeller);
      }
    }

    // Create products
    let inserted = 0;
    let skipped = 0;
    let updated = 0;

    for (const productData of sampleProducts) {
      try {
        // Check if product already exists
        const existing = await pool.query(
          "SELECT id, category_id FROM products WHERE name = $1",
          [productData.name]
        );

        if (existing.rows.length > 0) {
          // Update existing product with category if it doesn't have one
          const existingProduct = existing.rows[0];
          const categoryId = productData.category
            ? categoryMap.get(productData.category) || null
            : null;

          if (!existingProduct.category_id && categoryId) {
            await pool.query(
              "UPDATE products SET category_id = $1 WHERE id = $2",
              [categoryId, existingProduct.id]
            );
            updated++;
            console.log(
              `  ✓ Updated category for existing product: ${productData.name}`
            );
          } else {
            skipped++;
          }
          continue;
        }

        // Assign seller - use specified seller_email if provided, otherwise random
        let seller;
        if ((productData as any).seller_email) {
          // Try to find seller in sellers array by email
          seller = sellers.find(
            (s: any) => s.email === (productData as any).seller_email
          );
          // If not found, query database
          if (!seller) {
            const sellerResult = await pool.query(
              "SELECT id FROM sellers WHERE email = $1",
              [(productData as any).seller_email]
            );
            if (sellerResult.rows.length > 0) {
              seller = sellers.find((s) => s.id === sellerResult.rows[0].id);
              if (!seller) {
                // If seller not in sellers array, fetch it
                const fullSellerResult = await pool.query(
                  "SELECT * FROM sellers WHERE id = $1",
                  [sellerResult.rows[0].id]
                );
                if (fullSellerResult.rows.length > 0) {
                  seller = fullSellerResult.rows[0];
                }
              }
            }
          }
          // Fallback to random seller if not found
          if (!seller) {
            seller = sellers[Math.floor(Math.random() * sellers.length)];
          }
        } else {
          seller = sellers[Math.floor(Math.random() * sellers.length)];
        }

        // Get category ID from category name
        const categoryId = productData.category
          ? categoryMap.get(productData.category) || null
          : null;

        // Determine if product is Kappa branded
        const productDataWithBranding = productData as typeof productData & {
          is_kappa_branded?: boolean;
        };
        const isKappaBranded =
          productDataWithBranding.is_kappa_branded !== undefined
            ? productDataWithBranding.is_kappa_branded
            : productData.name.toLowerCase().includes("kappa alpha psi") ||
              productData.name.toLowerCase().includes("founders' day") ||
              productData.name.toLowerCase().includes("kappa");

        await createProduct({
          seller_id: seller.id,
          name: productData.name,
          description: productData.description,
          price_cents: productData.price_cents,
          image_url: productData.image_url,
          category_id: categoryId || undefined,
          is_kappa_branded: isKappaBranded,
        });

        inserted++;
      } catch (error) {
        console.error(
          `  ❌ Error inserting product ${productData.name}:`,
          error
        );
      }
    }

    console.log(
      `  ✓ Inserted ${inserted} products, updated ${updated} existing products (${skipped} skipped)`
    );
    console.log(`  ✓ Used ${sellers.length} sellers\n`);

    // Verify sellers are approved and products are queryable
    const verificationResult = await pool.query(
      `SELECT COUNT(*) as product_count 
       FROM products p 
       JOIN sellers s ON p.seller_id = s.id 
       WHERE s.status = 'APPROVED'`
    );
    const approvedProductCount = parseInt(
      verificationResult.rows[0]?.product_count || "0"
    );
    console.log(
      `  ✓ Verification: ${approvedProductCount} products with APPROVED sellers are queryable\n`
    );

    if (approvedProductCount === 0 && inserted > 0) {
      console.warn(
        "  ⚠️  WARNING: Products were created but none are queryable with APPROVED sellers!"
      );
      console.warn("  ⚠️  This may indicate a seller approval issue.\n");
    }
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    throw error;
  }
}

async function seedPromoters(): Promise<void> {
  console.log("🎤 Seeding promoters...");

  // Get all chapters
  const chapters = await getAllChapters();
  if (chapters.length === 0) {
    console.warn(
      "⚠️  No chapters found. Please seed chapters first using: npm run seed:chapters"
    );
    return;
  }

  const collegiateChapters = chapters.filter(
    (c) => c.type === "Collegiate" && c.status === "Active"
  );
  if (collegiateChapters.length === 0) {
    console.warn(
      "⚠️  No active collegiate chapters found. Using any available chapters..."
    );
  }

  const availableChapters =
    collegiateChapters.length > 0 ? collegiateChapters : chapters;

  let inserted = 0;
  let skipped = 0;

  for (const promoterData of testPromoters) {
    try {
      // Check if promoter already exists
      const existing = await pool.query(
        "SELECT id FROM promoters WHERE email = $1",
        [promoterData.email]
      );

      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      // Get random chapter
      const randomChapter =
        availableChapters[Math.floor(Math.random() * availableChapters.length)];

      // Create or get fraternity member for promoter (required)
      const existingMember = await pool.query(
        "SELECT id FROM fraternity_members WHERE email = $1",
        [promoterData.email]
      );

      let memberId: number;
      if (existingMember.rows.length > 0) {
        memberId = existingMember.rows[0].id;
      } else {
        // Create new member for promoter
        const initiatedChapter =
          availableChapters[
            Math.floor(Math.random() * availableChapters.length)
          ];
        const memberResult = await pool.query(
          `INSERT INTO fraternity_members (
            email, name, membership_number, registration_status, 
            initiated_chapter_id, initiated_season, initiated_year, verification_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'VERIFIED')
          RETURNING id`,
          [
            promoterData.email,
            promoterData.name,
            promoterData.membership_number,
            "COMPLETE",
            initiatedChapter.id,
            promoterData.initiated_season || "Fall",
            promoterData.initiated_year || 2018,
          ]
        );
        memberId = memberResult.rows[0].id;
      }

      // Create promoter with fraternity_member_id
      const promoter = await createPromoter({
        email: promoterData.email,
        name: promoterData.name,
        fraternity_member_id: memberId,
        sponsoring_chapter_id: randomChapter.id,
        headshot_url: undefined,
        social_links: Object.fromEntries(
          Object.entries(promoterData.social_links || {}).filter(
            ([_, v]) => v !== undefined
          )
        ) as Record<string, string>,
      });

      // Update status if not PENDING
      if (promoterData.status && promoterData.status !== "PENDING") {
        await pool.query("UPDATE promoters SET status = $1 WHERE id = $2", [
          promoterData.status,
          promoter.id,
        ]);
      }

      inserted++;
      console.log(
        `  ✓ Created promoter: ${promoterData.name} (${
          promoterData.status || "PENDING"
        })`
      );
    } catch (error) {
      console.error(
        `  ❌ Error seeding promoter ${promoterData.email}:`,
        error
      );
    }
  }

  console.log(`  ✓ Inserted ${inserted} promoters (${skipped} skipped)\n`);
}

async function seedEvents(): Promise<void> {
  console.log("📅 Seeding events...");

  // Get all chapters for sponsored chapter assignment
  const chapters = await getAllChapters();
  const availableChapters = chapters.length > 0 ? chapters : [];

  // Get approved promoters
  const promotersResult = await pool.query(
    "SELECT id FROM promoters WHERE status = 'APPROVED' AND (email LIKE '%example.com' OR email LIKE 'test%@%')"
  );
  const promoters = promotersResult.rows;

  if (promoters.length === 0) {
    console.warn(
      "  ⚠️  No approved promoters found. Please seed promoters first."
    );
    return;
  }

  let inserted = 0;
  let skipped = 0;

  for (const eventData of sampleEvents) {
    try {
      // Check if event already exists
      const existing = await pool.query(
        "SELECT id FROM events WHERE title = $1 AND event_date = $2",
        [eventData.title, eventData.event_date]
      );

      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      // Assign to random approved promoter
      const promoter = promoters[Math.floor(Math.random() * promoters.length)];

      // Randomly assign sponsored chapter (50% chance)
      const sponsoredChapter =
        availableChapters.length > 0 && Math.random() > 0.5
          ? availableChapters[
              Math.floor(Math.random() * availableChapters.length)
            ].id
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
  console.log("💰 Seeding orders for impact banner...");

  try {
    // Get some products with their sellers to create orders
    const productsResult = await pool.query(
      `SELECT p.id, p.price_cents, s.sponsoring_chapter_id 
       FROM products p 
       JOIN sellers s ON p.seller_id = s.id 
       LIMIT 10`
    );
    const products = productsResult.rows;

    const chaptersResult = await pool.query("SELECT id FROM chapters LIMIT 5");
    const chapters = chaptersResult.rows;

    if (products.length === 0) {
      console.log("  ⚠️  No products found. Skipping order seeding.");
      return;
    }

    if (chapters.length === 0) {
      console.log("  ⚠️  No chapters found. Skipping order seeding.");
      return;
    }

    // Create some paid orders with various amounts
    const orderAmounts = [
      4500, // $45.00
      5500, // $55.00
      3500, // $35.00
      2800, // $28.00
      1800, // $18.00
      2500, // $25.00
      4500, // $45.00
      5500, // $55.00
      3500, // $35.00
      2800, // $28.00
      1800, // $18.00
      4500, // $45.00
      5500, // $55.00
      3500, // $35.00
      2800, // $28.00
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
          "SELECT id FROM orders WHERE stripe_session_id = $1",
          [`test_session_${i}`]
        );

        if (existing.rows.length > 0) {
          continue; // Skip if already exists
        }

        await pool.query(
          `INSERT INTO orders (product_id, buyer_email, amount_cents, stripe_session_id, chapter_id, status, created_at)
           VALUES ($1, $2, $3, $4, $5, 'PAID', NOW() - INTERVAL '${Math.floor(
             Math.random() * 90
           )} days')`,
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
    console.error("  ❌ Error seeding orders:", error);
    throw error;
  }
}

async function clearTestData() {
  console.log("🧹 Clearing test data...");

  // Delete in reverse order of dependencies
  await pool.query(
    "DELETE FROM events WHERE promoter_id IN (SELECT id FROM promoters WHERE email LIKE '%example.com' OR email LIKE 'test%@%')"
  );
  await pool.query(
    "DELETE FROM promoters WHERE email LIKE '%example.com' OR email LIKE 'test%@%'"
  );
  await pool.query(
    "DELETE FROM orders WHERE buyer_email LIKE '%example.com' OR stripe_session_id LIKE 'test_session_%'"
  );
  await pool.query(
    "DELETE FROM products WHERE seller_id IN (SELECT id FROM sellers WHERE email LIKE '%example.com' OR email LIKE 'test%@%')"
  );
  await pool.query(
    "DELETE FROM sellers WHERE email LIKE '%example.com' OR email LIKE 'test%@%'"
  );

  console.log("✓ Test data cleared\n");
}

async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes("--clear");

  try {
    console.log("🌱 Starting database seeding (products & promoters)...\n");

    if (shouldClear) {
      await clearTestData();
    }

    // Seed products and sellers
    await seedProducts();

    // Seed steward sellers (must be after regular sellers)
    await seedStewardSellers();

    // Seed promoters
    await seedPromoters();

    // Seed events (requires promoters to be seeded first)
    await seedEvents();

    // Seed orders for impact banner
    await seedOrders();

    console.log("✅ Database seeding completed successfully!");
    console.log("\nNote: For chapters, use:");
    console.log("  - npm run seed:chapters (scrapes Wikipedia for chapters)");
    console.log("  - npm run seed:alumni (seeds alumni chapters)");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export {
  seedProducts,
  seedPromoters,
  seedEvents,
  seedStewardSellers,
  clearTestData,
};
