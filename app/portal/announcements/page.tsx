'use client';

import { useAuth } from '@/lib/firebase/auth';
import { useEffect, useState, useRef, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc, onSnapshot, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getFirebaseClientApp } from '@/lib/firebase/client';
import { Announcement, User } from '@/types/portal';
import FeedCard from '../_components/FeedCard';
import { PostCard } from '../_components/PostCard';
import MemberSpotlight from '../_components/MemberSpotlight';
import UpcomingDeadlines from '../_components/UpcomingDeadlines';
import QuickLinks from '../_components/QuickLinks';
import DashboardSummary from '../_components/DashboardSummary';
import DashboardQuickActions from '../_components/DashboardQuickActions';

interface CommunityPost {
  id: string;
  author: {
    name: string;
    role: string;
    photoUrl?: string;
    uid: string;
  };
  timestamp: string;
  createdAt: Date;
  content: {
    title?: string;
    body: string;
    type: 'text' | 'images' | 'announcement' | 'document' | 'link' | 'event' | 'spotlight';
    images?: string[];
    document?: {
      name: string;
      size: string;
      url: string;
    };
    link?: {
      url: string;
      title?: string;
      description?: string;
      image?: string;
    };
    event?: {
      id: string;
      title: string;
      date: string;
      time: string;
    };
    spotlight?: {
      userId: string;
      name: string;
      role: string;
      photoURL?: string;
      quote: string;
    };
  };
  likes: string[];
  commentsCount: number;
}

type FeedItem = 
  | { type: 'announcement'; data: Announcement; author?: User }
  | { type: 'post'; data: CommunityPost };

export default function AnnouncementsPage() {
  const { loading, user, userData } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [authors, setAuthors] = useState<Record<string, User>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'announcements' | 'posts'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastPostDoc, setLastPostDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const observerTarget = useRef(null);
  const POSTS_PER_PAGE = 10;

  useEffect(() => {
    if (!loading) {
      loadFeed();
    }
  }, [loading]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const loadFeed = async () => {
    const app = getFirebaseClientApp();
    if (!app) {
      setError('Firebase not initialized');
      setLoadingData(false);
      return;
    }

    const db = getFirestore(app);
    
    try {
      setError(null);
      
      // Load announcements with real-time listener
      const announcementsRef = collection(db, 'announcements');
      const announcementsQuery = query(
        announcementsRef,
        where('visibility', '==', 'member'),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribeAnnouncements = onSnapshot(announcementsQuery, async (snapshot) => {
        const announcementsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Announcement[];
        
        setAnnouncements(announcementsData);
        
        // Load author data
        const uniqueAuthors = Array.from(new Set(announcementsData.map(a => a.createdBy)));
        const authorsData: Record<string, User> = {};
        
        await Promise.all(
          uniqueAuthors.map(async (uid) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', uid));
              if (userDoc.exists()) {
                authorsData[uid] = { uid, ...userDoc.data() } as User;
              }
            } catch (error) {
              console.error(`Error loading author ${uid}:`, error);
            }
          })
        );
        
        setAuthors(authorsData);
      }, (error) => {
        console.error('Error loading announcements:', error);
        setError(error.message);
      });

      // Load community posts with real-time listener
      const postsRef = collection(db, 'communityPosts');
      const postsQuery = query(postsRef, orderBy('createdAt', 'desc'), limit(50));

      const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
        const loadedPosts = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          const createdAt: Date | null = data.createdAt?.toDate ? data.createdAt.toDate() : null;

          return {
            id: doc.id,
            author: {
              name: String(data.authorName || 'Member'),
              role: String(data.authorRole || 'Member'),
              photoUrl: data.authorPhotoURL ? String(data.authorPhotoURL) : undefined,
              uid: data.authorUid || '',
            },
            timestamp: createdAt ? formatTimeAgo(createdAt) : '',
            createdAt: createdAt || new Date(),
            content: {
              title: data.title ? String(data.title) : undefined,
              body: String(data.body || ''),
              type: (data.type as CommunityPost['content']['type']) || 'text',
              images: Array.isArray(data.images) ? (data.images as string[]) : undefined,
              document: data.document ? (data.document as CommunityPost['content']['document']) : undefined,
              link: data.link ? (data.link as CommunityPost['content']['link']) : undefined,
              event: data.event ? (data.event as CommunityPost['content']['event']) : undefined,
              spotlight: data.spotlight ? (data.spotlight as CommunityPost['content']['spotlight']) : undefined,
            },
            likes: Array.isArray(data.likes) ? data.likes : [],
            commentsCount: Number(data.commentsCount || 0),
          } as CommunityPost;
        });

        setCommunityPosts(loadedPosts);
        setLoadingData(false);
      }, (error) => {
        console.error('Error loading community posts:', error);
        setLoadingData(false);
      });

      // Cleanup listeners on unmount
      return () => {
        unsubscribeAnnouncements();
        unsubscribePosts();
      };
    } catch (error: any) {
      console.error('Error setting up feed listeners:', error);
      setError(error.message);
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Dashboard Summary Skeleton */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg p-6 animate-pulse h-48"></div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Main Feed Skeleton */}
            <div className="flex-1 w-full flex flex-col gap-6">
              {/* Quick Actions Skeleton */}
              <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a2a2a] p-5 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg"></div>
                  ))}
                </div>
              </div>

              {/* Section Heading Skeleton */}
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
              </div>

              {/* Search and Filters Skeleton */}
              <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a2a2a] p-4 space-y-4 animate-pulse">
                <div className="h-10 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg"></div>
                <div className="h-10 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg"></div>
              </div>

              {/* Feed Cards Skeleton */}
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a2a2a] p-6 animate-pulse">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <div className="h-8 bg-gray-100 dark:bg-[#2a2a2a] rounded w-20"></div>
                    <div className="h-8 bg-gray-100 dark:bg-[#2a2a2a] rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar Skeleton */}
            <aside className="hidden lg:block w-[320px] shrink-0 sticky top-24 space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a2a2a] p-4 animate-pulse">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-100 dark:bg-[#2a2a2a] rounded"></div>
                    <div className="h-4 bg-gray-100 dark:bg-[#2a2a2a] rounded"></div>
                    <div className="h-4 bg-gray-100 dark:bg-[#2a2a2a] rounded"></div>
                  </div>
                </div>
              ))}
            </aside>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
          <p className="text-red-500 text-lg">Error loading announcements</p>
          <p className="text-gray-500 text-sm mt-2">{error}</p>
          {error.includes('index') && (
            <p className="text-gray-500 text-sm mt-2">
              A Firestore index may need to be created. Check the browser console for the index creation link.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Merge and sort feed items
  let feedItems: FeedItem[] = [
    ...announcements.map(announcement => ({
      type: 'announcement' as const,
      data: announcement,
      author: authors[announcement.createdBy],
      sortDate: announcement.createdAt?.toDate?.() || new Date(0),
      pinned: announcement.pinned || false,
      likesCount: 0, // Announcements don't have likes
    })),
    ...communityPosts.map(post => ({
      type: 'post' as const,
      data: post,
      sortDate: post.createdAt,
      pinned: false,
      likesCount: post.likes.length,
    }))
  ];

  // Filter by type
  if (filterType === 'announcements') {
    feedItems = feedItems.filter(item => item.type === 'announcement');
  } else if (filterType === 'posts') {
    feedItems = feedItems.filter(item => item.type === 'post');
  }

  // Filter by search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    feedItems = feedItems.filter(item => {
      if (item.type === 'announcement') {
        return item.data.title?.toLowerCase().includes(query) || 
               item.data.body?.toLowerCase().includes(query);
      } else {
        return item.data.content.title?.toLowerCase().includes(query) || 
               item.data.content.body?.toLowerCase().includes(query);
      }
    });
  }

  // Sort items
  feedItems.sort((a, b) => {
    // Pinned announcements always come first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    
    // Then sort by preference
    if (sortBy === 'newest') {
      return b.sortDate.getTime() - a.sortDate.getTime();
    } else {
      // Sort by popularity (likes + comments)
      const aPopularity = a.likesCount + (a.type === 'post' ? a.data.commentsCount : 0);
      const bPopularity = b.likesCount + (b.type === 'post' ? b.data.commentsCount : 0);
      return bPopularity - aPopularity;
    }
  });

  return (
    <main className="flex-1 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dashboard Summary */}
        <div className="mb-8">
          <DashboardSummary />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT/MAIN COLUMN: The Feed */}
          <div className="flex-1 w-full flex flex-col gap-6">
            {/* Quick Actions */}
            <DashboardQuickActions />
            
            {/* Section Heading */}
            <div className="flex flex-col gap-1 pb-2">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Announcements
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Stay updated with the latest news and posts from your club
              </p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a2a2a] p-4 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search announcements and posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rotaract-blue focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Type Filter */}
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-1">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      filterType === 'all'
                        ? 'bg-white dark:bg-[#3a3a3a] text-rotaract-blue shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType('announcements')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      filterType === 'announcements'
                        ? 'bg-white dark:bg-[#3a3a3a] text-rotaract-blue shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Announcements
                  </button>
                  <button
                    onClick={() => setFilterType('posts')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      filterType === 'posts'
                        ? 'bg-white dark:bg-[#3a3a3a] text-rotaract-blue shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Posts
                  </button>
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

                {/* Sort Options */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sort by:</span>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-1">
                    <button
                      onClick={() => setSortBy('newest')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${
                        sortBy === 'newest'
                          ? 'bg-white dark:bg-[#3a3a3a] text-rotaract-blue shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      Newest
                    </button>
                    <button
                      onClick={() => setSortBy('popular')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${
                        sortBy === 'popular'
                          ? 'bg-white dark:bg-[#3a3a3a] text-rotaract-blue shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">trending_up</span>
                      Popular
                    </button>
                  </div>
                </div>

                {/* Results count */}
                <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                  {feedItems.length} {feedItems.length === 1 ? 'item' : 'items'}
                </div>
              </div>
            </div>

          {/* Unified Feed */}
          {feedItems.length > 0 ? (
            <>
              {feedItems.map((item) => {
                if (item.type === 'announcement') {
                  return (
                    <FeedCard
                      key={`announcement-${item.data.id}`}
                      announcement={item.data}
                      author={item.author ? {
                        name: item.author.name,
                        role: item.author.role,
                        photoURL: item.author.photoURL
                      } : undefined}
                    />
                  );
                } else {
                  return (
                    <PostCard
                      key={`post-${item.data.id}`}
                      postId={item.data.id}
                      author={item.data.author}
                      timestamp={item.data.timestamp}
                      content={item.data.content}
                      likes={item.data.likes}
                      commentsCount={item.data.commentsCount}
                    />
                  );
                }
              })}
              
              {/* End of Feed Indicator */}
              <div className="flex items-center justify-center py-8">
                <span className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full mx-1"></span>
                <span className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full mx-1"></span>
                <span className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full mx-1"></span>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a2a2a] p-12 text-center">
              <div className="max-w-md mx-auto">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">
                  {searchQuery ? 'search_off' : 'forum'}
                </span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {searchQuery ? 'No results found' : 'No posts yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                  {searchQuery 
                    ? `No posts match "${searchQuery}". Try different keywords or clear your search.`
                    : 'Be the first to share something with the club!'}
                </p>
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-rotaract-blue hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    Clear Search
                  </button>
                ) : (
                  <a
                    href="/portal"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-rotaract-blue hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Create a Post
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar (Widgets) */}
        <aside className="hidden lg:block w-[320px] shrink-0 sticky top-24 space-y-6">
          <MemberSpotlight />
          <UpcomingDeadlines />
          <QuickLinks />
          
          {/* Footer Links */}
          <div className="text-xs text-gray-400 dark:text-gray-600 px-2 leading-relaxed">
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
              <a href="/about" className="hover:underline">About</a>
              <a href="/help" className="hover:underline">Privacy</a>
              <a href="/help" className="hover:underline">Terms</a>
              <a href="/help" className="hover:underline">Help Center</a>
            </div>
            <p>© 2024 Rotaract Club of NYC. All rights reserved.</p>
          </div>
        </aside>
      </div>
    </div>
    </main>
  );
}
