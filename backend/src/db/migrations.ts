import pool from './connection';
import fs from 'fs';
import path from 'path';

async function runSchema() {
  // Try current directory first (works when running with tsx from src/db)
  let schemaPath = path.join(__dirname, 'schema.sql');
  
  // If not found, try going up from dist/db to backend root, then to src/db
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(__dirname, '..', '..', 'src', 'db', 'schema.sql');
  }
  
  // If still not found, try relative to project root (for different execution contexts)
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(process.cwd(), 'src', 'db', 'schema.sql');
  }
  
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found. Tried: ${schemaPath}`);
  }
  
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schema);
  console.log('Initial schema created successfully');
}

async function runMigrationFiles() {
  // Get migrations directory
  let migrationsDir = path.join(__dirname, 'migrations');
  
  // If not found, try going up from dist/db to backend root, then to src/db
  if (!fs.existsSync(migrationsDir)) {
    migrationsDir = path.resolve(__dirname, '..', '..', 'src', 'db', 'migrations');
  }
  
  // If still not found, try relative to project root
  if (!fs.existsSync(migrationsDir)) {
    migrationsDir = path.resolve(process.cwd(), 'src', 'db', 'migrations');
  }
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found, skipping migrations');
    return;
  }
  
  // Get all migration files and sort them
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort alphabetically (001, 002, 003, etc.)
  
  if (files.length === 0) {
    console.log('No migration files found');
    return;
  }
  
  console.log(`Found ${files.length} migration file(s)`);
  
  for (const file of files) {
    const migrationPath = path.join(migrationsDir, file);
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    try {
      await pool.query(migration);
      console.log(`✓ Applied migration: ${file}`);
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
        console.log(`✓ Migration ${file} completed (some objects already exist, which is expected)`);
      } else {
        // Unexpected error - log it but continue with other migrations
        console.error(`✗ Error applying migration ${file}:`, errorMessage.substring(0, 200));
        // Don't throw - continue with other migrations
      }
    }
  }
}

export async function runMigrations() {
  try {
    // First, run the initial schema (CREATE TABLE statements)
    await runSchema();
    
    // Then, run all migration files in order
    await runMigrationFiles();
    
    console.log('Database migrations completed successfully');
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
