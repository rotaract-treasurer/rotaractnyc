'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminSession } from '@/lib/admin/useAdminSession'
import LogisticsStep from './_components/LogisticsStep'
import ContentStep from './_components/ContentStep'
import PricingStep from './_components/PricingStep'
import WizardProgress from './_components/WizardProgress'
import WizardFooter from './_components/WizardFooter'

export type EventFormData = {
  // Logistics
  title: string
  venueType: 'physical' | 'virtual' | 'hybrid'
  location: string
  virtualLink?: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  timezone: string
  
  // Content
  description: string
  imageUrl: string
  category: 'upcoming' | 'past'
  visibility: 'public' | 'member' | 'board'
  tags?: string[]
  adminNotes?: string
  
  // Pricing & Registration (Enhanced)
  eventType: 'free' | 'paid' | 'service' | 'hybrid'
  requiresRegistration: boolean
  capacity?: number
  registrationDeadline?: string
  allowGuests: boolean
  
  // Paid event pricing
  memberPrice?: number
  memberEarlyBirdPrice?: number
  earlyBirdDeadline?: string
  guestPrice?: number
  guestEarlyBirdPrice?: number
  
  // Service event details
  serviceHours?: number
  serviceDescription?: string
  
  // Meta
  status: 'published' | 'draft' | 'cancelled'
}

export default function NewEventWizard() {
  const router = useRouter()
  const session = useAdminSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    venueType: 'physical',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    timezone: 'America/New_York',
    description: '',
    imageUrl: '',
    category: 'upcoming',
    visibility: 'member',
    eventType: 'free',
    requiresRegistration: true,
    allowGuests: true,
    status: 'draft',
  })

  const updateFormData = (updates: Partial<EventFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setHasUnsavedChanges(true)
  }

  // Auto-save draft every 30 seconds if there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges && !isSaving) {
        handleAutoSave()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [hasUnsavedChanges, isSaving])

  const handleAutoSave = useCallback(async () => {
    if (!formData.title) return // Don't auto-save if no title

    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'draft',
        }),
      })
      
      if (response.ok) {
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
      }
    } catch (err) {
      // Silently fail auto-save
      console.error('Auto-save failed:', err)
    }
  }, [formData])

  const handleNext = () => {
    setError(null)
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'draft',
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save draft')
      }
      
      const result = await response.json()
      setSuccess('Draft saved successfully!')
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      setTimeout(() => router.push('/admin/events'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft')
    } finally {
      setIsSaving(false)
    }
  }

  const validateForm = () => {
    const errors: string[] = []
    if (!formData.title) errors.push('Event Title')
    if (!formData.description) errors.push('Description')
    if (!formData.startDate) errors.push('Start Date')
    if (!formData.startTime) errors.push('Start Time')
    if (formData.venueType !== 'virtual' && !formData.location) errors.push('Physical Location')
    
    if (errors.length > 0) {
      setError(`Missing required fields: ${errors.join(', ')}`)
      return false
    }
    return true
  }

  const handlePublish = async () => {
    if (!validateForm()) {
      return
    }
    
    setIsSaving(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'published',
        }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to publish event')
      }
      
      const result = await response.json()
      router.push('/admin/events')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish event')
    } finally {
      setIsSaving(false)
    }
  }

  if (!session) {
    return null
  }

  return (
    <div className="space-y-8">
        {/* Page Header */}
        <div className="bg-white/80 dark:bg-slate-950/70 border-b border-slate-200/70 dark:border-slate-800/70 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  <span>Admin</span>
                  <span className="text-slate-300 dark:text-slate-700">/</span>
                  <span>Events</span>
                  <span className="text-slate-300 dark:text-slate-700">/</span>
                  <span className="text-primary">New</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create New Event</h1>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                    Draft
                  </span>
                </div>
                <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm max-w-2xl">
                  Set up a new event with our streamlined wizard. Complete all required fields to publish your event to members.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  {lastSaved && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Last saved {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                  {hasUnsavedChanges && !isSaving && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      <span className="material-symbols-outlined text-sm">pending</span>
                      Unsaved changes
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/admin/events')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200/70 dark:border-slate-800/70 bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 flex flex-col items-center py-10 px-4">
          {/* Wizard Container */}
          <div className="max-w-5xl w-full bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-black/30 border border-slate-200/60 dark:border-slate-800/80 overflow-hidden flex flex-col">
            <WizardProgress currentStep={currentStep} />

          {/* Success Display */}
          {success && (
            <div className="mx-10 mt-6 p-4 bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/70 dark:border-emerald-800/70 rounded-2xl flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
              <p className="text-green-800 dark:text-green-200 text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mx-10 mt-6 p-4 bg-red-50/80 dark:bg-red-900/20 border border-red-200/70 dark:border-red-800/70 rounded-2xl flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Step Content */}
          <div className="p-10">
            {currentStep === 1 && (
              <LogisticsStep formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 2 && (
              <ContentStep formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 3 && (
              <PricingStep formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 4 && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-primary">fact_check</span>
                    Review & Publish
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Review your event details before publishing. You can still edit after publishing.
                  </p>
                </div>

                {/* Summary cards */}
                <div className="space-y-4">
                  <div className="p-6 rounded-2xl border border-slate-200/70 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/70 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">Event Details</h3>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {formData.venueType.toUpperCase()}
                      </span>
                    </div>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">Title</dt>
                        <dd className="font-semibold text-slate-900 dark:text-white">{formData.title || 'Untitled event'}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">Type</dt>
                        <dd className="font-semibold text-slate-900 dark:text-white capitalize">{formData.eventType}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">Date</dt>
                        <dd className="font-semibold text-slate-900 dark:text-white">{formData.startDate || 'TBD'}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">Time</dt>
                        <dd className="font-semibold text-slate-900 dark:text-white">{formData.startTime || 'TBD'}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">Location</dt>
                        <dd className="font-semibold text-slate-900 dark:text-white">{formData.location || formData.virtualLink || 'TBD'}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">Visibility</dt>
                        <dd className="font-semibold text-slate-900 dark:text-white capitalize">{formData.visibility}</dd>
                      </div>
                    </dl>
                  </div>

                  {formData.eventType === 'paid' && (
                    <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 shadow-sm">
                      <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Pricing</h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="text-slate-500 dark:text-slate-400">Member Price</dt>
                          <dd className="font-bold text-xl text-primary">${formData.memberPrice?.toFixed(2) || '0.00'}</dd>
                        </div>
                        {formData.allowGuests && (
                          <div>
                            <dt className="text-slate-500 dark:text-slate-400">Guest Price</dt>
                            <dd className="font-bold text-xl text-slate-700 dark:text-slate-300">${formData.guestPrice?.toFixed(2) || '0.00'}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {formData.eventType === 'service' && (
                    <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 shadow-sm">
                      <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Service Info</h3>
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="text-slate-500 dark:text-slate-400">Service Hours</dt>
                          <dd className="font-bold text-xl text-primary">{formData.serviceHours || 0} hours</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500 dark:text-slate-400">Description</dt>
                          <dd className="text-slate-900 dark:text-white">{formData.serviceDescription || 'No description provided.'}</dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <WizardFooter
            currentStep={currentStep}
            onBack={handleBack}
            onNext={handleNext}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            isSaving={isSaving}
          />
        </div>

        {/* Helpful Tips */}
        <div className="max-w-5xl w-full mt-8 mb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3 p-5 rounded-2xl border border-primary/20 bg-white/80 dark:bg-slate-900/80 shadow-sm">
            <span className="material-symbols-outlined text-primary text-xl">lightbulb</span>
            <div>
              <p className="text-slate-900 dark:text-white font-bold text-sm">Expert Tip</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mt-1">
                {currentStep === 1 && 'Events with accurate locations get 40% higher RSVP rates. Make sure to provide detailed venue information.'}
                {currentStep === 2 && 'Events with engaging descriptions and quality images receive 60% more registrations.'}
                {currentStep === 3 && 'Consider setting early bird pricing to boost initial registrations and member discounts to encourage membership renewals.'}
                {currentStep === 4 && 'Take a moment to review all details. You can edit the event after publishing if needed.'}
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/80 shadow-sm">
            <span className="material-symbols-outlined text-slate-400 text-xl">help</span>
            <div>
              <p className="text-slate-900 dark:text-white font-bold text-sm">Need Help?</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mt-1">
                Contact the tech team for support with event setups or integrations.
              </p>
            </div>
          </div>
        </div>
        </main>
    </div>
  )
}
