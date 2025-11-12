-- Migration: Add stripe_account_id to stewards table
-- Date: Add Stripe Connect account support for steward shipping cost reimbursement
-- 
-- Stewards need Stripe Connect accounts to receive shipping cost reimbursements
-- when their listings are claimed by buyers.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='stewards' AND column_name='stripe_account_id') THEN
    ALTER TABLE stewards ADD COLUMN stripe_account_id VARCHAR(255);
  END IF;
END $$;

