'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';
import Tabs from '@/components/ui/Tabs';

const sampleMembers = [
  { id: '1', name: 'Sarah Chen', role: 'president', committee: 'Executive', status: 'active', email: 's****@gmail.com' },
  { id: '2', name: 'Michael Torres', role: 'board', committee: 'Service', status: 'active', email: 'm****@gmail.com' },
  { id: '3', name: 'Amanda Rodriguez', role: 'board', committee: 'Executive', status: 'active', email: 'a****@gmail.com' },
  { id: '4', name: 'James Park', role: 'treasurer', committee: 'Finance', status: 'active', email: 'j****@gmail.com' },
  { id: '5', name: 'Emily Washington', role: 'board', committee: 'Service', status: 'active', email: 'e****@gmail.com' },
  { id: '6', name: 'David Kim', role: 'board', committee: 'Fellowship', status: 'active', email: 'd****@gmail.com' },
  { id: '7', name: 'Rachel Green', role: 'member', committee: 'Professional Development', status: 'active', email: 'r****@gmail.com' },
  { id: '8', name: 'Carlos Martinez', role: 'member', committee: 'Communications', status: 'active', email: 'c****@gmail.com' },
];

const roleColors: Record<string, 'cranberry' | 'gold' | 'azure' | 'gray'> = {
  president: 'cranberry',
  treasurer: 'gold',
  board: 'azure',
  member: 'gray',
};

export default function DirectoryPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  const filtered = sampleMembers.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) ||
           m.committee?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Member Directory</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Find and connect with fellow Rotaractors.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or committee..." className="sm:max-w-xs" />
        <Tabs
          tabs={[
            { id: 'active', label: 'Active', count: 8 },
            { id: 'alumni', label: 'Alumni' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((member) => (
          <Card key={member.id} interactive padding="md">
            <div className="flex items-start gap-3">
              <Avatar alt={member.name} size="lg" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{member.name}</h3>
                <Badge variant={roleColors[member.role] || 'gray'} className="mt-1">{member.role}</Badge>
                {member.committee && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{member.committee}</p>
                )}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
              <Button size="sm" variant="ghost" className="flex-1">View Profile</Button>
              <Button size="sm" variant="outline" className="flex-1">Message</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
