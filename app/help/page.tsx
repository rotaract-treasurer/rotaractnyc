import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center | Rotaract Club of NYC',
  description: 'Find answers to frequently asked questions about membership, events, dues, and more.',
};

export default function HelpCenterPage() {
  return (
    <main className="flex-grow flex flex-col items-center w-full">
      {/* Hero Search Module */}
      <section className="w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 md:py-24 px-4 flex flex-col items-center text-center relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-40 dark:opacity-20">
          <div className="absolute -top-[10%] -left-[5%] w-[30%] h-[30%] rounded-full bg-[#17b0cf]/20 blur-[100px]"></div>
          <div className="absolute top-[20%] -right-[5%] w-[25%] h-[25%] rounded-full bg-blue-400/20 blur-[100px]"></div>
        </div>

        <div className="max-w-3xl w-full z-10 flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight">
            How can we help?
          </h1>

          {/* Large Search Bar */}
          <div className="w-full relative group mb-8">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <svg className="w-7 h-7 text-gray-400 dark:text-gray-500 group-focus-within:text-[#17b0cf] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full h-20 pl-16 pr-6 rounded-2xl border-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg focus:shadow-xl focus:ring-2 focus:ring-[#17b0cf]/50 text-xl placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium transition-all duration-300 ease-out"
              placeholder="Search for membership, dues, meeting times..."
              autoFocus
            />
            <div className="absolute inset-y-0 right-4 flex items-center">
              <kbd className="hidden sm:block bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors">
                Esc
              </kbd>
            </div>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap justify-center gap-3 w-full">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 py-1.5">Popular:</span>
            <button className="group flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[#17b0cf] hover:text-[#17b0cf] dark:hover:border-[#17b0cf] dark:hover:text-[#17b0cf] transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm font-medium">Membership</span>
            </button>
            <button className="group flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[#17b0cf] hover:text-[#17b0cf] dark:hover:border-[#17b0cf] dark:hover:text-[#17b0cf] transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">Events</span>
            </button>
            <button className="group flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[#17b0cf] hover:text-[#17b0cf] dark:hover:border-[#17b0cf] dark:hover:text-[#17b0cf] transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm font-medium">Dues</span>
            </button>
            <button className="group flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[#17b0cf] hover:text-[#17b0cf] dark:hover:border-[#17b0cf] dark:hover:text-[#17b0cf] transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm font-medium">Volunteering</span>
            </button>
          </div>
        </div>
      </section>

      {/* Results / FAQ Grid */}
      <section className="w-full max-w-7xl px-6 md:px-12 lg:px-20 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Questions</h2>
          <Link href="#" className="text-[#17b0cf] hover:text-[#17b0cf]/80 text-sm font-medium flex items-center gap-1">
            View all
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Link
            href="#"
            className="group flex flex-col bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-300 ring-1 ring-inset ring-blue-500/10">
                Membership
              </span>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-[#17b0cf] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-[#17b0cf] transition-colors">
              How do I become a member?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 flex-grow">
              Membership is open to young professionals and students ages 18-30. The process starts by attending at least 3 meetings...
            </p>
            <div className="flex items-center gap-2 mt-auto">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400"></div>
              <span className="text-xs text-gray-500">Updated 2 days ago</span>
            </div>
          </Link>

          {/* Card 2 */}
          <Link
            href="#"
            className="group flex flex-col bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/30 px-2.5 py-1 text-xs font-semibold text-green-600 dark:text-green-300 ring-1 ring-inset ring-green-600/20">
                Events
              </span>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-[#17b0cf] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-[#17b0cf] transition-colors">
              When and where are meetings?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 flex-grow">
              We meet every Tuesday at 7 PM at the Community Center on 4th Ave. Virtual options are available for selected dates.
            </p>
            <div className="flex items-center gap-2 mt-auto">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-green-400 to-teal-400"></div>
              <span className="text-xs text-gray-500">Updated 1 week ago</span>
            </div>
          </Link>

          {/* Card 3 */}
          <Link
            href="#"
            className="group flex flex-col bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center rounded-md bg-purple-50 dark:bg-purple-900/30 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-300 ring-1 ring-inset ring-purple-600/20">
                Dues
              </span>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-[#17b0cf] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-[#17b0cf] transition-colors">
              What are the annual dues?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 flex-grow">
              Dues are collected annually in January. The current rate is $50/year for students and $100/year for professionals.
            </p>
            <div className="flex items-center gap-2 mt-auto">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-400 to-pink-400"></div>
              <span className="text-xs text-gray-500">Updated 3 days ago</span>
            </div>
          </Link>

          {/* Card 4 */}
          <Link
            href="#"
            className="group flex flex-col bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center rounded-md bg-yellow-50 dark:bg-yellow-900/30 px-2.5 py-1 text-xs font-semibold text-yellow-700 dark:text-yellow-400 ring-1 ring-inset ring-yellow-600/20">
                Board
              </span>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-[#17b0cf] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-[#17b0cf] transition-colors">
              How can I join the board?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 flex-grow">
              Board elections are held every June. You must be an active member for at least 6 months to run for a position.
            </p>
            <div className="flex items-center gap-2 mt-auto">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 to-red-400"></div>
              <span className="text-xs text-gray-500">Updated 1 month ago</span>
            </div>
          </Link>

          {/* Card 5 */}
          <Link
            href="#"
            className="group flex flex-col bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center rounded-md bg-pink-50 dark:bg-pink-900/30 px-2.5 py-1 text-xs font-semibold text-pink-600 dark:text-pink-300 ring-1 ring-inset ring-pink-600/20">
                Volunteering
              </span>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-[#17b0cf] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-[#17b0cf] transition-colors">
              Are there weekend service projects?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 flex-grow">
              Yes! We organize monthly service projects on Saturdays or Sundays, typically partnering with local food banks.
            </p>
            <div className="flex items-center gap-2 mt-auto">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-400 to-cyan-400"></div>
              <span className="text-xs text-gray-500">Updated 2 weeks ago</span>
            </div>
          </Link>

          {/* Card 6: "More" placeholder - Ask Directly */}
          <div className="flex flex-col items-center justify-center bg-[#17b0cf]/5 dark:bg-[#17b0cf]/10 border border-dashed border-[#17b0cf]/30 dark:border-[#17b0cf]/20 rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mb-4 shadow-sm text-[#17b0cf]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">Can&apos;t find an answer?</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Our team is here to help with specific inquiries not covered here.
            </p>
            <Link
              href="/contact"
              className="px-5 py-2 bg-[#17b0cf] text-white text-sm font-bold rounded-lg shadow-lg shadow-[#17b0cf]/30 hover:bg-[#17b0cf]/90 transition-all transform hover:scale-105"
            >
              Ask us directly
            </Link>
          </div>
        </div>
      </section>

      {/* Category Grid (Alternative navigation) */}
      <section className="w-full bg-gray-50 dark:bg-gray-900 py-16 px-6 md:px-12 lg:px-20 mt-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6">
            Browse by Topic
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/membership-requirements"
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-transparent hover:border-[#17b0cf]/30 dark:hover:border-[#17b0cf]/50 transition-all group"
            >
              <svg className="w-6 h-6 text-[#17b0cf] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span className="font-medium text-gray-700 dark:text-gray-200">Membership</span>
            </Link>
            <Link
              href="/events"
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-transparent hover:border-[#17b0cf]/30 dark:hover:border-[#17b0cf]/50 transition-all group"
            >
              <svg className="w-6 h-6 text-[#17b0cf] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium text-gray-700 dark:text-gray-200">Events &amp; Calendar</span>
            </Link>
            <Link
              href="/leadership"
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-transparent hover:border-[#17b0cf]/30 dark:hover:border-[#17b0cf]/50 transition-all group"
            >
              <svg className="w-6 h-6 text-[#17b0cf] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="font-medium text-gray-700 dark:text-gray-200">Club Structure</span>
            </Link>
            <Link
              href="/about/sister-clubs"
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-transparent hover:border-[#17b0cf]/30 dark:hover:border-[#17b0cf]/50 transition-all group"
            >
              <svg className="w-6 h-6 text-[#17b0cf] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span className="font-medium text-gray-700 dark:text-gray-200">Partnerships</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
