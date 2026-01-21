type WizardFooterProps = {
  currentStep: number
  onBack: () => void
  onNext: () => void
  onSaveDraft: () => void
  onPublish: () => void
  isSaving: boolean
}

export default function WizardFooter({
  currentStep,
  onBack,
  onNext,
  onSaveDraft,
  onPublish,
  isSaving,
}: WizardFooterProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 dark:border-slate-800 gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={onSaveDraft}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-slate-500 font-bold text-sm hover:text-slate-900 dark:hover:text-white transition-all">
          <span className="material-symbols-outlined text-sm">visibility</span>
          Preview
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          disabled={currentStep === 1 || isSaving}
          className="px-8 py-3 rounded-lg font-bold text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Back
        </button>

        {currentStep < 3 ? (
          <button
            onClick={onNext}
            disabled={isSaving}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-10 py-3 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
          >
            Next: {currentStep === 1 ? 'Content' : 'Registration'}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        ) : (
          <button
            onClick={onPublish}
            disabled={isSaving}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-10 py-3 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Publishing...' : 'Publish Event'}
            <span className="material-symbols-outlined text-sm">check_circle</span>
          </button>
        )}
      </div>
    </div>
  )
}
