import Link from 'next/link'

export default function DonateNowPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative pt-32 pb-14 overflow-hidden bg-white">
        <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-56 -left-56 h-[640px] w-[640px] rounded-full bg-primary/5 blur-3xl" />

        <div className="container mx-auto px-4 relative max-w-4xl">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 mb-6">
            <span className="material-symbols-outlined text-green-600 text-sm">verified</span>
            <span className="text-green-700 text-xs font-bold">501(c)(3) Tax-Deductible</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
            Support Our Mission
          </h1>
          <p className="mt-4 text-lg text-gray-700 leading-relaxed max-w-3xl">
            Your donation directly funds service projects, community initiatives, and leadership programs for young professionals in NYC.
          </p>

          {/* Suggested amounts */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { amount: '$25', impact: 'Supplies for one service event' },
              { amount: '$50', impact: 'Feeds 20 families at a food drive' },
              { amount: '$100', impact: 'Sponsors a guest speaker session' },
              { amount: '$250', impact: 'Full project sponsorship' },
            ].map((item) => (
              <a
                key={item.amount}
                href={`mailto:rotaractnewyorkcity@gmail.com?subject=Donation: ${item.amount}&body=Hi, I would like to donate ${item.amount} to support Rotaract NYC.`}
                className="group rounded-xl border-2 border-gray-200 bg-white p-4 text-center hover:border-primary hover:bg-primary/5 transition-all"
              >
                <span className="block text-2xl font-black text-primary">{item.amount}</span>
                <span className="block text-xs text-gray-600 mt-1 group-hover:text-gray-700">{item.impact}</span>
              </a>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:rotaractnewyorkcity@gmail.com?subject=Donation%20Inquiry"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-semibold text-white hover:bg-primary-600 transition-colors"
            >
              <span className="material-symbols-outlined">volunteer_activism</span>
              Donate Any Amount
            </a>
            <Link
              href="/contact"
              className="inline-flex justify-center rounded-lg border border-primary/30 bg-white px-6 py-3.5 font-semibold text-primary hover:bg-primary/5 transition-colors"
            >
              Questions? Contact Us
            </Link>
          </div>
          
          {/* Trust signals */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">lock</span>
              Secure & encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">receipt_long</span>
              Tax receipt provided
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">account_balance</span>
              EIN: Available on request
            </span>
          </div>
        </div>
      </section>

      {/* Impact section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-primary">Where your support goes</h2>
            <p className="mt-3 text-lg text-gray-700 max-w-3xl">
              100% of donations go directly to community impact, member development, and local initiatives.
            </p>

            <div className="mt-10 grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: 'volunteer_activism',
                  title: 'Service Projects',
                  percentage: '60%',
                  description:
                    'Supplies, logistics, and partnerships that help us show up consistently for community needs.',
                },
                {
                  icon: 'groups',
                  title: 'Events & Programming',
                  percentage: '25%',
                  description:
                    'Meeting support, speakers, and materials that keep our member experience high quality and welcoming.',
                },
                {
                  icon: 'settings',
                  title: 'Club Operations',
                  percentage: '15%',
                  description:
                    'Tools and basics that help us coordinate projects, communicate effectively, and stay organized.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="material-symbols-outlined text-primary text-3xl">{item.icon}</span>
                    <span className="text-2xl font-black text-primary">{item.percentage}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-3 text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-primary/15 bg-primary/5 p-7">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary text-2xl mt-0.5">inventory_2</span>
                <div>
                  <h3 className="text-xl font-bold text-primary">Prefer to donate in-kind?</h3>
                  <p className="mt-2 text-gray-700">
                    We can often accept specific items for drives and projects. Email us what you&apos;d like to contribute and we&apos;ll confirm what&apos;s most helpful right now.
                  </p>
                  <div className="mt-5">
                    <a
                      href="mailto:rotaractnewyorkcity@gmail.com?subject=In-kind%20Donation%20Inquiry"
                      className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 font-semibold text-primary border border-primary/30 hover:bg-primary/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">mail</span>
                      Email About In-kind Support
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
