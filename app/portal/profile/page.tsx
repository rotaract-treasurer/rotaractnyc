'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Avatar from '@/components/ui/Avatar';

export default function ProfilePage() {
  const { member } = useAuth();
  const [form, setForm] = useState({
    firstName: member?.firstName || '',
    lastName: member?.lastName || '',
    bio: member?.bio || '',
    phone: member?.phone || '',
    linkedIn: member?.linkedIn || '',
    committee: member?.committee || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // TODO: Save to Firestore
    setTimeout(() => setSaving(false), 1000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Profile Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Update your profile information visible to other members.</p>
      </div>

      {/* Photo */}
      <Card padding="md">
        <div className="flex items-center gap-6">
          <Avatar src={member?.photoURL} alt={member?.displayName || ''} size="xl" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{member?.displayName}</h3>
            <p className="text-sm text-gray-500">{member?.email}</p>
            <Button size="sm" variant="secondary" className="mt-3">Change Photo</Button>
          </div>
        </div>
      </Card>

      {/* Form */}
      <Card padding="md">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <Input
              label="First Name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <Input
              label="Last Name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <Textarea
            label="Bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell the community about yourself..."
            rows={4}
          />
          <div className="grid sm:grid-cols-2 gap-5">
            <Input
              label="Phone (optional)"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
            />
            <Input
              label="LinkedIn URL"
              type="url"
              value={form.linkedIn}
              onChange={(e) => setForm({ ...form, linkedIn: e.target.value })}
              placeholder="https://linkedin.com/in/..."
            />
          </div>
          <Input
            label="Committee"
            value={form.committee}
            onChange={(e) => setForm({ ...form, committee: e.target.value })}
            placeholder="e.g., Service, Fellowship, Communications"
          />

          <div className="flex justify-end">
            <Button type="submit" loading={saving}>Save Changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
