'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import StatCard from '@/components/ui/StatCard';

export default function ServiceHoursPage() {
  const { member } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ eventId: '', hours: '', notes: '' });

  // Sample data
  const recentHours = [
    { id: '1', event: 'Food Bank Volunteering', hours: 4, date: '2026-01-20', status: 'approved' as const },
    { id: '2', event: 'Park Cleanup', hours: 3, date: '2025-12-15', status: 'approved' as const },
    { id: '3', event: 'Mentoring Session', hours: 2, date: '2025-11-10', status: 'pending' as const },
  ];

  const totalHours = recentHours.filter(h => h.status === 'approved').reduce((sum, h) => sum + h.hours, 0);

  const statusColors: Record<string, 'green' | 'gold' | 'red'> = {
    approved: 'green',
    pending: 'gold',
    rejected: 'red',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Service Hours</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Log and track your community service contributions.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Log Hours'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Hours" value={totalHours} />
        <StatCard label="This Year" value={totalHours} />
        <StatCard label="Events Served" value={recentHours.length} />
      </div>

      {/* Log Form */}
      {showForm && (
        <Card padding="md">
          <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Log Service Hours</h3>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowForm(false); }}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Event</label>
                <select
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cranberry-500/20 focus:border-cranberry-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                  value={form.eventId}
                  onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                >
                  <option value="">Select an event</option>
                  <option value="1">Food Bank Volunteering</option>
                  <option value="2">Central Park Cleanup</option>
                  <option value="3">Mentoring Program</option>
                </select>
              </div>
              <Input
                label="Hours"
                type="number"
                min="0.5"
                step="0.5"
                required
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                placeholder="e.g., 3"
              />
            </div>
            <Textarea
              label="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Describe your service..."
              rows={3}
            />
            <Button type="submit">Submit Hours</Button>
          </form>
        </Card>
      )}

      {/* Recent Hours */}
      <div>
        <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Recent Submissions</h3>
        <div className="space-y-3">
          {recentHours.map((entry) => (
            <Card key={entry.id} padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{entry.event}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{entry.date}</span>
                    <Badge variant={statusColors[entry.status]}>{entry.status}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-display font-bold text-cranberry">{entry.hours}</p>
                  <p className="text-xs text-gray-400">hours</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
