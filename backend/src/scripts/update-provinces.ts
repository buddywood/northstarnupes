import pool from '../db/connection';

// Mapping of US states to Kappa Alpha Psi provinces
const stateToProvince: Record<string, string> = {
  // North Central Province
  'IL': 'North Central',
  'IN': 'North Central',
  'IA': 'North Central',
  'WI': 'North Central',
  'MN': 'North Central',
  
  // Northern Province
  'MI': 'Northern',
  'NY': 'Northern',
  
  // East Central Province
  'OH': 'East Central',
  
  // South Central Province
  'KY': 'South Central',
  'TN': 'South Central',
  
  // Middle Western Province
  'MO': 'Middle Western',
  'KS': 'Middle Western',
  'OK': 'Middle Western',
  'NE': 'Middle Western',
  'CO': 'Middle Western',
  
  // Eastern Province
  'MD': 'Eastern',
  'VA': 'Eastern',
  'DC': 'Eastern',
  
  // Northeastern Province
  'PA': 'Northeastern',
  'NJ': 'Northeastern',
  'CT': 'Northeastern',
  'MA': 'Northeastern',
  'RI': 'Northeastern',
  'DE': 'Northeastern',
  
  // Southeastern Province
  'GA': 'Southeastern',
  'SC': 'Southeastern',
  
  // Southern Province
  'FL': 'Southern',
  'AL': 'Southern',
  
  // Southwestern Province
  'TX': 'Southwestern',
  'LA': 'Southwestern',
  'MS': 'Southwestern',
  'AR': 'Southwestern',
  'NM': 'Southwestern',
  
  // Middle Eastern Province
  'NC': 'Middle Eastern',
  'WV': 'Middle Eastern',
  
  // Western Province
  'CA': 'Western',
  'OR': 'Western',
  'WA': 'Western',
  'NV': 'Western',
  'AZ': 'Western',
  'HI': 'Western',
  'AK': 'Western',
  'UT': 'Western',
};

async function updateProvinces() {
  console.log('Starting province updates based on state...\n');

  // Get all chapters with null province but have a state
  const result = await pool.query(
    'SELECT id, name, state, province FROM chapters WHERE province IS NULL AND state IS NOT NULL'
  );

  console.log(`Found ${result.rows.length} chapters with null province but have state\n`);

  let updated = 0;
  let notFound = 0;
  const notFoundStates = new Set<string>();

  for (const chapter of result.rows) {
    const state = chapter.state?.trim().toUpperCase();
    
    if (!state) {
      continue;
    }

    // Handle state codes that might have extra characters
    const stateCode = state.length > 2 ? state.substring(0, 2) : state;
    const province = stateToProvince[stateCode];

    if (province) {
      await pool.query(
        'UPDATE chapters SET province = $1 WHERE id = $2',
        [province, chapter.id]
      );
      updated++;
      if (updated % 10 === 0) {
        console.log(`Updated ${updated} chapters...`);
      }
    } else {
      notFound++;
      notFoundStates.add(stateCode);
      console.log(`No province mapping found for state "${stateCode}" - Chapter: ${chapter.name} (ID: ${chapter.id})`);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total chapters with null province: ${result.rows.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Not found: ${notFound}`);
  
  if (notFoundStates.size > 0) {
    console.log(`\nStates without province mapping: ${Array.from(notFoundStates).join(', ')}`);
  }
}

async function main() {
  try {
    await updateProvinces();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    await pool.end();
    process.exit(1);
  }
}

main();

