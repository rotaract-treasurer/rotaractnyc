'use client';

import { useAuth } from '@/lib/firebase/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getFirebaseClientApp } from '@/lib/firebase/client';
import { User } from '@/types/portal';

export default function DirectoryPage() {
  const { loading, user } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterCommittee, setFilterCommittee] = useState<string>('all');
  const [committees, setCommittees] = useState<string[]>([]);

  useEffect(() => {
    if (!loading) {
      loadMembers();
    }
  }, [loading]);

  useEffect(() => {
    filterMembers();
  }, [members, searchTerm, filterRole, filterCommittee]);

  const loadMembers = async () => {
    const app = getFirebaseClientApp();
    if (!app) return;

    const db = getFirestore(app);
    
    try {
      const usersRef = collection(db, 'users');
      const usersQuery = query(
        usersRef,
        where('status', '==', 'active'),
        orderBy('name', 'asc')
      );
      const snapshot = await getDocs(usersQuery);
      const membersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as User[];
      
      setMembers(membersData);
      
      // Extract unique committees
      const uniqueCommittees = Array.from(new Set(
        membersData
          .map(m => m.committee)
          .filter(c => c)
      )) as string[];
      setCommittees(uniqueCommittees.sort());
      
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const filterMembers = () => {
    let filtered = [...members];

    // Search filter - search across name, email, role, committee, and bio
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.committee?.toLowerCase().includes(term) ||
        m.bio?.toLowerCase().includes(term) ||
        getRoleDisplay(m.role).toLowerCase().includes(term)
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(m => m.role === filterRole);
    }

    // Committee filter
    if (filterCommittee !== 'all') {
      filtered = filtered.filter(m => m.committee === filterCommittee);
    }

    setFilteredMembers(filtered);
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'BOARD': return 'Board Member';
      case 'TREASURER': return 'Treasurer';
      case 'ADMIN': return 'Administrator';
      default: return 'Member';
    }
  };

  if (loading || loadingData) {
    return (
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header skeleton */}
          <div className="animate-pulse">
            <div className="h-12 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4"></div>
            <div className="h-6 w-96 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          </div>
          
          {/* Search skeleton */}
          <div className="h-12 max-w-2xl bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
          
          {/* Grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
              Member Directory
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
              Connect with {members.length} passionate leaders, creators, and changemakers shaping the future of NYC.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl px-5 py-3.5 max-w-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all shadow-sm">
          <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 mr-3 text-xl">search</span>
          <input
            type="text"
            placeholder="Search by name, role, organization, or bio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-base w-full text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-500 outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>

        {/* Filters & Member Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Showing <span className="font-bold text-slate-900 dark:text-white">{filteredMembers.length}</span> of {members.length} members
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-primary/50 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="MEMBER">Member</option>
              <option value="BOARD">Board</option>
              <option value="TREASURER">Treasurer</option>
              <option value="ADMIN">Admin</option>
            </select>

            <select
              value={filterCommittee}
              onChange={(e) => setFilterCommittee(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-primary/50 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer"
            >
              <option value="all">All Committees</option>
              {committees.map(committee => (
                <option key={committee} value={committee}>{committee}</option>
              ))}
            </select>
          </div>
        </div>

      {/* Member Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMembers.map((member) => (
          <MemberCard key={member.uid} member={member} isAuthenticated={!!user} />
        ))}
      </div>

      {/* Empty State */}
      {!loadingData && filteredMembers.length === 0 && (
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">search_off</span>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No members found</p>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Try adjusting your search or filters</p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      )}
      </div>
    </main>
  );
}

// Member Card Component
function MemberCard({ member, isAuthenticated }: { member: User; isAuthenticated: boolean }) {
  const router = useRouter();
  
  // Clamp bio to 2-3 lines (approximately 120 characters)
  const clampedBio = member.bio && member.bio.length > 120 
    ? member.bio.substring(0, 120) + '...' 
    : member.bio;
    
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'BOARD': return 'Board Member';
      case 'TREASURER': return 'Treasurer';
      case 'ADMIN': return 'Administrator';
      default: return 'Member';
    }
  };
  
  return (
    <article 
      onClick={() => router.push(`/portal/directory/${member.uid}`)}
      className="group relative bg-white dark:bg-surface-dark rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col h-full transition-all duration-200 hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/portal/directory/${member.uid}`);
        }
      }}
    >
      {/* Avatar/Photo */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
        {member.photoURL ? (
          <img
            src={member.photoURL}
            alt={member.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
            <span className="text-5xl font-bold text-white">
              {member.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Name - Primary */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-1.5 line-clamp-2">
          {member.name}
        </h3>
        
        {/* Role / Profession */}
        <p className="text-sm font-semibold text-primary dark:text-primary-light mb-1">
          {getRoleDisplay(member.role)}
        </p>
        
        {/* Organization / Committee */}
        {member.committee && (
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-3">
            {member.committee}
          </p>
        )}
        
        {/* Bio - Clamped to 2-3 lines */}
        {clampedBio && isAuthenticated && (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mt-auto">
            {clampedBio}
          </p>
        )}
        
        {!isAuthenticated && (
          <p className="text-xs text-slate-500 dark:text-slate-500 italic mt-auto">
            Sign in to view full profile
          </p>
        )}
      </div>
      
      {/* Hover indicator */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-lg">
          <span className="material-symbols-outlined text-primary text-lg">arrow_forward</span>
        </div>
      </div>
    </article>
  );
}

// Skeleton Card Component
function SkeletonCard() {
  return (
    <div className="relative bg-white dark:bg-surface-dark rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col h-full animate-pulse">
      {/* Image skeleton */}
      <div className="w-full aspect-square bg-slate-200 dark:bg-slate-700"></div>
      
      {/* Content skeleton */}
      <div className="p-5 flex flex-col flex-grow space-y-3">
        <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="space-y-2 mt-auto">
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    </div>
  );
}
