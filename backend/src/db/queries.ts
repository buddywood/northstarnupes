import pool from './connection';
import { Chapter, Seller, Product, ProductCategory, CategoryAttributeDefinition, ProductAttributeValue, Order, Promoter, Event, User, Steward, StewardListing, StewardClaim, PlatformSetting } from '../types';

export interface Industry {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Chapter queries
export async function getAllChapters(): Promise<Chapter[]> {
  const result = await pool.query('SELECT * FROM chapters ORDER BY name');
  return result.rows;
}

export async function getChapterById(id: number): Promise<Chapter | null> {
  const result = await pool.query('SELECT * FROM chapters WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getActiveCollegiateChapters(): Promise<Chapter[]> {
  const result = await pool.query(
    'SELECT * FROM chapters WHERE type = $1 AND status = $2 ORDER BY name',
    ['Collegiate', 'Active']
  );
  return result.rows;
}

export async function createChapter(chapter: {
  name: string;
  type: string;
  status?: string | null;
  chartered?: number | null;
  province?: string | null;
  city?: string | null;
  state?: string | null;
  contact_email?: string | null;
}): Promise<Chapter> {
  const result = await pool.query(
    `INSERT INTO chapters (name, type, status, chartered, province, city, state, contact_email)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      chapter.name,
      chapter.type,
      chapter.status || null,
      chapter.chartered || null,
      chapter.province || null,
      chapter.city || null,
      chapter.state || null,
      chapter.contact_email || null,
    ]
  );
  return result.rows[0];
}

// Seller queries
export async function createSeller(seller: {
  email: string;
  name: string;
  member_id?: number | null;
  sponsoring_chapter_id: number;
  business_name?: string | null;
  business_email?: string | null;
  vendor_license_number?: string | null;
  merchandise_type?: 'KAPPA' | 'NON_KAPPA' | null;
  website?: string | null;
  headshot_url?: string;
  store_logo_url?: string;
  social_links?: Record<string, string>;
}): Promise<Seller> {
  const result = await pool.query(
    `INSERT INTO sellers (email, name, member_id, sponsoring_chapter_id, business_name, business_email, vendor_license_number, merchandise_type, website, headshot_url, store_logo_url, social_links, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDING')
     RETURNING *`,
    [
      seller.email,
      seller.name,
      seller.member_id || null,
      seller.sponsoring_chapter_id,
      seller.business_name || null,
      seller.business_email || null,
      seller.vendor_license_number || null,
      seller.merchandise_type || null,
      seller.website || null,
      seller.headshot_url || null,
      seller.store_logo_url || null,
      JSON.stringify(seller.social_links || {}),
    ]
  );
  return result.rows[0];
}

export async function getSellerById(id: number): Promise<Seller | null> {
  const result = await pool.query('SELECT * FROM sellers WHERE id = $1', [id]);
  if (result.rows[0]) {
    result.rows[0].social_links = typeof result.rows[0].social_links === 'string' 
      ? JSON.parse(result.rows[0].social_links) 
      : result.rows[0].social_links;
  }
  return result.rows[0] || null;
}

export async function getSellerByEmail(email: string): Promise<Seller | null> {
  const result = await pool.query('SELECT * FROM sellers WHERE email = $1', [email]);
  if (result.rows[0]) {
    result.rows[0].social_links = typeof result.rows[0].social_links === 'string' 
      ? JSON.parse(result.rows[0].social_links) 
      : result.rows[0].social_links;
  }
  return result.rows[0] || null;
}

export async function getPendingSellers(): Promise<Seller[]> {
  const result = await pool.query(
    'SELECT * FROM sellers WHERE status = $1 ORDER BY created_at DESC',
    ['PENDING']
  );
  return result.rows.map(row => ({
    ...row,
    social_links: typeof row.social_links === 'string' ? JSON.parse(row.social_links) : row.social_links,
  }));
}

export async function updateSellerStatus(
  id: number,
  status: 'PENDING' | 'APPROVED' | 'REJECTED',
  stripe_account_id?: string
): Promise<Seller> {
  const updates: string[] = ['status = $2'];
  const values: any[] = [id, status];
  
  if (stripe_account_id) {
    updates.push('stripe_account_id = $3');
    values.push(stripe_account_id);
  }
  
  const result = await pool.query(
    `UPDATE sellers SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );
  if (result.rows[0]) {
    result.rows[0].social_links = typeof result.rows[0].social_links === 'string' 
      ? JSON.parse(result.rows[0].social_links) 
      : result.rows[0].social_links;
  }
  return result.rows[0];
}

export async function updateSellerInvitationToken(
  sellerId: number,
  invitationToken: string | null
): Promise<void> {
  await pool.query(
    'UPDATE sellers SET invitation_token = $1 WHERE id = $2',
    [invitationToken, sellerId]
  );
}

export async function getSellerByInvitationToken(
  invitationToken: string
): Promise<Seller | null> {
  const result = await pool.query(
    'SELECT * FROM sellers WHERE invitation_token = $1 AND status = $2',
    [invitationToken, 'APPROVED']
  );
  if (result.rows[0]) {
    result.rows[0].social_links = typeof result.rows[0].social_links === 'string' 
      ? JSON.parse(result.rows[0].social_links) 
      : result.rows[0].social_links;
  }
  return result.rows[0] || null;
}

// Product queries
export async function createProduct(product: {
  seller_id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url?: string;
  category_id?: number | null;
  is_kappa_branded?: boolean;
}): Promise<Product> {
  const result = await pool.query(
    `INSERT INTO products (seller_id, name, description, price_cents, image_url, category_id, is_kappa_branded)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      product.seller_id,
      product.name,
      product.description,
      product.price_cents,
      product.image_url || null,
      product.category_id || null,
      product.is_kappa_branded ?? false,
    ]
  );
  return result.rows[0];
}

export async function getProductById(id: number): Promise<Product | null> {
  const result = await pool.query(
    `SELECT p.*, 
            s.name as seller_name, 
            s.business_name as seller_business_name,
            s.status as seller_status, 
            s.member_id as seller_member_id, 
            s.sponsoring_chapter_id as seller_sponsoring_chapter_id,
            m.initiated_chapter_id as seller_initiated_chapter_id
     FROM products p
     JOIN sellers s ON p.seller_id = s.id
     LEFT JOIN members m ON s.member_id = m.id
     WHERE p.id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const product = result.rows[0];
  // Load attributes for the product
  const attributes = await getProductAttributeValues(id);
  return { ...product, attributes };
}

export async function getActiveProducts(): Promise<Product[]> {
  const result = await pool.query(
    `SELECT p.*, s.name as seller_name, s.business_name as seller_business_name, s.status as seller_status, s.member_id as seller_member_id, s.sponsoring_chapter_id as seller_sponsoring_chapter_id
     FROM products p
     JOIN sellers s ON p.seller_id = s.id
     WHERE s.status = 'APPROVED'
     ORDER BY p.created_at DESC`
  );
  
  // Load attributes for all products
  const productsWithAttributes = await Promise.all(
    result.rows.map(async (product) => {
      const attributes = await getProductAttributeValues(product.id);
      return { ...product, attributes };
    })
  );
  
  return productsWithAttributes;
}

export async function getProductsBySeller(sellerId: number): Promise<Product[]> {
  const result = await pool.query(
    `SELECT p.*, s.name as seller_name, s.business_name as seller_business_name, s.status as seller_status, s.member_id as seller_member_id, s.sponsoring_chapter_id as seller_sponsoring_chapter_id
     FROM products p
     JOIN sellers s ON p.seller_id = s.id
     WHERE p.seller_id = $1
     ORDER BY p.created_at DESC`,
    [sellerId]
  );
  
  // Load attributes for all products
  const productsWithAttributes = await Promise.all(
    result.rows.map(async (product) => {
      const attributes = await getProductAttributeValues(product.id);
      return { ...product, attributes };
    })
  );
  
  return productsWithAttributes;
}

export async function updateProduct(
  id: number,
  updates: {
    name?: string;
    description?: string;
    price_cents?: number;
    image_url?: string;
    category_id?: number | null;
  }
): Promise<Product | null> {
  const fields: string[] = [];
  const values: any[] = [id];
  let paramIndex = 2;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.price_cents !== undefined) {
    fields.push(`price_cents = $${paramIndex++}`);
    values.push(updates.price_cents);
  }
  if (updates.image_url !== undefined) {
    fields.push(`image_url = $${paramIndex++}`);
    values.push(updates.image_url);
  }
  if (updates.category_id !== undefined) {
    fields.push(`category_id = $${paramIndex++}`);
    values.push(updates.category_id || null);
  }

  if (fields.length === 0) {
    return getProductById(id);
  }

  const query = `
    UPDATE products
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

// Product Category queries
export async function getAllProductCategories(): Promise<ProductCategory[]> {
  const result = await pool.query(
    'SELECT * FROM product_categories ORDER BY display_order ASC, name ASC'
  );
  return result.rows;
}

export async function getProductCategoryById(id: number): Promise<ProductCategory | null> {
  const result = await pool.query('SELECT * FROM product_categories WHERE id = $1', [id]);
  return result.rows[0] || null;
}

// Category Attribute Definition queries
export async function getCategoryAttributeDefinitions(categoryId: number): Promise<CategoryAttributeDefinition[]> {
  const result = await pool.query(
    'SELECT * FROM category_attribute_definitions WHERE category_id = $1 ORDER BY display_order ASC',
    [categoryId]
  );
  return result.rows;
}

export async function getCategoryAttributeDefinitionById(id: number): Promise<CategoryAttributeDefinition | null> {
  const result = await pool.query('SELECT * FROM category_attribute_definitions WHERE id = $1', [id]);
  return result.rows[0] || null;
}

// Product Attribute Value queries
export async function getProductAttributeValues(productId: number): Promise<ProductAttributeValue[]> {
  const result = await pool.query(
    'SELECT * FROM product_attribute_values WHERE product_id = $1',
    [productId]
  );
  return result.rows;
}

export async function setProductAttributeValue(
  productId: number,
  attributeDefinitionId: number,
  value: { text?: string; number?: number; boolean?: boolean }
): Promise<ProductAttributeValue> {
  const result = await pool.query(
    `INSERT INTO product_attribute_values (product_id, attribute_definition_id, value_text, value_number, value_boolean)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (product_id, attribute_definition_id)
     DO UPDATE SET value_text = EXCLUDED.value_text, value_number = EXCLUDED.value_number, value_boolean = EXCLUDED.value_boolean
     RETURNING *`,
    [productId, attributeDefinitionId, value.text || null, value.number || null, value.boolean ?? null]
  );
  return result.rows[0];
}

export async function deleteProductAttributeValue(productId: number, attributeDefinitionId: number): Promise<void> {
  await pool.query(
    'DELETE FROM product_attribute_values WHERE product_id = $1 AND attribute_definition_id = $2',
    [productId, attributeDefinitionId]
  );
}

// Order queries
export async function createOrder(order: {
  product_id: number;
  buyer_email: string;
  amount_cents: number;
  stripe_session_id: string;
  chapter_id?: number;
}): Promise<Order> {
  const result = await pool.query(
    `INSERT INTO orders (product_id, buyer_email, amount_cents, stripe_session_id, chapter_id, status)
     VALUES ($1, $2, $3, $4, $5, 'PENDING')
     RETURNING *`,
    [
      order.product_id,
      order.buyer_email,
      order.amount_cents,
      order.stripe_session_id,
      order.chapter_id || null,
    ]
  );
  return result.rows[0];
}

export async function getOrderByStripeSessionId(stripeSessionId: string): Promise<Order | null> {
  const result = await pool.query(
    'SELECT * FROM orders WHERE stripe_session_id = $1',
    [stripeSessionId]
  );
  return result.rows[0] || null;
}

export async function updateOrderStatus(
  id: number,
  status: 'PENDING' | 'PAID' | 'FAILED'
): Promise<Order> {
  const result = await pool.query(
    'UPDATE orders SET status = $2 WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0];
}

export async function getAllOrders(): Promise<Order[]> {
  const result = await pool.query(
    `SELECT o.*, p.name as product_name, s.name as seller_name, c.name as chapter_name
     FROM orders o
     JOIN products p ON o.product_id = p.id
     JOIN sellers s ON p.seller_id = s.id
     LEFT JOIN chapters c ON o.chapter_id = c.id
     ORDER BY o.created_at DESC`
  );
  return result.rows;
}

export async function getChapterDonations(): Promise<Array<{ chapter_id: number; chapter_name: string; total_donations_cents: number }>> {
  const result = await pool.query(
    `SELECT 
       o.chapter_id,
       c.name as chapter_name,
       SUM(o.amount_cents * 0.03) as total_donations_cents
     FROM orders o
     LEFT JOIN chapters c ON o.chapter_id = c.id
     WHERE o.status = 'PAID' AND o.chapter_id IS NOT NULL
     GROUP BY o.chapter_id, c.name
     ORDER BY total_donations_cents DESC`
  );
  return result.rows;
}

export async function getTotalDonations(): Promise<number> {
  const result = await pool.query(
    `SELECT SUM(o.amount_cents * 0.03) as total_donations_cents
     FROM orders o
     WHERE o.status = 'PAID' AND o.chapter_id IS NOT NULL`
  );
  return result.rows[0]?.total_donations_cents || 0;
}

// Promoter queries
export async function createPromoter(promoter: {
  email: string;
  name: string;
  member_id?: number | null;
  sponsoring_chapter_id?: number;
  headshot_url?: string;
  social_links?: Record<string, string>;
}): Promise<Promoter> {
  const result = await pool.query(
    `INSERT INTO promoters (email, name, member_id, sponsoring_chapter_id, headshot_url, social_links, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
     RETURNING *`,
    [
      promoter.email,
      promoter.name,
      promoter.member_id || null,
      promoter.sponsoring_chapter_id || null,
      promoter.headshot_url || null,
      JSON.stringify(promoter.social_links || {}),
    ]
  );
  if (result.rows[0]) {
    result.rows[0].social_links = typeof result.rows[0].social_links === 'string' 
      ? JSON.parse(result.rows[0].social_links) 
      : result.rows[0].social_links;
  }
  return result.rows[0];
}

export async function getPromoterById(id: number): Promise<Promoter | null> {
  const result = await pool.query('SELECT * FROM promoters WHERE id = $1', [id]);
  if (result.rows[0]) {
    result.rows[0].social_links = typeof result.rows[0].social_links === 'string' 
      ? JSON.parse(result.rows[0].social_links) 
      : result.rows[0].social_links;
  }
  return result.rows[0] || null;
}

export async function getPromoterByEmail(email: string): Promise<Promoter | null> {
  const result = await pool.query('SELECT * FROM promoters WHERE email = $1', [email]);
  if (result.rows[0]) {
    result.rows[0].social_links = typeof result.rows[0].social_links === 'string' 
      ? JSON.parse(result.rows[0].social_links) 
      : result.rows[0].social_links;
  }
  return result.rows[0] || null;
}

export async function getPendingPromoters(): Promise<Promoter[]> {
  const result = await pool.query(
    'SELECT * FROM promoters WHERE status = $1 ORDER BY created_at DESC',
    ['PENDING']
  );
  return result.rows.map(row => ({
    ...row,
    social_links: typeof row.social_links === 'string' ? JSON.parse(row.social_links) : row.social_links,
  }));
}

export async function updatePromoterStatus(
  id: number,
  status: 'PENDING' | 'APPROVED' | 'REJECTED',
  stripe_account_id?: string
): Promise<Promoter> {
  const updates: string[] = ['status = $2'];
  const values: any[] = [id, status];
  
  if (stripe_account_id) {
    updates.push('stripe_account_id = $3');
    values.push(stripe_account_id);
  }
  
  const result = await pool.query(
    `UPDATE promoters SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );
  if (result.rows[0]) {
    result.rows[0].social_links = typeof result.rows[0].social_links === 'string' 
      ? JSON.parse(result.rows[0].social_links) 
      : result.rows[0].social_links;
  }
  return result.rows[0];
}

// Event queries
export async function createEvent(event: {
  promoter_id: number;
  title: string;
  description?: string;
  event_date: Date;
  location: string;
  city?: string;
  state?: string;
  image_url?: string;
  sponsored_chapter_id?: number;
  ticket_price_cents?: number;
  max_attendees?: number;
}): Promise<Event> {
  const result = await pool.query(
    `INSERT INTO events (promoter_id, title, description, event_date, location, city, state, image_url, sponsored_chapter_id, ticket_price_cents, max_attendees)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      event.promoter_id,
      event.title,
      event.description || null,
      event.event_date,
      event.location,
      event.city || null,
      event.state || null,
      event.image_url || null,
      event.sponsored_chapter_id || null,
      event.ticket_price_cents || 0,
      event.max_attendees || null,
    ]
  );
  return result.rows[0];
}

export async function getEventById(id: number): Promise<Event | null> {
  const result = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getActiveEvents(): Promise<Event[]> {
  const result = await pool.query(
    `SELECT e.*, p.name as promoter_name, p.status as promoter_status
     FROM events e
     JOIN promoters p ON e.promoter_id = p.id
     WHERE p.status = 'APPROVED' AND e.event_date >= NOW()
     ORDER BY e.event_date ASC`
  );
  return result.rows;
}

export async function getAllEvents(): Promise<Event[]> {
  const result = await pool.query(
    `SELECT e.*, p.name as promoter_name, p.status as promoter_status
     FROM events e
     JOIN promoters p ON e.promoter_id = p.id
     WHERE p.status = 'APPROVED'
     ORDER BY e.event_date ASC`
  );
  return result.rows;
}

export async function getEventsByPromoter(promoterId: number): Promise<Event[]> {
  const result = await pool.query(
    'SELECT * FROM events WHERE promoter_id = $1 ORDER BY event_date DESC',
    [promoterId]
  );
  return result.rows;
}

// User queries
export async function createUser(user: {
  cognito_sub: string;
  email: string;
  role: 'ADMIN' | 'SELLER' | 'PROMOTER' | 'CONSUMER';
  onboarding_status?: 'PRE_COGNITO' | 'COGNITO_CONFIRMED' | 'ONBOARDING_STARTED' | 'ONBOARDING_FINISHED';
  member_id?: number | null;
  seller_id?: number | null;
  promoter_id?: number | null;
  features?: Record<string, any>;
}): Promise<User> {
  // Ensure onboarding_status is set properly for CONSUMER role with null member_id
  const onboardingStatus = user.onboarding_status || 
    (user.role === 'CONSUMER' && !user.member_id ? 'COGNITO_CONFIRMED' : 'COGNITO_CONFIRMED');
  
  const result = await pool.query(
    `INSERT INTO users (cognito_sub, email, role, onboarding_status, member_id, seller_id, promoter_id, features)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      user.cognito_sub,
      user.email,
      user.role,
      onboardingStatus,
      user.member_id || null,
      user.seller_id || null,
      user.promoter_id || null,
      JSON.stringify(user.features || {}),
    ]
  );
  const row = result.rows[0];
  if (row.features && typeof row.features === 'string') {
    row.features = JSON.parse(row.features);
  }
  return row;
}

export async function getUserByCognitoSub(cognitoSub: string): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE cognito_sub = $1', [cognitoSub]);
  if (result.rows[0]) {
    const row = result.rows[0];
    if (row.features && typeof row.features === 'string') {
      row.features = JSON.parse(row.features);
    }
    return row;
  }
  return null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const row = result.rows[0];
  if (row && row.features && typeof row.features === 'string') {
    row.features = JSON.parse(row.features);
  }
  return row || null;
}

export async function getUserById(id: number): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  if (result.rows[0]) {
    const row = result.rows[0];
    if (row.features && typeof row.features === 'string') {
      row.features = JSON.parse(row.features);
    }
    return row;
  }
  return null;
}

export async function updateUserRole(
  id: number,
  role: 'ADMIN' | 'SELLER' | 'PROMOTER' | 'CONSUMER'
): Promise<User> {
  const result = await pool.query(
    'UPDATE users SET role = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
    [id, role]
  );
  const row = result.rows[0];
  if (row.features && typeof row.features === 'string') {
    row.features = JSON.parse(row.features);
  }
  return row;
}

export async function linkUserToMember(userId: number, memberId: number): Promise<User> {
  const result = await pool.query(
    `UPDATE users 
     SET member_id = $2, seller_id = NULL, promoter_id = NULL, role = 'CONSUMER', updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [userId, memberId]
  );
  const row = result.rows[0];
  if (row.features && typeof row.features === 'string') {
    row.features = JSON.parse(row.features);
  }
  return row;
}

export async function linkUserToSeller(userId: number, sellerId: number): Promise<User> {
  const result = await pool.query(
    `UPDATE users 
     SET seller_id = $2, member_id = NULL, promoter_id = NULL, role = 'SELLER', updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [userId, sellerId]
  );
  const row = result.rows[0];
  if (row.features && typeof row.features === 'string') {
    row.features = JSON.parse(row.features);
  }
  return row;
}

export async function linkUserToPromoter(userId: number, promoterId: number): Promise<User> {
  const result = await pool.query(
    `UPDATE users 
     SET promoter_id = $2, member_id = NULL, seller_id = NULL, role = 'PROMOTER', updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [userId, promoterId]
  );
  const row = result.rows[0];
  if (row.features && typeof row.features === 'string') {
    row.features = JSON.parse(row.features);
  }
  return row;
}

export async function linkUserToSteward(userId: number, stewardId: number): Promise<User> {
  // For stewards, we keep member_id (required) and can coexist with seller/promoter
  // Get current user to preserve member_id
  const currentUser = await pool.query('SELECT member_id, seller_id, promoter_id FROM users WHERE id = $1', [userId]);
  const memberId = currentUser.rows[0]?.member_id;
  
  if (!memberId) {
    throw new Error('User must have a member_id to become a steward');
  }

  const result = await pool.query(
    `UPDATE users 
     SET steward_id = $2, role = 'STEWARD', updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [userId, stewardId]
  );
  const row = result.rows[0];
  if (row.features && typeof row.features === 'string') {
    row.features = JSON.parse(row.features);
  }
  return row;
}

export async function updateUserOnboardingStatus(
  id: number,
  onboarding_status: 'PRE_COGNITO' | 'COGNITO_CONFIRMED' | 'ONBOARDING_STARTED' | 'ONBOARDING_FINISHED'
): Promise<User> {
  const result = await pool.query(
    `UPDATE users 
     SET onboarding_status = $2, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [id, onboarding_status]
  );
  const row = result.rows[0];
  if (row.features && typeof row.features === 'string') {
    row.features = JSON.parse(row.features);
  }
  return row;
}

export async function updateUserOnboardingStatusByCognitoSub(
  cognito_sub: string,
  onboarding_status: 'PRE_COGNITO' | 'COGNITO_CONFIRMED' | 'ONBOARDING_STARTED' | 'ONBOARDING_FINISHED'
): Promise<User | null> {
  const result = await pool.query(
    `UPDATE users 
     SET onboarding_status = $2, updated_at = CURRENT_TIMESTAMP 
     WHERE cognito_sub = $1 
     RETURNING *`,
    [cognito_sub, onboarding_status]
  );
  if (result.rows.length === 0) {
    return null;
  }
  const row = result.rows[0];
  if (row.features && typeof row.features === 'string') {
    row.features = JSON.parse(row.features);
  }
  return row;
}

export async function updateUserLastLogin(cognitoSub: string): Promise<User | null> {
  const result = await pool.query(
    `UPDATE users 
     SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
     WHERE cognito_sub = $1 
     RETURNING *`,
    [cognitoSub]
  );
  if (result.rows.length === 0) {
    return null;
  }
  const row = result.rows[0];
  if (row.features && typeof row.features === 'string') {
    row.features = JSON.parse(row.features);
  }
  return row;
}

export async function upsertUserOnLogin(cognitoSub: string, email: string): Promise<User> {
  // First try to update existing user
  const updateResult = await pool.query(
    `UPDATE users 
     SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, email = $2
     WHERE cognito_sub = $1 
     RETURNING *`,
    [cognitoSub, email]
  );
  
  if (updateResult.rows.length > 0) {
    const row = updateResult.rows[0];
    if (row.features && typeof row.features === 'string') {
      row.features = JSON.parse(row.features);
    }
    return row;
  }
  
  // If no user exists, create one
  const insertResult = await pool.query(
    `INSERT INTO users (cognito_sub, email, role, onboarding_status, last_login)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
     RETURNING *`,
    [cognitoSub, email, 'CONSUMER', 'COGNITO_CONFIRMED']
  );
  
  const row = insertResult.rows[0];
  if (row.features && typeof row.features === 'string') {
    row.features = JSON.parse(row.features);
  }
  return row;
}

export async function updateUserFeatures(
  id: number,
  features: Record<string, any>
): Promise<User> {
  const result = await pool.query(
    'UPDATE users SET features = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
    [id, JSON.stringify(features)]
  );
  const row = result.rows[0];
  if (row.features && typeof row.features === 'string') {
    row.features = JSON.parse(row.features);
  }
  return row;
}

// Member verification queries
export async function getPendingMembersForVerification(): Promise<any[]> {
  const result = await pool.query(
    `SELECT * FROM members 
     WHERE registration_status = 'COMPLETE' 
     AND (verification_status IS NULL OR verification_status = 'PENDING')
     AND name IS NOT NULL 
     AND membership_number IS NOT NULL
     ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function getPendingSellersForVerification(): Promise<Seller[]> {
  const result = await pool.query(
    `SELECT * FROM sellers 
     WHERE status = 'PENDING' 
     AND (verification_status IS NULL OR verification_status = 'PENDING')
     ORDER BY created_at DESC`
  );
  return result.rows.map(row => ({
    ...row,
    social_links: typeof row.social_links === 'string' ? JSON.parse(row.social_links) : row.social_links,
  }));
}

export async function getPendingPromotersForVerification(): Promise<Promoter[]> {
  const result = await pool.query(
    `SELECT * FROM promoters 
     WHERE status = 'PENDING' 
     AND (verification_status IS NULL OR verification_status = 'PENDING')
     ORDER BY created_at DESC`
  );
  return result.rows.map(row => ({
    ...row,
    social_links: typeof row.social_links === 'string' ? JSON.parse(row.social_links) : row.social_links,
  }));
}

export async function updateMemberVerification(
  id: number,
  verification_status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW',
  verification_notes?: string | null
): Promise<any> {
  const result = await pool.query(
    `UPDATE members 
     SET verification_status = $2, 
         verification_date = CURRENT_TIMESTAMP,
         verification_notes = $3,
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [id, verification_status, verification_notes || null]
  );
  return result.rows[0];
}

export async function updateSellerVerification(
  id: number,
  verification_status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW',
  verification_notes?: string | null,
  autoApprove?: boolean
): Promise<Seller> {
  const updates: string[] = [
    'verification_status = $2',
    'verification_date = CURRENT_TIMESTAMP',
    'verification_notes = $3',
  ];
  const values: any[] = [id, verification_status, verification_notes || null];

  // Auto-approve if verified
  if (autoApprove && verification_status === 'VERIFIED') {
    updates.push('status = $4');
    values.push('APPROVED');
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');

  const result = await pool.query(
    `UPDATE sellers SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );
  if (result.rows[0]) {
    result.rows[0].social_links = typeof result.rows[0].social_links === 'string' 
      ? JSON.parse(result.rows[0].social_links) 
      : result.rows[0].social_links;
  }
  return result.rows[0];
}

export async function updatePromoterVerification(
  id: number,
  verification_status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW',
  verification_notes?: string | null,
  autoApprove?: boolean
): Promise<Promoter> {
  const updates: string[] = [
    'verification_status = $2',
    'verification_date = CURRENT_TIMESTAMP',
    'verification_notes = $3',
  ];
  const values: any[] = [id, verification_status, verification_notes || null];

  // Auto-approve if verified
  if (autoApprove && verification_status === 'VERIFIED') {
    updates.push('status = $4');
    values.push('APPROVED');
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');

  const result = await pool.query(
    `UPDATE promoters SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );
  if (result.rows[0]) {
    result.rows[0].social_links = typeof result.rows[0].social_links === 'string' 
      ? JSON.parse(result.rows[0].social_links) 
      : result.rows[0].social_links;
  }
  return result.rows[0];
}

// Industry queries
export async function getAllIndustries(includeInactive: boolean = false): Promise<Industry[]> {
  const query = includeInactive
    ? 'SELECT * FROM industries ORDER BY display_order, name'
    : 'SELECT * FROM industries WHERE is_active = true ORDER BY display_order, name';
  const result = await pool.query(query);
  return result.rows;
}

export async function getIndustryById(id: number): Promise<Industry | null> {
  const result = await pool.query('SELECT * FROM industries WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createIndustry(industry: {
  name: string;
  display_order?: number;
  is_active?: boolean;
}): Promise<Industry> {
  // Get max display_order if not provided
  let displayOrder = industry.display_order;
  if (displayOrder === undefined) {
    const maxResult = await pool.query('SELECT MAX(display_order) as max_order FROM industries');
    displayOrder = (maxResult.rows[0]?.max_order || 0) + 1;
  }

  const result = await pool.query(
    `INSERT INTO industries (name, display_order, is_active)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [industry.name, displayOrder, industry.is_active !== undefined ? industry.is_active : true]
  );
  return result.rows[0];
}

export async function updateIndustry(
  id: number,
  updates: {
    name?: string;
    display_order?: number;
    is_active?: boolean;
  }
): Promise<Industry | null> {
  const updatesList: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.name !== undefined) {
    updatesList.push(`name = $${paramCount}`);
    values.push(updates.name);
    paramCount++;
  }
  if (updates.display_order !== undefined) {
    updatesList.push(`display_order = $${paramCount}`);
    values.push(updates.display_order);
    paramCount++;
  }
  if (updates.is_active !== undefined) {
    updatesList.push(`is_active = $${paramCount}`);
    values.push(updates.is_active);
    paramCount++;
  }

  if (updatesList.length === 0) {
    return getIndustryById(id);
  }

  updatesList.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await pool.query(
    `UPDATE industries SET ${updatesList.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteIndustry(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM industries WHERE id = $1', [id]);
  return result.rowCount !== null && result.rowCount > 0;
}

// Member queries
export async function getMemberById(id: number): Promise<any | null> {
  const result = await pool.query('SELECT * FROM members WHERE id = $1', [id]);
  if (result.rows[0] && result.rows[0].social_links) {
    result.rows[0].social_links = typeof result.rows[0].social_links === 'string' 
      ? JSON.parse(result.rows[0].social_links) 
      : result.rows[0].social_links;
  }
  return result.rows[0] || null;
}

// Steward queries
export async function createSteward(steward: {
  member_id: number;
  sponsoring_chapter_id: number;
}): Promise<Steward> {
  const result = await pool.query(
    `INSERT INTO stewards (member_id, sponsoring_chapter_id, status)
     VALUES ($1, $2, 'PENDING')
     RETURNING *`,
    [steward.member_id, steward.sponsoring_chapter_id]
  );
  return result.rows[0];
}

export async function getStewardById(id: number): Promise<Steward | null> {
  const result = await pool.query('SELECT * FROM stewards WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getStewardByMemberId(memberId: number): Promise<Steward | null> {
  const result = await pool.query('SELECT * FROM stewards WHERE member_id = $1', [memberId]);
  return result.rows[0] || null;
}

export async function getPendingStewards(): Promise<Steward[]> {
  const result = await pool.query(
    'SELECT * FROM stewards WHERE status = $1 ORDER BY created_at DESC',
    ['PENDING']
  );
  return result.rows;
}

export async function updateStewardStatus(
  id: number,
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
): Promise<Steward> {
  const result = await pool.query(
    `UPDATE stewards SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [id, status]
  );
  return result.rows[0];
}

// Steward listing queries
export async function createStewardListing(listing: {
  steward_id: number;
  name: string;
  description?: string | null;
  image_url?: string | null;
  shipping_cost_cents: number;
  chapter_donation_cents: number;
  sponsoring_chapter_id: number;
}): Promise<StewardListing> {
  const result = await pool.query(
    `INSERT INTO steward_listings (steward_id, name, description, image_url, shipping_cost_cents, chapter_donation_cents, sponsoring_chapter_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
     RETURNING *`,
    [
      listing.steward_id,
      listing.name,
      listing.description || null,
      listing.image_url || null,
      listing.shipping_cost_cents,
      listing.chapter_donation_cents,
      listing.sponsoring_chapter_id,
    ]
  );
  return result.rows[0];
}

export async function getStewardListingById(id: number): Promise<StewardListing | null> {
  const result = await pool.query('SELECT * FROM steward_listings WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getStewardListings(stewardId: number): Promise<StewardListing[]> {
  const result = await pool.query(
    'SELECT * FROM steward_listings WHERE steward_id = $1 ORDER BY created_at DESC',
    [stewardId]
  );
  return result.rows;
}

export async function getActiveStewardListings(): Promise<StewardListing[]> {
  const result = await pool.query(
    `SELECT sl.*, s.status as steward_status
     FROM steward_listings sl
     JOIN stewards s ON sl.steward_id = s.id
     WHERE sl.status = 'ACTIVE' AND s.status = 'APPROVED'
     ORDER BY sl.created_at DESC`
  );
  return result.rows;
}

export async function updateStewardListing(
  id: number,
  updates: {
    name?: string;
    description?: string | null;
    image_url?: string | null;
    shipping_cost_cents?: number;
    chapter_donation_cents?: number;
    status?: 'ACTIVE' | 'CLAIMED' | 'REMOVED';
  }
): Promise<StewardListing | null> {
  const fields: string[] = [];
  const values: any[] = [id];
  let paramIndex = 2;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.image_url !== undefined) {
    fields.push(`image_url = $${paramIndex++}`);
    values.push(updates.image_url);
  }
  if (updates.shipping_cost_cents !== undefined) {
    fields.push(`shipping_cost_cents = $${paramIndex++}`);
    values.push(updates.shipping_cost_cents);
  }
  if (updates.chapter_donation_cents !== undefined) {
    fields.push(`chapter_donation_cents = $${paramIndex++}`);
    values.push(updates.chapter_donation_cents);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(updates.status);
    if (updates.status === 'CLAIMED') {
      // This should be set by the claim endpoint, but handle it here for safety
    }
  }

  if (fields.length === 0) {
    return getStewardListingById(id);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  const result = await pool.query(
    `UPDATE steward_listings SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function claimStewardListing(
  listingId: number,
  claimantMemberId: number
): Promise<StewardListing | null> {
  const result = await pool.query(
    `UPDATE steward_listings 
     SET status = 'CLAIMED', claimed_by_member_id = $2, claimed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status = 'ACTIVE'
     RETURNING *`,
    [listingId, claimantMemberId]
  );
  return result.rows[0] || null;
}

export async function deleteStewardListing(id: number): Promise<boolean> {
  const result = await pool.query(
    `UPDATE steward_listings SET status = 'REMOVED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

// Steward claim queries
export async function createStewardClaim(claim: {
  listing_id: number;
  claimant_member_id: number;
  stripe_session_id: string;
  total_amount_cents: number;
  shipping_cents: number;
  platform_fee_cents: number;
  chapter_donation_cents: number;
}): Promise<StewardClaim> {
  const result = await pool.query(
    `INSERT INTO steward_claims (listing_id, claimant_member_id, stripe_session_id, total_amount_cents, shipping_cents, platform_fee_cents, chapter_donation_cents, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
     RETURNING *`,
    [
      claim.listing_id,
      claim.claimant_member_id,
      claim.stripe_session_id,
      claim.total_amount_cents,
      claim.shipping_cents,
      claim.platform_fee_cents,
      claim.chapter_donation_cents,
    ]
  );
  return result.rows[0];
}

export async function getStewardClaimByStripeSessionId(stripeSessionId: string): Promise<StewardClaim | null> {
  const result = await pool.query(
    'SELECT * FROM steward_claims WHERE stripe_session_id = $1',
    [stripeSessionId]
  );
  return result.rows[0] || null;
}

export async function updateStewardClaimStatus(
  id: number,
  status: 'PENDING' | 'PAID' | 'FAILED'
): Promise<StewardClaim | null> {
  const result = await pool.query(
    `UPDATE steward_claims SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [id, status]
  );
  return result.rows[0] || null;
}

// Steward activity and reports
export async function getStewardActivity(): Promise<Array<{
  steward_id: number;
  steward_name: string;
  total_listings: number;
  active_listings: number;
  claimed_listings: number;
  total_donations_cents: number;
}>> {
  const result = await pool.query(
    `SELECT 
      s.id as steward_id,
      m.name as steward_name,
      COUNT(sl.id) as total_listings,
      COUNT(CASE WHEN sl.status = 'ACTIVE' THEN 1 END) as active_listings,
      COUNT(CASE WHEN sl.status = 'CLAIMED' THEN 1 END) as claimed_listings,
      COALESCE(SUM(sc.chapter_donation_cents), 0) as total_donations_cents
     FROM stewards s
     JOIN members m ON s.member_id = m.id
     LEFT JOIN steward_listings sl ON s.id = sl.steward_id
     LEFT JOIN steward_claims sc ON sl.id = sc.listing_id AND sc.status = 'PAID'
     GROUP BY s.id, m.name
     ORDER BY s.created_at DESC`
  );
  return result.rows;
}

export async function getChapterDonationsFromStewards(): Promise<Array<{
  chapter_id: number;
  chapter_name: string;
  total_donations_cents: number;
  claim_count: number;
}>> {
  const result = await pool.query(
    `SELECT 
      c.id as chapter_id,
      c.name as chapter_name,
      COALESCE(SUM(sc.chapter_donation_cents), 0) as total_donations_cents,
      COUNT(sc.id) as claim_count
     FROM chapters c
     LEFT JOIN steward_listings sl ON c.id = sl.sponsoring_chapter_id
     LEFT JOIN steward_claims sc ON sl.id = sc.listing_id AND sc.status = 'PAID'
     GROUP BY c.id, c.name
     HAVING COUNT(sc.id) > 0
     ORDER BY total_donations_cents DESC`
  );
  return result.rows;
}

// Platform settings queries
export async function getPlatformSetting(key: string): Promise<PlatformSetting | null> {
  const result = await pool.query('SELECT * FROM platform_settings WHERE key = $1', [key]);
  return result.rows[0] || null;
}

export async function setPlatformSetting(
  key: string,
  value: string,
  description?: string | null
): Promise<PlatformSetting> {
  const result = await pool.query(
    `INSERT INTO platform_settings (key, value, description, updated_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     ON CONFLICT (key) DO UPDATE SET value = $2, description = $3, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [key, value, description || null]
  );
  return result.rows[0];
}

export async function getAllPlatformSettings(): Promise<PlatformSetting[]> {
  const result = await pool.query('SELECT * FROM platform_settings ORDER BY key');
  return result.rows;
}

