import { API_URL } from './constants';

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
}

export interface ProductAttributeValue {
  id: number;
  product_id: number;
  attribute_definition_id: number;
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
  created_at: string;
  attribute_name?: string;
  attribute_type?: 'TEXT' | 'SELECT' | 'NUMBER' | 'BOOLEAN';
  display_order?: number;
}

export interface ProductCategory {
  id: number;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryAttributeDefinition {
  id: number;
  category_id: number;
  attribute_name: string;
  attribute_type: 'TEXT' | 'SELECT' | 'NUMBER' | 'BOOLEAN';
  is_required: boolean;
  display_order: number;
  options: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  seller_id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url: string | null;
  category_id: number | null;
  category_name?: string | null;
  is_kappa_branded?: boolean;
  seller_name?: string;
  seller_business_name?: string | null;
  seller_fraternity_member_id?: number | null;
  seller_sponsoring_chapter_id?: number | null;
  seller_initiated_chapter_id?: number | null;
  seller_initiated_season?: string | null;
  seller_initiated_year?: number | null;
  seller_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  is_fraternity_member?: boolean;
  is_seller?: boolean;
  is_promoter?: boolean;
  is_steward?: boolean;
  attributes?: ProductAttributeValue[];
}

export interface Event {
  id: number;
  promoter_id: number;
  title: string;
  description: string | null;
  event_date: string;
  location: string;
  city: string | null;
  state: string | null;
  image_url: string | null;
  sponsored_chapter_id: number | null;
  ticket_price_cents: number;
  max_attendees: number | null;
  promoter_name?: string;
  promoter_email?: string;
  promoter_fraternity_member_id?: number | null;
  promoter_sponsoring_chapter_id?: number | null;
  promoter_initiated_chapter_id?: number | null;
  promoter_initiated_season?: string | null;
  promoter_initiated_year?: number | null;
  chapter_name?: string | null;
  is_fraternity_member?: boolean;
  is_promoter?: boolean;
  is_steward?: boolean;
  is_seller?: boolean;
}

export interface Seller {
  id: number;
  name: string;
  business_name?: string | null;
  headshot_url?: string | null;
  sponsoring_chapter_id: number;
  social_links?: Record<string, string>;
  fraternity_member_id?: number | null;
  initiated_chapter_id?: number | null;
  initiated_season?: string | null;
  initiated_year?: number | null;
  product_count: number;
  is_fraternity_member?: boolean;
  is_seller?: boolean;
  is_promoter?: boolean;
  is_steward?: boolean;
}

export interface SellerWithProducts extends Seller {
  products: Product[];
}

export async function fetchChapters(): Promise<Chapter[]> {
  try {
    const res = await fetch(`${API_URL}/api/chapters`);
    if (!res.ok) throw new Error('Failed to fetch chapters');
    return res.json();
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return [];
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/products/featured`);
    if (!res.ok) throw new Error('Failed to fetch featured products');
    return res.json();
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

export async function fetchProduct(productId: number): Promise<Product> {
  try {
    const res = await fetch(`${API_URL}/api/products/${productId}`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Product not found');
      }
      throw new Error('Failed to fetch product');
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

export async function fetchEvents(): Promise<Event[]> {
  try {
    const res = await fetch(`${API_URL}/api/events`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export async function fetchUpcomingEvents(): Promise<Event[]> {
  try {
    const res = await fetch(`${API_URL}/api/events/upcoming`);
    if (!res.ok) throw new Error('Failed to fetch upcoming events');
    return res.json();
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
}

export async function fetchEvent(eventId: number): Promise<Event> {
  try {
    const res = await fetch(`${API_URL}/api/events/${eventId}`);
    if (!res.ok) throw new Error('Failed to fetch event');
    return res.json();
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
}

export async function getPromoterEvents(token: string): Promise<Event[]> {
  try {
    const res = await fetch(`${API_URL}/api/events/promoter/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch promoter events');
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching promoter events:', error);
    throw error;
  }
}

export interface SearchResults {
  products: Product[];
  events: Event[];
}

export async function searchPublicItems(query: string): Promise<SearchResults> {
  try {
    if (!query.trim()) {
      return { products: [], events: [] };
    }

    // Fetch all products and events, then filter client-side
    // (In a production app, you'd want a dedicated search endpoint)
    const [products, events] = await Promise.all([
      fetchProducts(),
      fetchEvents(),
    ]);

    const searchLower = query.toLowerCase();
    
    const filteredProducts = products.filter((product) => {
      const nameMatch = product.name?.toLowerCase().includes(searchLower);
      const descMatch = product.description?.toLowerCase().includes(searchLower);
      const sellerMatch = product.seller_name?.toLowerCase().includes(searchLower) ||
                         product.seller_business_name?.toLowerCase().includes(searchLower);
      return nameMatch || descMatch || sellerMatch;
    });

    const filteredEvents = events.filter((event) => {
      const titleMatch = event.title?.toLowerCase().includes(searchLower);
      const descMatch = event.description?.toLowerCase().includes(searchLower);
      const locationMatch = event.location?.toLowerCase().includes(searchLower) ||
                           event.city?.toLowerCase().includes(searchLower) ||
                           event.state?.toLowerCase().includes(searchLower);
      const promoterMatch = event.promoter_name?.toLowerCase().includes(searchLower);
      return titleMatch || descMatch || locationMatch || promoterMatch;
    });

    return {
      products: filteredProducts,
      events: filteredEvents,
    };
  } catch (error) {
    console.error('Error searching public items:', error);
    return { products: [], events: [] };
  }
}

export async function fetchTotalDonations(): Promise<number> {
  try {
    const res = await fetch(`${API_URL}/api/donations/total`);
    if (!res.ok) throw new Error('Failed to fetch total donations');
    const data = await res.json();
    return data.total_donations_cents || 0;
  } catch (error) {
    console.error('Error fetching total donations:', error);
    return 0;
  }
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
  category_id: number | null;
  status: 'ACTIVE' | 'CLAIMED' | 'REMOVED';
  steward?: {
    id: number;
    fraternity_member_id: number | null;
    sponsoring_chapter_id: number;
    status: string;
    member?: {
      id: number;
      name: string;
      email: string;
    } | null;
  } | null;
  chapter?: {
    id: number;
    name: string;
  } | null;
  can_claim?: boolean;
}

export async function getStewardMarketplacePublic(): Promise<StewardListing[]> {
  try {
    const res = await fetch(`${API_URL}/api/stewards/marketplace/public`);
    if (!res.ok) throw new Error('Failed to fetch steward marketplace');
    return res.json();
  } catch (error) {
    console.error('Error fetching steward marketplace:', error);
    return [];
  }
}

export async function getStewardListingPublic(id: number): Promise<StewardListing> {
  try {
    const res = await fetch(`${API_URL}/api/stewards/listings/${id}/public`);
    if (!res.ok) throw new Error('Failed to fetch steward listing');
    return res.json();
  } catch (error) {
    console.error('Error fetching steward listing:', error);
    throw error;
  }
}

export async function fetchProductCategories(): Promise<ProductCategory[]> {
  try {
    const res = await fetch(`${API_URL}/api/products/categories`);
    if (!res.ok) throw new Error('Failed to fetch product categories');
    return res.json();
  } catch (error) {
    console.error('Error fetching product categories:', error);
    return [];
  }
}

export async function fetchCategoryAttributeDefinitions(categoryId: number): Promise<CategoryAttributeDefinition[]> {
  try {
    const res = await fetch(`${API_URL}/api/products/categories/${categoryId}/attributes`);
    if (!res.ok) throw new Error('Failed to fetch category attributes');
    return res.json();
  } catch (error) {
    console.error('Error fetching category attributes:', error);
    return [];
  }
}

export async function fetchSellersWithProducts(): Promise<SellerWithProducts[]> {
  try {
    const res = await fetch(`${API_URL}/api/sellers/collections`);
    if (!res.ok) throw new Error('Failed to fetch sellers');
    return res.json();
  } catch (error) {
    console.error('Error fetching sellers with products:', error);
    return [];
  }
}

export async function fetchSellerWithProducts(sellerId: number): Promise<SellerWithProducts | null> {
  try {
    const res = await fetch(`${API_URL}/api/sellers/${sellerId}/products`);
    if (!res.ok) throw new Error('Failed to fetch seller with products');
    const data = await res.json();
    // The API returns seller data with products array
    return {
      ...data,
      products: data.products || [],
    };
  } catch (error) {
    console.error('Error fetching seller with products:', error);
    return null;
  }
}

// Helper function to get auth headers (for future use when auth is implemented)
export async function getAuthHeaders(): Promise<HeadersInit> {
  // TODO: Get token from auth context when authentication is implemented
  return {
    'Content-Type': 'application/json',
  };
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export async function createCheckoutSession(
  productId: number,
  buyerEmail: string,
  token?: string
): Promise<CheckoutSession> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/api/checkout/${productId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ buyer_email: buyerEmail }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Failed to create checkout session' }));
      throw new Error(errorData.error || errorData.details || 'Failed to create checkout session');
    }

    return res.json();
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export interface FeaturedBrother {
  id: number;
  name: string;
  business_name: string | null;
  headshot_url: string | null;
  sponsoring_chapter_id: number;
  chapter_name: string | null;
  social_links: Record<string, string>;
  website: string | null;
  product_count: number;
}

export async function fetchFeaturedBrothers(): Promise<FeaturedBrother[]> {
  try {
    const res = await fetch(`${API_URL}/api/sellers/featured`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(`Failed to fetch featured brothers: ${res.status} ${res.statusText}`, errorData);
      return [];
    }
    const data = await res.json();
    console.log(`fetchFeaturedBrothers: Retrieved ${data.length} featured brothers`);
    return data;
  } catch (error) {
    console.error('Error fetching featured brothers:', error);
    return [];
  }
}


