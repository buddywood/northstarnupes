import pool from '../db/connection';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// Professional professions list
const PROFESSIONS = [
  'Accountant',
  'Actuary',
  'Architect',
  'Attorney',
  'Business Analyst',
  'Business Owner',
  'CEO/Executive',
  'Civil Engineer',
  'Consultant',
  'Data Analyst',
  'Data Scientist',
  'Dentist',
  'Designer',
  'Developer/Software Engineer',
  'Doctor/Physician',
  'Educator/Teacher',
  'Engineer',
  'Entrepreneur',
  'Financial Advisor',
  'Healthcare Professional',
  'Human Resources',
  'Investment Banker',
  'Marketing Professional',
  'Nurse',
  'Pharmacist',
  'Project Manager',
  'Real Estate Agent',
  'Sales Professional',
  'Social Worker',
  'Therapist',
  'Veterinarian',
  'Other',
];

async function seedProfessions() {
  try {
    console.log('🌱 Seeding professions...\n');

    let order = 0;
    for (const professionName of PROFESSIONS) {
      try {
        await pool.query(
          `INSERT INTO professions (name, display_order, is_active)
           VALUES ($1, $2, true)
           ON CONFLICT (name) DO NOTHING`,
          [professionName, order]
        );
        console.log(`✓ Added: ${professionName}`);
        order++;
      } catch (error: any) {
        // Skip if already exists (handled by ON CONFLICT)
        if (error.code !== '23505') {
          console.error(`✗ Error adding ${professionName}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Successfully seeded ${PROFESSIONS.length} professions`);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding professions:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedProfessions();
}

export default seedProfessions;

