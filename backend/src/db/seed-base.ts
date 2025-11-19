import { spawn } from 'child_process';
import path from 'path';

/**
 * Base seed script that runs essential seeding operations
 * that should be part of both test and production environments.
 * 
 * This includes:
 * - Industries (required for registration)
 * - Chapters (collegiate + alumni)
 * - Province updates (update province column based on state)
 */

async function runScript(scriptPath: string, args: string[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = spawn('tsx', [scriptPath, ...args], {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '../..'),
    });

    script.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    script.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  try {
    // Always seed industries (they're needed for registration)
    console.log('🏭 Seeding industries (base)...\n');
    await runScript(path.join(__dirname, '../scripts/seed-industries.ts'));
    console.log('✅ Industries seeded successfully!\n');

    // Seed chapters (collegiate + alumni)
    console.log('📚 Seeding chapters (base)...\n');
    
    // Seed collegiate chapters
    console.log('📖 Seeding collegiate chapters...');
    await runScript(path.join(__dirname, '../scripts/seed-chapters.ts'));
    
    // Seed alumni chapters (part of base seed)
    console.log('\n📖 Seeding alumni chapters...');
    await runScript(path.join(__dirname, '../scripts/seed-alumni-chapters.ts'));
    
    console.log('\n✅ Chapters seeded successfully!\n');

    // Update provinces for all chapters based on state
    console.log('🗺️  Updating provinces for chapters...\n');
    await runScript(path.join(__dirname, '../scripts/update-provinces.ts'));
    console.log('\n✅ Province updates completed!\n');

    console.log('🎉 Base seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during base seeding:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default main;

