'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/hooks/useFirestore';
import { useAuth } from '@/lib/firebase/auth';
import { useToast } from '@/components/ui/Toast';
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
  const { member: currentMember } = useAuth();
  const isBoard = ['president', 'board', 'treasurer'].includes(currentMember?.role || '');

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
    <div className="max-w-3xl mx-auto space-y-6 page-enter">
      <button onClick={() => router.back()} className="group text-sm text-gray-500 hover:text-cranberry transition-colors flex items-center gap-1.5">
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Back to directory
      </button>

      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-6 sm:p-8">
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
              {isBoard && (member.whatsAppPhone || (member.whatsAppSameAsPhone && member.phone)) && (
                <a href={`https://wa.me/${(member.whatsAppSameAsPhone ? member.phone : member.whatsAppPhone)?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="secondary" className="!bg-green-50 !text-green-700 hover:!bg-green-100 dark:!bg-green-900/20 dark:!text-green-400">
                    <svg className="w-4 h-4 mr-1.5 inline" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.917.918l4.458-1.495A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.818-6.3-2.187l-.44-.358-3.095 1.037 1.037-3.095-.358-.44A9.95 9.95 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                    WhatsApp
                  </Button>
                </a>
              )}
              {member.linkedIn && (
                <a href={member.linkedIn} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="secondary">LinkedIn</Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-6">
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
        </div>

        {member.interests && member.interests.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-6">
            <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {member.interests.map((i) => (
                <Badge key={i} variant="azure">{i}</Badge>
              ))}
            </div>
          </div>
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
