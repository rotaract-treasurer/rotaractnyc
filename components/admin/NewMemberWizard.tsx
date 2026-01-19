'use client'

import { useState } from 'react'

interface NewMemberFormData {
  // Step 1: Basic Profile
  firstName: string
  lastName: string
  email: string
  phone: string
  occupation: string
  photoFile: File | null
  
  // Step 2: Roles
  membershipType: 'active' | 'honorary' | 'alumni'
  group: 'board' | 'member'
  title: string
  role: string
  
  // Step 3: Dues
  duesStatus: 'paid' | 'unpaid' | 'waived'
  joinDate: string
  duesAmount?: number
}

interface NewMemberWizardProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: NewMemberFormData) => Promise<void>
}

export default function NewMemberWizard({ isOpen, onClose, onSubmit }: NewMemberWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<NewMemberFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    occupation: '',
    photoFile: null,
    membershipType: 'active',
    group: 'member',
    title: '',
    role: '',
    duesStatus: 'unpaid',
    joinDate: new Date().toISOString().split('T')[0],
  })

  if (!isOpen) return null

  const updateFormData = (field: keyof NewMemberFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      updateFormData('photoFile', file)
    }
  }

  const isStep1Valid = formData.firstName && formData.lastName && formData.email
  const isStep2Valid = formData.role
  const isStep3Valid = true // All fields optional or have defaults

  return (
    <>
      {/* Scrim / Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
        <div className="relative w-full max-w-[640px] bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-auto max-h-[90vh] pointer-events-auto">
          
          {/* Header & Stepper */}
          <div className="px-8 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-rotaract-blue">person_add</span>
                  New Member Onboarding
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                  Administrative Panel • Rotaract NYC
                </p>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Stepper Component */}
            <div className="flex items-center gap-2 w-full mb-2">
              <div className="flex-1 flex flex-col gap-2">
                <div className={`h-1.5 w-full rounded-full ${currentStep >= 1 ? 'bg-rotaract-blue' : 'bg-slate-200 dark:bg-slate-700'}`} />
                <span className={`text-[10px] font-bold uppercase ${currentStep >= 1 ? 'text-rotaract-blue' : 'text-slate-400 dark:text-slate-600'}`}>
                  1. Basic Profile
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div className={`h-1.5 w-full rounded-full ${currentStep >= 2 ? 'bg-rotaract-blue' : 'bg-slate-200 dark:bg-slate-700'}`} />
                <span className={`text-[10px] font-bold uppercase ${currentStep >= 2 ? 'text-rotaract-blue' : 'text-slate-400 dark:text-slate-600'}`}>
                  2. Roles
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div className={`h-1.5 w-full rounded-full ${currentStep >= 3 ? 'bg-rotaract-blue' : 'bg-slate-200 dark:bg-slate-700'}`} />
                <span className={`text-[10px] font-bold uppercase ${currentStep >= 3 ? 'text-rotaract-blue' : 'text-slate-400 dark:text-slate-600'}`}>
                  3. Dues
                </span>
              </div>
            </div>
          </div>

          {/* Content Area (Scrollable) */}
          <div className="px-8 py-6 overflow-y-auto flex-1 custom-scrollbar">
            {currentStep === 1 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Step 1: Basic Profile
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Enter the member's core identification and contact details for the club database.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Name Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => updateFormData('firstName', e.target.value)}
                        className="w-full px-4 py-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-rotaract-blue focus:border-rotaract-blue outline-none transition-all placeholder:text-slate-400"
                        placeholder="e.g. Alexander"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => updateFormData('lastName', e.target.value)}
                        className="w-full px-4 py-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-rotaract-blue focus:border-rotaract-blue outline-none transition-all placeholder:text-slate-400"
                        placeholder="e.g. Hamilton"
                      />
                    </div>
                  </div>

                  {/* Email Row */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      Email Address <span className="text-red-500">*</span>
                      <span className="text-[10px] text-rotaract-blue font-bold uppercase tracking-tighter">
                        Verified on submission
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-rotaract-blue focus:border-rotaract-blue outline-none transition-all placeholder:text-slate-400"
                        placeholder="a.hamilton@columbia.edu"
                      />
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                        mail
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        className="w-full px-4 py-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-rotaract-blue focus:border-rotaract-blue outline-none transition-all placeholder:text-slate-400"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        Occupation
                        <span 
                          className="material-symbols-outlined text-slate-400 text-[14px] cursor-help" 
                          title="Current professional role or field of study"
                        >
                          info
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.occupation}
                        onChange={(e) => updateFormData('occupation', e.target.value)}
                        className="w-full px-4 py-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-rotaract-blue focus:border-rotaract-blue outline-none transition-all placeholder:text-slate-400"
                        placeholder="e.g. Financial Analyst"
                      />
                    </div>
                  </div>

                  {/* Profile Photo */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 overflow-hidden">
                        {formData.photoFile ? (
                          <img 
                            src={URL.createObjectURL(formData.photoFile)} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400 text-2xl">add_a_photo</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Profile Picture
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Square JPG or PNG, max 2MB.
                        </p>
                        <label className="mt-1 text-xs font-bold text-rotaract-blue hover:underline cursor-pointer">
                          Upload photo
                          <input
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Step 2: Roles & Positions
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Assign membership type, organizational group, and responsibilities.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Membership Type */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Membership Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['active', 'honorary', 'alumni'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => updateFormData('membershipType', type)}
                          className={`px-4 py-3 rounded border text-sm font-semibold transition-all ${
                            formData.membershipType === type
                              ? 'bg-rotaract-blue text-white border-rotaract-blue'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rotaract-blue'
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Group */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Group <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['board', 'member'] as const).map((group) => (
                        <button
                          key={group}
                          type="button"
                          onClick={() => updateFormData('group', group)}
                          className={`px-4 py-3 rounded border text-sm font-semibold transition-all ${
                            formData.group === group
                              ? 'bg-rotaract-blue text-white border-rotaract-blue'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rotaract-blue'
                          }`}
                        >
                          {group === 'board' ? 'Board Member' : 'General Member'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title (if Board) */}
                  {formData.group === 'board' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Board Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateFormData('title', e.target.value)}
                        className="w-full px-4 py-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-rotaract-blue focus:border-rotaract-blue outline-none transition-all placeholder:text-slate-400"
                        placeholder="e.g. President, Vice President, Treasurer"
                      />
                    </div>
                  )}

                  {/* Role/Position */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Role / Position <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => updateFormData('role', e.target.value)}
                      className="w-full px-4 py-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-rotaract-blue focus:border-rotaract-blue outline-none transition-all placeholder:text-slate-400"
                      placeholder="e.g. Events Committee, Community Service Chair"
                    />
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">
                        info
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          Role Guidelines
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Board members should have a specific title (President, Secretary, etc.). 
                          General members can list committee assignments or areas of interest.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Step 3: Dues & Financial
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Configure membership dues status and payment information.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Join Date */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Join Date
                    </label>
                    <input
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => updateFormData('joinDate', e.target.value)}
                      className="w-full px-4 py-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-rotaract-blue focus:border-rotaract-blue outline-none transition-all"
                    />
                  </div>

                  {/* Dues Status */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Dues Status <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['paid', 'unpaid', 'waived'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => updateFormData('duesStatus', status)}
                          className={`px-4 py-3 rounded border text-sm font-semibold transition-all ${
                            formData.duesStatus === status
                              ? 'bg-rotaract-blue text-white border-rotaract-blue'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rotaract-blue'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dues Amount (if paid) */}
                  {formData.duesStatus === 'paid' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Dues Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <input
                          type="number"
                          value={formData.duesAmount || ''}
                          onChange={(e) => updateFormData('duesAmount', parseFloat(e.target.value))}
                          className="w-full pl-8 pr-4 py-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-rotaract-blue focus:border-rotaract-blue outline-none transition-all placeholder:text-slate-400"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    </div>
                  )}

                  {/* Summary Card */}
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-rotaract-blue">summarize</span>
                      Member Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Name:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formData.firstName} {formData.lastName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Email:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formData.email}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Type:</span>
                        <span className="font-semibold text-slate-900 dark:text-white capitalize">
                          {formData.membershipType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Group:</span>
                        <span className="font-semibold text-slate-900 dark:text-white capitalize">
                          {formData.group === 'board' ? 'Board Member' : 'General Member'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Role:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formData.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`px-5 py-2.5 text-sm font-semibold flex items-center gap-2 transition-colors ${
                  currentStep === 1 
                    ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back
              </button>

              {currentStep < 3 ? (
                <button 
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !isStep1Valid) ||
                    (currentStep === 2 && !isStep2Valid)
                  }
                  className={`px-6 py-2.5 rounded shadow-sm text-sm font-bold flex items-center gap-2 transition-all ${
                    ((currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid))
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-rotaract-blue hover:bg-rotaract-blue/90 text-white'
                  }`}
                >
                  {currentStep === 1 ? 'Next: Roles' : 'Next: Dues'}
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-rotaract-blue hover:bg-rotaract-blue/90 text-white text-sm font-bold rounded shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      Create Member
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
