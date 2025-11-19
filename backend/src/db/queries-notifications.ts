import pool from './connection';

// Notifications queries
export interface Notification {
  id: number;
  user_email: string;
  type: 'PURCHASE_BLOCKED' | 'ITEM_AVAILABLE' | 'ORDER_CONFIRMED' | 'ORDER_SHIPPED';
  title: string;
  message: string;
  related_product_id: number | null;
  related_order_id: number | null;
  is_read: boolean;
  created_at: Date;
  read_at: Date | null;
}

export async function createNotification(notification: {
  user_email: string;
  type: 'PURCHASE_BLOCKED' | 'ITEM_AVAILABLE' | 'ORDER_CONFIRMED' | 'ORDER_SHIPPED';
  title: string;
  message: string;
  related_product_id?: number | null;
  related_order_id?: number | null;
}): Promise<Notification> {
  const result = await pool.query(
    `INSERT INTO notifications (user_email, type, title, message, related_product_id, related_order_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      notification.user_email,
      notification.type,
      notification.title,
      notification.message,
      notification.related_product_id || null,
      notification.related_order_id || null,
    ]
  );
  return result.rows[0];
}

export async function getNotificationsByUser(userEmail: string, limit: number = 50): Promise<Notification[]> {
  const result = await pool.query(
    `SELECT * FROM notifications 
     WHERE user_email = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [userEmail, limit]
  );
  return result.rows;
}

export async function getUnreadNotificationCount(userEmail: string): Promise<number> {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_email = $1 AND is_read = false',
    [userEmail]
  );
  return parseInt(result.rows[0].count) || 0;
}

export async function markNotificationAsRead(notificationId: number, userEmail: string): Promise<boolean> {
  const result = await pool.query(
    'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_email = $2',
    [notificationId, userEmail]
  );
  return result.rowCount > 0;
}

export async function markAllNotificationsAsRead(userEmail: string): Promise<number> {
  const result = await pool.query(
    'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE user_email = $1 AND is_read = false RETURNING id',
    [userEmail]
  );
  return result.rowCount;
}

export async function getNotificationsForProduct(productId: number, type: string): Promise<Notification[]> {
  const result = await pool.query(
    'SELECT * FROM notifications WHERE related_product_id = $1 AND type = $2 AND is_read = false',
    [productId, type]
  );
  return result.rows;
}

export async function deleteNotification(notificationId: number, userEmail: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM notifications WHERE id = $1 AND user_email = $2',
    [notificationId, userEmail]
  );
  return result.rowCount > 0;
}

// Get all users who tried to purchase a product but couldn't (for notifying when item becomes available)
export async function getInterestedUsersForProduct(productId: number): Promise<string[]> {
  const result = await pool.query(
    `SELECT DISTINCT user_email 
     FROM notifications 
     WHERE related_product_id = $1 
       AND type = 'PURCHASE_BLOCKED' 
       AND is_read = false`,
    [productId]
  );
  return result.rows.map(row => row.user_email);
}



