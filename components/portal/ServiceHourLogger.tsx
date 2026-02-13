'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import type { RotaractEvent } from '@/types';

interface ServiceHourLoggerProps {
  events: RotaractEvent[];
  onSubmit: (data: { eventId: string; eventTitle: string; hours: number; notes: string }) => Promise<void>;
}

export default function ServiceHourLogger({ events, onSubmit }: ServiceHourLoggerProps) {
  const [form, setForm] = useState({ eventId: '', hours: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const serviceEvents = events.filter((e) => e.type === 'service' || e.type === 'free');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hours) return;
    setSubmitting(true);
    try {
      await onSubmit({
        eventId: form.eventId || '',
        eventTitle: serviceEvents.find((ev) => ev.id === form.eventId)?.title || 'Other',
        hours: parseFloat(form.hours),
        notes: form.notes,
      });
      setForm({ eventId: '', hours: '', notes: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card padding="md">
      <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Log Service Hours</h3>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label="Event"
            options={serviceEvents.map((ev) => ({ value: ev.id, label: ev.title }))}
            placeholder="Select an event (optional)"
            value={form.eventId}
            onChange={(e) => setForm({ ...form, eventId: e.target.value })}
          />
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
        <Button type="submit" loading={submitting}>Submit Hours</Button>
      </form>
    </Card>
  );
}
