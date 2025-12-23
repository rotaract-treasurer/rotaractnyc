import Link from 'next/link'

export default function DonateNowPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-rotaract-pink/20 bg-rotaract-pink/5 px-4 py-1 text-sm text-rotaract-darkpink">
            Support Rotaract NYC
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold text-rotaract-darkpink tracking-tight">
            Donate Now
          </h1>
          <p className="mt-4 text-lg text-gray-700 leading-relaxed">
            Donations help us fund service projects, community initiatives, and member programming.
            If you’d like to support our work, please contact us and we’ll share the best way to contribute.
          </p>

          <div className="mt-10 grid gap-4">
            <a
              href="mailto:rotaractnewyorkcity@gmail.com?subject=Donation%20Inquiry"
              className="inline-flex justify-center rounded-lg bg-rotaract-pink px-6 py-3 font-semibold text-white hover:bg-rotaract-darkpink transition-colors"
            >
              Email Us About Donating
            </a>
            <Link
              href="/contact-us"
              className="inline-flex justify-center rounded-lg border border-rotaract-pink/30 bg-white px-6 py-3 font-semibold text-rotaract-pink hover:bg-rotaract-pink/5 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
