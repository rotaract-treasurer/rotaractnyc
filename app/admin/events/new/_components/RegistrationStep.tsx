import { EventFormData } from '../page'

type RegistrationStepProps = {
  formData: EventFormData
  updateFormData: (updates: Partial<EventFormData>) => void
}

export default function RegistrationStep({ formData, updateFormData }: RegistrationStepProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Registration & Ticketing</h2>
        <p className="text-slate-500 text-sm">
          Configure how members will register and manage event capacity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Require Registration */}
        <div className="flex items-start gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <input
            type="checkbox"
            id="requiresRegistration"
            checked={formData.requiresRegistration}
            onChange={(e) => updateFormData({ requiresRegistration: e.target.checked })}
            className="mt-1 w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <div className="flex-1">
            <label htmlFor="requiresRegistration" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Require Registration/RSVP
            </label>
            <p className="text-xs text-slate-500 mt-1">
              Enable this to track who's attending and manage capacity. Members will need to RSVP to attend.
            </p>
          </div>
        </div>

        {formData.requiresRegistration && (
          <>
            {/* Event Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Event Capacity
                </label>
                <input
                  type="number"
                  value={formData.capacity || ''}
                  onChange={(e) => updateFormData({ capacity: parseInt(e.target.value) || undefined })}
                  min="1"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                  placeholder="e.g. 100"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Leave empty for unlimited capacity
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Registration Deadline
                </label>
                <input
                  type="datetime-local"
                  value={formData.registrationDeadline || ''}
                  onChange={(e) => updateFormData({ registrationDeadline: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                />
                <p className="text-xs text-slate-400 mt-1">
                  When should registration close?
                </p>
              </div>
            </div>

            {/* Guest Policy */}
            <div className="flex items-start gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <input
                type="checkbox"
                id="allowGuests"
                checked={formData.allowGuests}
                onChange={(e) => updateFormData({ allowGuests: e.target.checked })}
                className="mt-1 w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="allowGuests" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Allow Members to Bring Guests
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  Members can register additional guests when RSVPing
                </p>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                Event Pricing
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary">badge</span>
                    <h4 className="font-bold text-slate-900 dark:text-white">Member Price</h4>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-500">$</span>
                    <input
                      type="number"
                      value={formData.memberPrice || ''}
                      onChange={(e) => updateFormData({ memberPrice: parseFloat(e.target.value) || undefined })}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Leave as 0 for free events
                  </p>
                </div>

                {formData.allowGuests && (
                  <div className="p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">person</span>
                      <h4 className="font-bold text-slate-900 dark:text-white">Guest Price</h4>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-slate-500">$</span>
                      <input
                        type="number"
                        value={formData.guestPrice || ''}
                        onChange={(e) => updateFormData({ guestPrice: parseFloat(e.target.value) || undefined })}
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Price for non-member guests
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Summary Card */}
        <div className="mt-4 p-6 rounded-xl border-2 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">event_available</span>
            <div className="flex-1">
              <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-3">Event Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Event Title:</span>
                  <span className="text-slate-900 dark:text-white font-semibold">
                    {formData.title || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Venue Type:</span>
                  <span className="text-slate-900 dark:text-white font-semibold capitalize">
                    {formData.venueType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Date:</span>
                  <span className="text-slate-900 dark:text-white font-semibold">
                    {formData.startDate || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Visibility:</span>
                  <span className="text-slate-900 dark:text-white font-semibold capitalize">
                    {formData.visibility}
                  </span>
                </div>
                {formData.requiresRegistration && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Capacity:</span>
                      <span className="text-slate-900 dark:text-white font-semibold">
                        {formData.capacity || 'Unlimited'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Member Price:</span>
                      <span className="text-slate-900 dark:text-white font-semibold">
                        ${formData.memberPrice?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Helpful Note */}
        <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">psychology</span>
            <div>
              <p className="text-slate-900 dark:text-white font-bold text-sm mb-1">Pro Tip</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Events with early registration deadlines tend to have better attendance rates. 
                Consider closing registration 24 hours before the event to allow for proper planning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
