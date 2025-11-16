export interface Chapter {
  id: number;
  name: string;
  type: string;
  status: string | null;
  chartered: number | null;
  province: string | null;
  city: string | null;
  state: string | null;
  contact_email: string | null;
  stripe_account_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// Base Brother interface - shared attributes for all brothers (sellers, promoters, etc.)
export interface Brother {
  id: number;
  name: string;
  email: string;
  membership_number: string; // member number (same for sellers/promoters)
  headshot_url: string | null; // photo/headshot
  location: string | null; // city, state, or general location
  initiated_chapter_id: number;
  initiated_season: string | null; // e.g., "Fall", "Spring"
  initiated_year: number | null;
  ship_name: string | null; // fraternity ship/line name
  line_name: string | null; // line name
  address: string | null; // can be private
  address_is_private: boolean;
  phone_number: string | null; // can be private
  phone_is_private: boolean;
  social_links: Record<string, string>;
  industry: string | null;
  job_title: string | null;
  bio: string | null; // biography/about section
  verification_status?: 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';
  verification_date?: Date | null;
  verification_notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Seller extends Brother {
  fraternity_member_id: number | null; // Foreign key to fraternity_members table (sellers can optionally be fraternity members)
  sponsoring_chapter_id: number;
  business_name: string | null;
  business_email: string | null;
  vendor_license_number: string | null; // Required only for KAPPA merchandise
  merchandise_type: 'KAPPA' | 'NON_KAPPA' | null;
  website: string | null;
  stripe_account_id: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ProductCategory {
  id: number;
  name: string;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryAttributeDefinition {
  id: number;
  category_id: number;
  attribute_name: string;
  attribute_type: 'TEXT' | 'SELECT' | 'NUMBER' | 'BOOLEAN';
  is_required: boolean;
  display_order: number;
  options: string[] | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProductAttributeValue {
  id: number;
  product_id: number;
  attribute_definition_id: number;
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
  created_at: Date;
}

export interface Product {
  id: number;
  seller_id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url: string | null;
  category_id: number | null;
  is_kappa_branded: boolean; // Indicates if product is Kappa Alpha Psi branded merchandise
  created_at: Date;
  updated_at: Date;
  attributes?: ProductAttributeValue[]; // Optional, loaded separately
  // Seller-related fields (from JOIN with sellers and members tables)
  seller_name?: string;
  seller_fraternity_member_id?: number | null;
  seller_sponsoring_chapter_id?: number | null;
  seller_initiated_chapter_id?: number | null;
}

export interface Order {
  id: number;
  product_id: number;
  buyer_email: string;
  amount_cents: number;
  stripe_session_id: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  chapter_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface SellerApplication {
  name: string;
  email: string;
  membership_number: string;
  initiated_chapter_id: number;
  sponsoring_chapter_id?: number;
  headshot_url: string;
  social_links: Record<string, string>;
}

export interface Promoter extends Brother {
  sponsoring_chapter_id: number | null;
  stripe_account_id: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Event {
  id: number;
  promoter_id: number;
  title: string;
  description: string | null;
  event_date: Date;
  location: string;
  city: string | null;
  state: string | null;
  image_url: string | null;
  sponsored_chapter_id: number | null;
  ticket_price_cents: number;
  max_attendees: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface PromoterApplication {
  name: string;
  email: string;
  membership_number: string;
  initiated_chapter_id: number;
  sponsoring_chapter_id?: number;
  headshot_url: string;
  social_links: Record<string, string>;
}

export interface User {
  id: number;
  cognito_sub: string;
  email: string;
  role: 'ADMIN' | 'SELLER' | 'PROMOTER' | 'CONSUMER' | 'STEWARD';
  onboarding_status: 'PRE_COGNITO' | 'COGNITO_CONFIRMED' | 'ONBOARDING_STARTED' | 'ONBOARDING_FINISHED';
  fraternity_member_id: number | null;
  seller_id: number | null;
  promoter_id: number | null;
  steward_id: number | null;
  features: Record<string, any>;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Steward {
  id: number;
  fraternity_member_id: number;
  sponsoring_chapter_id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verification_status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';
  verification_date: Date | null;
  verification_notes: string | null;
  stripe_account_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface StewardListing {
  id: number;
  steward_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  shipping_cost_cents: number;
  chapter_donation_cents: number;
  sponsoring_chapter_id: number;
  status: 'ACTIVE' | 'CLAIMED' | 'REMOVED';
  claimed_by_fraternity_member_id: number | null;
  claimed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface StewardClaim {
  id: number;
  listing_id: number;
  claimant_fraternity_member_id: number;
  stripe_session_id: string | null;
  total_amount_cents: number;
  shipping_cents: number;
  platform_fee_cents: number;
  chapter_donation_cents: number;
  status: 'PENDING' | 'PAID' | 'FAILED';
  created_at: Date;
  updated_at: Date;
}

export interface PlatformSetting {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
  updated_at: Date;
}

