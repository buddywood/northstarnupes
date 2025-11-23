'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SkeletonLoader } from '../components/SkeletonLoader';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchableSelect from '../components/SearchableSelect';
import UserRoleBadges from '../components/UserRoleBadges';
import { fetchAllMembers, fetchChapters, fetchIndustries, fetchProfessions, type MemberProfile, type Chapter, type Industry, type Profession } from '@/lib/api';
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
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedProfession, setSelectedProfession] = useState<number | null>(null);
  const [locationFilter, setLocationFilter] = useState('');

  // Check if user is a member (optional - for showing "Become a Member" button)
  const memberId = (session?.user as any)?.memberId;
  const is_fraternity_member = (session?.user as any)?.is_fraternity_member ?? false;
  const isMember = (memberId !== null && memberId !== undefined) || is_fraternity_member;

  useEffect(() => {
    // Load data regardless of authentication status - page is public
    loadData();
  }, [router]);

  useEffect(() => {
    // Load members when filters change - only show members if authenticated and member
    if (isAuthenticated && isMember) {
      loadMembers();
    } else {
      // Clear members if not authenticated or not a member
      setMembers([]);
    }
  }, [selectedChapter, selectedIndustry, selectedProfession, locationFilter, isAuthenticated, isMember]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [chaptersData, industriesData, professionsData] = await Promise.all([
        fetchChapters().catch(() => []),
        fetchIndustries().catch(() => []),
        fetchProfessions().catch(() => []),
      ]);
      setChapters(chaptersData);
      setIndustries(industriesData);
      setProfessions(professionsData);
    } catch (err) {
      console.error('Error loading filter data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (selectedChapter) filters.chapter_id = selectedChapter;
      if (selectedIndustry) filters.industry = selectedIndustry;
      if (selectedProfession) filters.profession_id = selectedProfession;
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

  return (
    <div className="min-h-screen bg-cream dark:bg-black text-midnight-navy dark:text-gray-100">
      <Header />
      
      {/* Hero Banner */}
      <section className="relative flex flex-col items-center justify-center text-center py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 bg-gradient-to-br from-crimson to-midnight-navy text-white overflow-hidden min-h-[200px] sm:min-h-[250px] md:min-h-[300px]">
        {/* Radial vignette + glow */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.25) 100%)',
          }}
        />

        {/* Soft background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[350px] h-[350px] sm:w-[450px] sm:h-[450px] md:w-[600px] md:h-[600px] rounded-full bg-white/10 blur-[140px]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-2 sm:px-4 w-full">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 sm:mb-6">
            The Kappa Connection
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          A verified network of Brothers — built for connection, mentorship, and opportunity.
          Your chapter may end, but your network shouldn’t.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* Show "Become a Member" if user is not a member */}
            {!isMember && (
              <Link
                href="/member-setup"
                className="inline-block bg-white text-crimson px-6 py-3 rounded-full font-semibold hover:bg-cream transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Become a Member
              </Link>
            )}
          </div>
        </div>
      </section>
      
      <main className="max-w-7xl mx-auto px-4 py-12">

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
                options={chapters.map(c => ({ id: c.id, value: c.id, label: c.name }))}
                value={selectedChapter ? String(selectedChapter) : ''}
                onChange={(value) => setSelectedChapter(value ? parseInt(value) : null)}
                placeholder="Filter by Chapter"
              />
            </div>

            {/* Industry Filter */}
            <div className="flex-1 min-w-[200px]">
              <SearchableSelect
                options={industries.map(i => ({ id: i.name, value: i.name, label: i.name }))}
                value={selectedIndustry || ''}
                onChange={(value) => setSelectedIndustry(value || null)}
                placeholder="Filter by Industry"
              />
            </div>

            {/* Profession Filter */}
            <div className="flex-1 min-w-[200px]">
              <SearchableSelect
                options={professions.map(p => ({ id: p.id, value: p.id.toString(), label: p.name }))}
                value={selectedProfession ? selectedProfession.toString() : ''}
                onChange={(value) => setSelectedProfession(value ? parseInt(value) : null)}
                placeholder="Filter by Profession"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {(selectedChapter || selectedIndustry || selectedProfession || locationFilter) && (
            <div className="text-center">
              <button
                onClick={() => {
                  setSelectedChapter(null);
                  setSelectedIndustry(null);
                  setSelectedProfession(null);
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
        {!isAuthenticated || !isMember ? (
          <div className="text-center py-12 bg-white dark:bg-black rounded-xl border border-frost-gray dark:border-gray-800">
            <h3 className="text-xl font-semibold text-midnight-navy dark:text-gray-100 mb-2">
              Sign in to Connect
            </h3>
            <p className="text-midnight-navy/60 dark:text-gray-400 mb-6">
              {!isAuthenticated 
                ? 'Please sign in to view and connect with verified brothers.'
                : 'Please complete your member profile to view and connect with verified brothers.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated && (
                <Link
                  href="/login?redirect=/connect"
                  className="inline-block bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition"
                >
                  Sign In
                </Link>
              )}
              {isAuthenticated && !isMember && (
                <Link
                  href="/member-setup"
                  className="inline-block bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition"
                >
                  Complete Member Profile
                </Link>
              )}
            </div>
          </div>
        ) : error ? (
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

                  {member.profession_name && (
                    <p className="text-xs text-midnight-navy/60 dark:text-gray-400 mb-1">
                      👔 {member.profession_name}
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
