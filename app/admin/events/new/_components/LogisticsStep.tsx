import { EventFormData } from '../page'

type LogisticsStepProps = {
  formData: EventFormData
  updateFormData: (updates: Partial<EventFormData>) => void
}

export default function LogisticsStep({ formData, updateFormData }: LogisticsStepProps) {
  const handleVenueTypeChange = (type: 'physical' | 'virtual' | 'hybrid') => {
    updateFormData({ venueType: type })
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Where & When</h2>
        <p className="text-slate-500 text-sm">Tell us the vital details for your upcoming gathering.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Event Name */}
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Event Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/80 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white shadow-inner"
            placeholder="e.g. Annual Charity Gala 2024"
          />
          <p className="mt-2 text-xs text-slate-400">Tip: add a year or theme to make it memorable.</p>
        </div>

        {/* Venue Selection */}
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 p-6 shadow-sm flex flex-col gap-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Venue Location <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => handleVenueTypeChange('physical')}
              className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition-all shadow-sm ${
                formData.venueType === 'physical'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-100 dark:border-slate-800 hover:border-primary/50 text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="material-symbols-outlined">apartment</span>
              <span className="text-sm font-bold">Physical Venue</span>
            </button>
            <button
              type="button"
              onClick={() => handleVenueTypeChange('virtual')}
              className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition-all shadow-sm ${
                formData.venueType === 'virtual'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-100 dark:border-slate-800 hover:border-primary/50 text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="material-symbols-outlined">videocam</span>
              <span className="text-sm font-bold">Online / Virtual</span>
            </button>
            <button
              type="button"
              onClick={() => handleVenueTypeChange('hybrid')}
              className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition-all shadow-sm ${
                formData.venueType === 'hybrid'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-100 dark:border-slate-800 hover:border-primary/50 text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="material-symbols-outlined">diversity_3</span>
              <span className="text-sm font-bold">Hybrid</span>
            </button>
          </div>
        </div>

        {/* Address / Virtual Link */}
        {(formData.venueType === 'physical' || formData.venueType === 'hybrid') && (
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Physical Location
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-3.5 text-slate-400">search</span>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => updateFormData({ location: e.target.value })}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/80 focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white"
                placeholder="Search for a location or address"
              />
            </div>
            <div className="mt-4 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 h-48 relative bg-slate-200 dark:bg-slate-700">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-xl">
                  <span className="material-symbols-outlined text-primary text-3xl">location_on</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {(formData.venueType === 'virtual' || formData.venueType === 'hybrid') && (
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Virtual Meeting Link
            </label>
            <input
              type="url"
              value={formData.virtualLink || ''}
              onChange={(e) => updateFormData({ virtualLink: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/80 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
              placeholder="https://zoom.us/j/..."
            />
          </div>
        )}

        {/* Date & Time */}
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Start Date & Time <span className="text-red-500">*</span>
          </label>
          <div className="mt-2 flex gap-2">
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => updateFormData({ startDate: e.target.value })}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/80 outline-none text-slate-900 dark:text-white"
            />
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => updateFormData({ startTime: e.target.value })}
              className="w-32 px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/80 outline-none text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            End Date & Time
          </label>
          <div className="mt-2 flex gap-2">
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => updateFormData({ endDate: e.target.value })}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/80 outline-none text-slate-900 dark:text-white"
            />
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => updateFormData({ endTime: e.target.value })}
              className="w-32 px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/80 outline-none text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Timezone
          </label>
          <select
            value={formData.timezone}
            onChange={(e) => updateFormData({ timezone: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/80 outline-none text-slate-900 dark:text-white"
          >
            <option value="America/New_York">(GMT-05:00) Eastern Time (US & Canada)</option>
            <option value="America/Chicago">(GMT-06:00) Central Time (US & Canada)</option>
            <option value="America/Denver">(GMT-07:00) Mountain Time (US & Canada)</option>
            <option value="America/Los_Angeles">(GMT-08:00) Pacific Time (US & Canada)</option>
          </select>
        </div>
      </div>
    </div>
  )
}
