import pool from '../db/connection';
import { createNotification } from '../db/queries-notifications';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });
dotenv.config();

// Sample notification data
interface NotificationSeedData {
  user_email: string;
  type: 'PURCHASE_BLOCKED' | 'ITEM_AVAILABLE' | 'ORDER_CONFIRMED' | 'ORDER_SHIPPED';
  title: string;
  message: string;
  related_product_id?: number | null;
  related_order_id?: number | null;
  is_read: boolean;
}

const sampleNotifications: NotificationSeedData[] = [
  // PURCHASE_BLOCKED notifications (for sellers) - Test users
  {
    user_email: 'buddy+seller@ebilly.com',
    type: 'PURCHASE_BLOCKED' as const,
    title: 'Purchase Attempted - Stripe Setup Required',
    message: 'A Brother attempted to purchase one of your items but couldn\'t complete the purchase because your Stripe account isn\'t connected. Connect your Stripe account to start receiving payments.',
    is_read: false,
  },
  // PURCHASE_BLOCKED notifications (for sellers) - Legacy test users
  {
    user_email: 'marcus.johnson@example.com',
    type: 'PURCHASE_BLOCKED' as const,
    title: 'Purchase Attempted - Stripe Setup Required',
    message: 'A Brother attempted to purchase "Kappa Alpha Psi Embroidered Polo" but couldn\'t complete the purchase because your Stripe account isn\'t connected. Connect your Stripe account to start receiving payments.',
    is_read: false,
  },
  {
    user_email: 'david.carter@example.com',
    type: 'PURCHASE_BLOCKED' as const,
    title: 'Purchase Attempted - Stripe Setup Required',
    message: 'A Brother attempted to purchase "Founders\' Day Commemorative Pin" but couldn\'t complete the purchase because your Stripe account isn\'t connected. Connect your Stripe account to start receiving payments.',
    is_read: false,
  },
  {
    user_email: 'sarah.mitchell@example.com',
    type: 'PURCHASE_BLOCKED' as const,
    title: 'Purchase Attempted - Stripe Setup Required',
    message: 'A Brother attempted to purchase "Crimson & Cream Tote Bag" but couldn\'t complete the purchase because your Stripe account isn\'t connected. Connect your Stripe account to start receiving payments.',
    is_read: true, // One read notification
  },
  
  // PURCHASE_BLOCKED notifications (for buyers) - Test users
  {
    user_email: 'buddy+member@ebilly.com',
    type: 'PURCHASE_BLOCKED' as const,
    title: 'Item Temporarily Unavailable',
    message: 'An item you tried to purchase is temporarily unavailable. The seller is finalizing their payout setup. We\'ll notify you when it becomes available!',
    is_read: false,
  },
  {
    user_email: 'buddy+promoter@ebilly.com',
    type: 'PURCHASE_BLOCKED' as const,
    title: 'Item Temporarily Unavailable',
    message: 'An item you tried to purchase is temporarily unavailable. The seller is finalizing their payout setup. We\'ll notify you when it becomes available!',
    is_read: true,
  },
  // PURCHASE_BLOCKED notifications (for buyers) - Legacy test users
  {
    user_email: 'buyer1@example.com',
    type: 'PURCHASE_BLOCKED' as const,
    title: 'Item Temporarily Unavailable',
    message: '"Kappa Alpha Psi Embroidered Polo" is temporarily unavailable. The seller is finalizing their payout setup. We\'ll notify you when it becomes available!',
    is_read: false,
  },
  {
    user_email: 'buyer2@example.com',
    type: 'PURCHASE_BLOCKED' as const,
    title: 'Item Temporarily Unavailable',
    message: '"Founders\' Day Commemorative Pin" is temporarily unavailable. The seller is finalizing their payout setup. We\'ll notify you when it becomes available!',
    is_read: false,
  },
  {
    user_email: 'buyer3@example.com',
    type: 'PURCHASE_BLOCKED' as const,
    title: 'Item Temporarily Unavailable',
    message: '"Kappa Alpha Psi Custom Hoodie" is temporarily unavailable. The seller is finalizing their payout setup. We\'ll notify you when it becomes available!',
    is_read: true,
  },
  
  // ITEM_AVAILABLE notifications - Test users
  {
    user_email: 'buddy+member@ebilly.com',
    type: 'ITEM_AVAILABLE' as const,
    title: 'Item Now Available!',
    message: 'An item you were interested in is now available for purchase! The seller has completed their payment setup.',
    is_read: false,
  },
  {
    user_email: 'buddy+steward@ebilly.com',
    type: 'ITEM_AVAILABLE' as const,
    title: 'Item Now Available!',
    message: 'An item you were interested in is now available for purchase! The seller has completed their payment setup.',
    is_read: false,
  },
  // ITEM_AVAILABLE notifications - Legacy test users
  {
    user_email: 'buyer1@example.com',
    type: 'ITEM_AVAILABLE' as const,
    title: 'Item Now Available!',
    message: '"Kappa Alpha Psi Embroidered Polo" is now available for purchase! The seller has completed their payment setup.',
    is_read: false,
  },
  {
    user_email: 'buyer4@example.com',
    type: 'ITEM_AVAILABLE' as const,
    title: 'Item Now Available!',
    message: '"Brotherhood T-Shirt Collection" is now available for purchase! The seller has completed their payment setup.',
    is_read: false,
  },
  {
    user_email: 'buyer5@example.com',
    type: 'ITEM_AVAILABLE' as const,
    title: 'Item Now Available!',
    message: '"Kappa Alpha Psi Leather Wallet" is now available for purchase! The seller has completed their payment setup.',
    is_read: true,
  },
  
  // ORDER_CONFIRMED notifications (for future use) - Test users
  {
    user_email: 'buddy+member@ebilly.com',
    type: 'ORDER_CONFIRMED' as const,
    title: 'Order Confirmed',
    message: 'Your order has been confirmed! You will receive a confirmation email shortly.',
    is_read: false,
  },
  // ORDER_CONFIRMED notifications (for future use) - Legacy test users
  {
    user_email: 'buyer1@example.com',
    type: 'ORDER_CONFIRMED' as const,
    title: 'Order Confirmed',
    message: 'Your order for "Chapter Custom Coffee Mug" has been confirmed! You will receive a confirmation email shortly.',
    is_read: false,
  },
  {
    user_email: 'buyer2@example.com',
    type: 'ORDER_CONFIRMED' as const,
    title: 'Order Confirmed',
    message: 'Your order for "Kappa Alpha Psi Baseball Cap" has been confirmed! You will receive a confirmation email shortly.',
    is_read: true,
  },
];

async function seedNotifications(): Promise<void> {
  console.log('🔔 Seeding notifications...\n');

  try {
    // Get some products to link notifications to
    const productsResult = await pool.query(
      'SELECT id, name, seller_id FROM products ORDER BY id LIMIT 20'
    );
    const products = productsResult.rows;

    if (products.length === 0) {
      console.log('  ⚠️  No products found. Please seed products first.');
      return;
    }

    // Get some sellers to create seller notifications
    const sellersResult = await pool.query(
      'SELECT id, email, name FROM sellers ORDER BY id LIMIT 10'
    );
    const sellers = sellersResult.rows;

    // Get some orders for ORDER_CONFIRMED notifications
    const ordersResult = await pool.query(
      'SELECT id, product_id FROM orders ORDER BY id LIMIT 5'
    );
    const orders = ordersResult.rows;

    let inserted = 0;
    let skipped = 0;
    let productIndex = 0;
    let orderIndex = 0;

    for (const notificationData of sampleNotifications) {
      try {
        // Check if notification already exists (by title and user_email)
        const existing = await pool.query(
          'SELECT id FROM notifications WHERE user_email = $1 AND title = $2',
          [notificationData.user_email, notificationData.title]
        );

        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }

        // Assign product_id if needed
        let productId: number | null = null;
        if (notificationData.type === 'PURCHASE_BLOCKED' || notificationData.type === 'ITEM_AVAILABLE') {
          if (productIndex < products.length) {
            productId = products[productIndex].id;
            productIndex++;
          } else {
            productId = products[Math.floor(Math.random() * products.length)].id;
          }
        }

        // Assign order_id for ORDER_CONFIRMED
        let orderId: number | null = null;
        if (notificationData.type === 'ORDER_CONFIRMED' && orderIndex < orders.length) {
          orderId = orders[orderIndex].id;
          orderIndex++;
        }

        // Create notification with varied timestamps (some older, some newer)
        const hoursAgo = Math.floor(Math.random() * 72); // Random 0-72 hours ago
        const notification = await createNotification({
          user_email: notificationData.user_email,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          related_product_id: productId,
          related_order_id: orderId,
        });

        // Update created_at to be more realistic (varied times)
        await pool.query(
          `UPDATE notifications 
           SET created_at = CURRENT_TIMESTAMP - INTERVAL '${hoursAgo} hours'
           WHERE id = $1`,
          [notification.id]
        );

        // Mark as read if specified (with some time offset to make it realistic)
        if (notificationData.is_read) {
          const readOffset = Math.floor(Math.random() * Math.min(hoursAgo * 60, 1440)); // Random minutes ago, but not before created_at
          await pool.query(
            `UPDATE notifications 
             SET is_read = true, read_at = CURRENT_TIMESTAMP - INTERVAL '${readOffset} minutes'
             WHERE id = $1`,
            [notification.id]
          );
        }

        inserted++;
        console.log(`  ✓ Created notification: ${notificationData.title} for ${notificationData.user_email} (${notificationData.is_read ? 'read' : 'unread'})`);
      } catch (error: any) {
        console.error(`  ❌ Error creating notification for ${notificationData.user_email}:`, error.message);
      }
    }

    // Create additional notifications for sellers about blocked purchases
    for (let i = 0; i < Math.min(5, sellers.length); i++) {
      const seller = sellers[i];
      const product = products[i % products.length];

      try {
        // Check if notification already exists
        const existing = await pool.query(
          'SELECT id FROM notifications WHERE user_email = $1 AND type = $2 AND related_product_id = $3',
          [seller.email, 'PURCHASE_BLOCKED', product.id]
        );

        if (existing.rows.length > 0) {
          continue;
        }

        const notification = await createNotification({
          user_email: seller.email,
          type: 'PURCHASE_BLOCKED',
          title: 'Purchase Attempted - Stripe Setup Required',
          message: `A Brother attempted to purchase "${product.name}" but couldn't complete the purchase because your Stripe account isn't connected. Connect your Stripe account to start receiving payments.`,
          related_product_id: product.id,
        });

        // Add varied timestamp
        const hoursAgo = Math.floor(Math.random() * 48); // Random 0-48 hours ago
        await pool.query(
          `UPDATE notifications 
           SET created_at = CURRENT_TIMESTAMP - INTERVAL '${hoursAgo} hours'
           WHERE id = $1`,
          [notification.id]
        );

        inserted++;
        console.log(`  ✓ Created seller notification for ${seller.name}`);
      } catch (error: any) {
        console.error(`  ❌ Error creating seller notification for ${seller.email}:`, error.message);
      }
    }

    console.log(`\n  ✓ Inserted ${inserted} notifications (${skipped} skipped)`);
    console.log('  ✓ Notification seeding completed!\n');
  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedNotifications();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { seedNotifications };

