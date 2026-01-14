'use client'

import { useState } from 'react'

export default function MembershipPage() {
  const [openAccordion, setOpenAccordion] = useState<number | null>(null)

  const toggleAccordion = (index: number) => {
    setOpenAccordion(openAccordion === index ? null : index)
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-stone-200 font-display transition-colors duration-300 antialiased pb-24">
      {/* Hero Section */}
      <div className="relative w-full overflow-hidden bg-surface-dark group">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-background-dark/90 to-background-dark/40 z-10"></div>
          <img
            alt="Community members gathering"
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhQiqUs_yxik4j_Lv7uQr5_U8pRTRGtBksUKIkC-5TAN_IEbvwGkW-fpKhutRRhUn0DnI-nDbNsHWYD3Zra4nJdDEtXgYQ3LgHWh1gLLjErjldmafUdCBB4BceZxr0DoyR6-9cAhEW8W5V-_rdbfB2qdGvD2dR7QbuFd6qcjbYd6WZKTATtUQyEO8DaeA-no851yaMNJIra7W4IGas-q2wu0keM13qHxw7ta2ZX9LcudQlrurzv5wXLGu1B4E9a8eRSwyuOrNu8gU"
          />
        </div>
        <div className="relative z-20 max-w-4xl mx-auto px-6 py-24 sm:py-32 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary-light border border-primary/30 text-xs font-bold uppercase tracking-wider mb-6 text-white backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Membership Guide
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
            Your Roadmap to <br />
            <span className="text-primary">Impact &amp; Community</span>
          </h1>
          <p className="text-lg sm:text-xl text-stone-300 max-w-2xl font-light leading-relaxed">
            From guest to official member. A clear, step-by-step path to joining New York City&apos;s most vibrant
            young professional service club.
          </p>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        {/* Introduction Header */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-text-main dark:text-white mb-2">The Journey</h2>
          <p className="text-text-muted dark:text-stone-400">
            Complete these four milestones to become an inducted member.
          </p>
        </div>

        {/* Vertical Timeline */}
        <div className="relative flex flex-col gap-0 ml-4 sm:ml-0">
          {/* Step 1 */}
          <div className="relative pl-12 pb-12 group">
            {/* Vertical Spine */}
            <div className="absolute left-[11px] top-10 h-full w-[2px] bg-stone-200 dark:bg-stone-700"></div>
            {/* Icon Indicator */}
            <div className="absolute left-0 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary ring-4 ring-background-light dark:ring-background-dark z-10">
              <span className="text-white text-[10px] font-bold">1</span>
            </div>
            {/* Card */}
            <div className="relative flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl p-6 sm:p-8 shadow-soft border border-stone-100 dark:border-stone-800 transition-all hover:shadow-soft-hover">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 mb-2">
                    Prerequisite
                  </span>
                  <h3 className="text-xl font-bold text-text-main dark:text-white flex items-center gap-2">
                    Eligibility Check
                  </h3>
                </div>
                <span className="material-symbols-outlined text-primary text-3xl opacity-20">verified_user</span>
              </div>
              <p className="text-text-muted dark:text-stone-400 text-sm leading-relaxed mb-6">
                Before diving in, let&apos;s make sure you meet the basic criteria set by Rotary International for
                Rotaract membership.
              </p>
              {/* Accordion for Details */}
              <details
                className="group/accordion border-t border-stone-100 dark:border-stone-700 pt-4"
                open={openAccordion === 1}
                onToggle={() => toggleAccordion(1)}
              >
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-bold text-primary hover:text-primary-dark transition-colors select-none">
                  <span className="material-symbols-outlined text-lg transition-transform duration-300 group-open/accordion:rotate-90">
                    arrow_right
                  </span>
                  View Detailed Criteria
                </summary>
                <div className="mt-3 pl-7 text-sm text-text-muted dark:text-stone-400 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Must be between the ages of 18 and 30.</li>
                    <li>Living, working, or studying in the NYC metropolitan area.</li>
                    <li>Commitment to attend at least 50% of meetings annually.</li>
                    <li>Passion for community service and professional development.</li>
                  </ul>
                </div>
              </details>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative pl-12 pb-12 group">
            <div className="absolute left-[11px] top-10 h-full w-[2px] bg-stone-200 dark:bg-stone-700"></div>
            <div className="absolute left-0 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-stone-800 border-2 border-primary ring-4 ring-background-light dark:ring-background-dark z-10">
              <span className="text-primary text-[10px] font-bold">2</span>
            </div>
            <div className="relative flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl p-6 sm:p-8 shadow-soft border border-stone-100 dark:border-stone-800 transition-all hover:shadow-soft-hover">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300 mb-2">
                    Action Required
                  </span>
                  <h3 className="text-xl font-bold text-text-main dark:text-white">Experience the Club</h3>
                </div>
                <span className="material-symbols-outlined text-primary text-3xl opacity-20">groups</span>
              </div>
              <p className="text-text-muted dark:text-stone-400 text-sm leading-relaxed mb-4">
                We want you to feel at home before you commit. Join us for our regular programming to meet the members
                and see what we do.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <div className="flex items-center gap-3 p-3 bg-background-light dark:bg-black/20 rounded-lg border border-stone-100 dark:border-stone-700 flex-1">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">
                    <span className="material-symbols-outlined text-lg">event</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-text-muted">Requirement</p>
                    <p className="text-sm font-semibold">Attend 3 Meetings</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background-light dark:bg-black/20 rounded-lg border border-stone-100 dark:border-stone-700 flex-1">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">
                    <span className="material-symbols-outlined text-lg">handshake</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-text-muted">Requirement</p>
                    <p className="text-sm font-semibold">Meet the Board</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative pl-12 pb-12 group">
            <div className="absolute left-[11px] top-10 h-full w-[2px] bg-stone-200 dark:bg-stone-700"></div>
            <div className="absolute left-0 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-stone-800 border-2 border-primary ring-4 ring-background-light dark:ring-background-dark z-10">
              <span className="text-primary text-[10px] font-bold">3</span>
            </div>
            <div className="relative flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl p-6 sm:p-8 shadow-soft border border-stone-100 dark:border-stone-800 transition-all hover:shadow-soft-hover">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300 mb-2">
                    Investment
                  </span>
                  <h3 className="text-xl font-bold text-text-main dark:text-white">Financial Commitment</h3>
                </div>
                <span className="material-symbols-outlined text-primary text-3xl opacity-20">payments</span>
              </div>
              <p className="text-text-muted dark:text-stone-400 text-sm leading-relaxed mb-6">
                Membership dues support our service projects, club operations, and your membership in the international
                Rotary network.
              </p>
              {/* Accordion for Dues */}
              <details
                className="group/accordion border-t border-stone-100 dark:border-stone-700 pt-4"
                open={openAccordion === 3}
                onToggle={() => toggleAccordion(3)}
              >
                <summary className="flex cursor-pointer items-center justify-between text-sm font-bold text-text-main dark:text-white hover:text-primary transition-colors select-none p-2 rounded hover:bg-stone-50 dark:hover:bg-stone-800">
                  <span>Annual Dues Breakdown</span>
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold">$120/year</span>
                    <span className="material-symbols-outlined text-lg transition-transform duration-300 group-open/accordion:rotate-180">
                      expand_more
                    </span>
                  </div>
                </summary>
                <div className="mt-2 p-4 bg-background-light dark:bg-black/20 rounded-lg text-sm space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between border-b border-stone-200 dark:border-stone-700 pb-2">
                    <span className="text-text-muted dark:text-stone-400">Rotary International Fees</span>
                    <span className="font-medium">$40.00</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-200 dark:border-stone-700 pb-2">
                    <span className="text-text-muted dark:text-stone-400">District 7230 Dues</span>
                    <span className="font-medium">$20.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-text-muted dark:text-stone-400">Club Operations &amp; Events</span>
                    <span className="font-medium">$60.00</span>
                  </div>
                  <p className="text-xs text-text-muted dark:text-stone-500 italic mt-2">
                    * Payment plans available for students.
                  </p>
                </div>
              </details>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative pl-12 group">
            {/* No connector line for last item */}
            <div className="absolute left-0 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-600 ring-4 ring-background-light dark:ring-background-dark z-10">
              <span className="text-stone-400 text-[10px] font-bold">4</span>
            </div>
            <div className="relative flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl p-6 sm:p-8 shadow-soft border border-stone-100 dark:border-stone-800 transition-all hover:shadow-soft-hover opacity-90">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-300 mb-2">
                    Final Step
                  </span>
                  <h3 className="text-xl font-bold text-text-main dark:text-white">Formal Application</h3>
                </div>
                <span className="material-symbols-outlined text-primary text-3xl opacity-20">assignment_add</span>
              </div>
              <p className="text-text-muted dark:text-stone-400 text-sm leading-relaxed">
                Once you&apos;ve completed the steps above, submit your official application. The board reviews
                applications monthly. Upon acceptance, you&apos;ll be invited to an induction ceremony!
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky CTA Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-lg border-t border-stone-200 dark:border-stone-800 p-4 sm:px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-text-main dark:text-white">Ready to make an impact?</p>
            <p className="text-xs text-text-muted dark:text-stone-400">Join a network of 200+ young leaders.</p>
          </div>
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg transition-all transform active:scale-95 shadow-lg shadow-primary/20">
            <span>Start Application</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  )
}
