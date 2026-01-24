import { useEffect } from 'react'

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
  const nextLabel = currentStep === 1 ? 'Content' : currentStep === 2 ? 'Pricing' : 'Review'

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault()
          onSaveDraft()
        } else if (e.key === 'Enter' && currentStep < 4) {
          e.preventDefault()
          onNext()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentStep, onSaveDraft, onNext])

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur p-6 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200/70 dark:border-slate-800/80 gap-4">
      <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
        <button
          onClick={onSaveDraft}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-semibold text-sm bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save draft (Ctrl/Cmd + S)"
        >
          <span className="material-symbols-outlined text-lg">save</span>
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
        <span className="hidden sm:inline text-xs text-slate-400">⌘S</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          disabled={currentStep === 1 || isSaving}
          className="flex items-center gap-1 px-6 py-3 rounded-lg font-semibold text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back
        </button>

        {currentStep < 4 ? (
          <button
            onClick={onNext}
            disabled={isSaving}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {nextLabel}
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        ) : (
          <button
            onClick={onPublish}
            disabled={isSaving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                Publishing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">rocket_launch</span>
                Publish Event
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
