-- Fix the check_role_foreign_key constraint to allow promoters to have fraternity_member_id
-- Promoters must be fraternity members (fraternity_member_id NOT NULL)
-- Sellers can optionally be members (fraternity_member_id can be NULL)

ALTER TABLE users DROP CONSTRAINT IF EXISTS check_role_foreign_key;

ALTER TABLE users ADD CONSTRAINT check_role_foreign_key CHECK (
  (role = 'CONSUMER' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL AND (
    (fraternity_member_id IS NOT NULL) OR 
    (fraternity_member_id IS NULL AND onboarding_status != 'ONBOARDING_FINISHED')
  )) OR
  (role = 'SELLER' AND seller_id IS NOT NULL AND fraternity_member_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
  (role = 'PROMOTER' AND promoter_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND seller_id IS NULL AND steward_id IS NULL) OR
  (role = 'STEWARD' AND steward_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND (
    (seller_id IS NULL AND promoter_id IS NULL) OR
    (seller_id IS NOT NULL AND promoter_id IS NULL) OR
    (seller_id IS NULL AND promoter_id IS NOT NULL) OR
    (seller_id IS NOT NULL AND promoter_id IS NOT NULL)
  )) OR
  (role = 'ADMIN' AND fraternity_member_id IS NULL AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL)
);


