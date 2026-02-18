'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { apiPatch, apiGet } from '@/hooks/useFirestore';
import { uploadFile, validateFile } from '@/lib/firebase/upload';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Avatar from '@/components/ui/Avatar';
import PhoneInput from '@/components/ui/PhoneInput';
import SelectWithOther from '@/components/ui/SelectWithOther';
import { toSelectOptions, DEFAULT_COMMITTEES, DEFAULT_OCCUPATIONS } from '@/lib/profileOptions';

interface ProfileFormProps {
  onSuccess?: () => void;
  onToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function ProfileForm({ onSuccess, onToast }: ProfileFormProps) {
  const { member } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const [committeeOpts, setCommitteeOpts] = useState(() => toSelectOptions(DEFAULT_COMMITTEES));
  const [occupationOpts, setOccupationOpts] = useState(() => toSelectOptions(DEFAULT_OCCUPATIONS));

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    phone: '',
    linkedIn: '',
    committee: '',
    occupation: '',
    employer: '',
    whatsAppPhone: '',
    whatsAppSameAsPhone: false,
  });

  // Fetch admin-configured dropdown options
  useEffect(() => {
    apiGet('/api/portal/settings/profile-options')
      .then((data: { committees?: string[]; occupations?: string[] }) => {
        if (data.committees?.length) setCommitteeOpts(toSelectOptions(data.committees));
        if (data.occupations?.length) setOccupationOpts(toSelectOptions(data.occupations));
      })
      .catch(() => {/* keep defaults */});
  }, []);

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
        whatsAppPhone: member.whatsAppPhone || '',
        whatsAppSameAsPhone: member.whatsAppSameAsPhone ?? false,
      });
    }
  }, [member]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPatch('/api/portal/profile', {
        ...form,
        whatsAppPhone: form.whatsAppSameAsPhone ? '' : form.whatsAppPhone,
      });
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
        <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Profile Photo</h3>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Avatar src={member?.photoURL} alt={member?.displayName || ''} size="xl" />
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{member?.displayName}</p>
            <p className="text-sm text-gray-500 mt-0.5">{member?.email}</p>
            <input type="file" ref={photoRef} accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <Button size="sm" variant="secondary" className="mt-3" loading={uploading} onClick={() => photoRef.current?.click()}>
              Change Photo
            </Button>
          </div>
        </div>
      </Card>

      {/* Form */}
      <Card padding="md">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <h3 className="font-display font-bold text-gray-900 dark:text-white mb-1">Personal Information</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Your basic information displayed in the member directory.</p>
            <div className="grid sm:grid-cols-2 gap-5">
              <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <h3 className="font-display font-bold text-gray-900 dark:text-white mb-1">About</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Tell other members a bit about yourself.</p>
            <Textarea label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell the community about yourself..." rows={4} />
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <h3 className="font-display font-bold text-gray-900 dark:text-white mb-1">Professional Details</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Your professional background.</p>
            <div className="grid sm:grid-cols-2 gap-5">
              <SelectWithOther
                label="Occupation"
                options={occupationOpts}
                value={form.occupation}
                onChange={(v) => setForm({ ...form, occupation: v })}
                placeholder="Enter your occupation..."
              />
              <Input label="Employer" value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} placeholder="e.g., Google" />
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <h3 className="font-display font-bold text-gray-900 dark:text-white mb-1">Contact & Social</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">How members can reach you.</p>
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <PhoneInput label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                <Input label="LinkedIn URL" type="url" value={form.linkedIn} onChange={(e) => setForm({ ...form, linkedIn: e.target.value })} placeholder="https://linkedin.com/in/..." />
              </div>
              {/* WhatsApp */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.917.918l4.458-1.495A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.818-6.3-2.187l-.44-.358-3.095 1.037 1.037-3.095-.358-.44A9.95 9.95 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                      WhatsApp Number
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Board members can contact you via WhatsApp.</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-gray-500">Same as phone</span>
                    <input
                      type="checkbox"
                      checked={form.whatsAppSameAsPhone}
                      onChange={(e) => setForm({ ...form, whatsAppSameAsPhone: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-cranberry focus:ring-cranberry"
                    />
                  </label>
                </div>
                {!form.whatsAppSameAsPhone && (
                  <PhoneInput
                    label="WhatsApp Phone"
                    value={form.whatsAppPhone}
                    onChange={(v) => setForm({ ...form, whatsAppPhone: v })}
                    placeholder="WhatsApp number"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <SelectWithOther
              label="Committee"
              options={committeeOpts}
              value={form.committee}
              onChange={(v) => setForm({ ...form, committee: v })}
              placeholder="Enter your committee..."
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={saving}>Save Changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
