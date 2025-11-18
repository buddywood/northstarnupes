import { createNotification, getInterestedUsersForProduct } from '../db/queries-notifications';
import { getProductsBySeller } from '../db/queries';

/**
 * Notify all interested users when a seller's product becomes available
 * (i.e., when seller sets up Stripe account)
 */
export async function notifyInterestedUsersForSeller(sellerId: number, sellerName: string): Promise<void> {
  try {
    // Get all products for this seller
    const products = await getProductsBySeller(sellerId);

    // For each product, notify users who tried to purchase it
    for (const product of products) {
      const interestedUsers = await getInterestedUsersForProduct(product.id);

      // Create notifications for each interested user
      for (const userEmail of interestedUsers) {
        await createNotification({
          user_email: userEmail,
          type: 'ITEM_AVAILABLE',
          title: 'Item Now Available!',
          message: `"${product.name}" is now available for purchase! The seller has completed their payment setup.`,
          related_product_id: product.id,
        }).catch(error => {
          console.error(`Failed to notify user ${userEmail} about product ${product.id}:`, error);
        });
      }
    }

    console.log(`Notified interested users for seller ${sellerName} (${sellerId})`);
  } catch (error) {
    console.error(`Error notifying interested users for seller ${sellerId}:`, error);
    // Don't throw - notification failure shouldn't break the setup process
  }
}

