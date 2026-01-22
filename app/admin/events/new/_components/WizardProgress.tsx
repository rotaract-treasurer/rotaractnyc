type WizardProgressProps = {
  currentStep: number
}

export default function WizardProgress({ currentStep }: WizardProgressProps) {
  const steps = [
    { number: 1, icon: 'location_on', label: 'Logistics', description: 'Where & when' },
    { number: 2, icon: 'description', label: 'Content', description: 'Details & images' },
    { number: 3, icon: 'confirmation_number', label: 'Registration', description: 'Ticketing & RSVPs' },
  ]

  const progressPercent = (currentStep / 3) * 100

  return (
    <>
      {/* Progress Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {steps.map((step, index) => {
          const isActive = currentStep === step.number
          const isCompleted = currentStep > step.number
          
          return (
            <div
              key={step.number}
              className={`relative flex-1 flex flex-col items-center justify-center py-6 transition-all ${
                isActive
                  ? 'bg-primary/5'
                  : isCompleted
                  ? 'bg-green-50 dark:bg-green-900/10'
                  : 'opacity-50'
              }`}
            >
              {/* Step Number Badge */}
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full mb-2 transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <span className=\"material-symbols-outlined text-lg\">check</span>
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
              <p className=\"text-xs text-slate-400 mt-0.5\">{step.description}</p>

              {/* Active indicator */}
              {isActive && (
                <div className=\"absolute bottom-0 left-0 right-0 h-1 bg-primary\"></div>
              )}

              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className={`absolute top-10 left-[60%] w-[80%] h-0.5 ${
                  isCompleted ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}></div>
              )}
            </div>
          )
        })}
      </div>

      {/* Progress Bar Detail */}
      <div className=\"px-8 pt-5 pb-2\">
        <div className=\"flex items-center justify-between mb-2\">
          <span className=\"text-xs font-semibold text-slate-500 dark:text-slate-400\">
            Overall Progress
          </span>
          <span className=\"text-xs font-bold text-primary\">
            {Math.round(progressPercent)}% Complete
          </span>
        </div>
        <div className=\"h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden\">
          <div
            className=\"h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out\"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </>
  )
}
