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

export interface Seller {
  id: number;
  email: string;
  name: string;
  membership_number: string;
  initiated_chapter_id: number;
  sponsoring_chapter_id: number;
  business_name: string | null;
  vendor_license_number: string;
  headshot_url: string | null;
  social_links: Record<string, string>;
  stripe_account_id: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: Date;
  updated_at: Date;
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

export interface Promoter {
  id: number;
  email: string;
  name: string;
  membership_number: string;
  initiated_chapter_id: number;
  sponsoring_chapter_id: number | null;
  headshot_url: string | null;
  social_links: Record<string, string>;
  stripe_account_id: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: Date;
  updated_at: Date;
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

