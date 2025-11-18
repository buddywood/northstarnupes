'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Header from '../components/Header';
import Footer from '../components/Footer';

const sidebarItems = [
  { href: '/promoter-dashboard', label: 'Dashboard Home', icon: '📊' },
  { href: '/promoter-dashboard/events', label: 'My Events', icon: '🎉' },
  { href: '/promoter-dashboard/events/create', label: 'Create Event', icon: '➕' },
  { href: '/promoter-dashboard/analytics', label: 'Analytics', icon: '📈' },
  { href: '/profile', label: 'Profile Settings', icon: '⚙️' },
  { href: '/promoter-dashboard/help', label: 'Help Center', icon: '❓' },
];

export default function PromoterDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check if user has seller or steward roles (for conditional items)
  const isSeller = (session?.user as any)?.is_seller || (session?.user as any)?.sellerId;
  const isSteward = (session?.user as any)?.is_steward || (session?.user as any)?.stewardId;

  const conditionalItems = [];
  if (isSeller) {
    conditionalItems.push({ href: '/seller-dashboard', label: 'Seller Items', icon: '🛍️' });
  }
  if (isSteward) {
    conditionalItems.push({ href: '/steward-dashboard', label: 'Steward Items', icon: '🛡️' });
  }

  const SidebarContent = () => (
    <nav className="px-2 pb-4">
      {sidebarItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition ${
              isActive
                ? 'bg-crimson text-white'
                : 'text-midnight-navy dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
      {conditionalItems.length > 0 && (
        <>
          <div className="my-2 border-t border-frost-gray dark:border-gray-800"></div>
          {conditionalItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition ${
                  isActive
                    ? 'bg-crimson text-white'
                    : 'text-midnight-navy dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-cream dark:bg-black">
      <Header />
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-16'
          } hidden lg:block bg-white dark:bg-gray-900 border-r border-frost-gray dark:border-gray-800 transition-all duration-300 fixed h-[calc(100vh-64px)] top-16 left-0 z-40 overflow-y-auto`}
        >
          <div className="p-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mb-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <svg
                className="w-5 h-5 text-midnight-navy dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={sidebarOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-full w-14 h-14 shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="mt-8">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        <main className={`flex-1 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'} transition-all duration-300`}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}


