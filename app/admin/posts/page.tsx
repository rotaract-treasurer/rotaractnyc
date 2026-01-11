'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaArrowLeft, FaNewspaper, FaSignOutAlt } from 'react-icons/fa'
import { useAdminSession, adminSignOut } from '@/lib/admin/useAdminSession'
import { getFriendlyAdminApiError } from '@/lib/admin/apiError'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { slugify } from '@/lib/slugify'

const DEFAULT_AUTHOR = 'Rotaract Club of New York at the United Nations'

function formatPublishedDate(dt: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  }).format(dt)
}

type PostRow = {
  slug: string
  title: string
  date: string
  author: string
  category: string
  excerpt: string
  content: string[]
  published: boolean
}

export default function AdminPostsPage() {
  const router = useRouter()
  const session = useAdminSession()

  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [posts, setPosts] = useState<PostRow[]>([])
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [mode, setMode] = useState<'list' | 'new' | 'edit'>('list')

  const [form, setForm] = useState({
    slug: '',
    title: '',
    date: '',
    author: DEFAULT_AUTHOR,
    category: 'Club News',
    excerpt: '',
    contentText: '',
    published: true,
  })

  const refresh = useCallback(async () => {
    setLoadingData(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/posts', { cache: 'no-store' })
      if (!res.ok) {
        setError(await getFriendlyAdminApiError(res, 'Unable to load posts.'))
        return
      }
      const json: unknown = await res.json()
      const rows =
        typeof json === 'object' &&
        json &&
        Array.isArray((json as { posts?: unknown }).posts)
          ? ((json as { posts: unknown[] }).posts as unknown[])
          : []

      setPosts(
        rows
          .map((p): PostRow => {
            const obj = typeof p === 'object' && p ? (p as Record<string, unknown>) : {}
            const slug = String(obj.slug ?? obj.id ?? '')
            const contentRaw = obj.content
            return {
              slug,
              title: String(obj.title ?? ''),
              date: String(obj.date ?? ''),
              author: String(obj.author ?? DEFAULT_AUTHOR),
              category: String(obj.category ?? 'News'),
              excerpt: String(obj.excerpt ?? ''),
              content: Array.isArray(contentRaw) ? contentRaw.map((x) => String(x)) : [],
              published: obj.published !== false,
            }
          })
          .filter((p) => p.slug)
      )
    } catch {
      setError('Unable to load posts.')
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    if (session.status === 'unauthenticated') router.push('/admin/login')
  }, [router, session.status])

  useEffect(() => {
    if (session.status === 'authenticated') refresh()
  }, [refresh, session.status])

  const sorted = useMemo(() => {
    return [...posts].sort((a, b) => b.slug.localeCompare(a.slug))
  }, [posts])

  if (session.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rotaract-pink" />
      </div>
    )
  }

  if (session.status !== 'authenticated') return null

  const startEdit = (row: PostRow) => {
    setEditingSlug(row.slug)
    setSlugManuallyEdited(true)
    setMode('edit')
    setForm({
      slug: row.slug,
      title: row.title,
      date: row.date,
      author: row.author,
      category: row.category,
      excerpt: row.excerpt,
      contentText: row.content.join('\n\n'),
      published: row.published,
    })
  }

  const startNew = () => {
    setEditingSlug(null)
    setSlugManuallyEdited(false)
    setMode('new')
    setForm({
      slug: '',
      title: '',
      date: formatPublishedDate(new Date()),
      author: DEFAULT_AUTHOR,
      category: 'Club News',
      excerpt: '',
      contentText: '',
      published: true,
    })
  }

  const backToList = () => {
    setEditingSlug(null)
    setSlugManuallyEdited(false)
    setMode('list')
    setForm({
      slug: '',
      title: '',
      date: '',
      author: DEFAULT_AUTHOR,
      category: 'Club News',
      excerpt: '',
      contentText: '',
      published: true,
    })
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const content = form.contentText
        .split(/\n\s*\n/g)
        .map((p) => p.trim())
        .filter(Boolean)

      const isEdit = mode === 'edit' && Boolean(editingSlug)
      const res = await fetch('/api/admin/posts', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug: form.slug.trim(),
          title: form.title,
          date: form.date.trim() ? form.date : formatPublishedDate(new Date()),
          author: form.author.trim() ? form.author : DEFAULT_AUTHOR,
          category: form.category,
          excerpt: form.excerpt,
          content,
          published: form.published,
        }),
      })

      if (!res.ok) {
        setError(await getFriendlyAdminApiError(res, 'Unable to save post.'))
        return
      }

      backToList()
      await refresh()
    } catch {
      setError('Unable to save post.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-rotaract-darkpink flex items-center gap-2">
                <FaNewspaper /> News & Articles
              </h1>
              <p className="text-gray-600 mt-1">Create, edit, and publish news and article updates</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-rotaract-pink/30 text-rotaract-darkpink rounded-lg transition-colors"
              >
                <FaArrowLeft /> Dashboard
              </Link>
              <button
                onClick={async () => {
                  await adminSignOut()
                  router.push('/')
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <FaSignOutAlt /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-rotaract-darkpink">All Articles</h2>
            <button
              onClick={startNew}
              className="px-4 py-2 bg-rotaract-pink text-white rounded-lg hover:bg-rotaract-darkpink"
            >
              New Article
            </button>
          </div>

          {error ? (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : null}

          {mode === 'list' ? (
            loadingData ? (
              <div className="text-gray-600">Loading…</div>
            ) : sorted.length === 0 ? (
              <div className="text-gray-600">No posts yet.</div>
            ) : (
              <div className="space-y-3">
                {sorted.map((p) => (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => startEdit(p)}
                    className="w-full text-left border border-gray-100 rounded-lg p-4 bg-white shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm text-gray-500">
                          {p.published ? 'published' : 'draft'} · {p.category}
                        </div>
                        <div className="text-lg font-semibold text-rotaract-darkpink">{p.title}</div>
                        <div className="mt-1 text-sm text-gray-600">
                          {p.date ? <span>{p.date}</span> : <span className="italic">No publish date</span>} · {p.author}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">/{p.slug}</div>
                      </div>
                      <div className="shrink-0 px-3 py-2 text-sm bg-white border border-rotaract-pink/30 text-rotaract-darkpink rounded-lg">
                        Edit
                      </div>
                    </div>
                    {p.excerpt ? <p className="mt-2 text-gray-700 text-sm">{p.excerpt}</p> : null}
                  </button>
                ))}
              </div>
            )
          ) : (
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-bold text-rotaract-darkpink">
                  {mode === 'edit' ? 'Edit Article' : 'New Article'}
                </h3>
                <button
                  onClick={backToList}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back to List
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Slug</label>
                    <input
                      value={form.slug}
                      onChange={(e) => {
                        const value = e.target.value
                        setSlugManuallyEdited(true)
                        setForm((f) => ({ ...f, slug: value }))
                      }}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="my-post-slug"
                      disabled={Boolean(editingSlug)}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.published}
                        onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                      />
                      Published
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => {
                      const title = e.target.value
                      setForm((f) => {
                        if (editingSlug) return { ...f, title }
                        const nextAutoSlug = slugify(title)
                        const shouldAutoUpdateSlug = !slugManuallyEdited || !f.slug.trim()
                        return shouldAutoUpdateSlug ? { ...f, title, slug: nextAutoSlug } : { ...f, title }
                      })
                    }}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Publish Date</label>
                    <input
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={formatPublishedDate(new Date())}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <input
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Author</label>
                    <input
                      value={form.author}
                      onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Excerpt</label>
                    <input
                      value={form.excerpt}
                      onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Content (paragraphs)</label>
                  <textarea
                    value={form.contentText}
                    onChange={(e) => setForm((f) => ({ ...f, contentText: e.target.value }))}
                    rows={10}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Write paragraphs separated by a blank line"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={save}
                    disabled={saving || !form.title.trim() || (!editingSlug && !form.slug.trim())}
                    className="px-4 py-2 bg-rotaract-pink text-white rounded-lg hover:bg-rotaract-darkpink disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Article'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
