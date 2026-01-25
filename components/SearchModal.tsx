'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SearchResult {
  title: string
  description: string
  url: string
  type: 'page' | 'event' | 'news' | 'resource'
}

// Mock search data - in a real app this would come from an API or search service
const searchData: SearchResult[] = [
  { title: 'About Rotaract NYC', description: 'Learn about our mission, values, and impact in the NYC community.', url: '/about', type: 'page' },
  { title: 'Membership Requirements', description: 'Requirements and process to join our Rotaract club.', url: '/membership-requirements', type: 'page' },
  { title: 'Events & Meetings', description: 'Upcoming events, general meetings, and service projects.', url: '/events', type: 'page' },
  { title: 'Member Benefits', description: 'Exclusive benefits available through our member portal.', url: '/member-benefits', type: 'page' },
  { title: 'Leadership Board', description: 'Meet our current board members and leadership team.', url: '/leadership', type: 'page' },
  { title: 'News & Updates', description: 'Latest news, articles, and updates from our club.', url: '/rcun-news', type: 'news' },
  { title: 'Sister Clubs', description: 'Our partner Rotaract clubs around the world.', url: '/about/sister-clubs', type: 'page' },
  { title: 'Contact Us', description: 'Get in touch with our club leadership and committees.', url: '/contact', type: 'page' },
  { title: 'FAQ', description: 'Frequently asked questions about our club and membership.', url: '/frequently-asked-questions', type: 'page' },
  { title: 'Help Center', description: 'Get help with membership, events, and club resources.', url: '/help', type: 'page' },
]

export default function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const filteredResults = searchData.filter(
      item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8) // Limit to 8 results

    setResults(filteredResults)
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      router.push(results[selectedIndex].url)
      onClose()
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event': return 'event'
      case 'news': return 'newspaper'
      case 'resource': return 'folder_open'
      default: return 'description'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'event': return 'text-blue-600'
      case 'news': return 'text-green-600'
      case 'resource': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop flex items-start justify-center pt-20" onClick={onClose}>
      <div 
        className="modal-content w-full max-w-2xl mx-4 max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="modal-header">
          <div className="flex items-center gap-3 flex-1">
            <span className="material-symbols-outlined text-text-muted text-2xl">search</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, events, news..."
              className="flex-1 text-xl bg-transparent border-none outline-none text-text-primary dark:text-text-primary-dark placeholder-text-muted"
              autoFocus
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-text-muted">close</span>
          </button>
        </div>

        {/* Search Results */}
        <div className="overflow-y-auto max-h-96">
          {results.length === 0 && query && (
            <div className="empty-state">
              <span className="material-symbols-outlined text-4xl mb-4 text-text-muted">search_off</span>
              <p className="text-text-muted dark:text-text-muted-dark">No results found for "{query}"</p>
              <p className="text-sm mt-2 text-text-muted dark:text-text-muted-dark">
                Try different keywords or check out our <Link href="/help" className="text-primary hover:underline">Help Center</Link>
              </p>
            </div>
          )}

          {results.length === 0 && !query && (
            <div className="empty-state">
              <span className="material-symbols-outlined text-4xl mb-4 text-text-muted">travel_explore</span>
              <p className="text-text-muted dark:text-text-muted-dark">Start typing to search...</p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                <span className="badge-neutral">membership</span>
                <span className="badge-neutral">events</span>
                <span className="badge-neutral">about</span>
                <span className="badge-neutral">contact</span>
              </div>
            </div>
          )}

          {results.map((result, index) => (
            <Link
              key={result.url}
              href={result.url}
              onClick={onClose}
              className={`block p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors border-b border-border-light dark:border-border-dark last:border-b-0 ${
                index === selectedIndex ? 'bg-gray-50 dark:bg-zinc-800' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`material-symbols-outlined text-xl ${getTypeColor(result.type)}`}>
                  {getTypeIcon(result.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-text-primary dark:text-text-primary-dark truncate">
                    {result.title}
                  </h3>
                  <p className="text-sm text-text-muted dark:text-text-muted-dark line-clamp-2 mt-1">
                    {result.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-text-muted uppercase font-medium">
                      {result.type}
                    </span>
                    <span className="text-xs text-text-muted">•</span>
                    <span className="text-xs text-text-muted">
                      {result.url}
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-text-muted text-lg">arrow_outward</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-zinc-900 border-t border-border-light dark:border-border-dark">
            <div className="flex items-center justify-between text-xs text-text-muted dark:text-text-muted-dark">
              <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
              <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}