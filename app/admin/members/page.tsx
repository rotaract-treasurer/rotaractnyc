'use client'

import Link from 'next/link'
import { useAdminSession } from '@/lib/admin/useAdminSession'
import { getFriendlyAdminApiError } from '@/lib/admin/apiError'
import DragDropFile from '@/components/admin/DragDropFile'
import NewMemberWizard from '@/components/admin/NewMemberWizard'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { UserRole, UserStatus } from '@/types/portal'

type MemberRow = {
  uid: string
  name: string
  email: string
  photoURL?: string
  role: UserRole
  status: UserStatus
  committee?: string
  phone?: string
  whatsapp?: string
  linkedin?: string
  bio?: string
  displayOrder?: number
  phoneOptIn: boolean
}

export default function AdminMembersPage() {
  const session = useAdminSession()

  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [headshotFile, setHeadshotFile] = useState<File | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<'name' | 'displayOrder'>('displayOrder')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [form, setForm] = useState<Omit<MemberRow, 'uid'>>({
    name: '',
    email: '',
    photoURL: '',
    role: 'MEMBER',
    status: 'active',
    committee: '',
    phone: '',
    whatsapp: '',
    linkedin: '',
    bio: '',
    displayOrder: undefined,
    phoneOptIn: false,
  })

  const refresh = useCallback(async () => {
    setLoadingData(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/members', { cache: 'no-store' })
      if (!res.ok) {
        setError(await getFriendlyAdminApiError(res, 'Unable to load members.'))
        return
      }
      const json: unknown = await res.json()
      const rows =
        typeof json === 'object' &&
        json &&
        Array.isArray((json as { users?: unknown }).users)
          ? ((json as { users: unknown[] }).users as unknown[])
          : []

      setMembers(
        rows
          .map((m): MemberRow => {
            const obj = typeof m === 'object' && m ? (m as Record<string, unknown>) : {}
            const displayOrder = Number(obj.displayOrder)
            const role: UserRole = ['MEMBER', 'BOARD', 'TREASURER', 'ADMIN'].includes(String(obj.role))
              ? (obj.role as UserRole)
              : 'MEMBER'
            const status: UserStatus = ['active', 'inactive', 'pending'].includes(String(obj.status))
              ? (obj.status as UserStatus)
              : 'pending'
            return {
              uid: String(obj.uid ?? ''),
              name: String(obj.name ?? ''),
              email: String(obj.email ?? ''),
              photoURL: String(obj.photoURL ?? '') || undefined,
              role,
              status,
              committee: String(obj.committee ?? '') || undefined,
              phone: String(obj.phone ?? '') || undefined,
              whatsapp: String(obj.whatsapp ?? '') || undefined,
              linkedin: String(obj.linkedin ?? '') || undefined,
              bio: String(obj.bio ?? '') || undefined,
              displayOrder: Number.isFinite(displayOrder) ? displayOrder : undefined,
              phoneOptIn: obj.phoneOptIn === true,
            }
          })
          .filter((m) => m.uid)
      )
    } catch {
      setError('Unable to load members.')
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    if (session.status === 'unauthenticated') {
      window.location.href = '/admin/login'
    }
  }, [session.status])

  useEffect(() => {
    if (session.status === 'authenticated') refresh()
  }, [refresh, session.status])

  // Filtering and sorting
  const filtered = useMemo(() => {
    let result = members

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          m.email?.toLowerCase().includes(term) ||
          m.committee?.toLowerCase().includes(term) ||
          m.uid.toLowerCase().includes(term)
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter((m) => m.role === roleFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((m) => m.status === statusFilter)
    }

    return result
  }, [members, searchTerm, roleFilter, statusFilter])

  const sorted = useMemo(() => {
    const result = [...filtered]
    result.sort((a, b) => {
      let comparison = 0
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else {
        const ao = a.displayOrder || 999
        const bo = b.displayOrder || 999
        comparison = ao - bo
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
    return result
  }, [filtered, sortField, sortDirection])

  const toggleSort = (field: 'name' | 'displayOrder') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === sorted.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sorted.map((m) => m.uid)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const exportCSV = () => {
    const headers = ['UID', 'Name', 'Email', 'Role', 'Status', 'Committee', 'Phone']
    const rows = sorted.map((m) => [
      m.uid,
      m.name,
      m.email || '',
      m.role,
      m.status,
      m.committee || '',
      m.phone || '',
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
            Admin
          </span>
        )
      case 'TREASURER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
            Treasurer
          </span>
        )
      case 'BOARD':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
            Board
          </span>
        )
      case 'MEMBER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            Member
          </span>
        )
    }
  }

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-100 dark:border-green-800">
            Active
          </span>
        )
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Inactive
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Pending
          </span>
        )
    }
  }

  const startEdit = (row: MemberRow) => {
    setEditingId(row.uid)
    setShowForm(true)
    setHeadshotFile(null)
    setForm({
      name: row.name,
      email: row.email,
      photoURL: row.photoURL || '',
      role: row.role,
      status: row.status,
      committee: row.committee || '',
      phone: row.phone || '',
      whatsapp: row.whatsapp || '',
      linkedin: row.linkedin || '',
      bio: row.bio || '',
      displayOrder: row.displayOrder,
      phoneOptIn: row.phoneOptIn,
    })
  }

  const startNew = () => {
    setEditingId(null)
    setShowForm(true)
    setHeadshotFile(null)
    setForm({
      name: '',
      email: '',
      photoURL: '',
      role: 'MEMBER',
      status: 'active',
      committee: '',
      phone: '',
      whatsapp: '',
      linkedin: '',
      bio: '',
      displayOrder: undefined,
      phoneOptIn: false,
    })
  }

  const resetForm = () => {
    setEditingId(null)
    setShowForm(false)
    setHeadshotFile(null)
    setForm({
      name: '',
      email: '',
      photoURL: '',
      role: 'MEMBER',
      status: 'active',
      committee: '',
      phone: '',
      whatsapp: '',
      linkedin: '',
      bio: '',
      displayOrder: undefined,
      phoneOptIn: false,
    })
  }

  const uploadHeadshot = async () => {
    if (!headshotFile) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', headshotFile)
      fd.append('folder', 'members')

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
      })

      if (!res.ok) {
        setError(await getFriendlyAdminApiError(res, 'Unable to upload headshot.'))
        return
      }

      const json: unknown = await res.json()
      const url =
        typeof json === 'object' && json && typeof (json as { url?: unknown }).url === 'string'
          ? String((json as { url: string }).url)
          : ''

      if (!url) {
        setError('Upload succeeded but no URL returned.')
        return
      }

      setForm((f) => ({ ...f, photoURL: url }))
      setHeadshotFile(null)
    } catch {
      setError('Unable to upload headshot.')
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/members', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...(editingId ? { uid: editingId } : {}),
          ...form,
        }),
      })

      if (!res.ok) {
        setError(await getFriendlyAdminApiError(res, 'Unable to save user.'))
        return
      }

      resetForm()
      await refresh()
    } catch {
      setError('Unable to save user.')
    } finally {
      setSaving(false)
    }
  }

  const handleWizardSubmit = async (data: any) => {
    setSaving(true)
    setError(null)
    try {
      // Upload photo first if provided
      let photoUrl = ''
      if (data.photoFile) {
        const fd = new FormData()
        fd.append('file', data.photoFile)
        fd.append('folder', 'members')

        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: fd,
        })

        if (uploadRes.ok) {
          const json: any = await uploadRes.json()
          photoUrl = json.url || ''
        }
      }

      // Create the member
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          group: data.group,
          title: data.title,
          name: `${data.firstName} ${data.lastName}`,
          role: data.role,
          email: data.email,
          photoUrl,
          order: 999, // Default to end of list
          active: true,
          membershipType: data.membershipType,
          duesStatus: data.duesStatus,
          joinDate: data.joinDate,
        }),
      })

      if (!res.ok) {
        setError(await getFriendlyAdminApiError(res, 'Unable to create member.'))
        throw new Error('Failed to create member')
      }

      setShowWizard(false)
      await refresh()
    } catch (err) {
      setError('Unable to create member.')
      throw err
    } finally {
      setSaving(false)
    }
  }

  const remove = async (uid: string) => {
    if (!confirm('Delete this user?')) return
    setError(null)
    try {
      const res = await fetch(`/api/admin/members?uid=${encodeURIComponent(uid)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        setError(await getFriendlyAdminApiError(res, 'Unable to delete user.'))
        return
      }
      await refresh()
    } catch {
      setError('Unable to delete user.')
    }
  }

  // const seed = async () => {
  //   setError(null)
  //   try {
  //     const res = await fetch('/api/admin/seed', { method: 'POST' })
  //     if (!res.ok) {
  //       setError(await getFriendlyAdminApiError(res, 'Seed failed.'))
  //       return
  //     }
  //     await refresh()
  //   } catch {
  //     setError('Seed failed.')
  //   }
  // }

  if (session.status === 'loading') {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (session.status !== 'authenticated') return null

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex mb-6">
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li className="inline-flex items-center">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px] mr-2">home</span>
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                <span className="ms-1 text-sm font-medium text-slate-900 md:ms-2 dark:text-white">
                  Members Directory
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Members Directory</h2>
            <p className="text-slate-500 dark:text-slate-400 text-base max-w-2xl">
              Manage active membership roster, track dues status, and update committee assignments.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 dark:border-slate-700 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px] mr-2">download</span>
              Export CSV
            </button>
            <button
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px] mr-2">person_add</span>
              Add Member
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Form Modal/Panel */}
        {showForm && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {editingId ? 'Edit Member' : 'Add New Member'}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Name *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    placeholder="john.doe@rotaractnyc.org"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Role *
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="MEMBER">Member</option>
                  <option value="BOARD">Board</option>
                  <option value="TREASURER">Treasurer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as UserStatus }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Committee
                  </label>
                  <input
                    value={form.committee}
                    onChange={(e) => setForm((f) => ({ ...f, committee: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    placeholder="e.g., Community Service"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={form.displayOrder || ''}
                    onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Headshot</label>
                <div className="flex flex-col gap-2">
                  <DragDropFile
                    label="Upload headshot"
                    accept="image/*"
                    file={headshotFile}
                    onFile={setHeadshotFile}
                    uploadedUrl={form.photoURL || undefined}
                    hint="PNG/JPG recommended."
                  />

                  {headshotFile && (
                    <button
                      type="button"
                      onClick={uploadHeadshot}
                      disabled={uploading}
                      className="px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 w-fit"
                    >
                      {uploading ? 'Uploading…' : 'Upload Photo'}
                    </button>
                  )}

                  <input
                    value={form.photoURL || ''}
                    onChange={(e) => setForm((f) => ({ ...f, photoURL: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    placeholder="Or paste image URL..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={save}
                  disabled={saving || !form.name.trim() || !form.email.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 font-medium"
                >
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create User'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Directory Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            {/* Search */}
            <div className="relative w-full lg:max-w-md group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 text-[20px] group-focus-within:text-primary transition-colors">
                  search
                </span>
              </div>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg leading-5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-all"
                placeholder="Search by name, email, or ID..."
                type="text"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors pr-8"
                >
                  <option value="all">Status: All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors pr-8"
                >
                  <option value="all">Role: All</option>
                  <option value="MEMBER">Member</option>
                  <option value="BOARD">Board</option>
                  <option value="TREASURER">Treasurer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block"></div>

              <button
                onClick={refresh}
                className="p-2 text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Refresh List"
              >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
              </button>
            </div>
          </div>

          {/* Table */}
          {loadingData ? (
            <div className="p-12 text-center text-slate-600 dark:text-slate-400">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              Loading members...
            </div>
          ) : sorted.length === 0 ? (
            <div className="p-12 text-center text-slate-600 dark:text-slate-400">
              {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                ? 'No users match your filters.'
                : 'No users yet. Click "Add User" to get started.'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === sorted.length && sorted.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                        />
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer group hover:text-primary"
                        onClick={() => toggleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Member
                          <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-primary">
                            {sortField === 'name' ? (sortDirection === 'asc' ? 'arrow_downward' : 'arrow_upward') : 'unfold_more'}
                          </span>
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Committee
                      </th>
                      <th scope="col" className="relative px-6 py-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                    {sorted.map((member) => (
                      <tr
                        key={member.uid}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(member.uid)}
                            onChange={() => toggleSelect(member.uid)}
                            className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {member.photoURL ? (
                                <div
                                  className="h-10 w-10 rounded-full bg-slate-200 bg-cover bg-center"
                                  style={{ backgroundImage: `url("${member.photoURL}")` }}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                  {member.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(member.role)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(member.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {member.committee || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEdit(member)}
                              className="text-slate-400 hover:text-primary transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              onClick={() => remove(member.uid)}
                              className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white dark:bg-slate-900 px-4 py-3 border-t border-slate-200 dark:border-slate-800 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Showing <span className="font-medium text-slate-900 dark:text-white">{sorted.length}</span> of{' '}
                    <span className="font-medium text-slate-900 dark:text-white">{members.length}</span> members
                    {selectedIds.size > 0 && (
                      <span className="ml-2 text-primary">({selectedIds.size} selected)</span>
                    )}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Member Wizard */}
      <NewMemberWizard 
        isOpen={showWizard} 
        onClose={() => setShowWizard(false)}
        onSubmit={handleWizardSubmit}
      />
    </div>
  )
}
