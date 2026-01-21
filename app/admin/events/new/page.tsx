'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminSession } from '@/lib/admin/useAdminSession'
import LogisticsStep from './_components/LogisticsStep'
import ContentStep from './_components/ContentStep'
import RegistrationStep from './_components/RegistrationStep'
import WizardHeader from './_components/WizardHeader'
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
  
  // Registration
  requiresRegistration: boolean
  capacity?: number
  registrationDeadline?: string
  allowGuests: boolean
  memberPrice?: number
  guestPrice?: number
  
  // Meta
  status: 'published' | 'draft' | 'cancelled'
}

export default function NewEventWizard() {
  const router = useRouter()
  const session = useAdminSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
    requiresRegistration: true,
    allowGuests: true,
    status: 'draft',
  })

  const updateFormData = (updates: Partial<EventFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    if (currentStep < 3) {
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
      router.push('/admin/events')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    // Validate required fields
    if (!formData.title || !formData.description || !formData.startDate || !formData.startTime) {
      setError('Please fill in all required fields')
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <WizardHeader />
      
      <main className="flex-1 flex flex-col items-center py-12 px-4">
        {/* Headline */}
        <div className="max-w-4xl w-full text-center mb-8">
          <h1 className="text-slate-900 dark:text-white text-4xl font-bold tracking-tight mb-2">
            Configure Your Event
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Step {currentStep} of 3: {currentStep === 1 ? 'Setting the Foundation for Success' : currentStep === 2 ? 'Tell Your Story' : 'Manage Registrations'}
          </p>
        </div>

        {/* Wizard Container */}
        <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
          <WizardProgress currentStep={currentStep} />

          {/* Error Display */}
          {error && (
            <div className="mx-10 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
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
              <RegistrationStep formData={formData} updateFormData={updateFormData} />
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
        <div className="max-w-4xl w-full mt-10 flex gap-6 px-6">
          <div className="flex-1 flex gap-4 p-5 rounded-xl border border-primary/20 bg-primary/5">
            <span className="material-symbols-outlined text-primary">info</span>
            <div>
              <p className="text-slate-900 dark:text-white font-bold text-sm">Expert Tip</p>
              <p className="text-slate-500 text-xs leading-relaxed mt-1">
                {currentStep === 1 && 'Events with accurate locations get 40% higher RSVP rates. Make sure to provide detailed venue information.'}
                {currentStep === 2 && 'Events with engaging descriptions and quality images receive 60% more registrations.'}
                {currentStep === 3 && 'Setting early bird pricing can increase initial registrations by 35%.'}
              </p>
            </div>
          </div>
          <div className="flex-1 hidden md:flex gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="material-symbols-outlined text-slate-400">help_outline</span>
            <div>
              <p className="text-slate-900 dark:text-white font-bold text-sm">Need help?</p>
              <p className="text-slate-500 text-xs leading-relaxed mt-1">
                Contact the NYC District Tech Team for support with complex event setups or integrations.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs text-slate-400 font-medium">
          © 2024 Rotaract Club of New York City. Service Above Self.
        </p>
      </footer>
    </div>
  )
}
