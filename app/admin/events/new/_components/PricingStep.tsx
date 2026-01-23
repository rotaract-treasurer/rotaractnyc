import { EventFormData } from '../page'

type PricingStepProps = {
  formData: EventFormData
  updateFormData: (updates: Partial<EventFormData>) => void
}

export default function PricingStep({ formData, updateFormData }: PricingStepProps) {
  const eventType = formData.eventType || 'free'

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-primary">payments</span>
          Event Type & Pricing
        </h2>
        <p className="text-slate-500 text-sm">
          Configure event type, pricing structure, and member benefits.
        </p>
      </div>

      {/* Event Type Selector */}
      <div>
        <label className="block text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4">
          Event Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Free Event */}
          <button
            type="button"
            onClick={() => updateFormData({ eventType: 'free', requiresRegistration: true })}
            className={`p-6 rounded-2xl border-2 transition-all text-left ${
              eventType === 'free'
                ? 'border-primary bg-primary/10 shadow-lg'
                : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col gap-3">
              <div className={`p-3 rounded-xl w-fit ${
                eventType === 'free' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800'
              }`}>
                <span className="material-symbols-outlined text-2xl">event_available</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Free Event</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  No payment required. Perfect for social gatherings and meetings.
                </p>
              </div>
            </div>
          </button>

          {/* Paid Event */}
          <button
            type="button"
            onClick={() => updateFormData({ eventType: 'paid', requiresRegistration: true })}
            className={`p-6 rounded-2xl border-2 transition-all text-left ${
              eventType === 'paid'
                ? 'border-primary bg-primary/10 shadow-lg'
                : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col gap-3">
              <div className={`p-3 rounded-xl w-fit ${
                eventType === 'paid' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800'
              }`}>
                <span className="material-symbols-outlined text-2xl">credit_card</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Paid Event</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Requires payment via Stripe. Set member discounts and guest pricing.
                </p>
              </div>
            </div>
          </button>

          {/* Service/Volunteering Event */}
          <button
            type="button"
            onClick={() => updateFormData({ eventType: 'service', requiresRegistration: true })}
            className={`p-6 rounded-2xl border-2 transition-all text-left ${
              eventType === 'service'
                ? 'border-primary bg-primary/10 shadow-lg'
                : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col gap-3">
              <div className={`p-3 rounded-xl w-fit ${
                eventType === 'service' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800'
              }`}>
                <span className="material-symbols-outlined text-2xl">volunteer_activism</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Service Event</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Volunteer opportunity. Track service hours for members.
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Free Event - Simple RSVP */}
      {eventType === 'free' && (
        <div className="p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-primary text-2xl">how_to_reg</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">RSVP Configuration</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Event Capacity
              </label>
              <input
                type="number"
                value={formData.capacity || ''}
                onChange={(e) => updateFormData({ capacity: parseInt(e.target.value) || undefined })}
                min="1"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none"
                placeholder="Leave empty for unlimited capacity"
              />
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                id="allowGuests-free"
                checked={formData.allowGuests}
                onChange={(e) => updateFormData({ allowGuests: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label htmlFor="allowGuests-free" className="flex-1 cursor-pointer">
                <div className="font-semibold text-slate-900 dark:text-white">Allow Guests</div>
                <div className="text-xs text-slate-500">Members can bring non-member guests</div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Paid Event - Pricing Details */}
      {eventType === 'paid' && (
        <div className="space-y-6">
          {/* Pricing Configuration */}
          <div className="p-6 rounded-2xl border-2 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary text-2xl">sell</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pricing Structure</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Member Pricing */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary">badge</span>
                  <h4 className="font-bold text-slate-900 dark:text-white">Member Pricing</h4>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Standard Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                    <input
                      type="number"
                      value={formData.memberPrice || ''}
                      onChange={(e) => updateFormData({ memberPrice: parseFloat(e.target.value) || undefined })}
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none text-lg font-semibold"
                      placeholder="25.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Early Bird Price (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                    <input
                      type="number"
                      value={formData.memberEarlyBirdPrice || ''}
                      onChange={(e) => updateFormData({ memberEarlyBirdPrice: parseFloat(e.target.value) || undefined })}
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none"
                      placeholder="20.00"
                    />
                  </div>
                </div>

                {formData.memberEarlyBirdPrice && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      Early Bird Deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.earlyBirdDeadline || ''}
                      onChange={(e) => updateFormData({ earlyBirdDeadline: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Guest Pricing */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">person</span>
                    <h4 className="font-bold text-slate-900 dark:text-white">Guest Pricing</h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowGuests}
                      onChange={(e) => updateFormData({ allowGuests: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Enable</span>
                  </label>
                </div>

                {formData.allowGuests && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                        Standard Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                        <input
                          type="number"
                          value={formData.guestPrice || ''}
                          onChange={(e) => updateFormData({ guestPrice: parseFloat(e.target.value) || undefined })}
                          min="0"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none text-lg font-semibold"
                          placeholder="35.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                        Early Bird Price (Optional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                        <input
                          type="number"
                          value={formData.guestEarlyBirdPrice || ''}
                          onChange={(e) => updateFormData({ guestEarlyBirdPrice: parseFloat(e.target.value) || undefined })}
                          min="0"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none"
                          placeholder="30.00"
                        />
                      </div>
                    </div>
                  </>
                )}

                {!formData.allowGuests && (
                  <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-900 text-center text-sm text-slate-500">
                    Guest pricing is disabled
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Settings */}
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
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g. 100"
              />
              <p className="text-xs text-slate-400 mt-1">Leave empty for unlimited</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Registration Deadline
              </label>
              <input
                type="datetime-local"
                value={formData.registrationDeadline || ''}
                onChange={(e) => updateFormData({ registrationDeadline: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* Pricing Preview */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">preview</span>
              Pricing Preview
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Member</div>
                <div className="text-xl font-bold text-primary">
                  ${formData.memberPrice?.toFixed(2) || '0.00'}
                </div>
                {formData.memberEarlyBirdPrice && (
                  <div className="text-xs text-slate-500 mt-1">
                    Early: ${formData.memberEarlyBirdPrice.toFixed(2)}
                  </div>
                )}
              </div>
              {formData.allowGuests && (
                <div>
                  <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Guest</div>
                  <div className="text-xl font-bold text-slate-700 dark:text-slate-300">
                    ${formData.guestPrice?.toFixed(2) || '0.00'}
                  </div>
                  {formData.guestEarlyBirdPrice && (
                    <div className="text-xs text-slate-500 mt-1">
                      Early: ${formData.guestEarlyBirdPrice.toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Service Event - Service Hours */}
      {eventType === 'service' && (
        <div className="p-6 rounded-2xl border-2 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary text-2xl">schedule</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Service Hours Configuration</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Service Hours per Volunteer
              </label>
              <input
                type="number"
                value={formData.serviceHours || ''}
                onChange={(e) => updateFormData({ serviceHours: parseFloat(e.target.value) || undefined })}
                min="0"
                step="0.5"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none text-lg font-semibold"
                placeholder="4.0"
              />
              <p className="text-xs text-slate-400 mt-1">
                Estimated service hours each volunteer will earn
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Service Description
              </label>
              <textarea
                value={formData.serviceDescription || ''}
                onChange={(e) => updateFormData({ serviceDescription: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none resize-none"
                placeholder="Describe the volunteer work (e.g., Food distribution, park cleanup, tutoring)"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Volunteer Capacity
              </label>
              <input
                type="number"
                value={formData.capacity || ''}
                onChange={(e) => updateFormData({ capacity: parseInt(e.target.value) || undefined })}
                min="1"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g. 20 volunteers"
              />
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <input
                type="checkbox"
                id="allowGuests-service"
                checked={formData.allowGuests}
                onChange={(e) => updateFormData({ allowGuests: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label htmlFor="allowGuests-service" className="flex-1 cursor-pointer">
                <div className="font-semibold text-slate-900 dark:text-white">Allow Non-Member Volunteers</div>
                <div className="text-xs text-slate-500">Non-members can participate (no service hours tracked)</div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
        <div className="flex-1 text-sm text-blue-900 dark:text-blue-100">
          <p className="font-semibold mb-1">Pricing Tips</p>
          <ul className="text-xs space-y-1 text-blue-700 dark:text-blue-300">
            <li>• Member discounts encourage membership renewals</li>
            <li>• Early bird pricing drives early registrations</li>
            <li>• Consider charging guests more to subsidize member costs</li>
            <li>• Service events build community engagement and track impact</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
