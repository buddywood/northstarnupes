const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

export interface ProductAttributeValue {
  id: number;
  product_id: number;
  attribute_definition_id: number;
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
  created_at: string;
  attribute_name?: string; // Included when joined with category_attribute_definitions
  attribute_type?: 'TEXT' | 'SELECT' | 'NUMBER' | 'BOOLEAN'; // Included when joined
  display_order?: number; // Included when joined
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  display_order: number;
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
  seller_stripe_account_id?: string | null;
  is_fraternity_member?: boolean;
  is_seller?: boolean;
  is_promoter?: boolean;
  is_steward?: boolean;
  attributes?: ProductAttributeValue[];
  images?: ProductImage[];
}

export interface Seller {
  id: number;
  email: string;
  name: string;
  fraternity_member_id?: number | null;
  sponsoring_chapter_id: number;
  business_name: string | null;
  business_email: string | null;
  business_phone: string | null;
  kappa_vendor_id: string | null;
  merchandise_type: 'KAPPA' | 'NON_KAPPA' | null;
  headshot_url: string | null;
  store_logo_url: string;
  social_links: Record<string, string>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verification_status?: 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';
  stripe_account_id?: string | null;
  stripe_account_type?: 'company' | 'individual' | null;
  tax_id?: string | null;
  website?: string | null;
  business_address_line1?: string | null;
  business_address_line2?: string | null;
  business_city?: string | null;
  business_state?: string | null;
  business_postal_code?: string | null;
  business_country?: string | null;
  initiated_chapter_id?: number | null;
  initiated_season?: string | null;
  initiated_year?: number | null;
  is_fraternity_member?: boolean;
  is_seller?: boolean;
  is_promoter?: boolean;
  is_steward?: boolean;
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
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
  event_type_id: number | null;
  event_audience_type_id: number | null;
  all_day: boolean;
  duration_minutes: number | null;
  event_link: string | null;
  is_featured: boolean;
  featured_payment_status: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  stripe_payment_intent_id: string | null;
  ticket_price_cents: number;
  dress_codes: ('business' | 'business_casual' | 'formal' | 'semi_formal' | 'kappa_casual' | 'greek_encouraged' | 'greek_required' | 'outdoor' | 'athletic' | 'comfortable' | 'all_white')[];
  dress_code_notes: string | null;
  status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
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
  event_audience_type_description?: string | null;
}

export interface EventType {
  id: number;
  enum: string;
  description: string;
  display_order: number;
}

export interface EventAudienceType {
  id: number;
  enum: string;
  description: string;
  display_order: number;
}

export async function fetchEventTypes(): Promise<EventType[]> {
  const res = await fetch(`${API_URL}/api/events/types`);
  if (!res.ok) {
    try {
      const error = await parseJsonResponse<{ error?: string }>(res);
      throw new Error(error.error || 'Failed to fetch event types');
    } catch (err: any) {
      if (err.message && !err.message.includes('Unexpected token')) {
        throw err;
      }
      throw new Error('Failed to load event types. Please try again.');
    }
  }
  return parseJsonResponse<EventType[]>(res);
}

export async function fetchEventAudienceTypes(): Promise<EventAudienceType[]> {
  const res = await fetch(`${API_URL}/api/events/audience-types`);
  if (!res.ok) {
    try {
      const error = await parseJsonResponse<{ error?: string }>(res);
      throw new Error(error.error || 'Failed to fetch event audience types');
    } catch (err: any) {
      if (err.message && !err.message.includes('Unexpected token')) {
        throw err;
      }
      throw new Error('Failed to load event audience types. Please try again.');
    }
  }
  return parseJsonResponse<EventAudienceType[]>(res);
}

export interface Order {
  id: number;
  product_id: number;
  buyer_email: string;
  amount_cents: number;
  status: 'PENDING' | 'PAID' | 'FAILED';
  product_name?: string;
  seller_name?: string;
  chapter_name?: string;
}

export interface Industry {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profession {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchChapters(): Promise<Chapter[]> {
  const res = await fetch(`${API_URL}/api/chapters`);
  if (!res.ok) throw new Error('Failed to fetch chapters');
  return res.json();
}

export async function fetchIndustries(includeInactive: boolean = false): Promise<Industry[]> {
  const url = includeInactive 
    ? `${API_URL}/api/industries?includeInactive=true`
    : `${API_URL}/api/industries`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch industries');
  return res.json();
}

export async function fetchProfessions(includeInactive: boolean = false): Promise<Profession[]> {
  const url = includeInactive 
    ? `${API_URL}/api/professions?includeInactive=true`
    : `${API_URL}/api/professions`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch professions');
  return res.json();
}

export async function fetchActiveCollegiateChapters(): Promise<Chapter[]> {
  const res = await fetch(`${API_URL}/api/chapters/active-collegiate`);
  if (!res.ok) throw new Error('Failed to fetch active collegiate chapters');
  return res.json();
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/products`, {
      cache: 'no-store', // Ensure fresh data on each request
    });
    if (!res.ok) {
      console.error(`Failed to fetch products: ${res.status} ${res.statusText}`);
      throw new Error('Failed to fetch products');
    }
    const data = await res.json();
    console.log(`fetchProducts: Retrieved ${data.length} products`);
    return data;
  } catch (error) {
    console.error('Error in fetchProducts:', error);
    throw error;
  }
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/products/featured`, {
      cache: 'no-store', // Ensure fresh data on each request
    });
    if (!res.ok) {
      console.error(`Failed to fetch featured products: ${res.status} ${res.statusText}`);
      throw new Error('Failed to fetch featured products');
    }
    const data = await res.json();
    console.log(`fetchFeaturedProducts: Retrieved ${data.length} featured products`);
    return data;
  } catch (error) {
    console.error('Error in fetchFeaturedProducts:', error);
    throw error;
  }
}

export async function fetchProduct(id: number): Promise<Product> {
  const res = await fetch(`${API_URL}/api/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

export async function fetchProductCategories(): Promise<ProductCategory[]> {
  const res = await fetch(`${API_URL}/api/products/categories`);
  if (!res.ok) throw new Error('Failed to fetch product categories');
  return res.json();
}

export async function fetchCategoryAttributeDefinitions(categoryId: number): Promise<CategoryAttributeDefinition[]> {
  const res = await fetch(`${API_URL}/api/products/categories/${categoryId}/attributes`);
  if (!res.ok) throw new Error('Failed to fetch category attribute definitions');
  return res.json();
}

export async function createProduct(formData: FormData): Promise<Product> {
  const session = await fetch('/api/auth/session').then(res => res.json());
  const idToken = (session as any)?.idToken;
  
  if (!idToken) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${API_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
    body: formData,
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || error.message || 'Failed to create product');
  }
  
  return res.json();
}

export async function createCheckoutSession(productId: number, buyerEmail: string): Promise<{ sessionId: string; url: string }> {
  const res = await fetch(`${API_URL}/api/checkout/${productId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ buyer_email: buyerEmail }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    // Include full error data for proper handling
    const error = new Error(errorData.message || errorData.details || errorData.error || 'Failed to create checkout session');
    (error as any).errorData = errorData;
    throw error;
  }
  
  return res.json();
}

export interface OrderDetails {
  order: {
    id: number;
    status: 'PENDING' | 'PAID' | 'FAILED';
    amount_cents: number;
    buyer_email: string;
    created_at: string;
  };
  product: {
    id: number;
    name: string;
    price_cents: number;
  } | null;
}

export async function getOrderBySessionId(sessionId: string): Promise<OrderDetails> {
  const res = await fetch(`${API_URL}/api/checkout/session/${sessionId}`);
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || 'Failed to fetch order details';
    throw new Error(errorMessage);
  }
  
  return res.json();
}

// Favorites API
export async function addFavorite(userEmail: string, productId: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/favorites/${userEmail}/${productId}`, {
    method: 'POST',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || 'Failed to add favorite';
    throw new Error(errorMessage);
  }
}

export async function removeFavorite(userEmail: string, productId: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/favorites/${userEmail}/${productId}`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || 'Failed to remove favorite';
    throw new Error(errorMessage);
  }
}

export async function checkFavorite(userEmail: string, productId: number): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/favorites/${userEmail}/${productId}`);
  
  if (!res.ok) {
    return false;
  }
  
  const data = await res.json();
  return data.favorited || false;
}

export async function getFavoriteProducts(userEmail: string): Promise<Product[]> {
  const res = await fetch(`${API_URL}/api/favorites/${userEmail}/products`);
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || 'Failed to fetch favorite products';
    throw new Error(errorMessage);
  }
  
  return res.json();
}

// Notifications API
export interface Notification {
  id: number;
  user_email: string;
  type: 'PURCHASE_BLOCKED' | 'ITEM_AVAILABLE' | 'ORDER_CONFIRMED' | 'ORDER_SHIPPED';
  title: string;
  message: string;
  related_product_id: number | null;
  related_order_id: number | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export async function getNotifications(userEmail: string, limit?: number): Promise<Notification[]> {
  const url = limit 
    ? `${API_URL}/api/notifications/${userEmail}?limit=${limit}`
    : `${API_URL}/api/notifications/${userEmail}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || 'Failed to fetch notifications';
    throw new Error(errorMessage);
  }
  
  return res.json();
}

export async function getUnreadNotificationCount(userEmail: string): Promise<number> {
  const res = await fetch(`${API_URL}/api/notifications/${userEmail}/count`);
  
  if (!res.ok) {
    return 0; // Return 0 on error to avoid breaking the UI
  }
  
  const data = await res.json();
  return data.count || 0;
}

export async function markNotificationAsRead(notificationId: number, userEmail: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userEmail }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || 'Failed to mark notification as read';
    throw new Error(errorMessage);
  }
}

export async function markAllNotificationsAsRead(userEmail: string): Promise<number> {
  const res = await fetch(`${API_URL}/api/notifications/${userEmail}/read-all`, {
    method: 'PUT',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || 'Failed to mark all notifications as read';
    throw new Error(errorMessage);
  }
  
  const data = await res.json();
  return data.count || 0;
}

export async function deleteNotification(notificationId: number, userEmail: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userEmail }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || 'Failed to delete notification';
    throw new Error(errorMessage);
  }
}

export async function submitSellerApplication(formData: FormData): Promise<Seller> {
  // Get auth token if available (optional)
  const headers: HeadersInit = {};
  try {
    const session = await fetch('/api/auth/session').then(res => res.json());
    const idToken = (session as any)?.idToken;
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }
  } catch (error) {
    // Not authenticated, continue without auth header
  }

  const res = await fetch(`${API_URL}/api/sellers/apply`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to submit application');
  }
  return res.json();
}

export async function validateSellerInvitation(token: string): Promise<{ valid: boolean; seller: { email: string; name: string } }> {
  const res = await fetch(`${API_URL}/api/seller-setup/validate/${token}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Invalid invitation token');
  }
  return res.json();
}

export async function completeSellerSetup(token: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/seller-setup/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to complete seller setup');
  }
}

/**
 * Safely parse JSON response, handling HTML error pages
 */
async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  
  // Check if response is HTML (error page) instead of JSON
  if (contentType.includes('text/html') || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    // Try to extract error message from HTML if possible
    const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
    const errorMessage = titleMatch ? titleMatch[1] : 'Server error';
    
    throw new Error(
      response.status === 500 
        ? 'A server error occurred. Please try again later or contact support if the problem persists.'
        : response.status === 404
        ? 'The requested resource was not found. Please check your connection and try again.'
        : response.status === 403
        ? 'You do not have permission to perform this action.'
        : response.status === 401
        ? 'Your session has expired. Please log in again.'
        : `An error occurred (${response.status}). ${errorMessage}`
    );
  }
  
  // Try to parse as JSON
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error('The server returned an invalid response. Please try again.');
  }
}

export async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await fetch('/api/auth/session').then(res => res.json());
  const idToken = (session as any)?.idToken;
  const onboardingStatus = (session as any)?.user?.onboarding_status;
  
  if (!idToken) {
    throw new Error('Not authenticated');
  }
  
  // Check if user has completed onboarding
  if (onboardingStatus !== 'ONBOARDING_FINISHED') {
    throw new Error('Registration incomplete. Please complete your registration to access this feature.');
  }
  
  return {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchPendingSellers(): Promise<Seller[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/sellers/pending`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch pending sellers');
  return res.json();
}

export async function updateSellerStatus(
  sellerId: number,
  status: 'APPROVED' | 'REJECTED'
): Promise<Seller> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/sellers/${sellerId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update seller status');
  return res.json();
}

export async function fetchOrders(): Promise<Order[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/orders`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function fetchDonations() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/donations`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch donations');
  return res.json();
}

export async function fetchTotalDonations(): Promise<number> {
  const res = await fetch(`${API_URL}/api/donations/total`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch total donations');
  const data = await res.json();
  return data.total_donations_cents || 0;
}

export async function submitPromoterApplication(formData: FormData): Promise<Promoter> {
  const res = await fetch(`${API_URL}/api/promoters/apply`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to submit application');
  }
  return res.json();
}

export async function createEvent(formData: FormData): Promise<Event & { checkout_url?: string; requires_payment?: boolean; payment_error?: string }> {
  const headers = await getAuthHeaders();
  // Remove Content-Type header when sending FormData - browser will set it automatically with boundary
  const { 'Content-Type': _, ...headersWithoutContentType } = headers as Record<string, string>;
  const res = await fetch(`${API_URL}/api/events`, {
    method: 'POST',
    headers: headersWithoutContentType,
    body: formData,
  });
  if (!res.ok) {
    try {
      const error = await parseJsonResponse<{ error?: string }>(res);
      throw new Error(error.error || 'Failed to create event');
    } catch (err: any) {
      // If it's already our friendly error, re-throw it
      if (err.message && !err.message.includes('Unexpected token')) {
        throw err;
      }
      // Otherwise provide a friendly message
      throw new Error('Failed to create event. Please check your connection and try again.');
    }
  }
  return parseJsonResponse<Event & { checkout_url?: string; requires_payment?: boolean; payment_error?: string }>(res);
}

export async function fetchPendingPromoters(): Promise<Promoter[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/promoters/pending`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch pending promoters');
  return res.json();
}

export async function fetchPendingMembers(): Promise<MemberProfile[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/members/pending`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch pending members');
  return res.json();
}

export async function updateMemberVerificationStatus(
  memberId: number,
  verification_status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW',
  verification_notes?: string | null
): Promise<MemberProfile> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/members/${memberId}/verification`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ verification_status, verification_notes }),
  });
  if (!res.ok) throw new Error('Failed to update member verification');
  return res.json();
}

export async function updatePromoterStatus(
  promoterId: number,
  status: 'APPROVED' | 'REJECTED'
): Promise<Promoter> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/promoters/${promoterId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update promoter status');
  return res.json();
}

export async function fetchEvents(includeAll: boolean = true): Promise<Event[]> {
  const url = includeAll ? `${API_URL}/api/events?all=true` : `${API_URL}/api/events`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function fetchUpcomingEvents(): Promise<Event[]> {
  try {
    const res = await fetch(`${API_URL}/api/events/upcoming`, {
      cache: 'no-store', // Ensure fresh data on each request
    });
    if (!res.ok) {
      console.error(`Failed to fetch upcoming events: ${res.status} ${res.statusText}`);
      throw new Error('Failed to fetch upcoming events');
    }
    const data = await res.json();
    console.log(`fetchUpcomingEvents: Retrieved ${data.length} upcoming events`);
    return data;
  } catch (error) {
    console.error('Error in fetchUpcomingEvents:', error);
    throw error;
  }
}

export interface PromoterMetrics {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  potentialRevenueCents: number;
}

export async function getPromoterEvents(): Promise<Event[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/events/promoter/me`, {
    headers,
  });
  if (!res.ok) {
    try {
      const error = await parseJsonResponse<{ error?: string }>(res);
      throw new Error(error.error || 'Failed to fetch promoter events');
    } catch (err: any) {
      if (err.message && !err.message.includes('Unexpected token')) {
        throw err;
      }
      throw new Error('Failed to load your events. Please try again.');
    }
  }
  return parseJsonResponse<Event[]>(res);
}

export async function getPromoterMetrics(): Promise<PromoterMetrics> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/events/promoter/me/metrics`, {
    headers,
  });
  if (!res.ok) {
    try {
      const error = await parseJsonResponse<{ error?: string }>(res);
      throw new Error(error.error || 'Failed to fetch promoter metrics');
    } catch (err: any) {
      if (err.message && !err.message.includes('Unexpected token')) {
        throw err;
      }
      throw new Error('Failed to load event metrics. Please try again.');
    }
  }
  return parseJsonResponse<PromoterMetrics>(res);
}

export async function closeEvent(eventId: number): Promise<Event> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/events/${eventId}/close`, {
    method: 'PATCH',
    headers,
  });
  if (!res.ok) {
    try {
      const error = await parseJsonResponse<{ error?: string }>(res);
      throw new Error(error.error || 'Failed to close event');
    } catch (err: any) {
      if (err.message && !err.message.includes('Unexpected token')) {
        throw err;
      }
      throw new Error('Failed to close event. Please try again.');
    }
  }
  return parseJsonResponse<Event>(res);
}

export async function getPromoterProfile(): Promise<Promoter> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/promoters/me`, {
    headers,
  });
  if (!res.ok) {
    try {
      const error = await parseJsonResponse<{ error?: string }>(res);
      throw new Error(error.error || 'Failed to fetch promoter profile');
    } catch (err: any) {
      if (err.message && !err.message.includes('Unexpected token')) {
        throw err;
      }
      throw new Error('Failed to load your profile. Please try again.');
    }
  }
  return parseJsonResponse<Promoter>(res);
}

export async function fetchEvent(id: number): Promise<Event> {
  const res = await fetch(`${API_URL}/api/events/${id}`);
  if (!res.ok) {
    try {
      const error = await parseJsonResponse<{ error?: string }>(res);
      throw new Error(error.error || 'Failed to fetch event');
    } catch (err: any) {
      if (err.message && !err.message.includes('Unexpected token')) {
        throw err;
      }
      throw new Error('Failed to load event. Please try again.');
    }
  }
  return parseJsonResponse<Event>(res);
}

export interface MemberProfile {
  id: number;
  email: string;
  name: string | null;
  membership_number: string | null;
  initiated_chapter_id: number | null;
  chapter_name: string | null;
  initiated_season: string | null;
  initiated_year: number | null;
  ship_name: string | null;
  line_name: string | null;
  location: string | null;
  address: string | null;
  address_is_private: boolean;
  phone_number: string | null;
  phone_is_private: boolean;
  industry: string | null;
  profession_id: number | null;
  profession_name: string | null;
  job_title: string | null;
  bio: string | null;
  headshot_url: string | null;
  social_links: Record<string, string>;
  verification_status?: 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';
  created_at: string;
  updated_at: string;
  is_seller?: boolean;
  is_promoter?: boolean;
  is_steward?: boolean;
}

export async function fetchAllMembers(filters?: {
  location?: string;
  chapter_id?: number;
  industry?: string;
  profession_id?: number;
}): Promise<MemberProfile[]> {
  const session = await fetch('/api/auth/session').then(res => res.json());
  const idToken = (session as any)?.idToken;
  
  if (!idToken) {
    throw new Error('Not authenticated');
  }

  const params = new URLSearchParams();
  if (filters?.location) params.append('location', filters.location);
  if (filters?.chapter_id) params.append('chapter_id', filters.chapter_id.toString());
  if (filters?.industry) params.append('industry', filters.industry);
  if (filters?.profession_id) params.append('profession_id', filters.profession_id.toString());

  const res = await fetch(`${API_URL}/api/members?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch members');
  }
  
  return res.json();
}

export async function fetchMemberProfile(): Promise<MemberProfile> {
  const session = await fetch('/api/auth/session').then(res => res.json());
  const idToken = (session as any)?.idToken;
  
  if (!idToken) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${API_URL}/api/members/profile`, {
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
  });
  
  if (!res.ok) {
    if (res.status === 404) {
      const errorData = await res.json().catch(() => ({}));
      const error = new Error('Member profile not found');
      (error as any).requiresRegistration = errorData.requiresRegistration === true;
      (error as any).code = errorData.code;
      throw error;
    }
    throw new Error('Failed to fetch member profile');
  }
  
  return res.json();
}

export async function updateMemberProfile(
  data: Partial<MemberProfile> & { headshot?: File }
): Promise<MemberProfile> {
  const session = await fetch('/api/auth/session').then(res => res.json());
  const idToken = (session as any)?.idToken;
  
  if (!idToken) {
    throw new Error('Not authenticated');
  }

  const formData = new FormData();
  
  // Add all fields except headshot
  Object.keys(data).forEach((key) => {
    if (key !== 'headshot' && data[key as keyof typeof data] !== undefined) {
      const value = data[key as keyof typeof data];
      if (key === 'social_links' && typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'address_is_private' || key === 'phone_is_private') {
        formData.append(key, String(value));
      } else if (value !== null) {
        formData.append(key, String(value));
      }
    }
  });

  // Add headshot if provided
  if (data.headshot) {
    formData.append('headshot', data.headshot);
  }

  const res = await fetch(`${API_URL}/api/members/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
    body: formData,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to update profile' }));
    throw new Error(error.error || 'Failed to update member profile');
  }
  
  return res.json();
}

export interface MemberMetrics {
  totalClaims: number;
  totalDonationsCents: number;
  paidDonationsCents: number;
  totalPurchases: number;
  totalSpentCents: number;
  paidSpentCents: number;
}

export async function getMemberMetrics(): Promise<MemberMetrics> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/members/me/metrics`, {
    headers,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch member metrics');
  }
  return res.json();
}

export interface MemberActivity {
  claims: Array<{
    id: number;
    type: 'claim';
    listing_id: number;
    name: string;
    amount_cents: number;
    status: string;
    created_at: string;
    chapter_name: string;
  }>;
  purchases: Array<{
    id: number;
    type: 'purchase';
    product_id: number;
    name: string;
    amount_cents: number;
    status: string;
    created_at: string;
    seller_name: string;
  }>;
}

export async function getMemberActivity(): Promise<MemberActivity> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/members/me/activity`, {
    headers,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch member activity');
  }
  return res.json();
}

export interface SellerWithProducts extends Seller {
  product_count: number;
  products: Product[];
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
    const res = await fetch(`${API_URL}/api/sellers/featured`, {
      cache: 'no-store', // Ensure fresh data on each request
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(`Failed to fetch featured brothers: ${res.status} ${res.statusText}`, errorData);
      throw new Error(errorData.error || errorData.details || 'Failed to fetch featured brothers');
    }
    const data = await res.json();
    console.log(`fetchFeaturedBrothers: Retrieved ${data.length} featured brothers`);
    return data;
  } catch (error) {
    console.error('Error in fetchFeaturedBrothers:', error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
}

export async function getSellerWithProducts(sellerId: number): Promise<SellerWithProducts | null> {
  const res = await fetch(`${API_URL}/api/sellers/${sellerId}/products`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch seller with products');
  }
  return res.json();
}

export async function fetchSellersWithProducts(): Promise<SellerWithProducts[]> {
  const res = await fetch(`${API_URL}/api/sellers/collections`);
  if (!res.ok) throw new Error('Failed to fetch sellers');
  return res.json();
}

// Social/Connect API functions
export interface Post {
  id: number;
  author_id: number;
  author_name: string;
  author_avatar?: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  created_at: string;
  hashtags?: string[];
}

export async function fetchPosts(): Promise<Post[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/connect/posts`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function createPost(content: string, imageUrl?: string): Promise<Post> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/connect/posts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content, image_url: imageUrl }),
  });
  if (!res.ok) throw new Error('Failed to create post');
  return res.json();
}

export async function likePost(postId: number): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/connect/posts/${postId}/like`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) throw new Error('Failed to like post');
}

export async function unlikePost(postId: number): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/connect/posts/${postId}/like`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to unlike post');
}

// Steward API functions
export interface Steward {
  id: number;
  fraternity_member_id: number;
  sponsoring_chapter_id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verification_status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';
  verification_date: string | null;
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
  member?: MemberProfile;
  chapter?: Chapter;
}

export interface StewardListingImage {
  id: number;
  image_url: string;
  display_order: number;
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
  claimed_by_fraternity_member_id: number | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
  steward?: Steward;
  chapter?: Chapter;
  images?: StewardListingImage[];
}

export async function applyToBecomeSteward(sponsoringChapterId: number): Promise<Steward> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/stewards/apply`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sponsoring_chapter_id: sponsoringChapterId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to apply to become a steward');
  }
  return res.json();
}

export async function getStewardProfile(): Promise<Steward> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/stewards/profile`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch steward profile');
  return res.json();
}

export async function createStewardListing(formData: FormData): Promise<StewardListing> {
  const session = await fetch('/api/auth/session').then(res => res.json());
  const idToken = (session as any)?.idToken;
  
  if (!idToken) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${API_URL}/api/stewards/listings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create steward listing');
  }
  return res.json();
}

export async function getStewardListings(): Promise<StewardListing[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/stewards/listings`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch steward listings');
  return res.json();
}

export async function getStewardListing(id: number): Promise<StewardListing> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/stewards/listings/${id}`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch steward listing');
  return res.json();
}

export async function getStewardMarketplace(): Promise<StewardListing[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/stewards/marketplace`, {
    headers,
  });
  if (!res.ok) {
    const error = await res.json();
    if (error.code === 'VERIFICATION_REQUIRED') {
      throw new Error('VERIFICATION_REQUIRED');
    }
    throw new Error(error.error || 'Failed to fetch steward marketplace');
  }
  return res.json();
}

export async function getStewardMarketplacePublic(): Promise<StewardListing[]> {
  const res = await fetch(`${API_URL}/api/stewards/marketplace/public`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch steward marketplace');
  }
  return res.json();
}

export async function getStewardListingPublic(id: number): Promise<StewardListing> {
  const res = await fetch(`${API_URL}/api/stewards/listings/${id}/public`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch steward listing');
  }
  return res.json();
}

export async function claimStewardListing(listingId: number): Promise<{ success: boolean; listing: StewardListing }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/stewards/listings/${listingId}/claim`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to claim steward listing');
  }
  return res.json();
}

export async function createStewardCheckoutSession(listingId: number): Promise<{ sessionId: string; url: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/steward-checkout/${listingId}`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }
  return res.json();
}

export async function updateStewardListing(
  listingId: number,
  formData: FormData
): Promise<StewardListing> {
  const session = await fetch('/api/auth/session').then(res => res.json());
  const idToken = (session as any)?.idToken;
  
  if (!idToken) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${API_URL}/api/stewards/listings/${listingId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update steward listing');
  }
  return res.json();
}

export async function deleteStewardListing(listingId: number): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/stewards/listings/${listingId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete steward listing');
  }
}

export interface StewardClaim {
  id: number;
  listing_id: number;
  listing_name: string;
  claimant_fraternity_member_id: number;
  claimant_email: string | null;
  stripe_session_id: string | null;
  total_amount_cents: number;
  shipping_cents: number;
  platform_fee_cents: number;
  chapter_donation_cents: number;
  status: 'PENDING' | 'PAID' | 'FAILED';
  created_at: string;
  updated_at: string;
}

export interface StewardMetrics {
  totalListings: number;
  activeListings: number;
  totalClaims: number;
  totalDonationsCents: number;
}

export async function getStewardMetrics(): Promise<StewardMetrics> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/stewards/me/metrics`, {
    headers,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch steward metrics');
  }
  return res.json();
}

export async function getStewardClaims(): Promise<StewardClaim[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/stewards/me/claims`, {
    headers,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch steward claims');
  }
  return res.json();
}

// Seller dashboard functions
export async function getSellerProfile(): Promise<Seller> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/sellers/me`, {
    headers,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch seller profile');
  }
  return res.json();
}

export async function getSellerProducts(): Promise<Product[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/sellers/me/products`, {
    headers,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch seller products');
  }
  return res.json();
}

export interface SellerOrder {
  id: number;
  product_id: number;
  product_name: string;
  price_cents: number;
  buyer_email: string;
  amount_cents: number;
  status: 'PENDING' | 'PAID' | 'FAILED';
  stripe_session_id: string | null;
  chapter_id: number | null;
  chapter_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface SellerMetrics {
  totalSalesCents: number;
  orderCount: number;
  activeListings: number;
  totalPayoutsCents: number;
  totalUndergradDonationsCents: number;
}

export async function getSellerOrders(): Promise<SellerOrder[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/sellers/me/orders`, {
    headers,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch seller orders');
  }
  return res.json();
}

export async function getSellerMetrics(): Promise<SellerMetrics> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/sellers/me/metrics`, {
    headers,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch seller metrics');
  }
  return res.json();
}

export interface StripeAccountStatus {
  connected: boolean;
  accountId: string | null;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements?: {
    currently_due?: string[];
    eventually_due?: string[];
    past_due?: string[];
    pending_verification?: string[];
  } | null;
}

export async function initiateStripeOnboarding(): Promise<{ url: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/sellers/me/stripe/onboard`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to initiate Stripe onboarding');
  }
  return res.json();
}

export async function getStripeAccountStatus(): Promise<StripeAccountStatus> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/sellers/me/stripe/status`, {
    headers,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch Stripe status');
  }
  return res.json();
}

export async function syncStripeBusinessDetails(): Promise<{
  success: boolean;
  seller: Seller;
  syncedFields: string[];
  businessDetails: {
    businessName: string | null;
    businessEmail: string | null;
    website: string | null;
    taxId: string | null;
    businessPhone: string | null;
    accountType: 'company' | 'individual' | null;
    businessAddress: {
      line1: string | null;
      line2: string | null;
      city: string | null;
      state: string | null;
      postal_code: string | null;
      country: string | null;
    };
  };
}> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/sellers/me/stripe/sync-business`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to sync business details from Stripe');
  }
  return res.json();
}

// Admin steward functions
export async function fetchPendingStewards(): Promise<Steward[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/stewards/pending`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch pending stewards');
  return res.json();
}

export async function updateStewardStatus(
  stewardId: number,
  status: 'APPROVED' | 'REJECTED'
): Promise<Steward> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/stewards/${stewardId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update steward status');
  return res.json();
}

export async function fetchStewardActivity(): Promise<Array<{
  steward_id: number;
  steward_name: string;
  total_listings: number;
  active_listings: number;
  claimed_listings: number;
  total_donations_cents: number;
}>> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/stewards/activity`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch steward activity');
  return res.json();
}

export async function fetchStewardDonations(): Promise<Array<{
  chapter_id: number;
  chapter_name: string;
  total_donations_cents: number;
  claim_count: number;
}>> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/stewards/donations`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch steward donations');
  return res.json();
}

export interface PlatformSetting {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
  updated_at: string;
}

export async function fetchPlatformSettings(): Promise<PlatformSetting[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/platform-settings`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch platform settings');
  return res.json();
}

export async function updatePlatformSetting(
  key: string,
  value: string,
  description?: string | null
): Promise<PlatformSetting> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/platform-settings/${key}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ value, description }),
  });
  if (!res.ok) throw new Error('Failed to update platform setting');
  return res.json();
}

