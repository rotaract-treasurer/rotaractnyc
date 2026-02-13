'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { apiPatch } from '@/hooks/useFirestore';
import { uploadFile, validateFile } from '@/lib/firebase/upload';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Avatar from '@/components/ui/Avatar';

interface ProfileFormProps {
  onSuccess?: () => void;
  onToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function ProfileForm({ onSuccess, onToast }: ProfileFormProps) {
  const { member } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    phone: '',
    linkedIn: '',
    committee: '',
    occupation: '',
    employer: '',
  });

  useEffect(() => {
    if (member) {
      setForm({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        bio: member.bio || '',
        phone: member.phone || '',
        linkedIn: member.linkedIn || '',
        committee: member.committee || '',
        occupation: member.occupation || '',
        employer: member.employer || '',
      });
    }
  }, [member]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPatch('/api/portal/profile', form);
      onToast?.('Profile updated!');
      onSuccess?.();
    } catch (err: any) {
      onToast?.(err.message || 'Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async () => {
    const file = photoRef.current?.files?.[0];
    if (!file || !member) return;
    const err = validateFile(file, { maxSizeMB: 5, allowedTypes: ['image/'] });
    if (err) { onToast?.(err, 'error'); return; }
    setUploading(true);
    try {
      const { url } = await uploadFile(file, 'profile-photos', member.id);
      await apiPatch('/api/portal/profile', { photoURL: url });
      onToast?.('Profile photo updated!');
    } catch (e: any) {
      onToast?.(e.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Photo */}
      <Card padding="md">
        <div className="flex items-center gap-6">
          <Avatar src={member?.photoURL} alt={member?.displayName || ''} size="xl" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{member?.displayName}</h3>
            <p className="text-sm text-gray-500">{member?.email}</p>
            <input type="file" ref={photoRef} accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <Button size="sm" variant="secondary" className="mt-3" loading={uploading} onClick={() => photoRef.current?.click()}>
              Change Photo
            </Button>
          </div>
        </div>
      </Card>

      {/* Form */}
      <Card padding="md">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <Textarea label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell the community about yourself..." rows={4} />
          <div className="grid sm:grid-cols-2 gap-5">
            <Input label="Occupation" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} placeholder="e.g., Software Engineer" />
            <Input label="Employer" value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} placeholder="e.g., Google" />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
            <Input label="LinkedIn URL" type="url" value={form.linkedIn} onChange={(e) => setForm({ ...form, linkedIn: e.target.value })} placeholder="https://linkedin.com/in/..." />
          </div>
          <Input label="Committee" value={form.committee} onChange={(e) => setForm({ ...form, committee: e.target.value })} placeholder="e.g., Service, Fellowship" />
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>Save Changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
