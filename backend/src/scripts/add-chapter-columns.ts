import pool from '../db/connection';

async function addColumns() {
  try {
    // Add status column if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='chapters' AND column_name='status') THEN
          ALTER TABLE chapters ADD COLUMN status VARCHAR(100);
        END IF;
      END $$;
    `);
    console.log('Added status column (if it didn\'t exist)');

    // Add chartered column if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='chapters' AND column_name='chartered') THEN
          ALTER TABLE chapters ADD COLUMN chartered INTEGER;
        END IF;
      END $$;
    `);
    console.log('Added chartered column (if it didn\'t exist)');

    console.log('Migration completed successfully');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error adding columns:', error);
    await pool.end();
    process.exit(1);
  }
}

addColumns();

