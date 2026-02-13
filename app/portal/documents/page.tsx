'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import SearchInput from '@/components/ui/SearchInput';

const sampleDocs = [
  { id: '1', title: 'Meeting Minutes - January 2026', category: 'Minutes', date: '2026-01-23' },
  { id: '2', title: 'Meeting Minutes - December 2025', category: 'Minutes', date: '2025-12-11' },
  { id: '3', title: 'Service Project Guidelines', category: 'Policies', date: '2025-09-01' },
  { id: '4', title: 'Membership Handbook 2025-2026', category: 'Handbook', date: '2025-07-01' },
  { id: '5', title: 'Annual Report 2024-2025', category: 'Reports', date: '2025-06-30' },
  { id: '6', title: 'Committee Chair Responsibilities', category: 'Policies', date: '2025-07-15' },
];

const categoryColors: Record<string, 'cranberry' | 'azure' | 'gold' | 'green' | 'gray'> = {
  Minutes: 'azure',
  Policies: 'cranberry',
  Handbook: 'gold',
  Reports: 'green',
};

export default function DocumentsPage() {
  const [search, setSearch] = useState('');

  const filtered = sampleDocs.filter(
    (d) => d.title.toLowerCase().includes(search.toLowerCase()) ||
           d.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Documents</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Access meeting minutes, handbooks, and important club documents.</p>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search documents..." className="max-w-sm" />

      <div className="space-y-3">
        {filtered.map((doc) => (
          <Card key={doc.id} interactive padding="md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{doc.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={categoryColors[doc.category] || 'gray'}>{doc.category}</Badge>
                    <span className="text-xs text-gray-400">{doc.date}</span>
                  </div>
                </div>
              </div>
              <button className="p-2 rounded-lg text-gray-400 hover:text-cranberry hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
