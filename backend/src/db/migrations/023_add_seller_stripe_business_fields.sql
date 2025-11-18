-- Migration: Add Stripe business details fields to sellers table
-- Date: Add fields to store business information synced from Stripe Connect accounts

-- Add tax_id field for storing tax identification number (EIN or partial SSN)
ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100);

-- Add business_phone field for storing business phone number from Stripe
ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS business_phone VARCHAR(50);

-- Add stripe_account_type field to track if account is 'company' or 'individual'
ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS stripe_account_type VARCHAR(20) CHECK (stripe_account_type IN ('company', 'individual', NULL));

-- Add business address fields from Stripe
ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS business_address_line1 VARCHAR(255);

ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS business_address_line2 VARCHAR(255);

ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS business_city VARCHAR(100);

ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS business_state VARCHAR(100);

ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS business_postal_code VARCHAR(20);

ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS business_country VARCHAR(2);

-- Add index for tax_id lookups (if needed for reporting)
CREATE INDEX IF NOT EXISTS idx_sellers_tax_id ON sellers(tax_id) WHERE tax_id IS NOT NULL;

-- Add index for business location queries
CREATE INDEX IF NOT EXISTS idx_sellers_business_state ON sellers(business_state) WHERE business_state IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sellers_business_country ON sellers(business_country) WHERE business_country IS NOT NULL;

-- Add comment to document the fields
COMMENT ON COLUMN sellers.tax_id IS 'Tax identification number from Stripe (EIN for companies, partial SSN for individuals)';
COMMENT ON COLUMN sellers.business_phone IS 'Business phone number from Stripe business profile';
COMMENT ON COLUMN sellers.stripe_account_type IS 'Type of Stripe Connect account: company or individual';
COMMENT ON COLUMN sellers.business_address_line1 IS 'Business address line 1 from Stripe';
COMMENT ON COLUMN sellers.business_address_line2 IS 'Business address line 2 from Stripe';
COMMENT ON COLUMN sellers.business_city IS 'Business city from Stripe';
COMMENT ON COLUMN sellers.business_state IS 'Business state/province from Stripe';
COMMENT ON COLUMN sellers.business_postal_code IS 'Business postal/ZIP code from Stripe';
COMMENT ON COLUMN sellers.business_country IS 'Business country code (ISO 2-letter) from Stripe';

