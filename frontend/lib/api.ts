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

export interface Product {
  id: number;
  seller_id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url: string | null;
  sponsored_chapter_id: number | null;
  seller_name?: string;
}

export interface Seller {
  id: number;
  email: string;
  name: string;
  member_id?: number | null;
  sponsoring_chapter_id: number;
  business_name: string | null;
  vendor_license_number: string;
  headshot_url: string | null;
  store_logo_url: string;
  social_links: Record<string, string>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
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
  ticket_price_cents: number;
  max_attendees: number | null;
  promoter_name?: string;
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

export async function fetchProduct(id: number): Promise<Product> {
  const res = await fetch(`${API_URL}/api/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

export async function createCheckoutSession(productId: number, buyerEmail: string): Promise<{ sessionId: string; url: string }> {
  const res = await fetch(`${API_URL}/api/checkout/${productId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ buyer_email: buyerEmail }),
  });
  if (!res.ok) throw new Error('Failed to create checkout session');
  return res.json();
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

async function getAuthHeaders(): Promise<HeadersInit> {
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

export async function fetchPendingPromoters(): Promise<Promoter[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/promoters/pending`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch pending promoters');
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

export async function fetchEvent(id: number): Promise<Event> {
  const res = await fetch(`${API_URL}/api/events/${id}`);
  if (!res.ok) throw new Error('Failed to fetch event');
  return res.json();
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
  job_title: string | null;
  bio: string | null;
  headshot_url: string | null;
  social_links: Record<string, string>;
  created_at: string;
  updated_at: string;
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
      throw new Error('Member profile not found');
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

export interface SellerWithProducts extends Seller {
  product_count: number;
  products: Product[];
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

