import dotenv from 'dotenv';
import path from 'path';
import { createBrowser, loginToKappaPortal, verifyMember } from '../services/memberVerification';
import {
  getPendingMembersForVerification,
  getPendingSellersForVerification,
  getPendingPromotersForVerification,
  updateMemberVerification,
  updateSellerVerification,
  updatePromoterVerification,
} from '../db/queries';
import { initializeDatabase } from '../db/migrations';
import type { Browser, Page } from 'puppeteer';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

// Helper: Wait for a specified number of milliseconds
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check for visible browser mode (--visible or --watch flag, or VERIFICATION_VISIBLE env var)
const args = process.argv.slice(2);
const isVisibleMode = args.includes('--visible') || args.includes('--watch') || process.env.VERIFICATION_VISIBLE === 'true';
const isDebugMode = args.includes('--debug') || args.includes('--record');
const isRecordMode = args.includes('--record');

interface VerificationResult {
  success: boolean;
  verified: boolean;
  notes?: string;
}

/**
 * Verify a single member
 */
async function verifySingleMember(
  page: Page,
  name: string,
  membershipNumber: string
): Promise<VerificationResult> {
  try {
    const result = await verifyMember(page, name, membershipNumber);

    if (result.found && result.nameMatch && result.membershipNumberMatch) {
      return {
        success: true,
        verified: true,
        notes: `Verified: Name and membership number match found. ${result.details?.name ? `Name: ${result.details.name}` : ''} ${result.details?.membershipNumber ? `Membership: ${result.details.membershipNumber}` : ''}`,
      };
    } else if (result.error) {
      return {
        success: false,
        verified: false,
        notes: `Error during verification: ${result.error}`,
      };
    } else {
      let notes = 'Verification failed: ';
      if (!result.nameMatch && !result.membershipNumberMatch) {
        notes += 'Neither name nor membership number matched.';
      } else if (!result.nameMatch) {
        notes += 'Name did not match (membership number matched).';
      } else if (!result.membershipNumberMatch) {
        notes += 'Membership number did not match (name matched).';
      }
      return {
        success: true,
        verified: false,
        notes,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      verified: false,
      notes: `Exception during verification: ${error.message}`,
    };
  }
}

/**
 * Main verification process
 */
async function runVerification() {
  console.log('🚀 Starting member verification process...\n');

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Initialize database connection
    await initializeDatabase();

    // Fetch all pending members
    console.log('📋 Fetching pending members...');
    const pendingMembers = await getPendingMembersForVerification();
    const pendingSellers = await getPendingSellersForVerification();
    const pendingPromoters = await getPendingPromotersForVerification();

    const totalPending = pendingMembers.length + pendingSellers.length + pendingPromoters.length;
    console.log(`   Found ${pendingMembers.length} pending members`);
    console.log(`   Found ${pendingSellers.length} pending sellers`);
    console.log(`   Found ${pendingPromoters.length} pending promoters`);
    console.log(`   Total: ${totalPending} pending verifications\n`);

    if (totalPending === 0) {
      console.log('✅ No pending verifications. Exiting.');
      return;
    }

    // Initialize browser
    if (isVisibleMode) {
      console.log('🌐 Initializing browser (VISIBLE MODE - you can watch the process)...');
    } else {
      console.log('🌐 Initializing browser...');
    }
    browser = await createBrowser(!isVisibleMode);
    page = await browser.newPage();

    // Set timeouts (longer in visible mode so user can see what's happening)
    if (isVisibleMode) {
      page.setDefaultTimeout(60000); // Longer timeout for visible mode
      page.setDefaultNavigationTimeout(60000);
      console.log('👀 Browser is visible - you can watch the verification process');
      console.log('   Press Ctrl+C to stop at any time\n');
    } else {
      page.setDefaultTimeout(30000);
      page.setDefaultNavigationTimeout(30000);
    }

    // Login to Kappa portal
    console.log('🔐 Logging into Kappa Alpha Psi portal...');
    
    // Record mode: Let user manually log in
    if (isRecordMode) {
      const { recordManualLogin } = await import('../services/memberVerification');
      await recordManualLogin(page);
      console.log('✅ Recording complete. Please check the output above for selectors.');
      return;
    }
    
    const loginSuccess = await loginToKappaPortal(page, isDebugMode);

    if (!loginSuccess) {
      console.error('❌ Failed to login to Kappa portal. Aborting verification.');
      return;
    }

    console.log('✅ Successfully logged in\n');

    // Verify members
    let verifiedCount = 0;
    let failedCount = 0;
    let errorCount = 0;

    // Process regular members
    if (pendingMembers.length > 0) {
      console.log(`\n📝 Processing ${pendingMembers.length} members...`);
      for (const member of pendingMembers) {
        if (!member.name || !member.membership_number) {
          console.log(`   ⚠️  Skipping member ${member.id}: missing name or membership number`);
          await updateMemberVerification(member.id, 'MANUAL_REVIEW', 'Missing name or membership number');
          continue;
        }

        console.log(`   Verifying: ${member.name} (${member.membership_number})...`);
        const result = await verifySingleMember(page, member.name, member.membership_number);

        if (!result.success) {
          errorCount++;
          await updateMemberVerification(member.id, 'FAILED', result.notes);
          console.log(`      ❌ Error: ${result.notes}`);
        } else if (result.verified) {
          verifiedCount++;
          await updateMemberVerification(member.id, 'VERIFIED', result.notes);
          console.log(`      ✅ Verified`);
        } else {
          failedCount++;
          await updateMemberVerification(member.id, 'FAILED', result.notes);
          console.log(`      ❌ Failed: ${result.notes}`);
        }

        // Small delay between verifications to avoid overwhelming the server
        await delay(1000);
      }
    }

    // Process sellers
    if (pendingSellers.length > 0) {
      console.log(`\n📝 Processing ${pendingSellers.length} sellers...`);
      for (const seller of pendingSellers) {
        if (!seller.name || !seller.membership_number) {
          console.log(`   ⚠️  Skipping seller ${seller.id}: missing name or membership number`);
          await updateSellerVerification(seller.id, 'MANUAL_REVIEW', 'Missing name or membership number', false);
          continue;
        }

        console.log(`   Verifying: ${seller.name} (${seller.membership_number})...`);
        const result = await verifySingleMember(page, seller.name, seller.membership_number);

        if (!result.success) {
          errorCount++;
          await updateSellerVerification(seller.id, 'FAILED', result.notes, false);
          console.log(`      ❌ Error: ${result.notes}`);
        } else if (result.verified) {
          verifiedCount++;
          // Auto-approve verified sellers
          await updateSellerVerification(seller.id, 'VERIFIED', result.notes, true);
          console.log(`      ✅ Verified and auto-approved`);
        } else {
          failedCount++;
          await updateSellerVerification(seller.id, 'FAILED', result.notes, false);
          console.log(`      ❌ Failed: ${result.notes}`);
        }

        await delay(1000);
      }
    }

    // Process promoters
    if (pendingPromoters.length > 0) {
      console.log(`\n📝 Processing ${pendingPromoters.length} promoters...`);
      for (const promoter of pendingPromoters) {
        if (!promoter.name || !promoter.membership_number) {
          console.log(`   ⚠️  Skipping promoter ${promoter.id}: missing name or membership number`);
          await updatePromoterVerification(promoter.id, 'MANUAL_REVIEW', 'Missing name or membership number', false);
          continue;
        }

        console.log(`   Verifying: ${promoter.name} (${promoter.membership_number})...`);
        const result = await verifySingleMember(page, promoter.name, promoter.membership_number);

        if (!result.success) {
          errorCount++;
          await updatePromoterVerification(promoter.id, 'FAILED', result.notes, false);
          console.log(`      ❌ Error: ${result.notes}`);
        } else if (result.verified) {
          verifiedCount++;
          // Auto-approve verified promoters
          await updatePromoterVerification(promoter.id, 'VERIFIED', result.notes, true);
          console.log(`      ✅ Verified and auto-approved`);
        } else {
          failedCount++;
          await updatePromoterVerification(promoter.id, 'FAILED', result.notes, false);
          console.log(`      ❌ Failed: ${result.notes}`);
        }

        await delay(1000);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Verification Summary:');
    console.log(`   ✅ Verified: ${verifiedCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log(`   ⚠️  Errors: ${errorCount}`);
    console.log(`   📝 Total processed: ${totalPending}`);
    console.log('='.repeat(50) + '\n');

  } catch (error: any) {
    console.error('❌ Fatal error during verification:', error);
    console.error(error.stack);
  } finally {
    // Clean up
    if (page) {
      await page.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
    console.log('🏁 Verification process completed.');
  }
}

// Run if called directly
if (require.main === module) {
  runVerification()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export { runVerification };

