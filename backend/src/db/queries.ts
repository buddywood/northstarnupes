import pool from './connection';
import { Chapter, Seller, Product, Order, Promoter, Event } from '../types';

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
  membership_number: string;
  initiated_chapter_id: number;
  sponsoring_chapter_id: number;
  business_name?: string | null;
  vendor_license_number: string;
  headshot_url?: string;
  social_links?: Record<string, string>;
}): Promise<Seller> {
  const result = await pool.query(
    `INSERT INTO sellers (email, name, membership_number, initiated_chapter_id, sponsoring_chapter_id, business_name, vendor_license_number, headshot_url, social_links, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')
     RETURNING *`,
    [
      seller.email,
      seller.name,
      seller.membership_number,
      seller.initiated_chapter_id,
      seller.sponsoring_chapter_id,
      seller.business_name || null,
      seller.vendor_license_number,
      seller.headshot_url || null,
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

// Product queries
export async function createProduct(product: {
  seller_id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url?: string;
  sponsored_chapter_id?: number;
}): Promise<Product> {
  const result = await pool.query(
    `INSERT INTO products (seller_id, name, description, price_cents, image_url, sponsored_chapter_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      product.seller_id,
      product.name,
      product.description,
      product.price_cents,
      product.image_url || null,
      product.sponsored_chapter_id || null,
    ]
  );
  return result.rows[0];
}

export async function getProductById(id: number): Promise<Product | null> {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getActiveProducts(): Promise<Product[]> {
  const result = await pool.query(
    `SELECT p.*, s.name as seller_name, s.status as seller_status
     FROM products p
     JOIN sellers s ON p.seller_id = s.id
     WHERE s.status = 'APPROVED'
     ORDER BY p.created_at DESC`
  );
  return result.rows;
}

export async function getProductsBySeller(sellerId: number): Promise<Product[]> {
  const result = await pool.query(
    'SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC',
    [sellerId]
  );
  return result.rows;
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

// Promoter queries
export async function createPromoter(promoter: {
  email: string;
  name: string;
  membership_number: string;
  initiated_chapter_id: number;
  sponsoring_chapter_id?: number;
  headshot_url?: string;
  social_links?: Record<string, string>;
}): Promise<Promoter> {
  const result = await pool.query(
    `INSERT INTO promoters (email, name, membership_number, initiated_chapter_id, sponsoring_chapter_id, headshot_url, social_links, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
     RETURNING *`,
    [
      promoter.email,
      promoter.name,
      promoter.membership_number,
      promoter.initiated_chapter_id,
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

export async function getEventsByPromoter(promoterId: number): Promise<Event[]> {
  const result = await pool.query(
    'SELECT * FROM events WHERE promoter_id = $1 ORDER BY event_date DESC',
    [promoterId]
  );
  return result.rows;
}

