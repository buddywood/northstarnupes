-- Migration: Add seller product rules
-- Date: Add distinction between verified sellers (Kappa merchandise only) and verified members (any products)
-- 
-- Business Rules:
-- 1. Verified sellers (seller.verification_status = 'VERIFIED') → Must sell Kappa Alpha Psi branded merchandise only
-- 2. Verified members (seller.member_id IS NOT NULL AND member.verification_status = 'VERIFIED') → Can sell anything

DO $$
BEGIN
  -- Add is_kappa_branded flag to products table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='is_kappa_branded') THEN
    ALTER TABLE products ADD COLUMN is_kappa_branded BOOLEAN DEFAULT false;
    CREATE INDEX IF NOT EXISTS idx_products_is_kappa_branded ON products(is_kappa_branded);
  END IF;

  -- Add comment to document the business rule
  COMMENT ON COLUMN products.is_kappa_branded IS 
    'Indicates if product is Kappa Alpha Psi branded merchandise. Verified sellers can only list branded products. Verified members can list any products.';
END $$;

