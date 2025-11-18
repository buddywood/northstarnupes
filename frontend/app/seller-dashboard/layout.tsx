'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingCart,
  DollarSign,
  CreditCard,
  Settings,
  HelpCircle,
  Shield,
  Megaphone,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const sidebarItems = [
  { href: '/seller-dashboard', label: 'Dashboard Home', icon: LayoutDashboard },
  { href: '/seller-dashboard/listings', label: 'My Listings', icon: Package },
  { href: '/seller-dashboard/listings/create', label: 'Add New Listing', icon: PlusCircle },
  { href: '/seller-dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/seller-dashboard/payouts', label: 'Payouts', icon: DollarSign },
  { href: '/seller-dashboard/stripe-setup', label: 'Stripe Setup', icon: CreditCard },
  { href: '/profile', label: 'Profile Settings', icon: Settings },
  { href: '/seller-dashboard/help', label: 'Help Center', icon: HelpCircle },
];

export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check if user has steward or promoter roles (for conditional items)
  const isSteward = (session?.user as any)?.is_steward || (session?.user as any)?.stewardId;
  const isPromoter = (session?.user as any)?.is_promoter || (session?.user as any)?.promoterId;

  const conditionalItems = [];
  if (isSteward) {
    conditionalItems.push({ href: '/steward-dashboard', label: 'Steward Items', icon: Shield });
  }
  if (isPromoter) {
    conditionalItems.push({ href: '/promoter-dashboard', label: 'Promoter Tools', icon: Megaphone });
  }

  const SidebarContent = () => (
    <nav className={`${sidebarOpen ? 'px-2' : 'px-2'} pb-4`}>
      {sidebarItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
        const IconComponent = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center ${sidebarOpen ? 'gap-3 px-4' : 'justify-center px-2'} py-3 rounded-lg mb-1 transition group ${
              isActive
                ? sidebarOpen
                  ? 'bg-crimson text-white'
                  : 'bg-crimson/10 dark:bg-crimson/20'
                : 'text-midnight-navy dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title={!sidebarOpen ? item.label : undefined}
          >
            <div className={`flex items-center justify-center ${sidebarOpen ? '' : 'w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 shadow-sm'} transition ${
              isActive && !sidebarOpen
                ? 'bg-crimson/20 dark:bg-crimson/30 shadow-md'
                : ''
            }`}>
              <IconComponent className={`${sidebarOpen ? 'w-5 h-5' : 'w-5 h-5'} ${isActive && !sidebarOpen ? 'text-crimson dark:text-crimson' : ''}`} />
            </div>
            {sidebarOpen && (
              <span className="font-medium">{item.label}</span>
            )}
          </Link>
        );
      })}
      {conditionalItems.length > 0 && (
        <>
          <div className="my-2 border-t border-frost-gray dark:border-gray-800"></div>
          {conditionalItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center ${sidebarOpen ? 'gap-3 px-4' : 'justify-center px-2'} py-3 rounded-lg mb-1 transition group ${
                  isActive
                    ? sidebarOpen
                      ? 'bg-crimson text-white'
                      : 'bg-crimson/10 dark:bg-crimson/20'
                    : 'text-midnight-navy dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <div className={`flex items-center justify-center ${sidebarOpen ? '' : 'w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 shadow-sm'} transition ${
                  isActive && !sidebarOpen
                    ? 'bg-crimson/20 dark:bg-crimson/30 shadow-md'
                    : ''
                }`}>
                  <IconComponent className={`${sidebarOpen ? 'w-5 h-5' : 'w-5 h-5'} ${isActive && !sidebarOpen ? 'text-crimson dark:text-crimson' : ''}`} />
                </div>
                {sidebarOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
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

