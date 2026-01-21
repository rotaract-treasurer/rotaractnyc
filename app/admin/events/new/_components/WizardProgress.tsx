type WizardProgressProps = {
  currentStep: number
}

export default function WizardProgress({ currentStep }: WizardProgressProps) {
  const steps = [
    { number: 1, icon: 'location_on', label: '1. Logistics' },
    { number: 2, icon: 'description', label: '2. Content' },
    { number: 3, icon: 'confirmation_number', label: '3. Registration' },
  ]

  const progressPercent = (currentStep / 3) * 100

  return (
    <>
      {/* Progress Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`flex-1 flex flex-col items-center justify-center border-b-[3px] py-5 ${
              currentStep === step.number
                ? 'border-primary bg-primary/5'
                : 'border-transparent opacity-40'
            }`}
          >
            <span
              className={`material-symbols-outlined mb-1 ${
                currentStep === step.number ? 'text-primary' : 'text-slate-400'
              }`}
            >
              {step.icon}
            </span>
            <p
              className={`text-xs font-bold uppercase tracking-widest ${
                currentStep === step.number
                  ? 'text-primary'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {step.label}
            </p>
          </div>
        ))}
      </div>

      {/* Progress Bar Detail */}
      <div className="px-10 pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
            Wizard Progress
          </span>
          <span className="text-[11px] font-bold text-primary">
            {Math.round(progressPercent)}% COMPLETE
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </>
  )
}
