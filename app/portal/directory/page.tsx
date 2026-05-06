'use client';

import { useState, useMemo } from 'react';
import { useAllMembers } from '@/hooks/useFirestore';
import { useAuth } from '@/lib/firebase/auth';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';
import Tabs from '@/components/ui/Tabs';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import AddMemberModal from '@/components/portal/AddMemberModal';
import ImportMembersModal from '@/components/portal/ImportMembersModal';
import MemberCard from '@/components/portal/MemberCard';
import type { Member } from '@/types';

const roleColors: Record<string, 'cranberry' | 'gold' | 'azure' | 'gray'> = {
  president: 'cranberry',
  treasurer: 'gold',
  board: 'azure',
  member: 'gray',
};

type ViewMode = 'grid' | 'table';
type DirectoryTab = 'active' | 'pending' | 'alumni' | 'all';

/** Extract a 4-digit year from an ISO date string or return null. */
function yearFromDate(date: string | undefined | null): number | null {
  if (!date) return null;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : d.getFullYear();
}

/** For alumni: prefer alumniSince year, fall back to joinedAt year. */
function alumniYear(m: { alumniSince?: string; joinedAt?: string }): number | null {
  return yearFromDate(m.alumniSince) ?? yearFromDate(m.joinedAt);
}

export default function DirectoryPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<DirectoryTab>('active');
  const [alumniYearFilter, setAlumniYearFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { member: currentMember } = useAuth();
  const { data: allMembers, loading } = useAllMembers();
  const { toast } = useToast();

  const isAdmin = currentMember && ['president', 'board', 'treasurer'].includes(currentMember.role);
  const isPresident = currentMember?.role === 'president';
  const [busyId, setBusyId] = useState<string | null>(null);

  // Derived counts for tabs
  const allList = (allMembers || []) as Member[];
  const activeList = useMemo(() => allList.filter((m) => m.status === 'active'), [allList]);
  const alumniList = useMemo(() => allList.filter((m) => m.status === 'alumni'), [allList]);
  const pendingList = useMemo(() => allList.filter((m) => m.status === 'pending'), [allList]);

  // Detect duplicate emails so admins can spot orphan invited docs
  const duplicateEmails = useMemo(() => {
    const counts = new Map<string, number>();
    allList.forEach((m) => {
      const e = (m.email || '').toLowerCase();
      if (e) counts.set(e, (counts.get(e) || 0) + 1);
    });
    return new Set(Array.from(counts.entries()).filter(([, n]) => n > 1).map(([e]) => e));
  }, [allList]);

  // Unique alumni years (descending) for the year dropdown
  const alumniYears = useMemo(() => {
    const years = new Set<number>();
    alumniList.forEach((m) => {
      const y = alumniYear(m);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [alumniList]);

  // Members visible for the current tab
  const tabMembers = useMemo(() => {
    if (activeTab === 'active') return activeList;
    if (activeTab === 'alumni') return alumniList;
    if (activeTab === 'pending') return pendingList;
    return allList; // 'all'
  }, [activeTab, activeList, alumniList, pendingList, allList]);

  // Apply alumni-year filter, then search
  const filtered = useMemo(() => {
    let list = tabMembers;

    // Year filter (only relevant on the alumni tab)
    if (activeTab === 'alumni' && alumniYearFilter !== 'all') {
      const yr = Number(alumniYearFilter);
      list = list.filter((m) => alumniYear(m) === yr);
    }

    // Text search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.displayName?.toLowerCase().includes(q) ||
          m.committee?.toLowerCase().includes(q) ||
          m.firstName?.toLowerCase().includes(q) ||
          m.lastName?.toLowerCase().includes(q) ||
          m.occupation?.toLowerCase().includes(q),
      );
    }

    return list;
  }, [tabMembers, search, activeTab, alumniYearFilter]);

  const tabs = [
    { id: 'active', label: 'Active Members', count: activeList.length },
    ...(isAdmin && pendingList.length > 0
      ? [{ id: 'pending', label: 'Pending', count: pendingList.length }]
      : []),
    { id: 'alumni', label: 'Alumni', count: alumniList.length },
    { id: 'all', label: 'All', count: allList.length },
  ];

  // ── Admin actions ─────────────────────────────────────────────────────
  async function approveMember(m: Member) {
    if (busyId) return;
    setBusyId(m.id);
    try {
      const res = await fetch('/api/portal/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: m.id, status: 'active' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to approve member');
      }
      toast(`${m.displayName || m.firstName || 'Member'} approved`, 'success');
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast(err?.message || 'Failed to approve member', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function deleteMember(m: Member) {
    if (busyId) return;
    if (
      !confirm(
        `Delete ${m.displayName || m.email || 'this member'}? This permanently removes their member record.`,
      )
    ) {
      return;
    }
    setBusyId(m.id);
    try {
      const res = await fetch('/api/portal/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: m.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to delete member');
      }
      toast(`${m.displayName || 'Member'} deleted`, 'success');
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast(err?.message || 'Failed to delete member', 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
    <div className="max-w-7xl mx-auto space-y-8 page-enter">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-cranberry tracking-tight">
            Member Directory
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 max-w-xl">
            Connect with fellow leaders and change-makers in the NYC community.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={() => setShowImportModal(true)}>
              <svg aria-hidden="true" className="w-4 h-4 -ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Import CSV
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <svg aria-hidden="true" className="w-4 h-4 -ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Member
            </Button>
          </div>
        )}
      </div>

      {/* ── Toolbar: search, tabs, view toggle ── */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:items-center sm:gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, committee, or occupation..."
          className="w-full sm:max-w-xs"
        />
        <div className="flex items-center gap-3 overflow-x-auto">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id as DirectoryTab); setAlumniYearFilter('all'); }} />

          {/* Year filter – visible only on the Alumni tab */}
          {activeTab === 'alumni' && alumniYears.length > 0 && (
            <select
              value={alumniYearFilter}
              onChange={(e) => setAlumniYearFilter(e.target.value)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-3 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cranberry-500 shrink-0"
              aria-label="Filter alumni by year"
            >
              <option value="all">All Years</option>
              {alumniYears.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          )}

          <div className="ml-auto flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            title="Grid view"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'table'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            title="Table view"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<svg aria-hidden="true" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          title="No members found"
          description={
            search ? 'Try a different search term.' : 'No members in this category yet.'
          }
        />
      ) : viewMode === 'grid' ? (
        /* ── Grid view ── */
        <>
          {/* Pending tab uses a dedicated admin layout with approve / delete */}
          {activeTab === 'pending' && isAdmin ? (
            <div className="space-y-3">
              {filtered.map((m) => {
                const isDup = duplicateEmails.has((m.email || '').toLowerCase());
                return (
                  <div
                    key={m.id}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-4 flex items-center gap-4"
                  >
                    <Avatar src={m.photoURL} alt={m.displayName} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2 flex-wrap">
                        {m.displayName || `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email}
                        <Badge variant="gold">Pending</Badge>
                        {m.role !== 'member' && <Badge variant={roleColors[m.role] || 'gray'}>{m.role}</Badge>}
                        {m.boardTitle && <Badge variant="azure">{m.boardTitle}</Badge>}
                        {isDup && <Badge variant="red">Duplicate email</Badge>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.email}</p>
                      {m.committee && (
                        <p className="text-xs text-gray-400 mt-0.5">Committee · {m.committee}</p>
                      )}
                      {(m as any).invitedAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Invited {new Date((m as any).invitedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => approveMember(m)}
                        disabled={busyId === m.id}
                      >
                        {busyId === m.id ? 'Working…' : 'Approve'}
                      </Button>
                      {isPresident && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMember(m)}
                          disabled={busyId === m.id}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              <p className="text-center text-sm text-gray-400 dark:text-gray-500 pt-2">
                Showing {filtered.length} pending member{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    viewerRole={currentMember?.role}
                    onMessage={() => (window.location.href = `/portal/messages?to=${m.id}`)}
                  />
                ))}
              </div>
              <p className="text-center text-sm text-gray-400 dark:text-gray-500 pt-2">
                Showing {filtered.length} member{filtered.length !== 1 ? 's' : ''}
              </p>
            </>
          )}
        </>
      ) : (
        /* ── Table view ── */
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Member
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">
                    Committee
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                    Occupation
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((m) => {
                  const isDup = duplicateEmails.has((m.email || '').toLowerCase());
                  return (
                  <tr
                    key={m.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={m.photoURL} alt={m.displayName} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate flex items-center gap-1.5 flex-wrap">
                            {m.displayName}
                            {m.status === 'alumni' && <Badge variant="gold">Alumni</Badge>}
                            {m.status === 'pending' && <Badge variant="gold">Pending</Badge>}
                            {m.status === 'inactive' && <Badge variant="gray">Inactive</Badge>}
                            {isAdmin && isDup && <Badge variant="red">Duplicate email</Badge>}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant={roleColors[m.role] || 'gray'}>{m.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">
                      {m.committee || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                      {m.occupation || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {isAdmin && m.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => approveMember(m)}
                            disabled={busyId === m.id}
                          >
                            {busyId === m.id ? '…' : 'Approve'}
                          </Button>
                        )}
                        {isPresident && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteMember(m)}
                            disabled={busyId === m.id}
                          >
                            Delete
                          </Button>
                        )}
                        {m.linkedIn && (
                          <a href={m.linkedIn} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost">
                              LinkedIn
                            </Button>
                          </a>
                        )}
                        <a href={`/portal/messages?to=${m.id}`}>
                          <Button size="sm" variant="outline">
                            Message
                          </Button>
                        </a>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
            Showing {filtered.length} member{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

    </div>

    {/* AddMemberModal must live outside page-enter: that div retains transform:translateY(0)
        via fill-mode:both which creates a CSS containing block that traps position:fixed. */}
    {isAdmin && (
      <AddMemberModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />
    )}
    {isAdmin && (
      <ImportMembersModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={() => setRefreshKey((k) => k + 1)}
      />
    )}
    </>
  );
}
