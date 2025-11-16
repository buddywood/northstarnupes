import pool from '../db/connection';
import { getAllChapters, createSeller, createPromoter } from '../db/queries';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });
dotenv.config();

// Test members for verification (these should match real members in the Kappa portal for testing)
const testMembers = [
  {
    email: 'kaliber12001@yahoo.com',  // not active but a member
    name: 'Kamal Rajee Aadil',
    membership_number: '20040111',
    registration_status: 'COMPLETE',
  },
  {
    email: 'abbasa6@my.erau.edu', //active
    name: 'Azhari Abbas',
    membership_number: '20250256',
    registration_status: 'COMPLETE',
  },
  {
    email: 'test.member3@example.com', //not a real member - should fail or move to manual review
    name: 'Michael Williams',
    membership_number: '11111',
    registration_status: 'COMPLETE',
  },
];

// Test sellers with PENDING status for verification
const testSellers = [
  {
    email: 'test.seller1@example.com',
    name: 'David Brown',
    membership_number: '22222',
    business_name: 'Test Seller Business 1',
    vendor_license_number: 'TEST-VL-001',
  },
  {
    email: 'test.seller2@example.com',
    name: 'James Davis',
    membership_number: '33333',
    business_name: 'Test Seller Business 2',
    vendor_license_number: 'TEST-VL-002',
  },
  {
    email: 'test.seller3@example.com',
    name: 'William Miller',
    membership_number: '44444',
    business_name: null,
    vendor_license_number: 'TEST-VL-003',
  },
];

// Test promoters with PENDING status for verification
const testPromoters = [
  {
    email: 'test.promoter1@example.com',
    name: 'Christopher Wilson',
    membership_number: '55555',
  },
  {
    email: 'test.promoter2@example.com',
    name: 'Daniel Moore',
    membership_number: '66666',
  },
  {
    email: 'test.promoter3@example.com',
    name: 'Matthew Taylor',
    membership_number: '77777',
  },
];

async function seedTestMembers(): Promise<void> {
  console.log('👤 Seeding test members for verification...\n');

  try {
    // Get chapters for initiated_chapter_id
    const chapters = await getAllChapters();
    if (chapters.length === 0) {
      console.error('❌ No chapters found. Please seed chapters first using: npm run seed:chapters');
      return;
    }

    const availableChapters = chapters;
    let inserted = 0;
    let skipped = 0;

    for (const memberData of testMembers) {
      try {
        // Check if member already exists
        const existing = await pool.query(
          'SELECT id FROM fraternity_members WHERE email = $1',
          [memberData.email]
        );

        if (existing.rows.length > 0) {
          // Update existing member to have PENDING verification status
          await pool.query(
            `UPDATE fraternity_members 
             SET name = $1, 
                 membership_number = $2, 
                 registration_status = $3,
                 verification_status = 'PENDING',
                 verification_date = NULL,
                 verification_notes = NULL,
                 initiated_chapter_id = COALESCE(initiated_chapter_id, $4)
             WHERE email = $5`,
            [
              memberData.name,
              memberData.membership_number,
              memberData.registration_status,
              availableChapters[Math.floor(Math.random() * availableChapters.length)].id,
              memberData.email,
            ]
          );
          console.log(`  ↻ Updated member: ${memberData.name} (${memberData.email})`);
          skipped++;
          continue;
        }

        // Create new member
        const randomChapter = availableChapters[Math.floor(Math.random() * availableChapters.length)];
        await pool.query(
          `INSERT INTO fraternity_members (
            email, name, membership_number, registration_status, 
            initiated_chapter_id, verification_status
          ) VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
          [
            memberData.email,
            memberData.name,
            memberData.membership_number,
            memberData.registration_status,
            randomChapter.id,
          ]
        );

        inserted++;
        console.log(`  ✓ Created member: ${memberData.name} (${memberData.email})`);
      } catch (error: any) {
        console.error(`  ❌ Error seeding member ${memberData.email}:`, error.message);
      }
    }

    console.log(`  ✓ Inserted ${inserted} members (${skipped} updated)\n`);
  } catch (error) {
    console.error('❌ Error seeding test members:', error);
    throw error;
  }
}

async function seedTestSellers(): Promise<void> {
  console.log('🛍️  Seeding test sellers for verification...\n');

  try {
    const chapters = await getAllChapters();
    if (chapters.length === 0) {
      console.error('❌ No chapters found. Please seed chapters first.');
      return;
    }

    const availableChapters = chapters;
    let inserted = 0;
    let skipped = 0;

    for (const sellerData of testSellers) {
      try {
        // Check if seller already exists
        const existing = await pool.query(
          'SELECT id FROM sellers WHERE email = $1',
          [sellerData.email]
        );

        if (existing.rows.length > 0) {
          // Update existing seller to have PENDING status and verification_status
          await pool.query(
            `UPDATE sellers 
             SET name = $1, 
                 membership_number = $2,
                 status = 'PENDING',
                 verification_status = 'PENDING',
                 verification_date = NULL,
                 verification_notes = NULL
             WHERE email = $3`,
            [sellerData.name, sellerData.membership_number, sellerData.email]
          );
          console.log(`  ↻ Updated seller: ${sellerData.name} (${sellerData.email})`);
          skipped++;
          continue;
        }

        // Create new seller
        const randomChapter = availableChapters[Math.floor(Math.random() * availableChapters.length)];
        const newSeller = await createSeller({
          email: sellerData.email,
          name: sellerData.name,
          sponsoring_chapter_id: randomChapter.id,
          business_name: sellerData.business_name,
          vendor_license_number: sellerData.vendor_license_number,
          social_links: {},
        });

        // Ensure status is PENDING and verification_status is PENDING
        await pool.query(
          `UPDATE sellers 
           SET status = 'PENDING', 
               verification_status = 'PENDING',
               verification_date = NULL,
               verification_notes = NULL
           WHERE id = $1`,
          [newSeller.id]
        );

        inserted++;
        console.log(`  ✓ Created seller: ${sellerData.name} (${sellerData.email})`);
      } catch (error: any) {
        console.error(`  ❌ Error seeding seller ${sellerData.email}:`, error.message);
      }
    }

    console.log(`  ✓ Inserted ${inserted} sellers (${skipped} updated)\n`);
  } catch (error) {
    console.error('❌ Error seeding test sellers:', error);
    throw error;
  }
}

async function seedTestPromoters(): Promise<void> {
  console.log('🎤 Seeding test promoters for verification...\n');

  try {
    const chapters = await getAllChapters();
    if (chapters.length === 0) {
      console.error('❌ No chapters found. Please seed chapters first.');
      return;
    }

    const availableChapters = chapters;
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
          // Update existing promoter to have PENDING status and verification_status
          await pool.query(
            `UPDATE promoters 
             SET name = $1, 
                 membership_number = $2,
                 status = 'PENDING',
                 verification_status = 'PENDING',
                 verification_date = NULL,
                 verification_notes = NULL
             WHERE email = $3`,
            [promoterData.name, promoterData.membership_number, promoterData.email]
          );
          console.log(`  ↻ Updated promoter: ${promoterData.name} (${promoterData.email})`);
          skipped++;
          continue;
        }

        // Create new promoter
        const randomChapter = availableChapters[Math.floor(Math.random() * availableChapters.length)];
        const newPromoter = await createPromoter({
          email: promoterData.email,
          name: promoterData.name,
          sponsoring_chapter_id: randomChapter.id,
          social_links: {},
        });

        // Ensure status is PENDING and verification_status is PENDING
        await pool.query(
          `UPDATE promoters 
           SET status = 'PENDING', 
               verification_status = 'PENDING',
               verification_date = NULL,
               verification_notes = NULL
           WHERE id = $1`,
          [newPromoter.id]
        );

        inserted++;
        console.log(`  ✓ Created promoter: ${promoterData.name} (${promoterData.email})`);
      } catch (error: any) {
        console.error(`  ❌ Error seeding promoter ${promoterData.email}:`, error.message);
      }
    }

    console.log(`  ✓ Inserted ${inserted} promoters (${skipped} updated)\n`);
  } catch (error) {
    console.error('❌ Error seeding test promoters:', error);
    throw error;
  }
}

async function clearVerificationTestData(): Promise<void> {
  console.log('🧹 Clearing verification test data...\n');

  try {
    // Delete test data (members, sellers, promoters with test emails)
    await pool.query(
      `DELETE FROM fraternity_members 
       WHERE email LIKE 'test.%@example.com' OR email LIKE 'test%@example.com'`
    );
    await pool.query(
      `DELETE FROM sellers 
       WHERE email LIKE 'test.%@example.com' OR email LIKE 'test%@example.com'`
    );
    await pool.query(
      `DELETE FROM promoters 
       WHERE email LIKE 'test.%@example.com' OR email LIKE 'test%@example.com'`
    );

    console.log('  ✓ Verification test data cleared\n');
  } catch (error) {
    console.error('  ❌ Error clearing verification test data:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');

  try {
    console.log('🧪 Starting verification test data seeding...\n');

    if (shouldClear) {
      await clearVerificationTestData();
    }

    // Seed test members
    await seedTestMembers();

    // Seed test sellers
    await seedTestSellers();

    // Seed test promoters
    await seedTestPromoters();

    console.log('✅ Verification test data seeding completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Update the test member names and membership numbers in this script');
    console.log('     to match real members in the Kappa Alpha Psi portal');
    console.log('  2. Run the verification script: npm run verify:members');
    console.log('  3. Check the verification results in the database\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding verification test data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { seedTestMembers, seedTestSellers, seedTestPromoters, clearVerificationTestData };

