type WizardProgressProps = {
  currentStep: number
}

export default function WizardProgress({ currentStep }: WizardProgressProps) {
  const steps = [
    { number: 1, icon: 'location_on', label: 'Logistics', description: 'Where & when' },
    { number: 2, icon: 'description', label: 'Content', description: 'Details & images' },
    { number: 3, icon: 'payments', label: 'Pricing', description: 'Type & costs' },
    { number: 4, icon: 'fact_check', label: 'Review', description: 'Publish event' },
  ]

  const progressPercent = (currentStep / 4) * 100

  return (
    <>
      {/* Progress Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200/70 dark:bg-slate-800/70 border-b border-slate-200/70 dark:border-slate-800/70">
        {steps.map((step) => {
          const isActive = currentStep === step.number
          const isCompleted = currentStep > step.number
          
          return (
            <div
              key={step.number}
              className={`relative flex flex-col items-center justify-center py-6 px-2 transition-all bg-white/80 dark:bg-slate-900/80 ${
                isActive
                  ? 'ring-2 ring-primary/30 shadow-sm'
                  : isCompleted
                  ? 'bg-emerald-50/70 dark:bg-emerald-900/10'
                  : 'opacity-70'
              }`}
            >
              {/* Step Number Badge */}
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full mb-2 transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <span className="material-symbols-outlined text-lg">check</span>
                ) : (
                  <span
                    className={`material-symbols-outlined text-lg`}
                  >
                    {step.icon}
                  </span>
                )}
              </div>

              {/* Step Label */}
              <p
                className={`text-sm font-bold ${
                  isActive
                    ? 'text-primary'
                    : isCompleted
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {step.label}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary"></div>
              )}

            </div>
          )
        })}
      </div>

      {/* Progress Bar Detail */}
      <div className="px-10 pt-5 pb-4 bg-white/70 dark:bg-slate-900/70">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Overall Progress
          </span>
          <span className="text-xs font-bold text-primary">
            {Math.round(progressPercent)}% Complete
          </span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </>
  )
}
