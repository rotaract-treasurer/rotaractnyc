'use client';

import { useAuth } from '@/lib/firebase/auth';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { getFirebaseClientApp } from '@/lib/firebase/client';
import { User } from '@/types/portal';

export default function MemberProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const router = useRouter();
  const { loading } = useAuth();
  const [member, setMember] = useState<User | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading) {
      loadMember();
    }
  }, [loading, uid]);

  const loadMember = async () => {
    const app = getFirebaseClientApp();
    if (!app) return;

    const db = getFirestore(app);
    
    try {
      const memberDoc = await getDoc(doc(db, 'users', uid));
      if (memberDoc.exists()) {
        setMember({
          uid: memberDoc.id,
          ...memberDoc.data()
        } as User);
      }
    } catch (error) {
      console.error('Error loading member:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">person_off</span>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Member not found</p>
          <button
            onClick={() => router.push('/portal/directory')}
            className="mt-4 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors"
          >
            Back to Directory
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.push('/portal/directory')}
        className="flex items-center gap-2 text-slate-600 hover:text-primary mb-6 transition-colors"
      >
        <span className="material-symbols-outlined">arrow_back</span>
        <span className="font-semibold">Back to Directory</span>
      </button>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg mb-6">
        {/* Banner Background */}
        <div className="h-32 bg-gradient-to-br from-primary to-primary-dark relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        </div>

        {/* Profile Content */}
        <div className="px-6 sm:px-8 pb-8">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4">
            <div className="inline-block">
              {member.photoURL ? (
                <img
                  src={member.photoURL}
                  alt={member.name}
                  className="w-32 h-32 rounded-2xl border-4 border-white dark:border-surface-dark object-cover shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl border-4 border-white dark:border-surface-dark bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-xl">
                  <span className="text-5xl font-bold text-white">
                    {member.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Name & Role */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {member.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-semibold">
                  {member.role === 'BOARD' ? 'Board Member' : 
                   member.role === 'TREASURER' ? 'Treasurer' : 
                   member.role === 'ADMIN' ? 'Administrator' : 'Member'}
                </span>
                {member.committee && (
                  <span className="inline-flex items-center px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold">
                    <span className="material-symbols-outlined text-sm mr-1">group</span>
                    {member.committee}
                  </span>
                )}
                <span className="inline-flex items-center px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-semibold">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Active
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <a
                href={`mailto:${member.email}`}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-lg">mail</span>
                Send Message
              </a>
              {member.linkedin && (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-[#0077b5] hover:border-[#0077b5] rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined">link</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Card */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">contact_mail</span>
              Contact Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-slate-400 mt-0.5">mail</span>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                  <a href={`mailto:${member.email}`} className="text-slate-900 dark:text-white hover:text-primary font-medium">
                    {member.email}
                  </a>
                </div>
              </div>
              {member.phone && (
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-slate-400 mt-0.5">phone</span>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                    <a href={`tel:${member.phone}`} className="text-slate-900 dark:text-white hover:text-primary font-medium">
                      {member.phone}
                    </a>
                  </div>
                </div>
              )}
              {member.linkedin && (
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-slate-400 mt-0.5">link</span>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">LinkedIn</p>
                    <a 
                      href={member.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-900 dark:text-white hover:text-primary font-medium"
                    >
                      View Profile
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bio Section */}
          {member.bio && (
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                About
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {member.bio}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar - Member Info */}
        <div className="space-y-6">
          {/* Member Since */}
          {member.joinedAt && (
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                Member Since
              </h3>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {new Date(member.joinedAt.toDate()).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}
              </p>
            </div>
          )}

          {/* Interests/Skills */}
          {member.interests && member.interests.length > 0 && (
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {member.interests.map((interest, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-semibold"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
              Member Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                  {member.status}
                </p>
              </div>
              {member.committee && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Committee</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {member.committee}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
