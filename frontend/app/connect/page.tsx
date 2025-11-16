'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SkeletonLoader } from '../components/Skeleton';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchableSelect from '../components/SearchableSelect';
import UserRoleBadges from '../components/UserRoleBadges';
import { fetchAllMembers, fetchChapters, fetchIndustries, type MemberProfile, type Chapter, type Industry } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

export default function ConnectPage() {
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === 'authenticated' && session?.user;
  const isLoading = sessionStatus === 'loading';
  const router = useRouter();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/connect');
      return;
    }

    if (isAuthenticated && session) {
      loadData();
    }
  }, [isLoading, isAuthenticated, session, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadMembers();
    }
  }, [selectedChapter, selectedIndustry, locationFilter, isAuthenticated]);

  const loadData = async () => {
    try {
      const [chaptersData, industriesData] = await Promise.all([
        fetchChapters().catch(() => []),
        fetchIndustries().catch(() => []),
      ]);
      setChapters(chaptersData);
      setIndustries(industriesData);
    } catch (err) {
      console.error('Error loading filter data:', err);
    }
  };

  const loadMembers = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (selectedChapter) filters.chapter_id = selectedChapter;
      if (selectedIndustry) filters.industry = selectedIndustry;
      if (locationFilter.trim()) filters.location = locationFilter.trim();
      
      const membersData = await fetchAllMembers(filters);
      setMembers(membersData);
    } catch (err: any) {
      console.error('Error loading members:', err);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return <SkeletonLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-black text-midnight-navy dark:text-gray-100">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-4">
            Connect
          </h1>
          <p className="text-lg text-midnight-navy/70 dark:text-gray-300 max-w-2xl mx-auto">
            Discover and connect with verified brothers from across the fraternity. Build your network and strengthen bonds.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="bg-white dark:bg-black border border-frost-gray dark:border-gray-800 rounded-lg p-4 shadow-sm flex flex-wrap items-center gap-3">
            {/* Location Filter */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Filter by Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-4 py-2 border border-frost-gray dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy dark:text-gray-100 bg-white dark:bg-gray-900"
              />
            </div>

            {/* Chapter Filter */}
            <div className="flex-1 min-w-[200px]">
              <SearchableSelect
                id="chapter-filter"
                options={chapters.map(c => ({ value: c.id, label: c.name }))}
                selectedValue={selectedChapter}
                onSelect={setSelectedChapter}
                placeholder="Filter by Chapter"
                noOptionsMessage="No chapters found"
              />
            </div>

            {/* Industry Filter */}
            <div className="flex-1 min-w-[200px]">
              <SearchableSelect
                id="industry-filter"
                options={industries.map(i => ({ value: i.name, label: i.name }))}
                selectedValue={selectedIndustry}
                onSelect={setSelectedIndustry}
                placeholder="Filter by Industry"
                noOptionsMessage="No industries found"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {(selectedChapter || selectedIndustry || locationFilter) && (
            <div className="text-center">
              <button
                onClick={() => {
                  setSelectedChapter(null);
                  setSelectedIndustry(null);
                  setLocationFilter('');
                }}
                className="text-sm text-crimson hover:underline"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Members Grid */}
        {error ? (
          <div className="text-center py-12 text-red-600 dark:text-red-400">
            <p>{error}</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No members found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {members.map((member) => (
              <Link
                key={member.id}
                href={`/profile?id=${member.id}`}
                className="group bg-white dark:bg-black rounded-xl shadow dark:shadow-black/50 overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-frost-gray dark:border-gray-900"
              >
                {/* Profile Image */}
                <div className="relative aspect-square bg-cream dark:bg-gray-900 overflow-hidden">
                  {member.headshot_url ? (
                    <Image
                      src={member.headshot_url}
                      alt={member.name || 'Brother'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-crimson font-bold text-4xl">
                      {member.name ? member.name.charAt(0).toUpperCase() : 'B'}
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-midnight-navy dark:text-gray-100 group-hover:text-crimson transition">
                      {member.name ? `Brother ${member.name}` : 'Brother'}
                    </h3>
                    {/* Role badges - all members are members, but may have other roles */}
                    <UserRoleBadges
                      is_member={true}
                      is_seller={member.is_seller}
                      is_promoter={member.is_promoter}
                      is_steward={member.is_steward}
                      size="sm"
                    />
                  </div>

                  {member.chapter_name && (
                    <p className="text-sm text-midnight-navy/70 dark:text-gray-300 mb-1">
                      {member.chapter_name}
                    </p>
                  )}

                  {member.location && (
                    <p className="text-xs text-midnight-navy/60 dark:text-gray-400 mb-1">
                      📍 {member.location}
                    </p>
                  )}

                  {member.industry && (
                    <p className="text-xs text-midnight-navy/60 dark:text-gray-400 mb-1">
                      💼 {member.industry}
                      {member.job_title && ` • ${member.job_title}`}
                    </p>
                  )}

                  {member.bio && (
                    <p className="text-xs text-midnight-navy/70 dark:text-gray-300 mt-2 line-clamp-2">
                      {member.bio}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
