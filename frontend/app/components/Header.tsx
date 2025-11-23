'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { fetchTotalDonations, fetchMemberProfile, getUnreadNotificationCount, getSellerProfile, fetchChapters } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCart } from '../contexts/CartContext';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SUPPORT_URL } from '@/lib/constants';

function HeaderContent() {
  const { session, isAuthenticated } = useAuth();
  const { data: nextAuthSession, status: sessionStatus } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [totalDonations, setTotalDonations] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartMenuOpen, setCartMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [sponsoringChapterName, setSponsoringChapterName] = useState<string | null>(null);
  const [memberVerificationStatus, setMemberVerificationStatus] = useState<string | null>(null);
  const { items, removeFromCart, updateQuantity, getTotalItems, getTotalPrice } = useCart();
  
  // Show authenticated menu for any authenticated user (not just fully onboarded)
  const showAuthenticatedMenu = sessionStatus === 'authenticated' && nextAuthSession?.user;
  
  // Fetch notification count
  useEffect(() => {
    const userEmail = nextAuthSession?.user?.email;
    if (showAuthenticatedMenu && userEmail) {
      getUnreadNotificationCount(userEmail)
        .then(setNotificationCount)
        .catch(() => setNotificationCount(0));
      
      // Poll for updates every 30 seconds
      const interval = setInterval(() => {
        if (userEmail) {
          getUnreadNotificationCount(userEmail)
            .then(setNotificationCount)
            .catch(() => setNotificationCount(0));
        }
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      setNotificationCount(0);
    }
  }, [showAuthenticatedMenu, nextAuthSession?.user?.email]);
  
  // Get first name from user's name
  const getUserFirstName = () => {
    const name = (session?.user as any)?.name;
    if (!name) return null;
    return name.split(' ')[0];
  };
  
  const firstName = getUserFirstName();
  // Get user data from session - check both session sources
  const userRole = (session?.user as any)?.role ?? (nextAuthSession?.user as any)?.role;
  const memberId = (session?.user as any)?.memberId ?? (nextAuthSession?.user as any)?.memberId;
  const sellerId = (session?.user as any)?.sellerId ?? (nextAuthSession?.user as any)?.sellerId;
  const promoterId = (session?.user as any)?.promoterId ?? (nextAuthSession?.user as any)?.promoterId;
  const stewardId = (session?.user as any)?.stewardId ?? (nextAuthSession?.user as any)?.stewardId;
  // Get role flags from session - check both session sources
  const is_fraternity_member = (session?.user as any)?.is_fraternity_member ?? (nextAuthSession?.user as any)?.is_fraternity_member ?? false;
  const is_seller = (session?.user as any)?.is_seller ?? (nextAuthSession?.user as any)?.is_seller ?? false;
  const is_promoter = (session?.user as any)?.is_promoter ?? (nextAuthSession?.user as any)?.is_promoter ?? false;
  const is_steward = (session?.user as any)?.is_steward ?? (nextAuthSession?.user as any)?.is_steward ?? false;
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    const currentTheme = theme || 'light';
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };
  
  const currentTheme = theme || 'light';

  // Debug: Log role flags to console
  useEffect(() => {
    if (showAuthenticatedMenu) {
      console.log('Header - Role flags:', {
        is_fraternity_member,
        is_seller,
        is_promoter,
        is_steward,
        userRole,
        stewardId,
        shouldShowStewardDashboard: is_steward || stewardId,
      });
    }
  }, [showAuthenticatedMenu, is_fraternity_member, is_seller, is_promoter, is_steward, userRole, stewardId]);
  
  // Determine which "Become" buttons to show (using role flags)
  const showBecomeSeller = !showAuthenticatedMenu || !is_seller;
  const showBecomePromoter = !showAuthenticatedMenu || !is_promoter;
  const showBecomeSteward = !showAuthenticatedMenu || !is_steward;
  // Hide "Become a Member" if user is a verified member
  const isVerifiedMember = memberVerificationStatus === 'VERIFIED';
  const finalShowBecomeMember = (!showAuthenticatedMenu || 
    (is_seller && !is_fraternity_member)) && 
    !is_promoter && 
    !(is_fraternity_member && !is_seller && !is_promoter && !is_steward) &&
    !(is_seller && is_fraternity_member) &&
    !isVerifiedMember;

  useEffect(() => {
    fetchTotalDonations()
      .then((cents) => {
        setTotalDonations(cents);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching donations:', err);
        setLoading(false);
      });
  }, []);

  // Fetch profile picture and verification status when user is authenticated and has a memberId
  useEffect(() => {
    const loadProfilePicture = async () => {
      if (showAuthenticatedMenu && (session?.user as any)?.memberId) {
        try {
          const profile = await fetchMemberProfile();
          if (profile.headshot_url) {
            setProfilePicture(profile.headshot_url);
          }
          if (profile.verification_status) {
            setMemberVerificationStatus(profile.verification_status);
          }
        } catch (err) {
          // Silently fail - user might not have a profile yet
          console.debug('Could not load profile picture:', err);
        }
      } else {
        setMemberVerificationStatus(null);
      }
    };

    loadProfilePicture();
  }, [showAuthenticatedMenu, session]);

  // Fetch seller's sponsoring chapter when user is a seller
  useEffect(() => {
    const loadSponsoringChapter = async () => {
      if (showAuthenticatedMenu && is_seller && sellerId) {
        try {
          const seller = await getSellerProfile();
          if (seller.sponsoring_chapter_id) {
            // Fetch all chapters to find the sponsoring chapter name
            const chapters = await fetchChapters();
            const chapter = chapters.find(c => c.id === seller.sponsoring_chapter_id);
            if (chapter) {
              setSponsoringChapterName(chapter.name);
            }
          }
        } catch (err) {
          // Silently fail - seller might not have a profile yet
          console.debug('Could not load sponsoring chapter:', err);
        }
      } else {
        setSponsoringChapterName(null);
      }
    };

    loadSponsoringChapter();
  }, [showAuthenticatedMenu, is_seller, sellerId]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
        setMobileMenuOpen(false);
      }
      if (!target.closest('.user-menu') && !target.closest('.user-menu-button')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const displayAmount = loading ? 0 : (totalDonations !== null ? totalDonations : 0);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  // Close cart menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (cartMenuOpen && !target.closest('.cart-menu-container')) {
        setCartMenuOpen(false);
      }
    };
    if (cartMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [cartMenuOpen]);

  const navLinks: Array<{
    href: string;
    label: string;
    matchPath: string;
    matchQuery?: string;
  }> = [
    { href: '/shop', label: 'Shop', matchPath: '/shop' },
    { href: '/events', label: 'Events', matchPath: '/events' },
    { href: '/steward-marketplace', label: 'Stewards', matchPath: '/steward-marketplace' },
    { href: '/connect', label: 'Connect', matchPath: '/connect' },
  ];

  // Check if a nav link is active
  const isLinkActive = (link: typeof navLinks[0]) => {
    if (link.matchPath) {
      const pathMatches = pathname === link.matchPath || pathname?.startsWith(link.matchPath + '/');
      // Events link should also be active for promoter dashboard events pages
      if (link.href === '/events') {
        const isPromoterEventsPage = pathname?.startsWith('/promoter-dashboard/events');
        return pathMatches || isPromoterEventsPage;
      }
      if (link.matchQuery) {
        const currentRole = searchParams?.get('role');
        const linkRole = link.matchQuery.split('=')[1];
        return pathMatches && currentRole === linkRole;
      }
      // For links without query params, check if no conflicting query params exist
      if (link.href === '/shop' && !link.matchQuery) {
        const currentRole = searchParams?.get('role');
        return pathMatches && !currentRole;
      }
      if (link.href === '/connect') {
        return pathMatches;
      }
      return pathMatches;
    }
    return false;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to shop with search query
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-900">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo - Icon + 1KAPPA */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
            {/* Icon */}
            <Image
              src="/header-icon.png"
              alt="1Kappa Icon"
              width={24}
              height={24}
              className="object-contain flex-shrink-0"
              priority
            />
            <span className="font-display font-bold text-crimson text-xl whitespace-nowrap">1KAPPA</span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center px-8 pr-12">
            {navLinks.map((link) => {
              const isActive = isLinkActive(link);
              return (
                <Link 
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-3 py-2 text-sm font-medium transition-all duration-200 ease-out",
                    isActive
                      ? "text-crimson dark:text-crimson font-semibold after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-0.5 after:w-6 after:h-1.5 after:bg-crimson after:rounded-full after:transition-all after:duration-300 after:ease-out"
                      : "text-gray-700 dark:text-gray-300 hover:text-crimson dark:hover:text-crimson"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            {/* Seller Sponsoring Chapter Badge */}
            {showAuthenticatedMenu && is_seller && sponsoringChapterName && (
              <Badge variant="outline" className="ml-4 border-crimson text-crimson bg-crimson/10 dark:bg-crimson/20">
                Sponsoring: {sponsoringChapterName}
              </Badge>
            )}
          </nav>

          {/* Right side - Desktop */}
          <div className="hidden lg:flex items-center gap-4 flex-shrink-0 ml-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <div className={`flex items-center border rounded-lg transition-all bg-white dark:bg-black ${
                searchFocused ? 'border-crimson shadow-sm dark:border-crimson' : 'border-gray-300 dark:border-gray-800'
              }`}>
                <div className="flex items-center px-3">
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search"
                  className="py-2 px-2 pr-3 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent border-0 focus:outline-none focus:ring-0 w-48"
                />
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-800 mx-1"></div>
                <button
                  type="button"
                  className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1"
                >
                  <span>All</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Help Icon */}
            <Link
              href={SUPPORT_URL}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-black rounded-lg transition-colors"
              aria-label="Help & Support"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Link>

            {/* Notifications Icon */}
            {showAuthenticatedMenu && (
              <Link
                href="/notifications"
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
                aria-label="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1.5 bg-crimson text-white text-xs font-semibold rounded-full flex items-center justify-center">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart Icon */}
            <div className="relative cart-menu-container">
              <button
                onClick={() => setCartMenuOpen(!cartMenuOpen)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-black rounded-lg transition-colors relative"
                aria-label="Shopping Cart"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {getTotalItems() > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1.5 bg-crimson text-white text-xs font-semibold rounded-full flex items-center justify-center">
                    {getTotalItems() > 99 ? '99+' : getTotalItems()}
                  </span>
                )}
              </button>

              {cartMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-black rounded-lg shadow-xl border border-gray-200 dark:border-gray-900 z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-900 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Cart ({getTotalItems()})
                    </h3>
                    <button
                      onClick={() => setCartMenuOpen(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {items.length === 0 ? (
                    <div className="p-8 text-center">
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-96 overflow-y-auto">
                        {items.map((item) => (
                          <div key={item.product.id} className="p-4 border-b border-gray-200 dark:border-gray-900 flex gap-3">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                              {item.product.image_url ? (
                                <Image
                                  src={item.product.image_url}
                                  alt={item.product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                                {item.product.name}
                              </p>
                              <p className="text-sm font-semibold text-crimson">
                                ${((item.product.price_cents / 100) * item.quantity).toFixed(2)}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                </button>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[24px] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => removeFromCart(item.product.id)}
                                  className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 border-t border-gray-200 dark:border-gray-900">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Total:</span>
                          <span className="text-xl font-bold text-crimson">${getTotalPrice().toFixed(2)}</span>
                        </div>
                        <Link
                          href="/checkout"
                          onClick={() => setCartMenuOpen(false)}
                          className="block w-full bg-crimson text-white text-center py-3 rounded-lg font-semibold hover:bg-crimson/90 transition-colors"
                        >
                          Checkout
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            {showAuthenticatedMenu ? (
              <div className="relative user-menu">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="user-menu-button flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-black transition-colors"
                >
                  <div className="relative w-8 h-8 rounded-full bg-crimson flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
                    {profilePicture ? (
                      <Image
                        src={profilePicture}
                        alt={firstName || 'User'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span>{firstName ? firstName[0].toUpperCase() : 'U'}</span>
                    )}
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-black rounded-lg shadow-xl border border-gray-200 dark:border-gray-900 py-2 z-50">
                    {/* Name Section */}
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full bg-crimson flex items-center justify-center text-white font-semibold text-base flex-shrink-0 overflow-hidden">
                          {profilePicture ? (
                            <Image
                              src={profilePicture}
                              alt={firstName || 'User'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <span>{firstName ? firstName[0].toUpperCase() : 'U'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {firstName ? `Brother ${firstName}` : 'Account'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {userRole === 'ADMIN' ? 'Administrator' : 
                             is_steward ? 'Steward' :
                             is_seller ? 'Seller' :
                             is_promoter ? 'Promoter' : 
                             is_fraternity_member ? 'Member' : 'Member'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stylish Divider */}
                    <div className="px-4 py-1">
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
                    </div>

                    {/* Dashboard Section */}
                    <div className="py-2">
                      {(is_fraternity_member || memberId) && isVerifiedMember && (
                        <Link 
                          href="/member-dashboard" 
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Member Dashboard
                        </Link>
                      )}
                      {(is_seller || sellerId) && (
                        <Link 
                          href="/seller-dashboard" 
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          Seller Dashboard
                        </Link>
                      )}
                      {(is_steward || stewardId) && (
                        <Link 
                          href="/steward-dashboard" 
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Steward Dashboard
                        </Link>
                      )}
                      {(is_promoter || promoterId) && (
                        <Link 
                          href="/promoter-dashboard" 
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Promoter Dashboard
                        </Link>
                      )}
                      {userRole === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Admin Dashboard
                        </Link>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="px-4 py-1">
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
                    </div>

                    {/* Profile & Settings Section */}
                    <div className="py-2">
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Account Settings
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleTheme();
                        }}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {currentTheme === 'dark' ? (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          )}
                          <span>Theme</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {currentTheme === 'dark' ? 'Dark' : 'Light'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleTheme();
                            }}
                            role="switch"
                            aria-checked={currentTheme === 'dark'}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-crimson focus:ring-offset-2 ${
                              currentTheme === 'dark' ? 'bg-crimson' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                currentTheme === 'dark' ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="px-4 py-1">
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
                    </div>

                    {/* Logout */}
                    <div className="py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-crimson dark:hover:text-crimson transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-3">
            {showAuthenticatedMenu && (
              <div className="relative user-menu">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="user-menu-button relative w-8 h-8 rounded-full bg-crimson flex items-center justify-center text-white font-semibold text-sm overflow-hidden"
                >
                  {profilePicture ? (
                    <Image
                      src={profilePicture}
                      alt={firstName || 'User'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span>{firstName ? firstName[0].toUpperCase() : 'U'}</span>
                  )}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {firstName && (
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-midnight-navy">Welcome, Brother {firstName}</p>
                      </div>
                    )}
                    <Link
                      href="/profile"
                      onClick={() => { setUserMenuOpen(false); setMobileMenuOpen(false); }}
                      className="block px-4 py-2 text-sm text-midnight-navy hover:bg-gray-50 transition-colors"
                    >
                      Profile
                    </Link>
                      {(is_steward || stewardId) && (
                        <Link
                          href="/steward-dashboard"
                          onClick={() => { setUserMenuOpen(false); setMobileMenuOpen(false); }}
                          className="block px-4 py-2 text-sm text-midnight-navy hover:bg-gray-50 transition-colors"
                        >
                          Steward Dashboard
                        </Link>
                      )}
                      {(is_seller || sellerId) && (
                        <Link
                          href="/seller-dashboard"
                          onClick={() => { setUserMenuOpen(false); setMobileMenuOpen(false); }}
                          className="block px-4 py-2 text-sm text-midnight-navy hover:bg-gray-50 transition-colors"
                        >
                          Seller Dashboard
                        </Link>
                      )}
                    {userRole === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={() => { setUserMenuOpen(false); setMobileMenuOpen(false); }}
                        className="block px-4 py-2 text-sm text-midnight-navy hover:bg-gray-50 transition-colors"
                      >
                        Admin Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-crimson hover:bg-gray-50 transition-colors"
              >
                Log Out
              </button>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-button p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6 text-midnight-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-midnight-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu lg:hidden border-t border-gray-200 dark:border-gray-900 py-4 bg-white dark:bg-black">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => {
                const isActive = isLinkActive(link);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`relative px-4 py-3 text-base font-medium transition-all rounded-lg ${
                      isActive
                        ? 'bg-crimson/10 dark:bg-crimson/20 text-crimson dark:text-crimson font-bold border-l-4 border-crimson'
                        : 'text-midnight-navy dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-crimson dark:hover:text-crimson'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isActive && (
                        <span className="w-2 h-2 bg-crimson rounded-full animate-pulse" />
                      )}
                      {link.label}
                    </span>
                  </Link>
                );
              })}
              
              {/* Seller Sponsoring Chapter Badge - Mobile */}
              {showAuthenticatedMenu && is_seller && sponsoringChapterName && (
                <div className="px-4 py-2">
                  <Badge variant="outline" className="border-crimson text-crimson bg-crimson/10 dark:bg-crimson/20">
                    Sponsoring: {sponsoringChapterName}
                  </Badge>
                </div>
              )}
              
              {/* "Become" buttons - shown on mobile in menu */}
              <div className="border-t border-gray-200 dark:border-gray-900 pt-2 mt-2 flex flex-col space-y-2">
                {finalShowBecomeMember && (
                  <Link
                    href="/member-setup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-base font-medium text-midnight-navy dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-crimson dark:hover:text-crimson transition-colors rounded-lg"
                  >
                    Become a Member
                  </Link>
                )}
                {showBecomeSeller && (
                  <Link
                    href="/seller-setup-intro"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-base font-medium text-midnight-navy dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-crimson dark:hover:text-crimson transition-colors rounded-lg"
                  >
                    Become a Seller
                  </Link>
                )}
                {showBecomePromoter && (
                  <Link
                    href="/promoter-setup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-base font-medium text-midnight-navy dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-crimson dark:hover:text-crimson transition-colors rounded-lg"
                  >
                    Become a Promoter
                  </Link>
                )}
                {showBecomeSteward && (
                  <Link
                    href="/steward-setup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-base font-medium text-midnight-navy dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-crimson dark:hover:text-crimson transition-colors rounded-lg"
                  >
                    Become a Steward
                  </Link>
                )}
              </div>
              
              {!showAuthenticatedMenu && (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-base font-medium text-midnight-navy dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-crimson dark:hover:text-crimson transition-colors rounded-lg"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mx-4 px-4 py-3 text-center bg-crimson text-white rounded-full font-semibold hover:bg-crimson/90 dark:hover:bg-crimson/80 transition"
                  >
                    Join Now
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <Image src="/horizon-logo.png" alt="1Kappa" width={120} height={40} />
              </Link>
            </div>
          </div>
        </div>
      </header>
    }>
      <HeaderContent />
    </Suspense>
  );
}

