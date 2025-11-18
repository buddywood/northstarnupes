'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification 
} from '@/lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Link from 'next/link';
import { SkeletonLoader } from '../components/Skeleton';
import Image from 'next/image';

export default function NotificationsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionStatus === 'loading') return;

    if (sessionStatus !== 'authenticated' || !session?.user?.email) {
      router.push('/login');
      return;
    }

    loadNotifications();
  }, [sessionStatus, session?.user?.email, router]);

  const loadNotifications = async () => {
    if (!session?.user?.email) return;
    
    try {
      const data = await getNotifications(session.user.email);
      setNotifications(data);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    if (!session?.user?.email) return;
    
    try {
      await markNotificationAsRead(notificationId, session.user.email);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!session?.user?.email) return;
    
    try {
      await markAllNotificationsAsRead(session.user.email);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleDelete = async (notificationId: number) => {
    if (!session?.user?.email) return;
    
    try {
      await deleteNotification(notificationId, session.user.email);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'PURCHASE_BLOCKED':
        return '⏳';
      case 'ITEM_AVAILABLE':
        return '✅';
      case 'ORDER_CONFIRMED':
        return '📦';
      case 'ORDER_SHIPPED':
        return '🚚';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'PURCHASE_BLOCKED':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700';
      case 'ITEM_AVAILABLE':
        return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
      case 'ORDER_CONFIRMED':
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700';
      case 'ORDER_SHIPPED':
        return 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700';
    }
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-black">
        <Header />
        <SkeletonLoader />
        <Footer />
      </div>
    );
  }

  if (sessionStatus !== 'authenticated') {
    return null; // Will redirect
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-cream dark:bg-black">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-display font-bold text-midnight-navy dark:text-gray-100">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-crimson hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-frost-gray dark:border-gray-800">
              <div className="text-6xl mb-4">🔔</div>
              <h2 className="text-2xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-2">
                No notifications
              </h2>
              <p className="text-midnight-navy/70 dark:text-gray-400">
                You're all caught up! We'll notify you when there's something new.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white dark:bg-gray-900 rounded-lg border p-4 transition-all ${
                    notification.is_read 
                      ? 'border-frost-gray dark:border-gray-800' 
                      : `${getNotificationColor(notification.type)} border-l-4`
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className={`font-semibold text-midnight-navy dark:text-gray-100 mb-1 ${
                            !notification.is_read ? 'font-bold' : ''
                          }`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-midnight-navy/70 dark:text-gray-400 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-midnight-navy/60 dark:text-gray-500">
                            <span>{formatDate(notification.created_at)}</span>
                            {notification.related_product_id && (
                              <Link
                                href={`/product/${notification.related_product_id}`}
                                className="text-crimson hover:underline"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                View Product →
                              </Link>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-xs text-crimson hover:underline"
                              title="Mark as read"
                            >
                              Mark read
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Delete"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}


