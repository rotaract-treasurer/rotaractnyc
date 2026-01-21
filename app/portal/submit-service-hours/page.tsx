'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, limit, Timestamp, addDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getFirebaseClientApp } from '@/lib/firebase/client';
import { Event, ServiceHourSubmission } from '@/types/portal';

interface FormData {
  eventId: string;
  eventName: string;
  hours: number;
  date: Date;
  notes: string;
}

export default function SubmitServiceHoursPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [events, setEvents] = useState<Event[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<ServiceHourSubmission[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    eventId: '',
    eventName: '',
    hours: 2,
    date: new Date(),
    notes: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/portal/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      loadRecentEvents();
      loadRecentSubmissions();
    }
  }, [user]);

  const loadRecentEvents = async () => {
    const app = getFirebaseClientApp();
    if (!app) return;

    const db = getFirestore(app);
    
    try {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const eventsRef = collection(db, 'events');
      const eventsQuery = query(
        eventsRef,
        where('startAt', '>=', Timestamp.fromDate(sixtyDaysAgo)),
        orderBy('startAt', 'desc'),
        limit(10)
      );
      
      const snapshot = await getDocs(eventsQuery);
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadRecentSubmissions = async () => {
    if (!user) return;
    
    const app = getFirebaseClientApp();
    if (!app) return;

    const db = getFirestore(app);
    
    try {
      const hoursRef = collection(db, 'serviceHours');
      const hoursQuery = query(
        hoursRef,
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      
      const snapshot = await getDocs(hoursQuery);
      const submissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceHourSubmission[];
      
      setRecentSubmissions(submissions);
    } catch (error) {
      console.error('Error loading recent submissions:', error);
    }
  };

  const handleEventSelect = (event: Event | null, isCustom: boolean = false) => {
    if (isCustom) {
      setFormData({
        ...formData,
        eventId: 'other',
        eventName: '',
        date: new Date(),
      });
    } else if (event) {
      setFormData({
        ...formData,
        eventId: event.id,
        eventName: event.title,
        date: event.startAt.toDate(),
      });
    }
    setStep(2);
  };

  const adjustHours = (delta: number) => {
    const newHours = Math.max(0.5, Math.min(24, formData.hours + delta));
    setFormData({ ...formData, hours: newHours });
  };

  const handleSubmit = async () => {
    if (!user || !formData.eventName || formData.hours <= 0) return;

    setSubmitting(true);
    
    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/portal/service-hours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: formData.eventId,
          eventName: formData.eventName,
          hours: formData.hours,
          date: formData.date.toISOString(),
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit service hours');
      }

      // Success - redirect to portal
      router.push('/portal?submitted=true');
    } catch (error) {
      console.error('Error submitting service hours:', error);
      alert('Failed to submit service hours. Please try again.');
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.push('/portal');
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Which event did you attend?';
      case 2:
        return 'How many hours did you contribute?';
      case 3:
        return 'Review your submission';
      default:
        return '';
    }
  };

  const getStepName = () => {
    switch (step) {
      case 1:
        return 'Select Event';
      case 2:
        return 'Log Time';
      case 3:
        return 'Review';
      default:
        return '';
    }
  };

  const progressPercentage = (step / 3) * 100;

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Sidebar: Recent Activity */}
      <aside className="w-80 border-r border-navy/5 dark:border-white/5 bg-white dark:bg-background-dark flex flex-col p-6 overflow-y-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined">diamond</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-navy dark:text-white">Rotaract NYC</h2>
        </div>
        
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-navy/40 dark:text-white/40 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentSubmissions.length > 0 ? (
              recentSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="p-4 rounded-xl border border-navy/5 bg-background-light dark:bg-white/5 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-bold text-navy dark:text-white">
                      {submission.eventName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        submission.status === 'approved'
                          ? 'bg-primary/20 text-primary'
                          : submission.status === 'rejected'
                          ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                          : 'bg-navy/10 text-navy dark:bg-white/10 dark:text-white/80'
                      }`}
                    >
                      {submission.status}
                    </span>
                  </div>
                  <p className="text-xs text-navy/60 dark:text-white/60">
                    {submission.date.toDate().toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    • {submission.hours} {submission.hours === 1 ? 'Hour' : 'Hours'}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl border border-navy/5 bg-background-light dark:bg-white/5 text-center">
                <p className="text-sm text-navy/60 dark:text-white/60">
                  No submissions yet
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-auto space-y-2">
          <button
            onClick={() => router.push('/portal')}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-navy/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-navy/60 dark:text-white/60">
              dashboard
            </span>
            <span className="text-sm font-medium text-navy dark:text-white">
              Back to Portal
            </span>
          </button>
          <button
            onClick={() => router.push('/portal/settings')}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-navy/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-navy/60 dark:text-white/60">
              account_circle
            </span>
            <span className="text-sm font-medium text-navy dark:text-white">
              My Profile
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content: Focused Wizard */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 bg-background-light dark:bg-background-dark relative overflow-hidden">
        {/* Subtle background elements */}
        <div className="absolute top-[-10%] right-[-10%] size-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] size-80 bg-navy/5 rounded-full blur-3xl"></div>
        
        <div className="w-full max-w-2xl z-10">
          {/* Progress Header */}
          <div className="mb-8 flex flex-col items-center">
            <h1 className="text-3xl font-extrabold mb-2 text-navy dark:text-white">
              Log Your Impact
            </h1>
            <p className="text-navy/50 dark:text-white/50 text-center max-w-sm">
              Every minute matters. Share your latest service contribution with the club.
            </p>
          </div>

          {/* Focus Card */}
          <div className="bg-white dark:bg-[#1c222b] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10 border border-navy/5 dark:border-white/5">
            {/* Progress Bar */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-3 text-xs font-bold uppercase tracking-widest text-primary">
                <span>Step {step} of 3</span>
                <span>{getStepName()}</span>
              </div>
              <div className="h-1.5 w-full bg-navy/5 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Step Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-6 text-center text-navy dark:text-white">
                  {getStepTitle()}
                </h2>

                {/* Step 1: Event Selection */}
                {step === 1 && (
                  <div className="grid grid-cols-1 gap-4">
                    {loadingEvents ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      </div>
                    ) : (
                      <>
                        {events.slice(0, 3).map((event) => (
                          <button
                            key={event.id}
                            onClick={() => handleEventSelect(event)}
                            className={`flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                              formData.eventId === event.id
                                ? 'border-primary bg-primary/5'
                                : 'border-navy/10 dark:border-white/10 hover:border-primary/50'
                            } group`}
                          >
                            <div
                              className={`size-12 rounded-lg flex items-center justify-center ${
                                formData.eventId === event.id
                                  ? 'bg-primary text-white'
                                  : 'bg-navy/5 dark:bg-white/5 text-navy/60 dark:text-white/60 group-hover:bg-primary/10 group-hover:text-primary'
                              }`}
                            >
                              <span className="material-symbols-outlined">nature_people</span>
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-navy dark:text-white">
                                {event.title}
                              </p>
                              <p className="text-xs text-navy/60 dark:text-white/60">
                                {event.startAt.toDate().toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                            {formData.eventId === event.id && (
                              <span className="material-symbols-outlined text-primary">
                                check_circle
                              </span>
                            )}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => handleEventSelect(null, true)}
                          className="flex items-center gap-4 p-5 rounded-xl border border-navy/10 dark:border-white/10 hover:border-primary/50 text-left transition-all group"
                        >
                          <div className="size-12 rounded-lg bg-navy/5 dark:bg-white/5 flex items-center justify-center text-navy/60 dark:text-white/60 group-hover:bg-primary/10 group-hover:text-primary">
                            <span className="material-symbols-outlined">more_horiz</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-navy dark:text-white">
                              Other Club Activity
                            </p>
                            <p className="text-xs text-navy/60 dark:text-white/60">
                              Specify event name
                            </p>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Step 2: Log Hours */}
                {step === 2 && (
                  <div className="space-y-6">
                    {formData.eventId === 'other' && (
                      <div>
                        <label className="block text-sm font-bold mb-2 text-navy dark:text-white">
                          Event Name
                        </label>
                        <input
                          type="text"
                          value={formData.eventName}
                          onChange={(e) =>
                            setFormData({ ...formData, eventName: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy/20 text-navy dark:text-white focus:outline-none focus:border-primary"
                          placeholder="Enter event name"
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-bold mb-2 text-navy dark:text-white">
                        Date
                      </label>
                      <input
                        type="date"
                        value={formData.date.toISOString().split('T')[0]}
                        onChange={(e) =>
                          setFormData({ ...formData, date: new Date(e.target.value) })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy/20 text-navy dark:text-white focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-background-light dark:bg-navy/20 p-6 rounded-xl">
                      <button
                        onClick={() => adjustHours(-0.5)}
                        className="size-12 rounded-full bg-white dark:bg-navy shadow-sm flex items-center justify-center text-navy dark:text-white hover:scale-105 transition-transform"
                      >
                        <span className="material-symbols-outlined">remove</span>
                      </button>
                      <div className="text-center">
                        <span className="text-4xl font-black text-navy dark:text-white">
                          {formData.hours}
                        </span>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-navy/40 dark:text-white/40">
                          Hours
                        </p>
                      </div>
                      <button
                        onClick={() => adjustHours(0.5)}
                        className="size-12 rounded-full bg-white dark:bg-navy shadow-sm flex items-center justify-center text-navy dark:text-white hover:scale-105 transition-transform"
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review and Notes */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-xl bg-background-light dark:bg-navy/20 space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-navy/60 dark:text-white/60">
                          Event
                        </span>
                        <span className="text-base font-bold text-navy dark:text-white text-right">
                          {formData.eventName}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-navy/60 dark:text-white/60">
                          Date
                        </span>
                        <span className="text-base font-bold text-navy dark:text-white">
                          {formData.date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-navy/60 dark:text-white/60">
                          Hours
                        </span>
                        <span className="text-base font-bold text-primary">
                          {formData.hours} {formData.hours === 1 ? 'hour' : 'hours'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2 text-navy dark:text-white">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy/20 text-navy dark:text-white focus:outline-none focus:border-primary resize-none"
                        rows={4}
                        placeholder="Share any additional details about your service..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  onClick={goBack}
                  disabled={submitting}
                  className="flex-1 h-14 rounded-xl border-2 border-navy/5 dark:border-white/5 font-bold hover:bg-navy/5 dark:hover:bg-white/5 transition-colors text-navy dark:text-white disabled:opacity-50"
                >
                  {step === 1 ? 'Cancel' : 'Back'}
                </button>
                <button
                  onClick={() => {
                    if (step < 3) {
                      if (step === 2 && formData.eventId === 'other' && !formData.eventName) {
                        alert('Please enter an event name');
                        return;
                      }
                      setStep(step + 1);
                    } else {
                      handleSubmit();
                    }
                  }}
                  disabled={
                    submitting ||
                    (step === 1 && !formData.eventId) ||
                    (step === 2 && formData.eventId === 'other' && !formData.eventName)
                  }
                  className="flex-[2] h-14 bg-primary text-navy font-extrabold rounded-xl shadow-lg shadow-primary/20 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-navy"></div>
                      Submitting...
                    </>
                  ) : step === 3 ? (
                    <>
                      Submit
                      <span className="material-symbols-outlined">check</span>
                    </>
                  ) : (
                    <>
                      Next Step
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Hint */}
          <p className="mt-8 text-center text-navy/30 dark:text-white/30 text-sm font-medium">
            Questions? Contact the{' '}
            <a
              href="mailto:service@rotaractnyc.org"
              className="underline decoration-primary underline-offset-4 hover:text-primary transition-colors"
            >
              Service Chair
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
