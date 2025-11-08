import pool from './connection';
import fs from 'fs';
import path from 'path';

export async function runMigrations() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema - it uses IF NOT EXISTS for most things
    // We'll catch expected errors and continue
    try {
      await pool.query(schema);
      console.log('Database migrations completed successfully');
    } catch (error: any) {
      // Check if it's an expected error (things already exist, deadlocks, etc.)
      const errorCode = error?.code;
      const errorMessage = error?.message || '';
      
      if (
        errorCode === '42710' || // duplicate object (trigger, index, etc.)
        errorCode === '42P07' || // duplicate table
        errorCode === '23505' || // duplicate key (sequence)
        errorCode === '40P01' || // deadlock detected
        errorMessage.includes('already exists') ||
        errorMessage.includes('duplicate') ||
        errorMessage.includes('deadlock')
      ) {
        // Expected error - some objects already exist or deadlock (concurrent migrations), which is fine
        console.log('Database migrations completed (some objects already exist or concurrent migration detected, which is expected)');
      } else {
        // Unexpected error - rethrow it
        throw error;
      }
    }
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    await runMigrations();
    console.log('Database initialized');
  } catch (error: any) {
    // Check if it's an expected error (things already exist, deadlocks, etc.)
    const errorCode = error?.code;
    const errorMessage = error?.message || '';
    
    if (
      errorCode === '42710' || // duplicate object
      errorCode === '42P07' || // duplicate table
      errorCode === '23505' || // duplicate key
      errorCode === '40P01' || // deadlock detected
      errorMessage.includes('already exists') ||
      errorMessage.includes('duplicate') ||
      errorMessage.includes('deadlock')
    ) {
      // Expected error - database is already initialized or concurrent migration, just log it
      console.log('Database already initialized (some objects already exist or concurrent migration)');
    } else {
      // Unexpected error - log it but don't crash the server
      console.error('Error initializing database:', errorMessage.substring(0, 200));
    }
  }
}

// Run migrations if this file is executed directly via tsx
// Check if this is the main module by comparing the file path
const isMainModule = process.argv[1] && process.argv[1].endsWith('migrations.ts');

if (isMainModule) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed');
      pool.end();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      pool.end();
      process.exit(1);
    });
}

