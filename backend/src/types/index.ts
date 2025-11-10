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
  sponsoring_chapter_id: number;
  business_name: string | null;
  vendor_license_number: string;
  stripe_account_id: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Product {
  id: number;
  seller_id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url: string | null;
  sponsored_chapter_id: number | null;
  created_at: Date;
  updated_at: Date;
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
  role: 'ADMIN' | 'SELLER' | 'PROMOTER' | 'CONSUMER';
  onboarding_status: 'PRE_COGNITO' | 'COGNITO_CONFIRMED' | 'ONBOARDING_STARTED' | 'ONBOARDING_FINISHED';
  member_id: number | null;
  seller_id: number | null;
  promoter_id: number | null;
  features: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

