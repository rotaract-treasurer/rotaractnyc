'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { FaCalendar, FaUser, FaClock, FaArrowRight, FaSearch, FaTimes } from 'react-icons/fa'
import { RCUN_NEWS } from '@/lib/rcunNews'
import { useEffect, useState } from 'react'
import Image from 'next/image'

type PostsResponseRow = Record<string, unknown>

interface NewsArticle {
  slug: string
  title: string
  date: string
  author: string
  category: string
  excerpt: string
  content: string[]
  imageUrl?: string
  readTime?: string
}

const CATEGORIES = ['All', 'Service', 'Social', 'Professional', 'International', 'Leadership', 'Fundraising']

const CATEGORY_COLORS: Record<string, string> = {
  Service: 'bg-green-500 text-white border-green-500',
  Social: 'bg-rotaract-gold text-white border-rotaract-gold',
  Professional: 'bg-rotaract-blue text-white border-rotaract-blue',
  International: 'bg-purple-600 text-white border-purple-600',
  Leadership: 'bg-purple-700 text-white border-purple-700',
  Fundraising: 'bg-red-500 text-white border-red-500',
  Charity: 'bg-red-500 text-white border-red-500',
  Internal: 'bg-gray-700 text-white border-gray-700',
  News: 'bg-rotaract-pink text-white border-rotaract-pink',
}

export default function NewsPage() {
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>(RCUN_NEWS)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [displayedCount, setDisplayedCount] = useState(9)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const res = await fetch('/api/public/posts')
        if (!res.ok) return
        const json: unknown = await res.json()
        const rows =
          typeof json === 'object' &&
          json &&
          Array.isArray((json as { posts?: unknown }).posts)
            ? ((json as { posts: unknown[] }).posts as unknown[])
            : []

        if (!cancelled && rows.length > 0) {
          setNewsArticles(
            rows
              .map((p) => {
                const obj: PostsResponseRow = typeof p === 'object' && p ? (p as PostsResponseRow) : {}
                const slug = String(obj.slug ?? obj.id ?? '')
                const contentRaw = obj.content
                return {
                  slug,
                  title: String(obj.title ?? ''),
                  date: String(obj.date ?? ''),
                  author: String(obj.author ?? 'Rotaract NYC'),
                  category: String(obj.category ?? 'News'),
                  excerpt: String(obj.excerpt ?? ''),
                  content: Array.isArray(contentRaw) ? contentRaw.map((x) => String(x)) : [],
                  imageUrl: String(obj.imageUrl ?? ''),
                  readTime: String(obj.readTime ?? '5 min read'),
                }
              })
              .filter((p) => p.slug)
          )
        }
      } catch {
        // ignore
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredArticles = newsArticles.filter((article) => {
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const featuredArticle = filteredArticles[0]
  const regularArticles = filteredArticles.slice(1, displayedCount)
  const hasMore = filteredArticles.length > displayedCount

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || 'bg-gray-600 text-white border-gray-600'
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Featured Story */}
      <section className="relative pt-24 pb-12 md:pb-20 overflow-hidden bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl relative">
          {featuredArticle && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
            >
              {/* Image Side */}
              <div className="lg:col-span-7 order-2 lg:order-1">
                <Link href={`/rcun-news/${featuredArticle.slug}`}>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-lg group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    {featuredArticle.imageUrl ? (
                      <Image
                        src={featuredArticle.imageUrl}
                        alt={featuredArticle.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-rotaract-blue to-rotaract-pink flex items-center justify-center">
                        <span className="text-white text-6xl font-bold opacity-20">RCUN</span>
                      </div>
                    )}
                    <span className={`absolute top-4 left-4 lg:hidden ${getCategoryColor(featuredArticle.category)} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider z-20 shadow-sm`}>
                      {featuredArticle.category}
                    </span>
                  </div>
                </Link>
              </div>
              
              {/* Content Side */}
              <div className="lg:col-span-5 order-1 lg:order-2 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="hidden lg:inline-block w-8 h-[2px] bg-rotaract-gold" />
                  <span className="text-rotaract-gold font-bold uppercase tracking-widest text-xs">Featured Story</span>
                </div>
                <Link href={`/rcun-news/${featuredArticle.slug}`}>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6 hover:text-rotaract-blue transition-colors cursor-pointer">
                    {featuredArticle.title}
                  </h1>
                </Link>
                <p className="text-lg text-gray-600 leading-relaxed mb-8 line-clamp-3">
                  {featuredArticle.excerpt}
                </p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <FaUser className="text-gray-600 text-sm" />
                    </div>
                    <div className="text-sm">
                      <p className="font-bold text-gray-900">{featuredArticle.author}</p>
                      <p className="text-gray-500 text-xs">{featuredArticle.date}</p>
                    </div>
                  </div>
                  <Link
                    href={`/rcun-news/${featuredArticle.slug}`}
                    className="flex items-center gap-2 text-sm font-bold text-rotaract-blue hover:translate-x-2 transition-transform duration-300"
                  >
                    Read Full Story <FaArrowRight />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Filters & Search Toolbar */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm py-4 border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Category Filters */}
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    selectedCategory === category
                      ? 'bg-gray-900 text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-600 hover:text-rotaract-blue hover:bg-blue-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            {/* Search Toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-500 hover:text-rotaract-blue transition-colors rounded-full hover:bg-gray-50"
            >
              {showSearch ? <FaTimes size={20} /> : <FaSearch size={20} />}
            </button>
          </div>
          
          {/* Search Bar */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-rotaract-blue focus:ring-2 focus:ring-rotaract-blue/20 outline-none transition-all"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* News Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {regularArticles.map((article, index) => (
                <motion.article
                  key={article.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group flex flex-col h-full transition-all duration-300 hover:-translate-y-1"
                >
                  <Link href={`/rcun-news/${article.slug}`}>
                    <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-100 mb-5 shadow-sm group-hover:shadow-md transition-shadow">
                      <div className="absolute top-3 left-3 z-10">
                        <span className={`${getCategoryColor(article.category)} px-3 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-sm border`}>
                          {article.category}
                        </span>
                      </div>
                      {article.imageUrl ? (
                        <Image
                          src={article.imageUrl}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-4xl font-bold opacity-20">RCUN</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="flex flex-col flex-grow">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 font-medium">
                      <FaClock className="text-[14px]" /> {article.readTime || '5 min read'}
                      <span className="mx-1">•</span>
                      <span>{article.date}</span>
                    </div>
                    
                    <Link href={`/rcun-news/${article.slug}`}>
                      <h3 className="text-xl font-bold text-gray-900 leading-tight mb-3 group-hover:text-rotaract-blue transition-colors cursor-pointer">
                        {article.title}
                      </h3>
                    </Link>
                    
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3 flex-grow">
                      {article.excerpt}
                    </p>
                    
                    <div className="mt-auto pt-2">
                      <Link
                        href={`/rcun-news/${article.slug}`}
                        className="inline-flex items-center text-sm font-bold text-rotaract-gold hover:text-rotaract-blue transition-colors group/link"
                      >
                        Read More <FaArrowRight className="ml-2 transition-transform group-hover/link:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>

          {/* Load More */}
          {hasMore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center mt-12"
            >
              <button
                onClick={() => setDisplayedCount(displayedCount + 6)}
                className="px-8 py-3 rounded-lg border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all font-medium text-sm tracking-wide shadow-sm hover:shadow-md"
              >
                Load More Articles
              </button>
            </motion.div>
          )}

          {/* No Results */}
          {filteredArticles.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-gray-500 text-lg">No articles found matching your criteria.</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Newsletter Signup with Sidebar Style */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Newsletter */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-rotaract-blue to-rotaract-pink p-8 rounded-2xl shadow-xl text-white"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">📧</div>
                  <h3 className="text-2xl font-bold">The Weekly Rotaract</h3>
                </div>
                <p className="text-white/90 text-sm mb-6 leading-relaxed">
                  Get the latest updates on service projects, social events, and member spotlights directly to your inbox.
                </p>
                <Link
                  href="/contact/newsletter"
                  className="inline-block bg-white text-rotaract-blue font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Subscribe Now
                </Link>
                <p className="text-xs text-white/70 mt-4">No spam, unsubscribe anytime.</p>
              </motion.div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6 border-b border-gray-200 pb-2">
                Trending Topics
              </h4>
              <ul className="flex flex-col gap-4">
                {CATEGORIES.slice(1, 5).map((category, idx) => (
                  <li key={category}>
                    <button
                      onClick={() => {
                        setSelectedCategory(category)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="group flex gap-4 items-start text-left w-full"
                    >
                      <span className="text-3xl font-light text-gray-300 group-hover:text-rotaract-blue transition-colors -mt-2">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <h5 className="text-base font-bold leading-snug text-gray-900 group-hover:text-rotaract-blue transition-colors">
                          {category} Stories
                        </h5>
                        <span className="text-xs text-gray-500 mt-1 block">
                          {newsArticles.filter(a => a.category === category).length} articles
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-rotaract-darkpink">Follow Us on Social Media</h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Get real-time updates and see what we&apos;re up to
          </p>
          <a
            href="/contact/follow"
            className="inline-block bg-white text-rotaract-pink font-semibold px-8 py-3 rounded-full border-2 border-rotaract-pink hover:bg-rotaract-pink hover:text-white transition-all"
          >
            View Social Media Links
          </a>
        </div>
      </section>
    </div>
  )
}
