'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/hooks/useFirestore';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import MessageModal from '@/components/portal/MessageModal';
import type { Member } from '@/types';

const roleColors: Record<string, 'cranberry' | 'gold' | 'azure' | 'gray'> = {
  president: 'cranberry',
  treasurer: 'gold',
  board: 'azure',
  member: 'gray',
};

export default function PortalMemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [msgOpen, setMsgOpen] = useState(false);

  const fetchMember = useCallback(async () => {
    try {
      const data = await apiGet(`/api/portal/members?id=${id}`);
      setMember(data);
    } catch {
      toast('Failed to load member profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  const handleSendMessage = async (data: { toId: string; subject: string; message: string }) => {
    await apiPost('/api/portal/messages', data);
    toast('Message sent!');
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!member) return (
    <div className="text-center py-20">
      <p className="text-gray-500 mb-4">Member not found.</p>
      <Button variant="secondary" onClick={() => router.push('/portal/directory')}>Back to Directory</Button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-cranberry transition-colors flex items-center gap-1">
        ← Back to directory
      </button>

      {/* Profile Header */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar src={member.photoURL} alt={member.displayName} size="xl" />
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">{member.displayName}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={roleColors[member.role] || 'gray'}>{member.role}</Badge>
              <Badge variant={member.status === 'active' ? 'green' : 'gray'}>{member.status}</Badge>
            </div>
            {member.bio && (
              <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{member.bio}</p>
            )}
            <div className="flex gap-3 mt-4">
              <Button size="sm" onClick={() => setMsgOpen(true)}>Message</Button>
              {member.linkedIn && (
                <a href={member.linkedIn} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="secondary">LinkedIn</Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Details */}
      <div className="grid sm:grid-cols-2 gap-6">
        <Card padding="md">
          <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Information</h3>
          <dl className="space-y-3 text-sm">
            {member.email && (
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-900 dark:text-white">{member.email}</dd>
              </div>
            )}
            {member.committee && (
              <div>
                <dt className="text-gray-500">Committee</dt>
                <dd className="text-gray-900 dark:text-white">{member.committee}</dd>
              </div>
            )}
            {member.occupation && (
              <div>
                <dt className="text-gray-500">Occupation</dt>
                <dd className="text-gray-900 dark:text-white">
                  {member.occupation}{member.employer ? ` at ${member.employer}` : ''}
                </dd>
              </div>
            )}
            {member.memberType && (
              <div>
                <dt className="text-gray-500">Membership Type</dt>
                <dd className="text-gray-900 dark:text-white capitalize">{member.memberType}</dd>
              </div>
            )}
          </dl>
        </Card>

        {member.interests && member.interests.length > 0 && (
          <Card padding="md">
            <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {member.interests.map((i) => (
                <Badge key={i} variant="azure">{i}</Badge>
              ))}
            </div>
          </Card>
        )}
      </div>

      <MessageModal
        open={msgOpen}
        onClose={() => setMsgOpen(false)}
        recipientName={member.displayName}
        recipientId={member.id}
        onSend={handleSendMessage}
      />
    </div>
  );
}
