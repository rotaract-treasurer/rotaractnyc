import { EventFormData } from '../page'
import { useState } from 'react'

type ContentStepProps = {
  formData: EventFormData
  updateFormData: (updates: Partial<EventFormData>) => void
}

export default function ContentStep({ formData, updateFormData }: ContentStepProps) {
  const [imagePreview, setImagePreview] = useState<string>(formData.imageUrl || '')

  const handleImageUrlChange = (url: string) => {
    updateFormData({ imageUrl: url })
    setImagePreview(url)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Event Content</h2>
        <p className="text-slate-500 text-sm">
          Share the details that will make members excited to attend.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Event Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Event Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            rows={8}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white resize-none"
            placeholder="Describe your event in detail. What can attendees expect? What should they bring? Any special instructions?"
          />
          <p className="text-xs text-slate-400 mt-1">
            {formData.description.length} characters
          </p>
        </div>

        {/* Event Image */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Event Image
          </label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => handleImageUrlChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
            placeholder="https://example.com/image.jpg"
          />
          {imagePreview && (
            <div className="mt-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              <img
                src={imagePreview}
                alt="Event preview"
                className="w-full h-48 object-cover"
                onError={() => setImagePreview('')}
              />
            </div>
          )}
          <p className="text-xs text-slate-400 mt-2">
            Recommended: 1200x630px. Events with images get 60% more registrations.
          </p>
        </div>

        {/* Visibility Settings */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Event Visibility
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => updateFormData({ visibility: 'public' })}
              className={`flex flex-col items-start gap-2 px-4 py-4 rounded-xl border-2 transition-all ${
                formData.visibility === 'public'
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-100 dark:border-slate-800 hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">public</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">Public</span>
              </div>
              <p className="text-xs text-slate-500">Visible to everyone, including non-members</p>
            </button>

            <button
              type="button"
              onClick={() => updateFormData({ visibility: 'member' })}
              className={`flex flex-col items-start gap-2 px-4 py-4 rounded-xl border-2 transition-all ${
                formData.visibility === 'member'
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-100 dark:border-slate-800 hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">group</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">Members Only</span>
              </div>
              <p className="text-xs text-slate-500">Only visible to logged-in members</p>
            </button>

            <button
              type="button"
              onClick={() => updateFormData({ visibility: 'board' })}
              className={`flex flex-col items-start gap-2 px-4 py-4 rounded-xl border-2 transition-all ${
                formData.visibility === 'board'
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-100 dark:border-slate-800 hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">lock</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">Board Only</span>
              </div>
              <p className="text-xs text-slate-500">Restricted to board members</p>
            </button>
          </div>
        </div>

        {/* Event Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Event Type
            </label>
            <select
              value={formData.category}
              onChange={(e) => updateFormData({ category: e.target.value as 'upcoming' | 'past' })}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none text-slate-900 dark:text-white"
            >
              <option value="upcoming">Upcoming Event</option>
              <option value="past">Past Event</option>
            </select>
          </div>
        </div>

        {/* Additional Info Cards */}
        <div className="mt-4 p-5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">lightbulb</span>
            <div>
              <p className="text-slate-900 dark:text-white font-bold text-sm mb-1">Writing Tips</p>
              <ul className="text-slate-600 dark:text-slate-400 text-xs space-y-1 list-disc list-inside">
                <li>Start with a compelling hook that captures attention</li>
                <li>Include what attendees will gain from participating</li>
                <li>Mention any special guests, speakers, or activities</li>
                <li>Clearly state any prerequisites or items to bring</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
