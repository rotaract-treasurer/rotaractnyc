import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Pay Dues: Impact & Fast Checkout | Rotaract NYC',
  description: 'Your annual dues fuel local service, professional development, and global fellowship in the heart of New York City.',
}

export default function DuesPage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 text-primary">
              <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" />
              </svg>
            </div>
            <h2 className="text-lg font-extrabold tracking-tight">Rotaract NYC</h2>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              Club Site
            </Link>
            <Link href="/" className="bg-gray-100 dark:bg-white/10 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to Site
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative w-full h-[320px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(20, 28, 31, 0.4), rgba(20, 28, 31, 0.7)), url('https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2000')`,
          }}
        >
          <div className="absolute inset-0" />
        </div>
        <div className="relative max-w-[1200px] mx-auto px-6 h-full flex flex-col justify-center items-center text-center">
          <h1 className="text-white text-5xl font-extrabold tracking-[-0.033em] mb-4">
            Invest in Your Impact
          </h1>
          <p className="text-white/90 text-lg max-w-2xl font-medium leading-relaxed">
            Your annual dues fuel local service, professional development, and global fellowship in the heart of New York City.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Impact Breakdown */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white dark:bg-surface-dark p-8 rounded-xl shadow-soft border border-gray-200 dark:border-white/5">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight mb-1">Where your $150 goes</h2>
                  <p className="text-primary font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    100% NYC focused initiatives
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-primary">$150</span>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Annual Dues</p>
                </div>
              </div>

              {/* Visual Chart */}
              <div className="flex items-end gap-4 h-40 px-4 mb-10">
                <div className="flex-1 flex flex-col items-center gap-3">
                  <div className="w-full bg-primary-dark/20 dark:bg-primary-dark/10 rounded-t-lg relative group" style={{ height: '50%' }}>
                    <div className="absolute inset-0 bg-primary-dark rounded-t-lg transition-all duration-500" style={{ height: '100%' }} />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 font-bold text-sm">$75</div>
                  </div>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-tighter">Service</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-3">
                  <div className="w-full bg-primary-dark/20 dark:bg-primary-dark/10 rounded-t-lg relative" style={{ height: '30%' }}>
                    <div className="absolute inset-0 bg-primary-dark/60 rounded-t-lg" style={{ height: '100%' }} />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 font-bold text-sm">$45</div>
                  </div>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-tighter">District</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-3">
                  <div className="w-full bg-primary-dark/20 dark:bg-primary-dark/10 rounded-t-lg relative" style={{ height: '20%' }}>
                    <div className="absolute inset-0 bg-primary-dark/40 rounded-t-lg" style={{ height: '100%' }} />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 font-bold text-sm">$30</div>
                  </div>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-tighter">Operations</span>
                </div>
              </div>

              {/* Detailed List */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-background-light dark:bg-white/5">
                  <div className="size-10 rounded-full bg-primary-dark/10 flex items-center justify-center text-primary-dark flex-shrink-0">
                    <span className="material-symbols-outlined">volunteer_activism</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold">Local Service Projects</h4>
                      <span className="font-bold">$75</span>
                    </div>
                    <p className="text-sm text-text-muted">
                      Feeding New Yorkers, school supply drives, and environmental cleanup across the five boroughs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg">
                  <div className="size-10 rounded-full bg-primary-dark/10 flex items-center justify-center text-primary-dark flex-shrink-0">
                    <span className="material-symbols-outlined">public</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold">District 7230 Dues</h4>
                      <span className="font-bold">$45</span>
                    </div>
                    <p className="text-sm text-text-muted">
                      Required insurance, Rotary International affiliation, and regional leadership conferences.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg">
                  <div className="size-10 rounded-full bg-primary-dark/10 flex items-center justify-center text-primary-dark flex-shrink-0">
                    <span className="material-symbols-outlined">psychology</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold">Professional Development</h4>
                      <span className="font-bold">$30</span>
                    </div>
                    <p className="text-sm text-text-muted">
                      Workshop materials, venue rentals for guest speakers, and club networking events.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/5 flex items-center gap-3">
                <div className="size-2 rounded-full bg-primary" />
                <p className="text-sm font-semibold text-primary uppercase tracking-widest">
                  Rotaract NYC is a 501(c)(3) non-profit
                </p>
              </div>
            </div>
            
            {/* FAQ Section */}
            <div className="bg-white dark:bg-surface-dark p-8 rounded-xl shadow-soft border border-gray-200 dark:border-white/5">
              <h3 className="text-xl font-extrabold mb-6">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-text-main dark:text-white">What&apos;s included in my dues?</h4>
                  <p className="text-sm text-text-muted mt-1">Full access to all club meetings, events, service projects, networking opportunities, and Rotary International affiliation.</p>
                </div>
                <div>
                  <h4 className="font-bold text-text-main dark:text-white">Can I get a refund?</h4>
                  <p className="text-sm text-text-muted mt-1">Dues are non-refundable but can be transferred to another member within 30 days if needed.</p>
                </div>
                <div>
                  <h4 className="font-bold text-text-main dark:text-white">When are dues collected?</h4>
                  <p className="text-sm text-text-muted mt-1">Dues are collected annually starting July 1st. New members can join anytime with pro-rated dues.</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/5">
                <p className="text-sm text-text-muted">Questions? Email <a href="mailto:treasury@rotaractnyc.org" className="text-primary font-semibold hover:underline">treasury@rotaractnyc.org</a></p>
              </div>
            </div>
          </div>

          {/* Right Column: Express Checkout */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-surface-dark p-8 rounded-xl shadow-soft border border-gray-200 dark:border-white/5 sticky top-24">
              <h3 className="text-xl font-extrabold mb-6">Express Checkout</h3>

              {/* Wallet Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <button className="flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg hover:opacity-90 transition-opacity">
                  <svg className="h-5" viewBox="0 0 50 20" fill="currentColor">
                    <path d="M9.536 7.212c-1.756 0-3.125 1.372-3.125 3.164 0 1.794 1.369 3.164 3.125 3.164 1.756 0 3.125-1.37 3.125-3.164 0-1.792-1.369-3.164-3.125-3.164zm14.472 0c-1.756 0-3.125 1.372-3.125 3.164 0 1.794 1.369 3.164 3.125 3.164 1.756 0 3.125-1.37 3.125-3.164 0-1.792-1.369-3.164-3.125-3.164z" />
                  </svg>
                  <span className="font-bold">Pay</span>
                </button>
                <button className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-900 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="h-5" viewBox="0 0 40 16" fill="none">
                    <path d="M19.526 7.972c-.234-.026-.463-.039-.693-.039-1.744 0-3.155 1.06-3.155 2.372 0 1.312 1.41 2.371 3.155 2.371.23 0 .459-.013.693-.039v-4.665z" fill="#4285F4" />
                    <path d="M19.526 7.972v4.665c.234.026.463.039.693.039 1.744 0 3.155-1.06 3.155-2.371 0-1.312-1.41-2.372-3.155-2.372-.23 0-.459.013-.693.039z" fill="#34A853" />
                    <path d="M16.678 10.305c0 .827.67 1.5 1.496 1.5v-3c-.826 0-1.496.673-1.496 1.5z" fill="#FBBC04" />
                    <path d="M21.741 10.305c0-.827-.67-1.5-1.496-1.5v3c.826 0 1.496-.673 1.496-1.5z" fill="#EA4335" />
                  </svg>
                  <span className="font-bold">Pay</span>
                </button>
              </div>

              <div className="relative flex items-center justify-center mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-white/10" />
                </div>
                <span className="relative px-4 bg-white dark:bg-surface-dark text-xs font-bold text-text-muted uppercase tracking-widest">
                  Or pay with card
                </span>
              </div>

              {/* Payment Form */}
              <form className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase mb-1.5 ml-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 dark:bg-white/5 focus:ring-2 focus:ring-primary-dark focus:border-primary-dark transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase mb-1.5 ml-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="•••• •••• •••• ••••"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 dark:bg-white/5 focus:ring-2 focus:ring-primary-dark focus:border-primary-dark transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                      <span className="material-symbols-outlined text-text-muted">credit_card</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-1.5 ml-1">
                      Expiry
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 dark:bg-white/5 focus:ring-2 focus:ring-primary-dark focus:border-primary-dark transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-1.5 ml-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 dark:bg-white/5 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary-600 transition-all flex items-center justify-center gap-2 mt-6"
                >
                  <span>Complete $150 Payment</span>
                  <span className="material-symbols-outlined">lock</span>
                </button>

                <div className="flex items-center justify-center gap-4 mt-6">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">shield</span>
                    Secure TLS
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">verified_user</span>
                    PCI Compliant
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 dark:border-white/10 text-center">
        <p className="text-sm text-text-muted">
          Questions? Email our treasurer at{' '}
          <a href="mailto:treasury@rotaractnyc.org" className="text-primary font-bold hover:underline">
            treasury@rotaractnyc.org
          </a>
        </p>
        <p className="text-xs text-text-muted/60 mt-2">
          © 2026 Rotaract Club of NYC. Member of Rotary International District 7230.
        </p>
      </footer>
    </div>
  )
}
