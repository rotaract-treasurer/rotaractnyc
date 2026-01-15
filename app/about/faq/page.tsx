'use client'

import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_PAGES, type FaqItem } from '@/lib/content/pages'
import { slugify } from '@/lib/slugify'

type FaqRow = {
  question: string
  answer: string
  category?: string
}

type FaqCategory = {
  name: string
  icon: string
  faqs: FaqRow[]
}

function formatSnippet(text: string, maxLen: number) {
  const t = text.trim().replace(/\s+/g, ' ')
  if (t.length <= maxLen) return t
  return `${t.slice(0, maxLen).trimEnd()}…`
}

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <details
      open={isOpen}
      onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
      className="group bg-gray-50 dark:bg-gray-800/50 rounded-md overflow-hidden transition-all duration-300 open:bg-white dark:open:bg-gray-800 open:shadow-sm open:ring-1 open:ring-black/5 dark:open:ring-white/10"
    >
      <summary className="flex cursor-pointer items-center justify-between p-5 list-none select-none">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 group-hover:text-rotaract-pink transition-colors pr-4">
          {question}
        </h3>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-5 pb-5 pt-0">
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base">
          {answer}
        </p>
      </div>
    </details>
  )
}

export default function FAQPage() {
  const defaults = DEFAULT_PAGES.faq
  const defaultFaqs = useMemo(() => {
    const data = defaults.data as { faqs?: FaqItem[] } | undefined
    return (data?.faqs ?? []).map((f) => ({ 
      question: f.question, 
      answer: f.answer,
      category: (f as { category?: string }).category || 'General'
    }))
  }, [defaults.data])

  const [heroTitle, setHeroTitle] = useState(defaults.heroTitle)
  const [heroSubtitle, setHeroSubtitle] = useState(defaults.heroSubtitle)
  const [faqs, setFaqs] = useState<FaqRow[]>(defaultFaqs)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const res = await fetch('/api/public/pages/faq')
        if (!res.ok) return
        const json: unknown = await res.json()
        const page =
          typeof json === 'object' &&
          json &&
          typeof (json as { page?: unknown }).page === 'object' &&
          (json as { page?: unknown }).page
            ? ((json as { page: unknown }).page as Record<string, unknown>)
            : null

        if (!page) return

        const newHeroTitle = String(page.heroTitle ?? defaults.heroTitle)
        const newHeroSubtitle = String(page.heroSubtitle ?? defaults.heroSubtitle)

        const data = (page.data as unknown) ?? {}
        const faqsRaw =
          typeof data === 'object' && data && Array.isArray((data as { faqs?: unknown }).faqs)
            ? ((data as { faqs: unknown[] }).faqs as unknown[])
            : []

        const mapped = faqsRaw
          .map((x): FaqRow => {
            const obj = typeof x === 'object' && x ? (x as Record<string, unknown>) : {}
            return {
              question: String(obj.question ?? ''),
              answer: String(obj.answer ?? ''),
              category: String(obj.category ?? 'General')
            }
          })
          .filter((f) => f.question && f.answer)

        if (cancelled) return
        setHeroTitle(newHeroTitle)
        setHeroSubtitle(newHeroSubtitle)
        if (mapped.length > 0) setFaqs(mapped)
      } catch {
        // keep defaults
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [defaults.heroSubtitle, defaults.heroTitle])

  // Group FAQs by category
  const categories: FaqCategory[] = useMemo(() => {
    const categoryMap = new Map<string, FaqRow[]>()
    
    faqs.forEach((faq) => {
      const cat = faq.category || 'General'
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, [])
      }
      categoryMap.get(cat)!.push(faq)
    })

    // Define category icons and order
    const categoryConfig: Record<string, { icon: string; order: number }> = {
      'Joining the Club': { icon: '👥', order: 1 },
      'Events & Meetings': { icon: '📅', order: 2 },
      'Rotary International': { icon: '🌍', order: 3 },
      'General': { icon: '❓', order: 99 }
    }

    return Array.from(categoryMap.entries())
      .map(([name, faqs]) => ({
        name,
        icon: categoryConfig[name]?.icon || '❓',
        faqs,
      }))
      .sort((a, b) => {
        const orderA = categoryConfig[a.name]?.order || 99
        const orderB = categoryConfig[b.name]?.order || 99
        return orderA - orderB
      })
  }, [faqs])

  const chips = useMemo(
    () =>
      [
        { label: 'Joining the Club', icon: '👥' },
        { label: 'Events & Meetings', icon: '📅' },
        { label: 'Rotary International', icon: '🌍' },
        { label: 'General', icon: '❓' },
      ] as const,
    [],
  )

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase()
    return faqs.filter((f) => {
      if (activeCategory && (f.category || 'General') !== activeCategory) return false
      if (!q) return true
      return (
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        (f.category || 'General').toLowerCase().includes(q)
      )
    })
  }, [activeCategory, faqs, query])

  const featuredFaqs = useMemo(() => {
    const list = (query.trim() || activeCategory) ? filteredFaqs : faqs
    return list.slice(0, 6)
  }, [activeCategory, faqs, filteredFaqs, query])

  const filteredCategories: FaqCategory[] = useMemo(() => {
    const q = query.trim().toLowerCase()
    const cats = categories
      .filter((c) => !activeCategory || c.name === activeCategory)
      .map((c) => {
        const faqs = !q
          ? c.faqs
          : c.faqs.filter((f) =>
              f.question.toLowerCase().includes(q) ||
              f.answer.toLowerCase().includes(q) ||
              (f.category || 'General').toLowerCase().includes(q),
            )
        return { ...c, faqs }
      })
      .filter((c) => c.faqs.length > 0)
    return cats
  }, [activeCategory, categories, query])

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Search Module */}
        <section className="w-full py-16 md:py-24 px-4 relative overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40 dark:opacity-20">
            <div className="absolute -top-[10%] -left-[5%] w-[30%] h-[30%] rounded-full bg-rotaract-pink/20 blur-[100px]"></div>
            <div className="absolute top-[20%] -right-[5%] w-[25%] h-[25%] rounded-full bg-rotaract-pink/10 blur-[100px]"></div>
          </div>

          <div className="max-w-3xl w-full mx-auto relative z-10 flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
              {heroTitle}
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed mb-10">
              {heroSubtitle}
            </p>

            {/* Large Search Bar */}
            <div className="w-full relative group mb-6">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <svg
                  className="w-6 h-6 text-slate-400 group-focus-within:text-rotaract-pink transition-colors"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35m1.6-5.15a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
                  />
                </svg>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="block w-full h-16 md:h-20 pl-14 pr-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-gray-900 text-slate-900 dark:text-white shadow-card focus:shadow-soft focus:ring-2 focus:ring-rotaract-pink/40 text-lg md:text-xl placeholder:text-slate-400 dark:placeholder:text-slate-600 font-semibold transition-all duration-300 ease-out"
                placeholder="Search for membership, dues, meeting times..."
                type="text"
                aria-label="Search FAQs"
              />
              {(query || activeCategory) && (
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setActiveCategory(null)
                    }}
                    className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-rotaract-pink transition-colors px-3 py-2 rounded-lg"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Chips */}
            <div className="flex flex-wrap justify-center gap-3 w-full">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 py-1.5">Popular:</span>
              {chips.map((c) => {
                const active = activeCategory === c.label
                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => {
                      setActiveCategory(active ? null : c.label)
                      const allSection = document.getElementById('faq-results')
                      allSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    className={`group flex items-center gap-2 px-4 py-2 rounded-full border transition-all shadow-sm ${
                      active
                        ? 'bg-rotaract-pink/10 border-rotaract-pink/30 text-rotaract-pink'
                        : 'bg-white dark:bg-gray-900 border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-rotaract-pink/30 hover:text-rotaract-pink'
                    }`}
                  >
                    <span className="text-base" aria-hidden>
                      {c.icon}
                    </span>
                    <span className="text-sm font-semibold">{c.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Featured / Results Grid */}
        <section id="faq-results" className="w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-12">
          <div className="flex items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Featured Questions
            </h2>
            <a
              className="text-rotaract-pink hover:text-rotaract-darkpink text-sm font-semibold flex items-center gap-2"
              href="#all-questions"
            >
              View all
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>

          {featuredFaqs.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center shadow-card border border-black/5 dark:border-white/10">
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                No results found. Try a different search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredFaqs.map((faq) => {
                const category = faq.category || 'General'
                const id = `faq-${slugify(faq.question)}`
                return (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="group flex flex-col bg-white dark:bg-gray-900 border border-black/5 dark:border-white/10 rounded-xl p-6 shadow-card hover:shadow-soft hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex items-center rounded-md bg-rotaract-pink/10 px-2.5 py-1 text-xs font-semibold text-rotaract-pink ring-1 ring-inset ring-rotaract-pink/20">
                        {category}
                      </span>
                      <svg
                        className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-rotaract-pink transition-colors"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 3h7v7m0-7L10 14m-1 7H3v-6"
                        />
                      </svg>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2 group-hover:text-rotaract-pink transition-colors">
                      {faq.question}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-2 flex-grow">
                      {formatSnippet(faq.answer, 140)}
                    </p>
                    <span className="text-xs text-slate-500 dark:text-slate-500 font-semibold">Read answer</span>
                  </a>
                )
              })}

              {featuredFaqs.length < 6 && (
                <div className="flex flex-col items-center justify-center bg-rotaract-pink/5 dark:bg-rotaract-pink/10 border border-dashed border-rotaract-pink/30 rounded-xl p-6 text-center">
                  <div className="size-12 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center mb-4 shadow-sm text-rotaract-pink">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 10c0 3.866-3.582 7-8 7a8.9 8.9 0 01-4-.93L3 17l1.28-3.2A6.8 6.8 0 013 10c0-3.866 3.582-7 8-7s8 3.134 8 7z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">Can&apos;t find an answer?</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">Reach out and we&apos;ll help directly.</p>
                  <a
                    href="/contact"
                    className="px-5 py-2 bg-rotaract-pink hover:bg-rotaract-darkpink text-white text-sm font-bold rounded-lg shadow-md transition-all"
                  >
                    Contact us
                  </a>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Category Grid (Alternative navigation) */}
        <section className="w-full py-16 px-6 md:px-12 lg:px-20 border-t border-black/5 dark:border-white/10 bg-gray-50 dark:bg-gray-950">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6">
              Browse by Topic
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {chips.map((c) => {
                const active = activeCategory === c.label
                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => {
                      setActiveCategory(active ? null : c.label)
                      const allSection = document.getElementById('all-questions')
                      allSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    className={`flex items-center gap-3 p-4 rounded-lg border transition-all group text-left ${
                      active
                        ? 'bg-white dark:bg-gray-900 border-rotaract-pink/30'
                        : 'bg-white dark:bg-gray-900 border-black/5 dark:border-white/10 hover:border-rotaract-pink/30'
                    }`}
                  >
                    <span className="text-xl" aria-hidden>
                      {c.icon}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-rotaract-pink transition-colors">
                      {c.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Full FAQ list */}
        <section id="all-questions" className="w-full max-w-5xl mx-auto px-6 md:px-12 lg:px-20 py-12">
          <div className="flex items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">All Questions</h2>
            {(query || activeCategory) && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {filteredFaqs.length} result{filteredFaqs.length === 1 ? '' : 's'}
              </p>
            )}
          </div>

          <div className="space-y-12">
            {filteredCategories.map((category) => (
              <section
                key={category.name}
                className="bg-white dark:bg-gray-900 rounded-lg p-6 md:p-8 shadow-soft border border-black/5 dark:border-white/10"
              >
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-black/5 dark:border-white/10">
                  <span className="text-3xl" aria-hidden>
                    {category.icon}
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{category.name}</h3>
                </div>
                <div className="flex flex-col gap-4">
                  {category.faqs.map((faq) => {
                    const id = `faq-${slugify(faq.question)}`
                    return (
                      <div key={id} id={id} className="scroll-mt-28">
                        <AccordionItem question={faq.question} answer={faq.answer} />
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="mt-16 bg-white dark:bg-gray-900 rounded-xl p-8 md:p-12 text-center shadow-card border border-rotaract-pink/10 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rotaract-pink to-transparent opacity-50"></div>
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-rotaract-pink/5 rounded-full blur-3xl group-hover:bg-rotaract-pink/10 transition-colors"></div>
            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="size-14 rounded-full bg-rotaract-pink/10 flex items-center justify-center text-rotaract-pink mb-2">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Still have questions?</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                We&apos;re here to help. If you couldn&apos;t find what you were looking for, reach out and we&apos;ll respond.
              </p>
              <a
                href="/contact"
                className="bg-rotaract-pink hover:bg-rotaract-darkpink text-white text-base font-bold py-3 px-8 rounded-sm transition-all transform hover:-translate-y-0.5 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <span>Contact Support</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
